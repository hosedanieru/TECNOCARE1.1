from django.conf import settings
from django.db import models, transaction
from django.utils import timezone


class CategoriaEquipo(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Categoría de Equipo'
        verbose_name_plural = 'Categorías de Equipos'

    def __str__(self):
        return self.nombre


class SecuenciaEquipo(models.Model):
    """
    Fila única (pk=1) que lleva el contador para generar códigos internos
    secuenciales (EQ-0001, EQ-0002...) sin colisiones entre requests
    concurrentes. select_for_update() bloquea la fila hasta que termine
    la transacción, así dos creaciones simultáneas nunca calculan el
    mismo número.
    """
    ultimo_numero = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Secuencia de Equipo'
        verbose_name_plural = 'Secuencias de Equipo'

    @classmethod
    def siguiente_numero(cls):
        with transaction.atomic():
            secuencia, _ = cls.objects.select_for_update().get_or_create(pk=1)
            secuencia.ultimo_numero += 1
            secuencia.save(update_fields=['ultimo_numero'])
            return secuencia.ultimo_numero


class Equipo(models.Model):
    class Estado(models.TextChoices):
        OPERATIVO = 'OPERATIVO', 'Operativo'
        EN_MANTENIMIENTO = 'EN_MANTENIMIENTO', 'En mantenimiento'
        FUERA_DE_SERVICIO = 'FUERA_DE_SERVICIO', 'Fuera de servicio'
        DADO_DE_BAJA = 'DADO_DE_BAJA', 'Dado de baja'

    # blank=True: ya no es obligatorio en formularios/serializers, se
    # autogenera en save() si viene vacío. unique=True se mantiene.
    codigo_interno = models.CharField(max_length=30, unique=True, blank=True)
    nombre = models.CharField(max_length=150)
    categoria = models.ForeignKey(
        CategoriaEquipo, on_delete=models.PROTECT, related_name='equipos'
    )
    marca = models.CharField(max_length=100, blank=True)
    modelo = models.CharField(max_length=100, blank=True)
    numero_serie = models.CharField(max_length=100, blank=True)
    ubicacion = models.CharField(max_length=150)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.OPERATIVO)
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='equipos_a_cargo',
    )
    fecha_adquisicion = models.DateField(null=True, blank=True)
    frecuencia_mantenimiento_dias = models.PositiveIntegerField(default=90)
    fecha_ultimo_mantenimiento = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['codigo_interno']
        verbose_name = 'Equipo'
        verbose_name_plural = 'Equipos'

    def __str__(self):
        return f'{self.codigo_interno} — {self.nombre}'

    def save(self, *args, **kwargs):
        if not self.codigo_interno:
            numero = SecuenciaEquipo.siguiente_numero()
            self.codigo_interno = f'EQ-{numero:04d}'
        super().save(*args, **kwargs)

    @property
    def proximo_mantenimiento(self):
        from datetime import timedelta
        base = self.fecha_ultimo_mantenimiento or self.fecha_adquisicion
        if not base:
            return None
        return base + timedelta(days=self.frecuencia_mantenimiento_dias)

    @property
    def dias_para_proximo_mantenimiento(self):
        proximo = self.proximo_mantenimiento
        if not proximo:
            return None
        delta = proximo - timezone.localdate()
        return delta.days

    @property
    def alerta_vencida(self):
        dias = self.dias_para_proximo_mantenimiento
        return dias is not None and dias < 0

    @property
    def alerta_proxima(self):
        dias = self.dias_para_proximo_mantenimiento
        return dias is not None and 0 <= dias <= 30