const transitions = [
    {from: 4, to: 5, apply: (data, cur) => ({lastPosition: data.destination || cur.destination, destination: ''})},
    {from: 2, to: 3, apply: (data, cur) => ({lastPosition: data.destination || cur.destination, destination: ''})},
    {to: 1, apply: (data, cur) => cur.home ? {lastPosition: cur.home} : null},
];

module.exports = function (rules = transitions) {
    return async function stateTransitions(hook) {
        if (hook.result) return;
        if (hook.data.state === undefined) return;

        const current = hook.params._currentData
            || await hook.app.service('resources').get(hook.id);

        if (current.state === hook.data.state) return;

        for (const rule of rules) {
            if (rule.to !== hook.data.state) continue;
            if (rule.from !== undefined && rule.from !== current.state) continue;
            const changes = rule.apply(hook.data, current);
            if (changes) Object.assign(hook.data, changes);
        }
    };
};
