import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import IntegrityError


class Command(BaseCommand):
    help = 'Crea un superusuario administrador inicial si no existe ninguno.'

    def add_arguments(self, parser):
        parser.add_argument('--username', default=os.environ.get('DJANGO_ADMIN_USERNAME', 'admin'))
        parser.add_argument('--email', default=os.environ.get('DJANGO_ADMIN_EMAIL', 'admin@example.com'))
        parser.add_argument('--password', default=os.environ.get('DJANGO_ADMIN_PASSWORD', None))

    def handle(self, *args, **options):
        Usuario = get_user_model()

        if Usuario.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.WARNING('Ya existe al menos un superusuario. No se crea otro.'))
            return

        username = options['username']
        email = options['email']
        password = options['password']

        if not password:
            self.stdout.write(self.style.ERROR(
                'Debes definir DJANGO_ADMIN_PASSWORD (env var) o pasar --password.'
            ))
            return

        try:
            usuario = Usuario.objects.create_superuser(
                username=username,
                email=email,
                password=password,
            )
            # La señal ya fuerza esto, pero lo dejamos explícito por claridad:
            usuario.rol = Usuario.Rol.ADMINISTRADOR
            usuario.save(update_fields=['rol'])

            self.stdout.write(self.style.SUCCESS(
                f'Superusuario "{username}" creado como ADMINISTRADOR correctamente.'
            ))
        except IntegrityError:
            self.stdout.write(self.style.WARNING(f'El usuario "{username}" ya existe.'))