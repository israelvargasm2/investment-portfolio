#!/usr/bin/env bash
#
# Actualización de investment-portfolio-api + investment-portfolio-web en una
# instancia de AWS Lightsail que YA corrió lightsail-setup.sh al menos una
# vez (Node/PM2/Nginx/ufw/certbot ya instalados y configurados). Este script
# NO toca nada de infraestructura — solo trae el código nuevo de GitHub,
# reinstala dependencias, compila y reinicia lo necesario. Para el setup
# inicial de una instancia nueva, usar lightsail-setup.sh en cambio.
#
# Qué hace:
#   1. API: git pull, npm ci, build, corre migraciones nuevas (si las hay) y
#      reinicia el proceso de PM2.
#   2. Frontend: git pull, npm ci, build, y publica el resultado en el
#      directorio que sirve Nginx (rsync, sin reiniciar nada: son estáticos).
#
# Uso: parado en el home del usuario de la instancia (donde ya viven ambos
# clones, ej. "ubuntu"):
#   chmod +x lightsail-update.sh && ./lightsail-update.sh
#
# Es seguro re-ejecutarlo.

set -euo pipefail

# Sin esto, el primer `ng build`/`npm ci` del frontend pregunta interactivo
# si querés mandar analytics a Google — corta el script esperando un input
# que nunca llega si se corre sin terminal (ej. cron, CI).
export NG_CLI_ANALYTICS=false

# Mismos paths que usa lightsail-setup.sh — deben coincidir con dónde
# quedaron clonados los repos la primera vez que corrió ese script.
APP_DIR="$HOME/investment-portfolio-api"
WEB_APP_DIR="$HOME/investment-portfolio-web"
WEB_ROOT="/var/www/investment-portfolio-web"

# ---------------------------------------------------------------------------
# 1. API
# ---------------------------------------------------------------------------

echo "==> Actualizando la API..."
git -C "$APP_DIR" pull

cd "$APP_DIR"
npm ci
npm run build

echo "==> Corriendo migraciones de base de datos..."
if ! npm run migration:run; then
  echo "!!! Las migraciones fallaron — revisá el error arriba antes de seguir."
  exit 1
fi

echo "==> Reiniciando la API con PM2..."
pm2 restart investment-portfolio-api --update-env

# ---------------------------------------------------------------------------
# 2. Frontend
# ---------------------------------------------------------------------------

if [ -d "$WEB_APP_DIR/.git" ]; then
  echo "==> Actualizando el frontend..."
  git -C "$WEB_APP_DIR" pull

  # google-client-id.ts está gitignorado (ver su .example para el porqué) —
  # se regenera acá con el valor real en cada build, leyéndolo del .env de
  # la API (mismo Client ID de los dos lados, un solo lugar donde
  # escribirlo a mano). Al no ser un archivo trackeado, esto nunca genera
  # una modificación local que choque con el próximo `git pull`.
  GOOGLE_CLIENT_ID_VALUE="$(grep -E '^GOOGLE_CLIENT_ID=' "$APP_DIR/.env" 2>/dev/null | cut -d '=' -f2- || true)"
  if [ -n "$GOOGLE_CLIENT_ID_VALUE" ]; then
    cat > "$WEB_APP_DIR/src/environments/google-client-id.ts" <<EOF
export const GOOGLE_CLIENT_ID = '${GOOGLE_CLIENT_ID_VALUE}';
EOF
  else
    echo "!!! GOOGLE_CLIENT_ID vacío en $APP_DIR/.env — el frontend se va a compilar con el placeholder"
    echo "    y el login con Google no va a andar. Completalo ahí y volvé a correr este script."
    cp "$WEB_APP_DIR/src/environments/google-client-id.example.ts" "$WEB_APP_DIR/src/environments/google-client-id.ts"
  fi

  (cd "$WEB_APP_DIR" && npm ci && npm run build)

  echo "==> Publicando build en $WEB_ROOT..."
  rsync -a --delete "$WEB_APP_DIR/dist/investment-portfolio-web/browser/" "$WEB_ROOT/"
else
  echo "==> $WEB_APP_DIR no existe (no se clonó con lightsail-setup.sh) — se omite el frontend."
fi

echo ""
echo "==> Listo."
