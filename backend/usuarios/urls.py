from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UsuarioViewSet,
    CustomTokenObtainPairView,
    SolicitarResetPasswordView,
    ConfirmarResetPasswordView,
)

router = DefaultRouter()
router.register('usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', SolicitarResetPasswordView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', ConfirmarResetPasswordView.as_view(), name='password-reset-confirm'),
    path('', include(router.urls)),
]