# ==========================================
# STAGE 1: Build (Compile code React)
# ==========================================
FROM node:16 AS builder

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and begin build
COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Deploy (Service for staitic file  by Nginx)
# ==========================================


# FROM nginxinc/nginx-unprivileged:alpine
FROM nginx:1.18.0 

# Copy all static file has build in Stage 1 to folder of Nginx
COPY --from=builder /app/build /usr/share/nginx/html
# Expose port 80 (default port of static web )
EXPOSE 8080

# Run Nginx on background mode
CMD ["nginx", "-g", "daemon off;"]