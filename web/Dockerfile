# Stage 1: Build React application
FROM node:24-bookworm-slim as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# Stage 2: Serve static files with Nginx
From nginx:stable-alpine as runtime

# Copy compiled frontend files
COPY --from=build /app/dist /usr/share/nginx/html/

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]