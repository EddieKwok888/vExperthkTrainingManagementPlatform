FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

ENV PORT=8080
EXPOSE $PORT
CMD ["nginx", "-g", "daemon off;"]
