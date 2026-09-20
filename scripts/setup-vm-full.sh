#!/bin/bash
set -ex

echo "=== 1. Cloning / Updating Full Application Codebase on ems-vm ==="
APP_DIR="/home/dev/prems"
if [ ! -d "$APP_DIR" ]; then
  git clone https://github.com/rahmanshahriar777/prems.git "$APP_DIR"
else
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/main
fi

chown -R dev:dev "$APP_DIR"
echo "✅ Full application codebase located at: $APP_DIR"

echo "=== 2. Configuring Nginx Reverse Proxy with SSL ==="
cat << 'EOF' > /etc/nginx/sites-available/ems
server {
    server_name 34.9.3.144 34.9.3.144.sslip.io 34.9.3.144.nip.io;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/ems /etc/nginx/sites-enabled/ems
nginx -t
systemctl restart nginx

echo "=== 3. Obtaining Free Let's Encrypt SSL Certificate ==="
certbot --nginx \
  -d 34.9.3.144.sslip.io \
  -d 34.9.3.144.nip.io \
  --non-interactive \
  --agree-tos \
  --email saif.sicbd@gmail.com \
  --redirect \
  --keep-until-expiring || true

systemctl reload nginx

echo "=== 4. Verifying Docker Container ems-app ==="
docker ps

echo "=== Full VM Application Setup Complete ==="
