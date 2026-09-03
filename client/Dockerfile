FROM node:22-alpine AS build

WORKDIR /app
COPY client/package.json ./
RUN npm install --no-audit --no-fund
COPY client/ ./
RUN npm test -- --watch=false
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/client/browser /usr/share/nginx/html

EXPOSE 80
