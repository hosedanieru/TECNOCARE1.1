from django.contrib import admin
from .models import Mantenimiento, Intervencion


class IntervencionInline(admin.TabularInline):
    model = Intervencion
    extra = 0


@admin.register(Mantenimiento)
class MantenimientoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'equipo', 'tipo', 'estado', 'prioridad', 'tecnico_asignado', 'fecha_programada']
    list_filter = ['tipo', 'estado', 'prioridad']
    search_fields = ['titulo', 'equipo__codigo_interno']
    inlines = [IntervencionInline]


@admin.register(Intervencion)
class IntervencionAdmin(admin.ModelAdmin):
    list_display = ['mantenimiento', 'tecnico', 'fecha', 'horas_invertidas']
