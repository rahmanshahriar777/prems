#!/bin/bash
set -ex

echo "=== Installing Nginx and Certbot for Free Let's Encrypt SSL ==="

# 1. Remap container to local 127.0.0.1:8080
IMAGE="us-central1-docker.pkg.dev/project-58b53849-89ee-4aeb-a05/cloud-run-source-deploy/ndems-app:v2"
docker stop ems-app || true
docker rm ems-app || true
docker run -d \
  --name ems-app \
  --restart always \
  -p 127.0.0.1:8080:8080 \
  -e PORT=8080 \
  "$IMAGE"

# 2. Install host Nginx and Certbot
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# 3. Create Nginx virtual host configuration
cat << 'EOF' > /etc/nginx/sites-available/ems
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 34.46.124.175 34.46.124.175.sslip.io 34.46.124.175.nip.io;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
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

# 4. Request free Let's Encrypt SSL certificate
echo "Requesting Let's Encrypt SSL Certificate..."
certbot --nginx \
  -d 34.46.124.175.sslip.io \
  -d 34.46.124.175.nip.io \
  --non-interactive \
  --agree-tos \
  --email saif.sicbd@gmail.com \
  --redirect

# 5. Reload Nginx with SSL enabled
systemctl reload nginx

echo "=== SSL Setup Completed Successfully ==="
