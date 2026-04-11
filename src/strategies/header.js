const {NotAuthenticated} = require('@feathersjs/errors');
const logger = require('winston');

function normalizeIP(ip) {
    if (ip && ip.startsWith('::ffff:')) {
        return ip.substring(7);
    }
    return ip;
}

function resolveRemoteUser(app, req) {
    const config = app.get('authentication')?.header || {};
    const allowedIPs = config.allowedIPs || ['127.0.0.1', '::1'];
    const userField = config.userField || 'x-remote-user';
    const username = req.headers[userField];

    if (!username) {
        return null;
    }

    const remoteIP = normalizeIP(req.socket.remoteAddress);
    if (!allowedIPs.includes(remoteIP)) {
        logger.warn(`Header auth: rejected X-Remote-User '${username}' from untrusted IP ${remoteIP}`);
        return null;
    }

    return username;
}

function headerAuthMiddleware() {
    return async (req, _res, next) => {
        const username = resolveRemoteUser(req.app, req);
        if (!username) {
            return next();
        }

        try {
            const users = req.app.service('users');
            const result = await users.find({query: {username}, paginate: false});
            const user = Array.isArray(result) ? result[0] : result.data?.[0];

            if (!user) {
                logger.warn(`Header auth: user '${username}' not found locally`);
                return next(new NotAuthenticated(`User '${username}' not found`));
            }

            logger.info(`Header auth: authenticated '${username}' via X-Remote-User`);
            req.feathers = {
                ...req.feathers,
                authenticated: true,
                user
            };
            next();
        } catch (error) {
            next(error);
        }
    };
}

function ssoTokenRoute(app) {
    app.get('/sso-token', async (req, res) => {
        try {
            const username = resolveRemoteUser(app, req);
            if (!username) {
                return res.json({sso: false});
            }

            const users = app.service('users');
            const result = await users.find({query: {username}, paginate: false});
            const user = Array.isArray(result) ? result[0] : result.data?.[0];

            if (!user) {
                logger.info(`SSO token: user '${username}' not found locally, SSO unavailable`);
                return res.json({sso: false});
            }

            const authService = app.service('authentication');
            const accessToken = await authService.createAccessToken({sub: user._id.toString()});
            logger.info(`SSO token: issued JWT for '${username}'`);
            res.json({accessToken, user: {_id: user._id, username: user.username, name: user.name, roles: user.roles}});
        } catch (error) {
            logger.error(`SSO token error: ${error.message}`);
            res.json({sso: false});
        }
    });
}

module.exports = {headerAuthMiddleware, ssoTokenRoute};
