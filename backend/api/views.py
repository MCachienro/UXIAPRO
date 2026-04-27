from django.shortcuts import render
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from .models import Intent, Expo, Item
from .services.ai_service import analizar_coche_con_ai


def _guess_item_id_from_description(expo, descripcion):
    normalized_description = (descripcion or '').lower()
    if not normalized_description:
        return None

    for item in Item.objects.filter(expo=expo).only('id', 'nom'):
        if item.nom and item.nom.lower() in normalized_description:
            return item.id

    return None

@csrf_exempt
def procesar_identificacion(request):
    if request.method == 'POST' and request.FILES.get('foto'):
        expo_id = request.POST.get('expo_id')
        foto = request.FILES['foto']
        expo = get_object_or_404(Expo, id=expo_id)
        
        # 1. Creamos el objeto Intent (sin la respuesta de IA todavía)
        intent = Intent.objects.create(
            usuari=request.user if request.user.is_authenticated else None,
            expo=expo,
            url_foto_enviada=foto
        )
        
        # 2. Llamamos a la IA
        descripcion = analizar_coche_con_ai(intent.url_foto_enviada.name)

        guessed_item_id = _guess_item_id_from_description(expo, descripcion)
        if guessed_item_id:
            intent.item_identificat_id = guessed_item_id
        
        # 3. Actualizamos el Intent con el resultado
        intent.resultat_identificacio = descripcion
        intent.save()
        
        return JsonResponse({
            'success': True,
            'mensaje': descripcion,
            'intent_id': intent.id,
            'item_id': intent.item_identificat_id,
            'photo_url': request.build_absolute_uri(intent.url_foto_enviada.url),
        })
        
    return JsonResponse({'success': False, 'error': 'Faltan datos'}, status=400)
