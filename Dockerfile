FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build


FROM node:22-alpine AS production

WORKDIR /app

# Install CA certificates + wget
RUN apk add --no-cache ca-certificates wget

# Download AWS RDS CA bundle
RUN mkdir -p /app/certs \
    && wget -O /app/certs/rds-ca-bundle.pem \
    https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/dist ./dist

COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/src/main.js"]