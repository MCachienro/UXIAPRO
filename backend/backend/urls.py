"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include  # Añadimos 'include'
from rest_framework.routers import DefaultRouter # Añadimos el router
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.api import api as uxia_api
from api.views import (
    procesar_identificacion, 
    classify_item_id,
    classify_item_id_b64,
    ExpoViewSet, 
    ItemViewSet, 
    current_user, 
    search, 
    start_expo_training, 
    check_training_status
)
# 1. Configuramos el router para el ViewSet
router = DefaultRouter()
router.register(r'expos', ExpoViewSet, basename='expo')
router.register(r'items', ItemViewSet, basename='item')

urlpatterns = [
    path('admin/', admin.site.urls),
    # --- RUTAS DE LA API (Unificadas bajo /api/) ---
    
    # Autenticación JWT    
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair_mounted'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh_mounted'),
    path('auth/me/', current_user, name='current_user_mounted'),
    path('rest/', include(router.urls)),

    # Búsqueda e Identificación
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', current_user, name='current_user'),
    path('api/search/', search, name='search'),
    path('api/identificar/', procesar_identificacion),
    path('api/item-description/', procesar_identificacion, name='item_description'),
    path('api/classify/', classify_item_id, name='item_classify'),
    path('api/classify_b64/', classify_item_id_b64, name='item_classify_b64'),
    path('identificar/', procesar_identificacion),
    path('classify/', classify_item_id),
    path('classify_b64/', classify_item_id_b64),

    # --- ENTRENAMIENTO IA (UXIA) ---
    # Eliminamos el prefijo 'views.' porque ya importamos las funciones arriba
    path('expos/<int:expo_id>/train/', start_expo_training, name='start_train'),
    path('expos/<int:expo_id>/status/', check_training_status, name='check_status'),
    
    # ViewSets (CRUD de Expos e Items)    
    path('api/rest/', include(router.urls)), 
    
    # Otras rutas de la API Ninja o similares
    path('api/', uxia_api.urls),
    path('', uxia_api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)