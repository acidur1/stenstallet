#!/bin/bash
# Run this once on a fresh Ubuntu 22.04 Droplet as root.
# Usage: bash setup-droplet.sh your-domain.com

set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain>}"
DEPLOY_USER="deploy"
WEB_ROOT="/var/www/stenstallet"

echo "==> Updating packages"
apt-get update -q && apt-get upgrade -y -q

echo "==> Installing nginx + certbot"
apt-get install -y nginx certbot python3-certbot-nginx ufw

echo "==> Configuring firewall"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Creating deploy user"
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
mkdir -p "/home/$DEPLOY_USER/.ssh"
chmod 700 "/home/$DEPLOY_USER/.ssh"

echo ""
echo ">>> Paste the deploy user's PUBLIC key, then press Enter + Ctrl-D:"
cat >> "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"

echo "==> Creating web root"
mkdir -p "$WEB_ROOT"
chown -R "$DEPLOY_USER:www-data" "$WEB_ROOT"
chmod -R 755 "$WEB_ROOT"

echo "==> Writing nginx config"
cat > "/etc/nginx/sites-available/stenstallet" <<NGINX
server {
    listen 80;
    server_name $DOMAIN;

    root $WEB_ROOT;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|woff|woff2|ttf|svg)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/stenstallet /etc/nginx/sites-enabled/stenstallet
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> Obtaining SSL certificate"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN"

echo ""
echo "==> Done! Next steps:"
echo "  1. Add the deploy user's PUBLIC key to GitHub secret DROPLET_SSH_KEY (private key goes in the secret)"
echo "  2. Add your Droplet IP to GitHub secret DROPLET_HOST"
echo "  3. Push to main — the GitHub Action will deploy automatically"
