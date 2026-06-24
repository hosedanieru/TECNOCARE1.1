from django.conf import settings
from django.db import models
from django.utils import timezone

from equipos.models import Equipo


class Mantenimiento(models.Model):
    class Tipo(models.TextChoices):
        PREVENTIVO = 'PREVENTIVO', 'Preventivo'
        CORRECTIVO = 'CORRECTIVO', 'Correctivo'
        PREDICTIVO = 'PREDICTIVO', 'Predictivo'

    class Estado(models.TextChoices):
        PROGRAMADO = 'PROGRAMADO', 'Programado'
        EN_PROCESO = 'EN_PROCESO', 'En proceso'
        FINALIZADO = 'FINALIZADO', 'Finalizado'
        CANCELADO = 'CANCELADO', 'Cancelado'

    class Prioridad(models.TextChoices):
        BAJA = 'BAJA', 'Baja'
        MEDIA = 'MEDIA', 'Media'
        ALTA = 'ALTA', 'Alta'
        CRITICA = 'CRITICA', 'Crítica'

    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='mantenimientos')
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    prioridad = models.CharField(max_length=10, choices=Prioridad.choices, default=Prioridad.MEDIA)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PROGRAMADO)
    tecnico_asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='mantenimientos_asignados',
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='mantenimientos_creados',
    )
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    diagnostico = models.TextField(blank=True)
    solucion_aplicada = models.TextField(blank=True)
    fecha_programada = models.DateField()
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_finalizacion = models.DateTimeField(null=True, blank=True)
    costo_repuestos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    costo_mano_obra = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    calificacion_resultado = models.PositiveSmallIntegerField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_programada', '-fecha_creacion']
        verbose_name = 'Mantenimiento'
        verbose_name_plural = 'Mantenimientos'

    def __str__(self):
        return f'[{self.get_tipo_display()}] {self.titulo} — {self.equipo.codigo_interno}'

    @property
    def costo_total(self):
        return self.costo_repuestos + self.costo_mano_obra

    @property
    def duracion_horas(self):
        """Horas reales entre inicio y finalización."""
        if self.fecha_inicio and self.fecha_finalizacion:
            delta = self.fecha_finalizacion - self.fecha_inicio
            return round(delta.total_seconds() / 3600, 2)
        return None

    def iniciar(self):
        if self.estado != self.Estado.PROGRAMADO:
            raise ValueError('Solo se puede iniciar un mantenimiento PROGRAMADO.')
        self.estado = self.Estado.EN_PROCESO
        self.fecha_inicio = timezone.now()
        self.save(update_fields=['estado', 'fecha_inicio'])
        # Marcar equipo EN_MANTENIMIENTO
        self.equipo.estado = Equipo.Estado.EN_MANTENIMIENTO
        self.equipo.save(update_fields=['estado'])

    def finalizar(self, solucion='', diagnostico=''):
        if self.estado != self.Estado.EN_PROCESO:
            raise ValueError('Solo se puede finalizar un mantenimiento EN_PROCESO.')
        self.estado = self.Estado.FINALIZADO
        self.fecha_finalizacion = timezone.now()
        if solucion:
            self.solucion_aplicada = solucion
        if diagnostico:
            self.diagnostico = diagnostico
        self.save()
        # Actualizar equipo
        self.equipo.estado = Equipo.Estado.OPERATIVO
        if self.tipo == self.Tipo.PREVENTIVO:
            self.equipo.fecha_ultimo_mantenimiento = timezone.localdate()
        self.equipo.save(update_fields=['estado', 'fecha_ultimo_mantenimiento'])

    def cancelar(self, motivo=''):
        if self.estado == self.Estado.FINALIZADO:
            raise ValueError('No se puede cancelar un mantenimiento ya finalizado.')
        self.estado = self.Estado.CANCELADO
        if motivo:
            self.observaciones_cancelacion = motivo
        self.save(update_fields=['estado'])
        if self.equipo.estado == Equipo.Estado.EN_MANTENIMIENTO:
            self.equipo.estado = Equipo.Estado.OPERATIVO
            self.equipo.save(update_fields=['estado'])


class Intervencion(models.Model):
    mantenimiento = models.ForeignKey(
        Mantenimiento, on_delete=models.CASCADE, related_name='intervenciones'
    )
    tecnico = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    fecha = models.DateTimeField(auto_now_add=True)
    descripcion = models.TextField()
    horas_invertidas = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Intervención'
        verbose_name_plural = 'Intervenciones'

    def __str__(self):
        return f'Intervención de {self.tecnico} en {self.mantenimiento} ({self.fecha:%Y-%m-%d})'
