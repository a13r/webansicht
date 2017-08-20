// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

module.exports = function (defaults = {}) { // eslint-disable-line no-unused-vars
  return function fillDefaults (hook) {
    // Hooks can either return nothing or a promise
    // that resolves with the `hook` object for asynchronous operations
    hook.data = Object.assign({}, defaults, hook.data);
    console.log('creating', hook.data);
  };
};
