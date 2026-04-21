FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY eslint.config.js ./
COPY src ./src
COPY tests ./tests

RUN npm run lint
RUN npm test

FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

EXPOSE 8000

CMD ["node", "src/server.js"]
