# ----------------------------------------------------
# Stage 1: Build React/Vite SPA with Node.js
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code and compile production distribution
COPY . .
RUN npm run build

# ----------------------------------------------------
# Stage 2: Serve with Lightweight Nginx Alpine
# ----------------------------------------------------
FROM nginx:1.27-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA bundle from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with reverse proxy and SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check to ensure Nginx is actively responding
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
