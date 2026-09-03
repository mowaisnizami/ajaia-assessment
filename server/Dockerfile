FROM node:22-alpine AS build

WORKDIR /app
COPY server/package.json ./
RUN npm install --no-audit --no-fund
COPY server/ ./
RUN npm test -- --runInBand
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app
COPY server/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
