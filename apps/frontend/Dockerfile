FROM node:20-alpine AS build
WORKDIR /app

# Build-time variable for API URL
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente y construir
COPY . .
RUN npm run build

# Etapa de producción con Nginx
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
