from rest_framework import serializers
from .models import Equipo, CategoriaEquipo


class CategoriaEquipoSerializer(serializers.ModelSerializer):
    total_equipos = serializers.IntegerField(source='equipos.count', read_only=True)

    class Meta:
        model = CategoriaEquipo
        fields = ['id', 'nombre', 'descripcion', 'total_equipos']


class EquipoListSerializer(serializers.ModelSerializer):
    """Serializer liviano para listados."""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_nombre = serializers.SerializerMethodField()
    proximo_mantenimiento = serializers.DateField(read_only=True)
    dias_para_proximo_mantenimiento = serializers.IntegerField(read_only=True)
    alerta_vencida = serializers.BooleanField(read_only=True)
    alerta_proxima = serializers.BooleanField(read_only=True)

    class Meta:
        model = Equipo
        fields = [
            'id', 'codigo_interno', 'nombre', 'categoria', 'categoria_nombre',
            'ubicacion', 'estado', 'estado_display',
            'responsable', 'responsable_nombre',
            'proximo_mantenimiento', 'dias_para_proximo_mantenimiento',
            'alerta_vencida', 'alerta_proxima',
        ]

    def get_responsable_nombre(self, obj):
        return obj.responsable.get_full_name() if obj.responsable else None


class EquipoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para create/retrieve/update."""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_nombre = serializers.SerializerMethodField()
    proximo_mantenimiento = serializers.DateField(read_only=True)
    dias_para_proximo_mantenimiento = serializers.IntegerField(read_only=True)
    alerta_vencida = serializers.BooleanField(read_only=True)
    alerta_proxima = serializers.BooleanField(read_only=True)

    class Meta:
        model = Equipo
        fields = [
            'id', 'codigo_interno', 'nombre', 'categoria', 'categoria_nombre',
            'marca', 'modelo', 'numero_serie', 'ubicacion', 'estado', 'estado_display',
            'responsable', 'responsable_nombre',
            'fecha_adquisicion', 'frecuencia_mantenimiento_dias',
            'fecha_ultimo_mantenimiento', 'proximo_mantenimiento',
            'dias_para_proximo_mantenimiento', 'alerta_vencida', 'alerta_proxima',
            'observaciones', 'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

    def get_responsable_nombre(self, obj):
        return obj.responsable.get_full_name() if obj.responsable else None
