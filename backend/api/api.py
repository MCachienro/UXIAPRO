from typing import List, Optional

from ninja import NinjaAPI, Schema
from ninja.errors import HttpError

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


api = NinjaAPI(title="UXIA API")


@api.get("/expos", response=List[ExpoOut], tags=["Expos"])
def list_expos(request):
    return Expo.objects.all().order_by("id")


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
