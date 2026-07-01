from rest_framework.routers import DefaultRouter
from .views import MantenimientoViewSet, IntervencionViewSet

router = DefaultRouter()
router.register('mantenimientos', MantenimientoViewSet, basename='mantenimiento')
router.register('intervenciones', IntervencionViewSet, basename='intervencion')

urlpatterns = router.urls