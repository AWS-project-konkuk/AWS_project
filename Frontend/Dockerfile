FROM node:24-bookworm-slim AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run lint && npm test && npm run build

FROM nginx:stable-alpine
# 링크 공유 미리보기(Open Graph) 이미지의 절대 주소. 실행할 때 정하며 비우면 같은 도메인의 루트 경로를 쓴다.
# 예: SITE_URL=http://example.com/prefix (끝에 / 없이)
ENV SITE_URL=
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /src/dist/ /usr/share/nginx/html/
EXPOSE 80