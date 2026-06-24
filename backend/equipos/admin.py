from django.contrib import admin
from .models import Equipo, CategoriaEquipo

@admin.register(CategoriaEquipo)
class CategoriaEquipoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)

@admin.register(Equipo)
class EquipoAdmin(admin.ModelAdmin):
    list_display = ('codigo_interno', 'nombre', 'categoria', 'estado', 'ubicacion')
    list_filter = ('categoria', 'estado')
    search_fields = ('codigo_interno', 'nombre')

# Register your models here.
