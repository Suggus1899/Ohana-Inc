#!/bin/sh
set -e

echo "ðŸš€ Iniciando Ohana Backend..."

echo "â³ Ejecutando migraciones de base de datos..."
node dist/scripts/docker-migrate.js

echo "âœ… Migraciones aplicadas. Iniciando servidor..."
exec "$@"
