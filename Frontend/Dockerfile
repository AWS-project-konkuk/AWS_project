FROM node:24-bookworm-slim AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# 링크 공유 미리보기(Open Graph) 이미지의 절대 주소에 쓴다. 예: --build-arg SITE_URL=https://example.com
ARG SITE_URL=
ENV SITE_URL=$SITE_URL
RUN npm run lint && npm test && npm run build

FROM nginx:stable-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /src/dist/ /usr/share/nginx/html/
EXPOSE 80