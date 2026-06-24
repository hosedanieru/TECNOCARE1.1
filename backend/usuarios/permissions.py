from rest_framework import permissions


class EsAdministrador(permissions.BasePermission):
    message = 'Solo un Administrador puede realizar esta acción.'

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.es_administrador
        )


class EsSupervisorOAdministrador(permissions.BasePermission):
    message = 'Solo un Supervisor o Administrador puede realizar esta acción.'

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and (request.user.es_supervisor or request.user.es_administrador)
        )


class SoloLecturaOEsAdministrador(permissions.BasePermission):
    """GET/HEAD/OPTIONS libre para autenticados; escritura solo ADMIN."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.es_administrador
