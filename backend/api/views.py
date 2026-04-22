from django.shortcuts import render
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .models import Intent, Expo
from .services.ai_service import analizar_coche_con_ai

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
        
        # 3. Actualizamos el Intent con el resultado
        intent.resultat_identificacio = descripcion
        intent.save()
        
        return JsonResponse({
            'success': True,
            'mensaje': descripcion,
            'intent_id': intent.id
        })
        
    return JsonResponse({'success': False, 'error': 'Faltan datos'}, status=400)
