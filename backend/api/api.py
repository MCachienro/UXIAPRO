from typing import List, Optional

from ninja import NinjaAPI, Schema
from ninja.errors import HttpError
from ninja import File, Form
from typing import List, Optional, Any
# from django.core.files.uploadedfile import uploadedfile

from .models import Expo, Item


def _build_file_url(request, file_field) -> Optional[str]:
    if not file_field:
        return None
    try:
        return request.build_absolute_uri(file_field.url)
    except (ValueError, AttributeError):
        return None


class ExpoOut(Schema):
    id: int
    nom: str
    descripcio: Optional[str] = None
    estat: str


class ItemOut(Schema):
    id: int
    expo_id: int
    nom: str
    descripcio: Optional[str] = None
    imatge_destacada_id: Optional[int] = None
    imatge_destacada_url: Optional[str] = None


class ItemDetailOut(ItemOut):
    etiquetes: List[str]
    imatges_publiques: List[str]


class SearchResultOut(Schema):
    tipus: str
    id: int
    nom: str
    descripcio: Optional[str] = None
    expo_id: Optional[int] = None
    expo_nom: Optional[str] = None
    imatge_destacada_url: Optional[str] = None


api = NinjaAPI(title="UXIA API")


@api.get("/expos", response=List[ExpoOut], tags=["Expos"])
def list_expos(request):
    return Expo.objects.all().order_by("id")


@api.get("/expos/search", response=List[ExpoOut], tags=["Expos"])
def search_expos(request, q: Optional[str] = None):
    if q:
        return Expo.objects.filter(nom__icontains=q).order_by("id")
    return Expo.objects.all().order_by("id")


@api.get("/search", response=List[SearchResultOut], tags=["Search"])
def polymorphic_search(request, q: Optional[str] = None):
    query = (q or "").strip()
    if len(query) < 3:
        return []

    expos = Expo.objects.filter(nom__icontains=query).order_by("id")
    items = (
        Item.objects.select_related("expo", "imatge_destacada")
        .filter(nom__icontains=query)
        .order_by("id")
    )

    results = [
        {
            "tipus": "EXPO",
            "id": expo.id,
            "nom": expo.nom,
            "descripcio": expo.descripcio,
        }
        for expo in expos
    ]

    results.extend(
        {
            "tipus": "ITEM",
            "id": item.id,
            "nom": item.nom,
            "descripcio": item.descripcio,
            "expo_id": item.expo_id,
            "expo_nom": item.expo.nom,
            "imatge_destacada_url": _build_file_url(
                request,
                item.imatge_destacada.url_imatge if item.imatge_destacada else None,
            ),
        }
        for item in items
    )

    return results


@api.get("/expos/{expo_id}", response=ExpoOut, tags=["Expos"])
def get_expo(request, expo_id: int):
    expo = Expo.objects.filter(id=expo_id).first()
    if not expo:
        raise HttpError(404, "Expo not found")
    return expo


@api.get("/expos/{expo_id}/items", response=List[ItemOut], tags=["Items"])
def list_expo_items(request, expo_id: int):
    expo_exists = Expo.objects.filter(id=expo_id).exists()
    if not expo_exists:
        raise HttpError(404, "Expo not found")
    items = (
        Item.objects.select_related("imatge_destacada")
        .filter(expo_id=expo_id)
        .order_by("id")
    )
    return [
        {
            "id": item.id,
            "expo_id": item.expo_id,
            "nom": item.nom,
            "descripcio": item.descripcio,
            "imatge_destacada_id": item.imatge_destacada_id,
            "imatge_destacada_url": _build_file_url(
                request,
                item.imatge_destacada.url_imatge if item.imatge_destacada else None,
            ),
        }
        for item in items
    ]


@api.get("/items/{item_id}", response=ItemDetailOut, tags=["Items"])
def get_item(request, item_id: int):
    item = (
        Item.objects.select_related("expo", "imatge_destacada")
        .prefetch_related("etiquetes", "imatges")
        .filter(id=item_id)
        .first()
    )
    if not item:
        raise HttpError(404, "Item not found")

    return {
        "id": item.id,
        "expo_id": item.expo_id,
        "nom": item.nom,
        "descripcio": item.descripcio,
        "imatge_destacada_id": item.imatge_destacada_id,
        "imatge_destacada_url": _build_file_url(
            request,
            item.imatge_destacada.url_imatge if item.imatge_destacada else None,
        ),
        "etiquetes": [etiqueta.nom for etiqueta in item.etiquetes.all()],
        "imatges_publiques": [
            image_url
            for imatge in item.imatges.filter(es_publica=True).order_by("id")
            for image_url in [_build_file_url(request, imatge.url_imatge)]
            if image_url
        ],
    }

# Endpoint para crear el item
@api.post("/items", tags=["Items"])
def create_item(
    request, 
    nom: str = Form(...), 
    descripcio: str = Form(None), 
    expo_id: int = Form(...),
    imatges: List[Any] = File(None)
):
    expo = Expo.objects.get(id=expo_id)
    
    # 1. Crear el item
    item = Item.objects.create(nom=nom, descripcio=descripcio, expo=expo)
    
    # 2. Gestionar imágenes
    if imatges:
        for img in imatges:
            Imatge.objects.create(item=item, url_imatge=img)
        
        # 3. Si hay imágenes, actualizar el estado de la expo
        expo.estat = 'ACTUALITZABLE'
        expo.save()
        
    return {"id": item.id, "message": "Item creat correctament"}

# Endpoint para actualizar la expo
@api.patch("/expos/{expo_id}", tags=["Expos"])
def update_expo(request, expo_id: int, estat: str):
    expo = Expo.objects.get(id=expo_id)
    expo.estat = estat
    expo.save()
    return {"id": expo.id, "estat": expo.estat}
