FROM node:22-alpine

WORKDIR /opt/webansicht
COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .
RUN npm run web:build

EXPOSE 3030
CMD ["npm", "start"]
