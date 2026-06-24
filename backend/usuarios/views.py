from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Usuario
from .serializers import (
    UsuarioSerializer,
    UsuarioCreateSerializer,
    UsuarioUpdateSerializer,
    CambiarPasswordSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import EsAdministrador


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    filterset_fields = ['rol', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'email', 'cargo']
    ordering_fields = ['username', 'fecha_creacion', 'rol']
    ordering = ['username']

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UsuarioUpdateSerializer
        return UsuarioSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update', 'desactivar', 'reactivar']:
            return [permissions.IsAuthenticated(), EsAdministrador()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def perfil(self, request):
        """Devuelve los datos del usuario autenticado."""
        return Response(UsuarioSerializer(request.user).data)

    @action(detail=False, methods=['patch'])
    def cambiar_password(self, request):
        """El usuario cambia su propia contraseña."""
        serializer = CambiarPasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['password_nuevo'])
        request.user.save()
        return Response({'detail': 'Contraseña actualizada correctamente.'})

    @action(detail=True, methods=['patch'])
    def desactivar(self, request, pk=None):
        usuario = self.get_object()
        if usuario == request.user:
            return Response(
                {'detail': 'No puedes desactivar tu propio usuario.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        usuario.is_active = False
        usuario.save(update_fields=['is_active'])
        return Response({'detail': f'Usuario {usuario.username} desactivado.'})

    @action(detail=True, methods=['patch'])
    def reactivar(self, request, pk=None):
        usuario = self.get_object()
        usuario.is_active = True
        usuario.save(update_fields=['is_active'])
        return Response({'detail': f'Usuario {usuario.username} reactivado.'})
