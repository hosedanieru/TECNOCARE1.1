from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Equipo, CategoriaEquipo
from .serializers import EquipoListSerializer, EquipoDetailSerializer, CategoriaEquipoSerializer
from usuarios.permissions import SoloLecturaOEsAdministrador


class CategoriaEquipoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaEquipo.objects.all()
    serializer_class = CategoriaEquipoSerializer
    permission_classes = [SoloLecturaOEsAdministrador]
    search_fields = ['nombre']
    ordering = ['nombre']


class EquipoViewSet(viewsets.ModelViewSet):
    queryset = Equipo.objects.select_related('categoria', 'responsable').all()
    permission_classes = [SoloLecturaOEsAdministrador]
    filterset_fields = ['estado', 'categoria', 'responsable']
    search_fields = ['codigo_interno', 'nombre', 'numero_serie', 'ubicacion', 'marca']
    ordering_fields = ['codigo_interno', 'nombre', 'estado', 'fecha_creacion']
    ordering = ['codigo_interno']

    def get_serializer_class(self):
        if self.action == 'list':
            return EquipoListSerializer
        return EquipoDetailSerializer

    @action(detail=False, methods=['get'])
    def alertas_proximas(self, request):
        """
        Devuelve equipos cuyo próximo mantenimiento cae dentro de `dias` días
        (parámetro query, default 30). Incluye vencidos (dias < 0).
        """
        dias = int(request.query_params.get('dias', 30))
        hoy = timezone.localdate()
        limite = hoy + timedelta(days=dias)
        qs = self.get_queryset()
        proximos = [
            e for e in qs
            if e.proximo_mantenimiento and e.proximo_mantenimiento <= limite
        ]
        proximos.sort(key=lambda e: e.proximo_mantenimiento)
        serializer = EquipoListSerializer(proximos, many=True)
        return Response({
            'total': len(proximos),
            'vencidos': sum(1 for e in proximos if e.alerta_vencida),
            'proximos': sum(1 for e in proximos if e.alerta_proxima and not e.alerta_vencida),
            'equipos': serializer.data,
        })

    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        """Cambia el estado de un equipo directamente (solo ADMIN)."""
        equipo = self.get_object()
        nuevo_estado = request.data.get('estado')
        if nuevo_estado not in Equipo.Estado.values:
            return Response(
                {'detail': f'Estado inválido. Opciones: {Equipo.Estado.values}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        equipo.estado = nuevo_estado
        equipo.save(update_fields=['estado'])
        return Response(EquipoDetailSerializer(equipo).data)
