FROM node:25-alpine

WORKDIR /opt/webansicht
COPY package.json .
COPY package-lock.json .
RUN --mount=type=cache,target=/root/.npm npm install

COPY vite.config.js .
COPY web web
RUN npm run web:build

COPY src src

EXPOSE 3030
CMD ["npm", "start"]
