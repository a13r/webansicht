FROM mhart/alpine-node:latest

ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

WORKDIR /opt/app
COPY . .
RUN npm run web:build

EXPOSE 3030
CMD ["npm", "start"]
