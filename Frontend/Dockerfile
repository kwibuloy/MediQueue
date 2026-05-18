# --- Build React/Vite static assets ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Required at build time (Vite inlines these into the JS bundle).
# Cluster: nginx proxies /api to mediqueue-backend-svc; open frontend NodePort.
# Example cluster deploy:
#   docker build \
#     --build-arg VITE_API_URL=/api \
#     --build-arg VITE_SUPABASE_URL=https://xxxx.supabase.co \
#     --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \
#     -t mediqueue-frontend:latest Frontend
ARG VITE_API_URL=/api
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# --- Serve with nginx ---
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
