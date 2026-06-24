from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from equipos.models import Equipo
from mantenimientos.models import Mantenimiento
from .pdf_generator import generar_pdf_historial_equipo, generar_pdf_reporte_general


class ReporteHistorialEquipoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, equipo_id):
        equipo = get_object_or_404(Equipo, pk=equipo_id)
        mantenimientos = equipo.mantenimientos.select_related('tecnico_asignado').order_by('-fecha_programada')
        buffer = generar_pdf_historial_equipo(equipo, mantenimientos)
        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f'historial_{equipo.codigo_interno}.pdf',
            content_type='application/pdf',
        )


class ReporteGeneralView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Mantenimiento.objects.select_related('equipo', 'tecnico_asignado').all()
        filtros_aplicados = {}

        FILTROS_PERMITIDOS = ['tipo', 'estado', 'prioridad', 'equipo', 'tecnico_asignado']
        for campo in FILTROS_PERMITIDOS:
            valor = request.query_params.get(campo)
            if valor:
                qs = qs.filter(**{campo: valor})
                filtros_aplicados[campo] = valor

        # Rango de fechas
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        if fecha_desde:
            qs = qs.filter(fecha_programada__gte=fecha_desde)
            filtros_aplicados['fecha_desde'] = fecha_desde
        if fecha_hasta:
            qs = qs.filter(fecha_programada__lte=fecha_hasta)
            filtros_aplicados['fecha_hasta'] = fecha_hasta

        buffer = generar_pdf_reporte_general(list(qs), filtros=filtros_aplicados or None)
        return FileResponse(
            buffer,
            as_attachment=True,
            filename='reporte_general.pdf',
            content_type='application/pdf',
        )


class EstadisticasView(APIView):
    """Endpoint JSON con estadísticas para el dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count, Sum, Avg

        equipos_qs = Equipo.objects.all()
        mantenimientos_qs = Mantenimiento.objects.all()

        equipos_por_estado = {
            e: equipos_qs.filter(estado=e).count()
            for e, _ in Equipo.Estado.choices
        }

        mant_por_tipo = dict(
            mantenimientos_qs.values('tipo').annotate(total=Count('id')).values_list('tipo', 'total')
        )
        mant_por_estado = dict(
            mantenimientos_qs.values('estado').annotate(total=Count('id')).values_list('estado', 'total')
        )

        costos = mantenimientos_qs.filter(estado=Mantenimiento.Estado.FINALIZADO).aggregate(
            total_repuestos=Sum('costo_repuestos'),
            total_mano_obra=Sum('costo_mano_obra'),
            promedio_calificacion=Avg('calificacion_resultado'),
        )

        return Response({
            'equipos': {
                'total': equipos_qs.count(),
                'por_estado': equipos_por_estado,
            },
            'mantenimientos': {
                'total': mantenimientos_qs.count(),
                'por_tipo': mant_por_tipo,
                'por_estado': mant_por_estado,
            },
            'costos': {
                'total_repuestos': costos['total_repuestos'] or 0,
                'total_mano_obra': costos['total_mano_obra'] or 0,
                'total': (costos['total_repuestos'] or 0) + (costos['total_mano_obra'] or 0),
                'promedio_calificacion': round(costos['promedio_calificacion'] or 0, 2),
            },
        })
