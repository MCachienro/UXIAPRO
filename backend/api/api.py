from typing import List, Optional
from django.shortcuts import get_object_or_404
from ninja import NinjaAPI, Schema
from ninja.errors import HttpError

from .models import Expo, Item

# --- HELPERS ---
def _build_file_url(request, file_field) -> Optional[str]:
    """Genera una URL absoluta para los archivos/imágenes."""
    if not file_field:
        return None
    try:
        return request.build_absolute_uri(file_field.url)
    except (ValueError, AttributeError):
        return None

# --- SCHEMAS DE ENTRADA (INPUT) ---
class EditExpoIn(Schema):
    """Datos permitidos para editar una exposición."""
    nom: str
    descripcio: Optional[str] = None
    estat: str = "esborrany"

# --- SCHEMAS DE SALIDA (OUTPUT) ---
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

# --- INICIALIZACIÓN API ---
api = NinjaAPI(title="UXIA API", version="1.0.0")

# --- ENDPOINTS PÚBLICOS (EXPOSICIONES) ---

@api.get("/expos", response=List[ExpoOut], tags=["Públic"])
def list_expos(request):
    """Lista todas las exposiciones ordenadas por ID."""
    return Expo.objects.all().order_by("id")

@api.get("/expos/search", response=List[ExpoOut], tags=["Públic"])
def search_expos(request, q: Optional[str] = None):
    """Filtra exposiciones por nombre."""
    if q:
        return Expo.objects.filter(nom__icontains=q).order_by("id")
    return Expo.objects.all().order_by("id")

@api.get("/expos/{expo_id}", response=ExpoOut, tags=["Públic"])
def get_expo(request, expo_id: int):
    """Obtiene los detalles de una exposición específica."""
    expo = Expo.objects.filter(id=expo_id).first()
    if not expo:
        raise HttpError(404, "Exposició no trobada")
    return expo

# --- ENDPOINTS DE BÚSQUEDA POLIMÓRFICA ---

@api.get("/search", response=List[SearchResultOut], tags=["Públic"])
def polymorphic_search(request, q: Optional[str] = None):
    """Busca tanto en exposiciones como en ítems simultáneamente."""
    query = (q or "").strip()
    if len(query) < 3:
        return []

    expos = Expo.objects.filter(nom__icontains=query).order_by("id")
    items = (
        Item.objects.select_related("expo", "imatge_destacada")
        .filter(nom__icontains=query)
        .order_by("id")
    )

    results = []
    
    # Añadir Exposiciones a los resultados
    for expo in expos:
        results.append({
            "tipus": "EXPO",
            "id": expo.id,
            "nom": expo.nom,
            "descripcio": expo.descripcio,
        })

    # Añadir Ítems a los resultados
    for item in items:
        results.append({
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
        })

    return results

# --- ENDPOINTS DE ÍTEMS ---

@api.get("/expos/{expo_id}/items", response=List[ItemOut], tags=["Públic"])
def list_expo_items(request, expo_id: int):
    """Lista todos los ítems pertenecientes a una exposición."""
    if not Expo.objects.filter(id=expo_id).exists():
        raise HttpError(404, "Exposició no trobada")
        
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

@api.get("/items/{item_id}", response=ItemDetailOut, tags=["Públic"])
def get_item(request, item_id: int):
    """Obtiene el detalle completo de un ítem, incluyendo etiquetas e imágenes secundarias."""
    item = (
        Item.objects.select_related("expo", "imatge_destacada")
        .prefetch_related("etiquetes", "imatges")
        .filter(id=item_id)
        .first()
    )
    if not item:
        raise HttpError(404, "Ítem no trobat")

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
        "etiquetes": [e.nom for e in item.etiquetes.all()],
        "imatges_publiques": [
            url for imatge in item.imatges.filter(es_publica=True).order_by("id")
            if (url := _build_file_url(request, imatge.url_imatge))
        ],
    }

# --- ENDPOINTS DE ADMINISTRACIÓN (EDITAR) ---

@api.put("/exposicions/{expo_id}/", tags=["Admin"])
def update_exposicio(request, expo_id: int, data: EditExpoIn):
    """
    Actualiza los detalles de una exposición (Ejercicio 17).
    Se usa el método PUT para procesar los cambios enviados desde el Modal.
    """
    expo = get_object_or_404(Expo, id=expo_id)
    
    # Actualización dinámica de atributos basada en el Schema de entrada
    for attr, value in data.dict().items():
        setattr(expo, attr, value)
    
    expo.save()
    return {"success": True, "id": expo.id}