from rest_framework import serializers
from .models import Mantenimiento, Intervencion


class IntervencionSerializer(serializers.ModelSerializer):
    tecnico_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Intervencion
        fields = ['id', 'mantenimiento', 'tecnico', 'tecnico_nombre', 'fecha',
                  'descripcion', 'horas_invertidas']
        read_only_fields = ['id', 'fecha', 'tecnico']

    def get_tecnico_nombre(self, obj):
        return obj.tecnico.get_full_name() if obj.tecnico else None


class MantenimientoListSerializer(serializers.ModelSerializer):
    equipo_codigo = serializers.CharField(source='equipo.codigo_interno', read_only=True)
    equipo_nombre = serializers.CharField(source='equipo.nombre', read_only=True)
    tecnico_nombre = serializers.SerializerMethodField()
    creado_por_nombre = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    costo_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    duracion_horas = serializers.FloatField(read_only=True)

    class Meta:
        model = Mantenimiento
        fields = [
            'id', 'equipo', 'equipo_codigo', 'equipo_nombre',
            'tipo', 'tipo_display', 'prioridad', 'prioridad_display',
            'estado', 'estado_display',
            'tecnico_asignado', 'tecnico_nombre',
            'creado_por', 'creado_por_nombre',
            'titulo', 'fecha_programada', 'fecha_inicio', 'fecha_finalizacion',
            'costo_total', 'duracion_horas',
        ]

    def get_tecnico_nombre(self, obj):
        return obj.tecnico_asignado.get_full_name() if obj.tecnico_asignado else 'Sin asignar'

    def get_creado_por_nombre(self, obj):
        return obj.creado_por.get_full_name() if obj.creado_por else None


class MantenimientoDetailSerializer(serializers.ModelSerializer):
    equipo_codigo = serializers.CharField(source='equipo.codigo_interno', read_only=True)
    equipo_nombre = serializers.CharField(source='equipo.nombre', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    costo_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    duracion_horas = serializers.FloatField(read_only=True)
    intervenciones = IntervencionSerializer(many=True, read_only=True)

    class Meta:
        model = Mantenimiento
        fields = [
            'id', 'equipo', 'equipo_codigo', 'equipo_nombre',
            'tipo', 'tipo_display', 'prioridad', 'prioridad_display',
            'estado', 'estado_display',
            'tecnico_asignado', 'creado_por',
            'titulo', 'descripcion', 'diagnostico', 'solucion_aplicada',
            'fecha_programada', 'fecha_inicio', 'fecha_finalizacion',
            'costo_repuestos', 'costo_mano_obra', 'costo_total',
            'duracion_horas', 'calificacion_resultado',
            'intervenciones',
            'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'creado_por', 'fecha_creacion', 'fecha_actualizacion']


class FinalizarMantenimientoSerializer(serializers.Serializer):
    solucion_aplicada = serializers.CharField(required=False, allow_blank=True)
    diagnostico = serializers.CharField(required=False, allow_blank=True)
    costo_repuestos = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    costo_mano_obra = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)


class CalificarMantenimientoSerializer(serializers.Serializer):
    calificacion_resultado = serializers.IntegerField(min_value=1, max_value=5)
