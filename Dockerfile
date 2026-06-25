FROM node:22-alpine
WORKDIR /app
RUN mkdir -p /app/node_modules && chown -R node:node /app
USER node
