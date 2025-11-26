FROM node:24-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY package.json package-lock.json /app/
COPY database/schema.prisma /app/
WORKDIR /app
RUN npm ci --omit=dev
RUN npm run db:generate

FROM node:24-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:24-alpine
COPY deployment/start.sh /app/
COPY package.json package-lock.json /app/
COPY database /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/dist /app/dist
WORKDIR /app
ENV NODE_ENV="production"
RUN npm config set update-notifier false
RUN chmod +x start.sh

CMD ["./start.sh"]