FROM node:14-alpine AS build

WORKDIR /app

COPY ./src ./src
COPY ./.eslintrc.js ./
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./

RUN npm ci
RUN npm run build

FROM node:14-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY ./package.json .

EXPOSE 3000

CMD npm start
