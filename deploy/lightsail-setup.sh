#!/usr/bin/env bash
#
# Setup inicial de investment-portfolio-api + investment-portfolio-web en una
# instancia de AWS Lightsail (blueprint "OS Only" Ubuntu 22.04/24.04). NO
# instala PostgreSQL: la base de datos vive afuera (ej. Neon/Supabase) y se
# conecta vía DATABASE_URL.
#
# Qué hace:
#   1. Instala Node.js (NodeSource) + PM2 (proceso siempre vivo, reinicia
#      solo ante crash/reboot) para la API.
#   2. Instala y configura Nginx. Si DOMAIN está seteado (default: matrixa.uk),
#      usa dos server blocks por nombre de host: "matrixa.uk"/"www.matrixa.uk"
#      sirven el build estático de Angular, "api.matrixa.uk" hace proxy
#      directo a la API Nest (puerto interno, nunca expuesto). Si DOMAIN
#      queda vacío, cae a un único server block por IP con "/" para el
#      frontend y "/api/" como proxy con prefijo — ver apiUrl en
#      investment-portfolio-web/src/environments/environment.ts, tiene que
#      coincidir con el modo elegido acá.
#   5. Si DOMAIN y CERTBOT_EMAIL están seteados, pide certificados HTTPS
#      gratis (Let's Encrypt) para los tres hosts con certbot y configura el
#      redirect HTTP->HTTPS solo. Requiere que el DNS ya esté apuntando a la
#      IP estática de esta instancia (A en @ y www, CNAME en api -> @, como
#      ya tenés armado) — si el DNS todavía no propagó, este paso falla con
#      un aviso claro y el resto del script sigue igual.
#   3. Activa el firewall del sistema operativo (ufw) — esto es ADEMÁS del
#      firewall de red de Lightsail, que se configura aparte en la consola
#      (Networking -> instancia -> Firewall: abrir HTTP/80 y HTTPS/443;
#      SSH/22 ya viene abierto por default). Sin abrir esos dos puertos ahí,
#      nada de esto es alcanzable desde afuera aunque el script corra bien.
#   4. Deja la API lista para buildear y levantar con PM2, y si WEB_REPO_URL
#      está seteado, clona/actualiza y buildea también el frontend acá
#      mismo (ver sección 7). Agrega un swapfile antes de buildear (sección
#      1.5): `ng build` de producción puede pedir más RAM de la que trae el
#      bundle más chico de Lightsail (512MB-1GB) y el swap evita que el
#      build muera por eso, a costa de ser más lento si se llega a usar. Si
#      preferís no buildear en el servidor, dejá WEB_REPO_URL vacío: la
#      sección 7 te va a pedir el build hecho en tu máquina + rsync.
#
# Uso: copiar este archivo a la instancia (scp) y correrlo como el usuario
# con sudo (ej. "ubuntu"):
#   scp deploy/lightsail-setup.sh ubuntu@<IP-de-la-instancia>:~/
#   ssh ubuntu@<IP-de-la-instancia>
#   chmod +x lightsail-setup.sh && ./lightsail-setup.sh
#
# Es seguro re-ejecutarlo (los pasos son idempotentes).

set -euo pipefail

# Sin esto, el primer `ng build`/`npm ci` del frontend pregunta interactivo
# si querés mandar analytics a Google — corta el script esperando un input
# que nunca llega si se corre sin terminal (ej. cron, CI).
export NG_CLI_ANALYTICS=false

# ---------------------------------------------------------------------------
# Variables — ajustar antes de correr
# ---------------------------------------------------------------------------

# Si el código de la API se sube vía git, poner acá la URL del repo remoto.
# Si en cambio se sube con scp/rsync desde la máquina local, dejar vacío y
# subir el proyecto a mano a $APP_DIR (o después, re-corriendo este script).
REPO_URL="https://github.com/israelvargasm2/investment-portfolio.git"

# Igual que REPO_URL pero para investment-portfolio-web. Si se setea, la
# sección 7 clona y buildea el frontend en el servidor. Si se deja vacío, hay
# que buildearlo a mano en tu máquina y subir el resultado por rsync (ver
# sección 7 para el comando exacto).
WEB_REPO_URL="https://github.com/israelvargasm2/investment-portfolio-web.git"

APP_DIR="$HOME/investment-portfolio-api"
WEB_APP_DIR="$HOME/investment-portfolio-web"
NODE_MAJOR="20"                 # LTS — misma major usada en desarrollo
APP_PORT="3000"                 # debe coincidir con PORT en .env

# Dominio base. Se usan 3 hosts: "$DOMAIN" y "www.$DOMAIN" para el frontend,
# "api.$DOMAIN" para la API (coincide con el DNS: A en @ y www a la IP
# estática, CNAME en api -> @). Vacío = Nginx sirve por IP en cambio, sin
# dominio ni HTTPS (ver sección 2).
DOMAIN="matrixa.uk"

# Email para el registro de Let's Encrypt (avisos de expiración, requerido
# por certbot) — no es secreto, pero no lo puedo completar por vos. Si queda
# vacío, el script deja los certificados listos para pedir a mano (sección 8
# te da el comando exacto) en vez de fallar.
CERTBOT_EMAIL="israelvargas44m@gmail.com"

# Directorio donde Nginx sirve el build estático de Angular. Es un directorio
# de PUBLICACIÓN (lo que Nginx expone), separado de $WEB_APP_DIR (el clon del
# repo con el código fuente) — el build compilado se copia de uno a otro.
WEB_ROOT="/var/www/investment-portfolio-web"

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

if ! command -v rsync >/dev/null 2>&1; then
  echo "==> Instalando rsync..."
  sudo apt-get install -y rsync
fi

# ---------------------------------------------------------------------------
# 1.5. Swap — red de seguridad para el build de Angular (ver sección 7)
# ---------------------------------------------------------------------------
# Sin esto, un `ng build` de producción puede morir con "JavaScript heap out
# of memory" (o el OOM killer del kernel lo mata directo) en el bundle más
# chico de Lightsail. El swap no acelera nada, solo evita que el build falle
# —si lo llega a usar, va a ser lento—; si el build sigue fallando o tarda
# demasiado, la solución real es subir de bundle, no agrandar el swap.
if [ ! -f /swapfile ]; then
  echo "==> Creando swapfile de 2GB..."
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
fi

# ---------------------------------------------------------------------------
# 2. Directorio del frontend + Nginx (estáticos + reverse proxy)
# ---------------------------------------------------------------------------

sudo mkdir -p "$WEB_ROOT"
sudo chown -R "$USER":"$USER" "$WEB_ROOT"

if ! command -v nginx >/dev/null 2>&1; then
  echo "==> Instalando Nginx..."
  sudo apt-get install -y nginx
fi

# Si esta instancia ya había corrido una versión anterior de este script
# (solo-API, sin frontend), limpia ese site viejo para que no quede compitiendo
# con el nuevo.
sudo rm -f /etc/nginx/sites-available/investment-portfolio-api /etc/nginx/sites-enabled/investment-portfolio-api

NGINX_CONFIG_PATH="/etc/nginx/sites-available/investment-portfolio"

if [ -n "$DOMAIN" ]; then
  echo "==> Configurando Nginx con dominio (${DOMAIN}, www.${DOMAIN}, api.${DOMAIN})..."
  sudo tee "$NGINX_CONFIG_PATH" > /dev/null <<EOF
# Frontend: Angular estático, apex + www.
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    root ${WEB_ROOT};
    index index.html;

    # Angular Router (rutas del lado del cliente): sin este fallback,
    # refrescar en /watchlist o /purchases da 404 (esa ruta no existe como
    # archivo real, la resuelve el JS de Angular una vez cargado index.html).
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}

# API: subdominio propio (coincide con el CNAME api -> ${DOMAIN} del DNS).
# Todo el namespace de este host es la API, sin prefijo "/api/" — a
# diferencia del modo sin dominio de abajo, acá cada subdominio es su propio
# origen.
server {
    listen 80;
    server_name api.${DOMAIN};

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
else
  echo "==> Configurando Nginx sin dominio (sirve por IP: frontend en \"/\", API en \"/api/\")..."
  sudo tee "$NGINX_CONFIG_PATH" > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    root ${WEB_ROOT};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Todo lo que empiece con /api/ va a la API Nest (puerto interno, nunca
    # expuesto directo). El "/" al final de location y de proxy_pass es lo
    # que hace que Nginx saque el prefijo "/api" antes de reenviar: un
    # request externo a /api/watchlist le llega a Nest como /watchlist.
    location /api/ {
        proxy_pass http://127.0.0.1:${APP_PORT}/;
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
fi

sudo ln -sf "$NGINX_CONFIG_PATH" /etc/nginx/sites-enabled/investment-portfolio
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
# 4. Código de la API
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

echo "==> Instalando dependencias y compilando la API..."
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
  if [ -n "$DOMAIN" ]; then
    echo "    - CORS_ORIGIN=https://${DOMAIN},https://www.${DOMAIN}"
    echo "      (frontend y API quedan en subdominios distintos -matrixa.uk / api.matrixa.uk-, así que"
    echo "      esto SÍ hace falta: sin el origen exacto del frontend acá, el navegador bloquea los"
    echo "      requests por CORS)"
  else
    echo "    - CORS_ORIGIN    (con frontend y API bajo el mismo origen -sin DOMAIN, ver sección 2- no es"
    echo "      estrictamente necesario para lo que sirve Nginx acá, pero dejalo apuntando al"
    echo "      origen público del sitio por si accedés a la API desde otro origen, ej. en dev)"
  fi
  echo "    - PORT=${APP_PORT}"
  echo ""
  echo "Editar con: nano $APP_DIR/.env"
  echo "Después volver a correr este script, o solo: pm2 restart investment-portfolio-api"
fi

# ---------------------------------------------------------------------------
# 5.5. Migraciones de base de datos
# ---------------------------------------------------------------------------
# Correr siempre (no solo la primera vez): así una tabla nueva agregada en
# una versión posterior del código (ej. accounts) se crea sola en cada
# re-deploy, sin tener que acordarse de correr esto a mano. TypeORM no
# reaplica migraciones ya corridas (lleva registro en su propia tabla
# "migrations"), así que repetir esto en cada corrida del script es seguro.
echo "==> Corriendo migraciones de base de datos..."
if ! npm run migration:run; then
  echo "!!! Las migraciones fallaron — probablemente falta completar DATABASE_URL en $APP_DIR/.env todavía."
  echo "    Completalo y corré a mano: cd $APP_DIR && npm run migration:run"
fi

# ---------------------------------------------------------------------------
# 6. Levantar la API con PM2
# ---------------------------------------------------------------------------

echo "==> Iniciando con PM2..."
pm2 start dist/main.js --name investment-portfolio-api --update-env || pm2 restart investment-portfolio-api --update-env
pm2 save

# Deja el arranque de PM2 registrado como servicio systemd para que la API
# vuelva a levantarse sola después de un reinicio de la instancia.
# `pm2 startup` termina con exit code 1 a propósito (no configura nada solo,
# solo imprime el comando `sudo ...` que hay que correr) — con `set -e` eso
# cortaba el script acá mismo antes de llegar a la sección 7. El "|| true"
# evita que ese código de salida "esperado" aborte todo.
STARTUP_CMD="$(pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1)" || true
if [[ "$STARTUP_CMD" == sudo* ]]; then
  eval "$STARTUP_CMD"
fi

# ---------------------------------------------------------------------------
# 7. Frontend Angular
# ---------------------------------------------------------------------------

if [ -n "$WEB_REPO_URL" ]; then
  if [ -d "$WEB_APP_DIR/.git" ]; then
    echo "==> Repo del frontend ya existe, actualizando..."
    git -C "$WEB_APP_DIR" pull
  else
    echo "==> Clonando repo del frontend..."
    git clone "$WEB_REPO_URL" "$WEB_APP_DIR"
  fi

  # El Client ID de Google OAuth no es un secreto (está pensado para ir
  # embebido en cualquier frontend que use Sign In With Google — a
  # diferencia de JWT_SECRET/DATABASE_URL/etc., no necesita vivir en un
  # .env), pero igual no se commitea en el frontend: environment.ts importa
  # el valor desde src/environments/google-client-id.ts, que está
  # gitignorado (ver google-client-id.example.ts ahí para el porqué) — así
  # que hay que generarlo acá, en cada build. En vez de pedirlo dos veces,
  # se reusa el GOOGLE_CLIENT_ID que ya completaste en $APP_DIR/.env (ver
  # sección 5) — mismo Client ID de los dos lados, un solo lugar donde
  # escribirlo a mano. Al no ser un archivo trackeado, esto nunca genera una
  # modificación local que choque con el próximo `git pull`.
  GOOGLE_CLIENT_ID_VALUE="$(grep -E '^GOOGLE_CLIENT_ID=' "$APP_DIR/.env" 2>/dev/null | cut -d '=' -f2- || true)"
  if [ -n "$GOOGLE_CLIENT_ID_VALUE" ]; then
    cat > "$WEB_APP_DIR/src/environments/google-client-id.ts" <<EOF
export const GOOGLE_CLIENT_ID = '${GOOGLE_CLIENT_ID_VALUE}';
EOF
  else
    echo "!!! GOOGLE_CLIENT_ID vacío en $APP_DIR/.env — completalo ahí primero y volvé a correr este script."
    echo "    Mientras tanto el frontend se va a buildear con el placeholder: el login con Google no va a andar."
    cp "$WEB_APP_DIR/src/environments/google-client-id.example.ts" "$WEB_APP_DIR/src/environments/google-client-id.ts"
  fi

  echo "==> Instalando dependencias y compilando el frontend..."
  (cd "$WEB_APP_DIR" && npm ci && npm run build)

  echo "==> Publicando build en $WEB_ROOT..."
  rsync -a --delete "$WEB_APP_DIR/dist/investment-portfolio-web/browser/" "$WEB_ROOT/"
else
  if [ -z "$(ls -A "$WEB_ROOT" 2>/dev/null)" ]; then
    echo ""
    echo "!!! WEB_REPO_URL vacío y $WEB_ROOT está vacío todavía. Desde investment-portfolio-web, en tu máquina:"
    echo "      ng build"
    echo "      rsync -avz --delete dist/investment-portfolio-web/browser/ ubuntu@<IP-de-la-instancia>:${WEB_ROOT}/"
  fi
fi

# ---------------------------------------------------------------------------
# 8. HTTPS (certbot + Let's Encrypt) — solo si DOMAIN está seteado
# ---------------------------------------------------------------------------
# Requiere que el DNS ya resuelva ${DOMAIN}/www.${DOMAIN}/api.${DOMAIN} a la
# IP estática de esta instancia (certbot valida por HTTP-01, pegándole a esos
# hosts). Si el DNS todavía no propagó, esto falla con un aviso claro y el
# resto de la app queda igual de funcional por HTTP mientras tanto.

if [ -n "$DOMAIN" ]; then
  if [ -z "$CERTBOT_EMAIL" ]; then
    echo ""
    echo "!!! DOMAIN está seteado pero falta CERTBOT_EMAIL — no se pidió el certificado automáticamente."
    echo "    Completá CERTBOT_EMAIL arriba y volvé a correr este script, o corré a mano:"
    echo "      sudo apt-get install -y certbot python3-certbot-nginx"
    echo "      sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d api.${DOMAIN} --expand"
  else
    if ! command -v certbot >/dev/null 2>&1; then
      echo "==> Instalando certbot..."
      sudo apt-get install -y certbot python3-certbot-nginx
    fi
    echo "==> Pidiendo certificado HTTPS para ${DOMAIN}, www.${DOMAIN} y api.${DOMAIN}..."
    # --expand: si una corrida anterior ya generó un certificado para un
    # subconjunto de estos hosts (ej. antes de que api.$DOMAIN resolviera en
    # el DNS), certbot en modo no interactivo se niega a ampliarlo salvo que
    # se lo pidas explícitamente — sin esto, cada corrida posterior que
    # sume un host nuevo vuelve a fallar preguntando lo mismo.
    if ! sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "api.$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect --expand; then
      echo "!!! certbot falló — puede ser que el DNS todavía no haya propagado del todo, o algún otro"
      echo "    conflicto. Mirá el detalle arriba y, si hace falta, corré a mano:"
      echo "      sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d api.${DOMAIN} --expand"
    fi
  fi
fi

echo ""
echo "==> Listo. Chequeos pendientes:"
echo "1. Completar $APP_DIR/.env con valores reales (ver arriba) si todavía no se hizo, y correr: pm2 restart investment-portfolio-api"
echo "2. Si WEB_REPO_URL está vacío: subir el build de Angular a $WEB_ROOT a mano (ver sección 7 arriba)."
echo "3. En la consola de Lightsail (Networking de esta instancia): abrir los puertos 80 (HTTP) y 443 (HTTPS)."
if [ -n "$DOMAIN" ]; then
  echo "4. Confirmar que el DNS de ${DOMAIN} ya propagó (A en @ y www a la IP estática, CNAME en api -> @)."
  echo "5. Probar: https://${DOMAIN}/ (frontend) y https://api.${DOMAIN}/health (API) — o http:// si certbot"
  echo "   todavía no corrió."
  echo "6. Si falta CERTBOT_EMAIL o certbot falló por DNS: completar/reintentar (ver sección 8 arriba)."
else
  echo "4. Probar: http://<IP-de-la-instancia>/ (frontend) y http://<IP-de-la-instancia>/api/health (API)."
fi
echo "7. Para actualizar la API más adelante: volver a correr este script (git pull + build + pm2 restart)."
echo "8. Para actualizar el frontend más adelante: volver a correr este script si WEB_REPO_URL está seteado"
echo "   (git pull + build + publicar en $WEB_ROOT), o repetir el build local + rsync si no."
