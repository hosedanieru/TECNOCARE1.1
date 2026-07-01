from django.db.models.signals import pre_save
from django.dispatch import receiver

from .models import Usuario


@receiver(pre_save, sender=Usuario)
def forzar_rol_admin_en_superusuarios(sender, instance, **kwargs):
    """
    Si el usuario se marca como superusuario (createsuperuser, admin, shell, etc.)
    aseguramos que su rol sea ADMINISTRADOR, sin importar cómo se haya creado.
    """
    if instance.is_superuser and instance.rol != Usuario.Rol.ADMINISTRADOR:
        instance.rol = Usuario.Rol.ADMINISTRADOR