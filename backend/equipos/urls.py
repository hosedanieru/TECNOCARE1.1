from rest_framework.routers import DefaultRouter
from .views import EquipoViewSet, CategoriaEquipoViewSet

router = DefaultRouter()
router.register('equipos', EquipoViewSet, basename='equipo')
router.register('categorias-equipo', CategoriaEquipoViewSet, basename='categoria-equipo')

urlpatterns = router.urls
