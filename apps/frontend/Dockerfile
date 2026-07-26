FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Build-time variable for API URL
ARG VITE_API_URL=http://localhost:3026/api
ENV VITE_API_URL=$VITE_API_URL

# Copiar archivos de dependencias (desde raiz del monorepo)
COPY apps/frontend/package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copiar el codigo fuente y construir
COPY apps/frontend/ .
RUN pnpm run build

# Etapa de produccion con Nginx
FROM nginx:alpine

# Copiar los archivos compilados de Vite (carpeta dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Configurar Nginx para SPA (React Router)
RUN echo 'server { \
    listen 80; \
    location / { \
    root   /usr/share/nginx/html; \
    index  index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
