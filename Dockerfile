FROM node:22-alpine

WORKDIR /opt/webansicht
COPY package.json .
COPY package-lock.json .
RUN npm install

COPY .babelrc .
COPY webpack.config.js .
COPY web web
RUN npm run web:build

COPY src src

EXPOSE 3030
CMD ["npm", "start"]
