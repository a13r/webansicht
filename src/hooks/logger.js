// A hook that logs service method before, after and error
const logger = require('winston');

logger.configure({
    transports: [
        new logger.transports.Console({
            timestamp: true,
            colorize: true,
            level: 'info'
        })
    ]
});

module.exports = function () {
  return function (hook) {
    let message = `${hook.type}: ${hook.path} - Method: ${hook.method}`;

    if (hook.type === 'error') {
      message += `: ${hook.error.message}`;
    }

    logger.info(message);
    logger.debug('hook.data', hook.data);
    logger.debug('hook.params', hook.params);

    if (hook.result) {
      logger.debug('hook.result', hook.result);
    }

    if (hook.error) {
      logger.error(` message=${hook.error.message}, stack=${hook.error.stack}`);
    }
  };
};
