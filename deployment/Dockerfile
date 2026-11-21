FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS production-dependencies-env
COPY package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run db:generate
RUN npm run build

FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5
COPY deployment/start.sh /app/
COPY package.json package-lock.json /app/
COPY database /app/database/
COPY prisma.config.ts /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/dist /app/dist
WORKDIR /app
ENV NODE_ENV="production"
RUN npm config set update-notifier false
RUN chmod +x start.sh

CMD ["./start.sh"]
