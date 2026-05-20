$ErrorActionPreference = "Stop"

Write-Host "Building Backend..."
docker build -t mediqueue-backend:latest ./Backend

Write-Host "Building Frontend..."
docker build `
  --build-arg VITE_SUPABASE_URL=https://gtfmhzbcjhlzalldpuax.supabase.co `
  --build-arg VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm1oemJjamhsemFsbGRwdWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODYxMzUsImV4cCI6MjA4MzI2MjEzNX0.s9Wn37gbHbahBGEghY7BIWJHATqZZGtNlUHOipPcnFw `
  -t mediqueue-frontend:latest ./Frontend

Write-Host "Applying Kubernetes configurations..."
kubectl apply -f k8s/

Write-Host "Waiting for deployments to be ready..."
kubectl rollout status deployment/mediqueue-backend
kubectl rollout status deployment/mediqueue-frontend

Write-Host "Setting up port forwarding..."
Start-Process -FilePath "kubectl" -ArgumentList "port-forward", "svc/mediqueue-backend-svc", "5000:80" -NoNewWindow
Start-Process -FilePath "kubectl" -ArgumentList "port-forward", "svc/mediqueue-frontend-svc", "8080:80" -NoNewWindow

Write-Host "Deployment complete!"
Write-Host "Frontend: http://localhost:8080"
Write-Host "Backend: http://localhost:5000"
