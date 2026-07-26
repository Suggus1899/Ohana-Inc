#!/bin/sh
set -e

echo "[Dev Entrypoint] Verificando dependencias..."

# Verificar si node_modules existe y si package.json tiene cambios
# Durante desarrollo, el usuario puede cambiar package.json
# Por eso verificamos si hay cambios y actualizamos si es necesario
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-hash" ] || \
   [ "$(md5sum package.json 2>/dev/null | cut -d' ' -f1)" != "$(cat node_modules/.package-hash 2>/dev/null)" ]; then
    echo "[Dev Entrypoint] Instalando dependencias con pnpm..."
    # No usamos --frozen-lockfile en desarrollo para permitir actualizaciones
    pnpm install
    md5sum package.json 2>/dev/null | cut -d' ' -f1 > node_modules/.package-hash
    echo "[Dev Entrypoint] Dependencias instaladas correctamente"
else
    echo "[Dev Entrypoint] Dependencias actualizadas, saltando pnpm install"
fi

# Esperar a que PostgreSQL estÃ© listo antes de iniciar
echo "[Dev Entrypoint] Esperando a que PostgreSQL estÃ© listo..."
MAX_RETRIES=30
RETRY_INTERVAL=2
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"

for i in $(seq 1 $MAX_RETRIES); do
  if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    echo "[Dev Entrypoint] âœ… PostgreSQL estÃ¡ listo en $DB_HOST:$DB_PORT"
    break
  else
    if [ $i -eq $MAX_RETRIES ]; then
      echo "[Dev Entrypoint] âŒ Error: No se pudo conectar a PostgreSQL despuÃ©s de $MAX_RETRIES intentos"
      exit 1
    fi
    echo "[Dev Entrypoint] â³ Intento $i/$MAX_RETRIES: PostgreSQL no estÃ¡ listo, esperando $RETRY_INTERVAL segundos..."
    sleep $RETRY_INTERVAL
  fi
done

# Esperar adicionalmente para asegurar que PostgreSQL estÃ© completamente listo
echo "[Dev Entrypoint] Esperando 5 segundos adicionales para asegurar que PostgreSQL estÃ© completamente inicializado..."
sleep 5

echo "[Dev Entrypoint] Iniciando servidor de desarrollo..."
exec "$@"
