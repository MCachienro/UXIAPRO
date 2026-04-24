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
from api.api import api as uxia_api
from api.views import procesar_identificacion, ExpoViewSet # Importamos ExpoViewSet

# 1. Configuramos el router para el ViewSet
router = DefaultRouter()
router.register(r'expos', ExpoViewSet, basename='expo')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/identificar/', procesar_identificacion),
    path('identificar/', procesar_identificacion),
    
    # Lo ponemos en 'api/rest/' para no colisionar con 'api/' (uxia_api)
    path('api/rest/', include(router.urls)), 
    
    path('api/', uxia_api.urls),
    path('', uxia_api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)