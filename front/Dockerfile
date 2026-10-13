# ---- 1. Build de Angular
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- 2. Servir con nginx (reenvia /api al backend, sin CORS)
FROM nginx:1.27-alpine
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/procesos-front/browser /usr/share/nginx/html
# URL del backend dentro de la red de Docker
ENV BACKEND_URL=http://backend:8080
EXPOSE 80
