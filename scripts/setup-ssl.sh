#!/bin/bash
set -ex

echo "=== Installing Free Let's Encrypt SSL on ems-vm ==="

# 1. Update Nginx server_name for static IP
cat << 'EOF' > /etc/nginx/sites-available/ems
server {
    listen 80 default_server;
    listen [::]:80 default_server;
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

# 2. Request Let's Encrypt SSL Certificate
echo "Requesting Let's Encrypt SSL Certificate..."
certbot --nginx \
  -d 34.9.3.144.sslip.io \
  -d 34.9.3.144.nip.io \
  --non-interactive \
  --agree-tos \
  --email saif.sicbd@gmail.com \
  --redirect

# 3. Reload Nginx
systemctl reload nginx

echo "=== Let's Encrypt SSL Successfully Installed and Verified ==="
