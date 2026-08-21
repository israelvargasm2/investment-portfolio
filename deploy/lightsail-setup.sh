#!/usr/bin/env bash
#
# Setup inicial de investment-portfolio-api en una instancia de AWS Lightsail
# (blueprint "OS Only" Ubuntu 22.04/24.04). NO instala PostgreSQL: la base de
# datos vive afuera (ej. Neon/Supabase) y se conecta vía DATABASE_URL.
#
# Qué hace:
#   1. Instala Node.js (NodeSource) + PM2 (proceso siempre vivo, reinicia
#      solo ante crash/reboot).
#   2. Instala y configura Nginx como reverse proxy (la API nunca queda
#      expuesta directo a internet, solo vía Nginx en 80/443).
#   3. Activa el firewall del sistema operativo (ufw) — esto es ADEMÁS del
#      firewall de red de Lightsail, que se configura aparte en la consola
#      (Networking -> instancia -> Firewall: abrir HTTP/80 y HTTPS/443;
#      SSH/22 ya viene abierto por default). Sin abrir esos dos puertos ahí,
#      nada de esto es alcanzable desde afuera aunque el script corra bien.
#   4. Deja el código listo para buildear y levantar con PM2.
#
# Uso: copiar este archivo a la instancia (scp) y correrlo como el usuario
# con sudo (ej. "ubuntu"):
#   scp deploy/lightsail-setup.sh ubuntu@<IP-de-la-instancia>:~/
#   ssh ubuntu@<IP-de-la-instancia>
#   chmod +x lightsail-setup.sh && ./lightsail-setup.sh
#
# Es seguro re-ejecutarlo (los pasos son idempotentes).

set -euo pipefail

# ---------------------------------------------------------------------------
# Variables — ajustar antes de correr
# ---------------------------------------------------------------------------

# Si el código se sube vía git, poner acá la URL del repo remoto (ej. GitHub)
# y descomentar el bloque "git clone" más abajo. Si en cambio se sube el
# código con scp/rsync desde la máquina local, dejar vacío y subir el
# proyecto a mano a $APP_DIR antes de correr este script (o después, editando
# el bloque marcado abajo).
REPO_URL="https://github.com/israelvargasm2/investment-portfolio.git"

APP_DIR="$HOME/investment-portfolio-api"
NODE_MAJOR="20"                 # LTS — misma major usada en desarrollo
APP_PORT="3000"                 # debe coincidir con PORT en .env
DOMAIN=""                       # ej. "api.tudominio.com" — vacío = Nginx sirve por IP, sin HTTPS todavía

# ---------------------------------------------------------------------------
# 1. Paquetes base + Node.js
# ---------------------------------------------------------------------------

echo "==> Actualizando paquetes del sistema..."
sudo apt-get update -y
sudo apt-get upgrade -y

if ! command -v node >/dev/null 2>&1; then
  echo "==> Instalando Node.js ${NODE_MAJOR}.x..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v
npm -v

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Instalando PM2..."
  sudo npm install -g pm2
fi

# ---------------------------------------------------------------------------
# 2. Nginx (reverse proxy)
# ---------------------------------------------------------------------------

if ! command -v nginx >/dev/null 2>&1; then
  echo "==> Instalando Nginx..."
  sudo apt-get install -y nginx
fi

NGINX_SERVER_NAME="${DOMAIN:-_}" # "_" = catch-all, sirve por IP si no hay dominio todavía

sudo tee /etc/nginx/sites-available/investment-portfolio-api > /dev/null <<EOF
server {
    listen 80;
    server_name ${NGINX_SERVER_NAME};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/investment-portfolio-api /etc/nginx/sites-enabled/investment-portfolio-api
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# ---------------------------------------------------------------------------
# 3. Firewall del sistema operativo (ufw)
# ---------------------------------------------------------------------------

echo "==> Configurando ufw..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # 80 y 443
sudo ufw --force enable
sudo ufw status

# ---------------------------------------------------------------------------
# 4. Código de la aplicación
# ---------------------------------------------------------------------------

if [ -n "$REPO_URL" ]; then
  if [ -d "$APP_DIR/.git" ]; then
    echo "==> Repo ya existe, haciendo git pull..."
    git -C "$APP_DIR" pull
  else
    echo "==> Clonando repo..."
    git clone "$REPO_URL" "$APP_DIR"
  fi
else
  echo "==> REPO_URL vacío: asegurate de haber subido el código a $APP_DIR"
  echo "    (ej. desde tu máquina: rsync -avz --exclude node_modules --exclude dist ./ ubuntu@<IP>:${APP_DIR}/)"
  mkdir -p "$APP_DIR"
fi

cd "$APP_DIR"

echo "==> Instalando dependencias y compilando..."
npm ci
npm run build

# ---------------------------------------------------------------------------
# 5. Variables de entorno (.env)
# ---------------------------------------------------------------------------

if [ ! -f "$APP_DIR/.env" ]; then
  if [ -f "$APP_DIR/.env.example" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  else
    touch "$APP_DIR/.env"
  fi
  echo "!!! Falta completar $APP_DIR/.env con valores reales antes de arrancar la app:"
  echo "    - DATABASE_URL   (Postgres externo, ej. Neon/Supabase; no se instaló Postgres acá)"
  echo "    - DATABASE_SSL   (dejar sin definir o 'true' salvo que el proveedor no use SSL)"
  echo "    - JWT_SECRET     (string largo y aleatorio, ej: openssl rand -base64 48)"
  echo "    - JWT_EXPIRES_IN (opcional, default 1h)"
  echo "    - GOOGLE_CLIENT_ID (mismo Client ID que usa el frontend)"
  echo "    - FINNHUB_API_KEY"
  echo "    - CORS_ORIGIN    (origen exacto del frontend en producción, ej. https://tuapp.pages.dev)"
  echo "    - PORT=${APP_PORT}"
  echo ""
  echo "Editar con: nano $APP_DIR/.env"
  echo "Después volver a correr este script, o solo: pm2 restart investment-portfolio-api"
fi

# ---------------------------------------------------------------------------
# 6. Levantar con PM2
# ---------------------------------------------------------------------------

echo "==> Iniciando con PM2..."
pm2 start dist/main.js --name investment-portfolio-api --update-env || pm2 restart investment-portfolio-api --update-env
pm2 save

# Deja el arranque de PM2 registrado como servicio systemd para que la API
# vuelva a levantarse sola después de un reinicio de la instancia.
STARTUP_CMD="$(pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1)"
if [[ "$STARTUP_CMD" == sudo* ]]; then
  eval "$STARTUP_CMD"
fi

echo ""
echo "==> Listo. Chequeos pendientes:"
echo "1. Completar $APP_DIR/.env con valores reales (ver arriba) si todavía no se hizo, y correr: pm2 restart investment-portfolio-api"
echo "2. En la consola de Lightsail (Networking de esta instancia): abrir los puertos 80 (HTTP) y 443 (HTTPS)."
echo "3. Si hay un dominio apuntando a la IP de esta instancia, correr certbot para HTTPS:"
echo "     sudo apt-get install -y certbot python3-certbot-nginx"
echo "     sudo certbot --nginx -d ${DOMAIN:-tu-dominio.com}"
echo "4. Para actualizar la app más adelante: git pull (o volver a subir el código), npm ci, npm run build, pm2 restart investment-portfolio-api"
#git pull && npm ci && npm run build && pm2 restart
