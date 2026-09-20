#!/bin/bash
set -ex

echo "=== 1. Reverting Nginx configuration to HTTP Port 80 (No SSL) ==="

cat << 'EOF' > /etc/nginx/sites-available/ems
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

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

echo "=== 2. Deleting SSL Certificates via Certbot ==="
certbot delete --cert-name 34.9.3.144.sslip.io --non-interactive || true
certbot delete --cert-name 34.46.124.175.sslip.io --non-interactive || true

echo "=== 3. Cleaning up any remaining certbot renewal configs ==="
rm -rf /etc/letsencrypt/live/34.* /etc/letsencrypt/archive/34.* /etc/letsencrypt/renewal/34.*

echo "=== 4. Reloading Nginx ==="
systemctl reload nginx

echo "=== 5. Verifying Certificates Removal ==="
certbot certificates || true

echo "=== SSL Certificate Successfully Removed ==="
