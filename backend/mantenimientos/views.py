from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Mantenimiento, Intervencion
from .serializers import (
    MantenimientoListSerializer,
    MantenimientoDetailSerializer,
    IntervencionSerializer,
    FinalizarMantenimientoSerializer,
    CalificarMantenimientoSerializer,
)
from usuarios.permissions import EsSupervisorOAdministrador


class MantenimientoViewSet(viewsets.ModelViewSet):
    queryset = Mantenimiento.objects.select_related(
        'equipo', 'tecnico_asignado', 'creado_por'
    ).prefetch_related('intervenciones').all()
    filterset_fields = ['tipo', 'estado', 'prioridad', 'equipo', 'tecnico_asignado']
    search_fields = ['titulo', 'descripcion', 'equipo__codigo_interno', 'equipo__nombre']
    ordering_fields = ['fecha_programada', 'prioridad', 'estado', 'fecha_creacion']
    ordering = ['-fecha_programada']

    def get_serializer_class(self):
        if self.action == 'list':
            return MantenimientoListSerializer
        return MantenimientoDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAuthenticated(), EsSupervisorOAdministrador()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=['patch'])
    def iniciar(self, request, pk=None):
        mantenimiento = self.get_object()
        try:
            mantenimiento.iniciar()
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MantenimientoDetailSerializer(mantenimiento).data)

    @action(detail=True, methods=['patch'])
    def finalizar(self, request, pk=None):
        mantenimiento = self.get_object()
        serializer = FinalizarMantenimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data

        # Costos opcionales
        if 'costo_repuestos' in datos:
            mantenimiento.costo_repuestos = datos['costo_repuestos']
        if 'costo_mano_obra' in datos:
            mantenimiento.costo_mano_obra = datos['costo_mano_obra']

        try:
            mantenimiento.finalizar(
                solucion=datos.get('solucion_aplicada', ''),
                diagnostico=datos.get('diagnostico', ''),
            )
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MantenimientoDetailSerializer(mantenimiento).data)

    @action(detail=True, methods=['patch'])
    def cancelar(self, request, pk=None):
        mantenimiento = self.get_object()
        motivo = request.data.get('motivo', '')
        try:
            mantenimiento.cancelar(motivo=motivo)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MantenimientoDetailSerializer(mantenimiento).data)

    @action(detail=True, methods=['patch'])
    def calificar(self, request, pk=None):
        mantenimiento = self.get_object()
        if mantenimiento.estado != Mantenimiento.Estado.FINALIZADO:
            return Response(
                {'detail': 'Solo se pueden calificar mantenimientos finalizados.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = CalificarMantenimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mantenimiento.calificacion_resultado = serializer.validated_data['calificacion_resultado']
        mantenimiento.save(update_fields=['calificacion_resultado'])
        return Response(MantenimientoDetailSerializer(mantenimiento).data)

    @action(detail=False, methods=['get'])
    def mis_tareas(self, request):
        """Filtra los mantenimientos asignados al técnico autenticado."""
        qs = self.get_queryset().filter(tecnico_asignado=request.user)
        serializer = MantenimientoListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """KPIs rápidos: totales por estado y tipo."""
        qs = self.get_queryset()
        data = {
            'por_estado': {
                estado: qs.filter(estado=estado).count()
                for estado, _ in Mantenimiento.Estado.choices
            },
            'por_tipo': {
                tipo: qs.filter(tipo=tipo).count()
                for tipo, _ in Mantenimiento.Tipo.choices
            },
            'total': qs.count(),
        }
        return Response(data)


class IntervencionViewSet(viewsets.ModelViewSet):
    queryset = Intervencion.objects.select_related('tecnico', 'mantenimiento').all()
    serializer_class = IntervencionSerializer
    filterset_fields = ['mantenimiento', 'tecnico']
    ordering = ['-fecha']

    def perform_create(self, serializer):
        serializer.save(tecnico=self.request.user)
