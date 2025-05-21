FROM node:22-alpine AS build
WORKDIR /app
ADD . /app

RUN npm ci && \
    npm run build && \
    rm -rf /app/node_modules && \
    npm ci --omit=dev && \
    mkdir /build && \
    mv /app/node_modules /app/dist/* /build && \
    mv /app/package.json /app/docker-entrypoint.sh /build

FROM node:22-alpine
WORKDIR /app
USER node
COPY --from=build /build /app

ENV NODE_ENV=production

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
