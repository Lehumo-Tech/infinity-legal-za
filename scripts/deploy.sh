#!/bin/bash
set -euo pipefail

echo "🚀 Deploying Infinity Legal SA to Kubernetes..."

# Build and tag Docker image
echo "📦 Building Docker image..."
docker build -t infinity-legal/web:latest .

# Push to registry (if configured)
# docker push infinity-legal/web:latest

# Apply Kubernetes manifests
echo "☸️  Applying Kubernetes manifests..."
kubectl apply -k k8s/

# Wait for rollout
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/infinity-legal-web -n infinity-legal --timeout=120s

echo "✅ Deployment complete!"
kubectl get pods -n infinity-legal
kubectl get services -n infinity-legal
kubectl get ingress -n infinity-legal
