from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from api.api import api as uxia_api
from api.views import procesar_identificacion, current_user


urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth (JWT)
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', current_user, name='current_user'),

    # Otros endpoints tuyos
    path('api/identificar/', procesar_identificacion),

    # 🔥 API principal (Ninja)
    path('api/', uxia_api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)