#!/bin/sh
set -e

echo "Aplicando migraciones..."
python manage.py migrate --noinput

echo "Verificando/creando superusuario administrador inicial..."
python manage.py crear_admin_inicial

echo "Iniciando gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2