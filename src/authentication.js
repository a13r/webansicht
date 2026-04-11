const {AuthenticationService, JWTStrategy} = require("@feathersjs/authentication");
const {LocalStrategy} = require("@feathersjs/authentication-local");
const {oauth} = require("@feathersjs/authentication-oauth");
const {PasswordChangeService} = require('feathers-authentication-management');


module.exports = app => {
    const authentication = new AuthenticationService(app);
    authentication.register('jwt', new JWTStrategy());
    authentication.register('local', new LocalStrategy());

    app.use('/authentication', authentication);
    app.use('/auth-management/change-password', new PasswordChangeService(app, {
        identifyUserProps: ['username'],
    }));
    app.configure(oauth());
};
