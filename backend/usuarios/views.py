from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Usuario
from .serializers import (
    UsuarioSerializer,
    UsuarioCreateSerializer,
    UsuarioUpdateSerializer,
    CambiarPasswordSerializer,
    SolicitarResetPasswordSerializer,
    ConfirmarResetPasswordSerializer,
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


class SolicitarResetPasswordView(APIView):
    """
    POST /api/password-reset/
    body: { "email": "tecnico@correo.com" }

    Siempre responde 200 con el mismo mensaje, exista o no el correo,
    para no revelar qué usuarios están registrados en el sistema.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SolicitarResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        usuario = Usuario.objects.filter(email__iexact=email).first()

        if usuario is not None:
            uid = urlsafe_base64_encode(force_bytes(usuario.pk))
            token = default_token_generator.make_token(usuario)
            link_reset = f'{settings.FRONTEND_URL}/restablecer-contrasena?uid={uid}&token={token}'

            send_mail(
                subject='Restablece tu contraseña — TecnoCare',
                message=(
                    f'Hola {usuario.nombre_completo},\n\n'
                    'Recibimos una solicitud para restablecer tu contraseña en TecnoCare.\n'
                    'Si fuiste tú, usa este enlace (válido por 24 horas):\n\n'
                    f'{link_reset}\n\n'
                    'Si no solicitaste esto, puedes ignorar este correo.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[usuario.email],
                fail_silently=False,
            )

        return Response(
            {'detail': 'Si el correo está registrado, recibirás instrucciones en breve.'},
            status=status.HTTP_200_OK,
        )


class ConfirmarResetPasswordView(APIView):
    """
    POST /api/password-reset/confirm/
    body: { "uid": "...", "token": "...", "password_nuevo": "...", "password_nuevo2": "..." }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ConfirmarResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data

        try:
            usuario_pk = force_str(urlsafe_base64_decode(datos['uid']))
            usuario = Usuario.objects.get(pk=usuario_pk)
        except (Usuario.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'detail': 'Enlace inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(usuario, datos['token']):
            return Response(
                {'detail': 'El enlace ya expiró o ya fue usado. Solicita uno nuevo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario.set_password(datos['password_nuevo'])
        usuario.save()

        return Response({'detail': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)