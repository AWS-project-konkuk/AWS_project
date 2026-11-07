FROM node:24-bookworm-slim AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run lint && npm test && npm run build

FROM nginx:stable-alpine
COPY --from=build /src/dist/ /usr/share/nginx/html/
EXPOSE 80