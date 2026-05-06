from django.shortcuts import render
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from .models import Intent, Expo, Item, Imatge
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .services.ai_service import analizar_coche_con_ai, UXIAIService
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from .serializers import ExpoSerializer, ItemSerializer, ImatgeSerializer # Importas el archivo que acabas de crear



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

class ExpoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExpoSerializer # Aquí le dices qué serializer usar

    def get_queryset(self):
        # Filtra solo las expos del usuario logueado
        return Expo.objects.filter(propietari=self.request.user)


class ItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Items.
    
    Endpoints:
    - GET /items/ -> Listar items del usuario
    - GET /items/{id}/ -> Obtener detalle del item
    - PUT /items/{id}/ -> Editar item (nombre, descripción)
    - POST /items/{id}/upload-images/ -> Subir múltiples imágenes
    - PUT /items/{id}/set-featured-image/ -> Marcar imagen como destacada
    - DELETE /items/{id}/images/{image_id}/ -> Eliminar una imagen
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ItemSerializer

    def get_queryset(self):
        # Filtra solo los items de expos del usuario logueado
        return Item.objects.filter(expo__propietari=self.request.user)

    @action(detail=True, methods=['post'])
    def upload_images(self, request, pk=None):
        """
        POST /items/{id}/upload-images/
        Sube múltiples imágenes para un item.
        
        Parámetros esperados:
        - images: Lista de archivos (request.FILES.getlist('images'))
        
        Respuesta:
        - success: bool
        - images: Lista de imágenes creadas con sus URLs
        """
        item = self.get_object()
        images = request.FILES.getlist('images')
        
        if not images:
            return Response(
                {'success': False, 'error': 'No images provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_images = []
        for image_file in images:
            imatge = Imatge.objects.create(
                item=item,
                url_imatge=image_file,
                tipus='PUBLICA',
                es_publica=True
            )
            created_images.append(
                ImatgeSerializer(imatge, context={'request': request}).data
            )
        
        # Marcar estado de expo como ACTUALITZABLE si aún no tiene imágenes destacadas
        if item.imatge_destacada is None and created_images:
            item.expo.estat = 'ACTUALITZABLE'
            item.expo.save()
        
        return Response({
            'success': True,
            'images': created_images,
            'message': f'{len(created_images)} image(s) uploaded successfully'
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put'])
    def set_featured_image(self, request, pk=None):
        """
        PUT /items/{id}/set-featured-image/
        Marca una imagen como destacada (imatge_destacada).
        
        Parámetros esperados:
        - image_id: int (ID de la imagen a marcar como destacada)
        
        Respuesta:
        - success: bool, item: ItemSerializer
        """
        item = self.get_object()
        image_id = request.data.get('image_id')
        
        if not image_id:
            return Response(
                {'success': False, 'error': 'image_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        imatge = Imatge.objects.filter(id=image_id, item=item).first()
        if not imatge:
            return Response(
                {'success': False, 'error': 'Image not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        item.imatge_destacada = imatge
        item.expo.estat = 'ACTUALITZABLE'
        item.save()
        item.expo.save()
        
        return Response({
            'success': True,
            'item': ItemSerializer(item, context={'request': request}).data
        })

    @action(detail=True, methods=['delete'])
    def delete_image(self, request, pk=None):
        """
        DELETE /items/{id}/images/{image_id}/
        Elimina una imagen de un item.
        
        Parámetros esperados:
        - image_id: int (ID de la imagen a eliminar)
        
        Respuesta:
        - success: bool, item: ItemSerializer
        """
        item = self.get_object()
        image_id = request.query_params.get('image_id')
        
        if not image_id:
            return Response(
                {'success': False, 'error': 'image_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        imatge = Imatge.objects.filter(id=image_id, item=item).first()
        if not imatge:
            return Response(
                {'success': False, 'error': 'Image not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        imatge.delete()
        
        # Si la imagen eliminada era la destacada, limpiarla
        if item.imatge_destacada_id == image_id:
            item.imatge_destacada = None
            item.save()
        
        return Response({
            'success': True,
            'item': ItemSerializer(item, context={'request': request}).data
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    user = request.user
    return Response(
        {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
        }
    )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search(request):
    """
    Endpoint de búsqueda global.
    GET /api/search?q=query
    
    Busca en:
    - Nombres de Expos
    - Nombres de Items
    
    Retorna lista con resultados de ambas búsquedas.
    """
    query = request.GET.get('q', '').strip()
    
    if len(query) < 3:
        return Response([])
    
    # Buscar expos
    expos = Expo.objects.filter(nom__icontains=query).values('id', 'nom', 'descripcio')[:5]
    
    # Buscar items
    items = Item.objects.filter(nom__icontains=query).values('id', 'nom', 'expo__nom', 'expo_id')[:5]
    
    results = []
    
    # Agregar expos
    for expo in expos:
        results.append({
            'tipus': 'EXPO',
            'id': expo['id'],
            'nom': expo['nom'],
            'descripcio': expo['descripcio']
        })
    
    # Agregar items
    for item in items:
        results.append({
            'tipus': 'ITEM',
            'id': item['id'],
            'nom': item['nom'],
            'expo_nom': item['expo__nom'],
            'expo_id': item['expo_id']
        })
    
    return Response(results)

@api_view(['POST'])
def start_expo_training(request, expo_id):
    """
    Endpoint para iniciar el proceso: Sube fotos e inicia entrenamiento.
    """
    expo = get_object_or_404(Expo, id=expo_id)
    service = UXIAIService()
    
    # DEBUG: Esto saldrá en tu terminal de Django
    print(f"--- INICIANDO TRÁFICO CON IA ---")
    print(f"Token: {service.token}")
    
    if not service.token:
        # Devolvemos 401 y un mensaje más descriptivo
        return Response({
            "error": "Error de autenticación",
            "detail": "La IA no ha devuelto un token válido. Revisa las credenciales y la IP."
        }, status=401)

    # 1. Cambiamos estado a QUEUED (En cola)
    expo.current_train = 'QUEUED'
    expo.save()

    try:
        # 2. Subimos las imágenes de los items
        service.upload_expo_dataset(expo)
        
        # 3. Ordenamos empezar el entrenamiento
        response = service.start_training()
        
        if response.ok:
            expo.current_train = 'RUNNING'
            expo.save()
            return Response({"status": "RUNNING", "message": "Entrenamiento iniciado correctamente"})
        else:
            expo.current_train = 'ERROR'
            expo.save()
            return Response({"status": "ERROR", "message": "El servidor de IA rechazó la orden"}, status=400)

    except Exception as e:
        expo.current_train = 'ERROR'
        expo.save()
        return Response({"status": "ERROR", "message": str(e)}, status=500)

@api_view(["GET"])
def check_training_status(request, expo_id):
    """
    Endpoint para que React pregunte: ¿Cómo va lo mío?
    """
    expo = get_object_or_404(Expo, id=expo_id)
    service = UXIAIService()
    
    # Consultamos al servidor de UXIA
    info_ia = service.check_status()
    nuevo_estado = info_ia.get('status', 'ERROR')
    
    # Actualizamos nuestra base de datos con lo que diga la IA
    expo.current_train = nuevo_estado
    
    # Si la IA dice OK, la expo pasa a estar DISPONIBLE para el público
    if nuevo_estado == 'OK':
        expo.estat = Expo.Estat.DISPONIBLE
    
    expo.save()
    
    return Response({
        "status": nuevo_estado,
        "expo_estat": expo.estat
    })