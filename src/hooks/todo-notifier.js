const nodeSchedule = require('node-schedule');

const jobs = {};

// Used as an after hook (context.result is the stored todo, including its _id) and at startup,
// where the todo is passed as `data`. `data` of a create/patch call has no _id, so using it
// alone made all todos share the job slot `undefined` and cancel each other.
function schedule({result, data, app}) {
    const todo = result || data;
    const existing = jobs[todo._id];
    if (existing) {
        existing.cancel();
        console.log('cancelled existing scheduled job');
    }
    if (!todo.dueDate) return;
    jobs[todo._id] = nodeSchedule.scheduleJob(todo.dueDate, function () {
        console.log('todo due', todo);
        app.service('notifications').create({
            type: 'showNotification',
            data: {
                title: 'Todo fällig',
                message: todo.description,
                level: 'info'
            }
        });
        delete jobs[todo._id];
    });
    console.log('scheduled job for todo at', todo.dueDate);
}

function unschedule({result: todo}) {
    const existing = jobs[todo._id];
    if (existing) {
        existing.cancel();
        console.log('unscheduled job for deleted job', todo._id);
    }
}

module.exports = {schedule, unschedule};
