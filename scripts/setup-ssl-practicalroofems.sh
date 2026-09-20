#!/bin/bash
# ==============================================================================
# Script: setup-ssl-practicalroofems.sh
# Purpose: Install and configure Let's Encrypt Free SSL/TLS for practicalroofems.online
# Target Server: Google Compute Engine (ems-vm @ 34.9.3.144)
# ==============================================================================

set -e

# Configuration variables
DOMAIN="practicalroofems.online"
WWW_DOMAIN="www.practicalroofems.online"
ADMIN_EMAIL="saif.sicbd@gmail.com"
APP_PORT="8080"
SERVER_IP="34.9.3.144"

echo "=========================================================="
echo " Starting SSL Setup for https://${DOMAIN}"
echo "=========================================================="

# Ensure running as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: This script must be run as root or with sudo."
  echo "Usage: sudo bash $0"
  exit 1
fi

# 1. Install prerequisites (Nginx, Certbot, Python3 Certbot Nginx plugin, dnsutils)
echo "📦 [1/6] Installing Nginx, Certbot, and DNS tools..."
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx dnsutils curl

# 2. Check DNS A Records
echo "🔍 [2/6] Checking DNS records for ${DOMAIN}..."
RESOLVED_IP=$(dig +short A "${DOMAIN}" | tail -n1 || true)
echo "   - Expected IP: ${SERVER_IP}"
echo "   - Resolved IP: ${RESOLVED_IP:-NOT_RESOLVED}"

if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
  echo "⚠️  WARNING: ${DOMAIN} does not yet resolve to ${SERVER_IP}!"
  echo "   Please make sure your DNS provider (Namecheap, GoDaddy, Cloudflare, etc.)"
  echo "   has an 'A' record pointing ${DOMAIN} and ${WWW_DOMAIN} to ${SERVER_IP}."
  echo "   Proceeding with setup, but Let's Encrypt validation may fail if DNS is not propagated."
  echo ""
  read -p "Do you want to continue anyway? (y/N): " -r CONFIRM
  if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Aborted by user. Update your DNS A records and run this script again."
    exit 1
  fi
fi

# 3. Create Nginx virtual host for HTTP challenge
echo "⚙️ [3/6] Configuring Nginx reverse proxy virtual host..."
cat << EOF > /etc/nginx/sites-available/ems
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN} ${SERVER_IP};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site and disable default
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/ems /etc/nginx/sites-enabled/ems

# Test Nginx syntax
nginx -t
systemctl restart nginx

# 4. Request Let's Encrypt SSL Certificate
echo "🔒 [4/6] Requesting Let's Encrypt SSL Certificate for ${DOMAIN} and ${WWW_DOMAIN}..."
certbot --nginx \
  -d "${DOMAIN}" \
  -d "${WWW_DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "${ADMIN_EMAIL}" \
  --redirect

# 5. Configure raw IP redirect to secure domain
echo "🔄 [5/6] Configuring IP redirect (http://${SERVER_IP} -> https://${DOMAIN})..."
sed -i "s/return 404;/return 301 https:\/\/${DOMAIN}\$request_uri;/g" /etc/nginx/sites-available/ems || true
nginx -t
systemctl reload nginx

# 6. Verify Certbot Auto-Renewal
echo "⏱️ [6/6] Verifying Certbot automatic renewal service..."
systemctl enable certbot.timer
systemctl start certbot.timer
certbot renew --dry-run || true

echo "=========================================================="
echo "✅ SSL Installation Complete for ${DOMAIN}!"
echo "   - Secure HTTPS URL: https://${DOMAIN}"
echo "   - WWW HTTPS URL:    https://${WWW_DOMAIN}"
echo "   - Certificate Path: /etc/letsencrypt/live/${DOMAIN}/"
echo "=========================================================="
