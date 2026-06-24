from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    nombre_completo = serializers.CharField(read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'first_name', 'last_name', 'nombre_completo',
            'email', 'rol', 'rol_display', 'telefono', 'cargo',
            'is_active', 'fecha_creacion',
        ]
        read_only_fields = ['id', 'fecha_creacion']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'rol', 'telefono', 'cargo', 'password', 'password2',
        ]

    def validate(self, datos):
        if datos['password'] != datos.pop('password2'):
            raise serializers.ValidationError({'password2': 'Las contraseñas no coinciden.'})
        return datos

    def create(self, datos_validados):
        password = datos_validados.pop('password')
        usuario = Usuario(**datos_validados)
        usuario.set_password(password)
        usuario.save()
        return usuario


class UsuarioUpdateSerializer(serializers.ModelSerializer):
    """Para ediciones parciales — sin cambio de contraseña aquí."""

    class Meta:
        model = Usuario
        fields = ['first_name', 'last_name', 'email', 'rol', 'telefono', 'cargo', 'is_active']


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    password_nuevo = serializers.CharField(write_only=True, validators=[validate_password])
    password_nuevo2 = serializers.CharField(write_only=True)

    def validate(self, datos):
        if datos['password_nuevo'] != datos['password_nuevo2']:
            raise serializers.ValidationError({'password_nuevo2': 'Las contraseñas no coinciden.'})
        return datos

    def validate_password_actual(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta.')
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['rol'] = user.rol
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['usuario'] = {
            'id': self.user.id,
            'username': self.user.username,
            'nombre_completo': self.user.nombre_completo,
            'rol': self.user.rol,
            'rol_display': self.user.get_rol_display(),
        }
        return data
