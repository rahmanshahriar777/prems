#!/bin/bash
set -ex
exec > >(tee -a /var/log/ems-startup.log) 2>&1

echo "=== Starting EMS Deployment on Compute Engine ==="

# 1. Install Docker
apt-get update
apt-get install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# 2. Configure Docker to authenticate with Google Artifact Registry
echo "Configuring Artifact Registry Docker auth..."
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet

# 3. Pull image
IMAGE="us-central1-docker.pkg.dev/project-58b53849-89ee-4aeb-a05/cloud-run-source-deploy/ndems-app:v2"
echo "Pulling $IMAGE..."
docker pull "$IMAGE"

# 4. Stop existing container if any
docker rm -f ems-app || true

# 5. Run container on port 80
echo "Running container ems-app on port 80..."
docker run -d \
  --name ems-app \
  --restart always \
  -p 80:8080 \
  -e PORT=8080 \
  "$IMAGE"

echo "=== EMS Deployment Complete ==="
