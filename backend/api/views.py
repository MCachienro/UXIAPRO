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
import unicodedata
import difflib
import base64
from django.core.files.uploadedfile import SimpleUploadedFile

MIN_CLASSIFY_CONFIDENCE = 0.65
MIN_CLASSIFY_STABILITY = 1.00
REQUIRE_CLASSIFY_CONFIDENCE = False



def _guess_item_id_from_description(expo, descripcion):
    normalized_description = (descripcion or '').lower()
    if not normalized_description:
        return None

    for item in Item.objects.filter(expo=expo).only('id', 'nom'):
        if item.nom and item.nom.lower() in normalized_description:
            return item.id

    return None


def _normalize_label(value):
    """Normaliza una etiqueta eliminando acentos, guiones, sufijos de año
    y retornando solo caracteres alfanuméricos en minúscula.
    Ejemplos:
    - 'Seat-Ibiza-2025' -> 'seatibiza'
    - 'Opel Insignia' -> 'opelinsignia'
    """
    if not value:
        return ''

    # Unicode normalize y quitar diacríticos
    normalized = unicodedata.normalize('NFKD', value)
    normalized = ''.join(char for char in normalized if not unicodedata.combining(char))

    # Reemplazar guiones/underscore por espacios y quitar sufijos año (4 dígitos)
    normalized = normalized.replace('-', ' ').replace('_', ' ')
    # Remover años al final: ' ... 2025' -> ''
    parts = normalized.split()
    if parts and parts[-1].isdigit() and len(parts[-1]) == 4:
        parts = parts[:-1]
    normalized = ' '.join(parts)

    # Mantener solo caracteres alfanuméricos y espacios
    cleaned = ''.join(ch.lower() if ch.isalnum() or ch.isspace() else ' ' for ch in normalized)
    # Compactar espacios y devolver sin espacios para comparación simple
    tokens = [t for t in cleaned.split() if t]
    return ''.join(tokens)


def _find_item_for_label(expo, label):
    normalized_label = _normalize_label(label)
    if not normalized_label:
        return None

    items = Item.objects.filter(expo=expo).only('id', 'nom').order_by('id')

    # 1) Exact normalized match
    for item in items:
        item_label = _normalize_label(item.nom)
        if item_label == normalized_label:
            return item

    # 2) Token containment: every token of the predicted label appears in item label
    # (handles cases like 'seatibiza' vs 'seatibiza2025' or small format differences)
    label_tokens = [t for t in unicodedata.normalize('NFKD', label).replace('-', ' ').replace('_', ' ').lower().split() if t]
    if label_tokens:
        for item in items:
            item_tokens = [t for t in unicodedata.normalize('NFKD', item.nom).replace('-', ' ').replace('_', ' ').lower().split() if t]
            if all(any(lt in it for it in item_tokens) for lt in label_tokens):
                return item

    # 3) Fuzzy matching as fallback
    # Build list of normalized item labels -> map back to items
    candidates = []
    item_map = {}
    for item in items:
        il = _normalize_label(item.nom)
        if il:
            candidates.append(il)
            item_map[il] = item

    if candidates:
        matches = difflib.get_close_matches(normalized_label, candidates, n=1, cutoff=0.75)
        if matches:
            return item_map.get(matches[0])

    return None


def _parse_confidence(raw_value):
    if isinstance(raw_value, (int, float, str)):
        try:
            return float(raw_value)
        except (TypeError, ValueError):
            return 0.0
    return 0.0

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


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def classify_item_id(request):
    """
    ITEM ID: usa el clasificador entrenado de UXIA y devuelve el item de la BD.
    """
    expo_id = request.data.get('expo_id')
    image_file = request.FILES.get('image') or request.FILES.get('foto')

    if not expo_id or not image_file:
        return Response(
            {
                'match': False,
                'message': 'Faltan datos: expo_id e image son obligatorios.',
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    expo = get_object_or_404(Expo, id=expo_id)
    intent = Intent.objects.create(
        usuari=request.user if request.user.is_authenticated else None,
        expo=expo,
        url_foto_enviada=image_file,
    )

    service = UXIAIService()
    if not service.token:
        intent.resultat_identificacio = 'Error de autenticación con UXIA'
        intent.save(update_fields=['resultat_identificacio'])
        return Response(
            {
                'match': False,
                'message': 'No se ha podido autenticar con el servicio de clasificación.',
                'intent_id': intent.id,
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    classification = service.classify_image(intent.url_foto_enviada.file)
    if not classification.get('ok'):
        intent.resultat_identificacio = classification.get('message') or 'Error en la clasificación'
        intent.save(update_fields=['resultat_identificacio'])
        return Response(
            {
                'match': False,
                'message': classification.get('message') or 'No se ha podido clasificar la imagen.',
                'intent_id': intent.id,
            },
            status=status.HTTP_200_OK,
        )

    label = classification.get('label')
    confidence_value = _parse_confidence(classification.get('confidence'))
    has_confidence = confidence_value > 0
    stability = _parse_confidence(classification.get('stability'))

    matched_item = None
    can_match = (
        label
        and stability >= MIN_CLASSIFY_STABILITY
        and (not has_confidence or confidence_value >= MIN_CLASSIFY_CONFIDENCE)
    )

    if can_match:
        matched_item = _find_item_for_label(expo, label)

    if matched_item:
        intent.item_identificat = matched_item
        intent.resultat_identificacio = label or matched_item.nom
        intent.save()

        return Response(
            {
                'match': True,
                'message': f"Item identificado: {matched_item.nom}",
                'intent_id': intent.id,
                'item_id': matched_item.id,
                'confidence': confidence_value,
                'label': label,
                'item': ItemSerializer(matched_item, context={'request': request}).data,
                'photo_url': request.build_absolute_uri(intent.url_foto_enviada.url),
            },
            status=status.HTTP_200_OK,
        )

    intent.resultat_identificacio = label or 'Sin coincidencia clara'
    intent.save(update_fields=['resultat_identificacio'])

    if stability < MIN_CLASSIFY_STABILITY:
        message = (
            f"Predicción inestable ({stability:.2f}). "
            "La IA no mantiene la misma clase en varios intentos."
        )
    elif has_confidence and confidence_value < MIN_CLASSIFY_CONFIDENCE:
        message = (
            f"Predicción con baja confianza ({confidence_value:.2f}). "
            "No se devuelve match automático."
        )
    elif label:
        message = (
            f"La IA ha reconocido {label}, pero no existe un item coincidente en esta expo."
        )
    else:
        message = "No s'ha trobat cap coincidència clara amb els items d'aquesta expo."

    return Response(
        {
            'match': False,
            'message': message,
            'intent_id': intent.id,
            'item_id': None,
            'confidence': confidence_value,
            'stability': stability,
            'label': label,
            'photo_url': request.build_absolute_uri(intent.url_foto_enviada.url),
        },
        status=status.HTTP_200_OK,
    )

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def classify_item_id_b64(request):
    """
    Alternative endpoint that accepts JSON with base64-encoded image.
    Use when multipart/form-data uploads fail on the server.
    Body: { "expo_id": 2, "image_b64": "<base64string>" }
    """
    expo_id = request.data.get('expo_id')
    image_b64 = request.data.get('image_b64')

    if not expo_id or not image_b64:
        return Response({'match': False, 'message': 'faltan expo_id e image_b64'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        decoded = base64.b64decode(image_b64)
    except Exception:
        return Response({'match': False, 'message': 'imagen base64 inválida'}, status=status.HTTP_400_BAD_REQUEST)

    expo = get_object_or_404(Expo, id=expo_id)

    uploaded_file = SimpleUploadedFile('upload.jpg', decoded, content_type='image/jpeg')

    intent = Intent.objects.create(
        usuari=request.user if request.user.is_authenticated else None,
        expo=expo,
        url_foto_enviada=uploaded_file,
    )

    service = UXIAIService()
    if not service.token:
        intent.resultat_identificacio = 'Error de autenticación con UXIA'
        intent.save(update_fields=['resultat_identificacio'])
        return Response({'match': False, 'message': 'No se ha podido autenticar con el servicio de clasificación.', 'intent_id': intent.id}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    uploaded_file.seek(0)
    classification = service.classify_image(uploaded_file)

    if not classification.get('ok'):
        intent.resultat_identificacio = classification.get('message') or 'Error en la clasificación'
        intent.save(update_fields=['resultat_identificacio'])
        return Response({'match': False, 'message': classification.get('message') or 'No se ha podido clasificar la imagen.', 'intent_id': intent.id}, status=status.HTTP_200_OK)

    label = classification.get('label')
    confidence_value = _parse_confidence(classification.get('confidence'))
    has_confidence = confidence_value > 0
    stability = _parse_confidence(classification.get('stability'))

    can_match = (
        label
        and stability >= MIN_CLASSIFY_STABILITY
        and (not has_confidence or confidence_value >= MIN_CLASSIFY_CONFIDENCE)
    )

    if can_match:
        matched_item = _find_item_for_label(expo, label)

    if matched_item:
        intent.item_identificat = matched_item
        intent.resultat_identificacio = label or matched_item.nom
        intent.save()
        return Response({'match': True, 'message': f"Item identificado: {matched_item.nom}", 'intent_id': intent.id, 'item_id': matched_item.id, 'confidence': confidence_value, 'label': label, 'item': ItemSerializer(matched_item, context={'request': request}).data}, status=status.HTTP_200_OK)

    intent.resultat_identificacio = label or 'Sin coincidencia clara'
    intent.save(update_fields=['resultat_identificacio'])

    if stability < MIN_CLASSIFY_STABILITY:
        message = (
            f"Predicción inestable ({stability:.2f}). "
            "La IA no mantiene la misma clase en varios intentos."
        )
    elif has_confidence and confidence_value < MIN_CLASSIFY_CONFIDENCE:
        message = (
            f"Predicción con baja confianza ({confidence_value:.2f}). "
            "No se devuelve match automático."
        )
    else:
        message = 'No se encontró un Item con ese nombre.'

    return Response({'match': False, 'message': message, 'intent_id': intent.id, 'label': label, 'confidence': confidence_value, 'stability': stability}, status=status.HTTP_200_OK)

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
    print(f"--- INICIANDO TRAFICO CON IA ---")
    print(f"Token: {service.token}")
    
    if service.token is None:
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