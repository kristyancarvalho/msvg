FROM node:22-alpine
WORKDIR /app
RUN addgroup -S msvg && adduser -S -G msvg msvg
USER msvg
