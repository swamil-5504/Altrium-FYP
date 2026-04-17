FROM node:18-alpine AS build

WORKDIR /app

# Vite reads VITE_* at build-time; we pass this from docker-compose.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_REGISTRY_ADDRESS
ENV VITE_REGISTRY_ADDRESS=$VITE_REGISTRY_ADDRESS

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist
EXPOSE 5173

CMD ["serve", "dist", "-l", "5173", "-s"]

