const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const configuration = require('@feathersjs/configuration');
const {rest} = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const fallback = require('connect-history-api-fallback');

const { errorHandler } = require('@feathersjs/express');
const logger = require('./logger');

const {headerAuthMiddleware, ssoTokenRoute} = require('./strategies/header');
const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');

const authentication = require('./authentication');
const channels = require('./channels');

const mongoose = require('./mongoose');
const exporter = require('./exporter');
const lardis = require('./lardis');
const gps = require('./gps');

const app = express(feathers());

// Load app configuration
app.configure(configuration());

// Enable CORS, security, compression, favicon and body parsing
app.use(cors());
app.use(helmet());
app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// SPA fallback + static files before API routes
// htmlAcceptHeaders: ['text/html'] ensures only browser navigation is rewritten,
// not fetch/XHR API calls (which send Accept: */* or application/json)
app.use(fallback({htmlAcceptHeaders: ['text/html']}));
app.use('/', express.static(app.get('public')));
app.configure(mongoose);
app.use(headerAuthMiddleware());
app.configure(rest());
app.configure(socketio());

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
ssoTokenRoute(app);

// Set up our services (see `services/index.js`)
app.configure(services);
app.configure(channels);
app.configure(exporter);
app.configure(lardis);
app.configure(gps);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(errorHandler({ logger }));

app.hooks(appHooks);

module.exports = app;
