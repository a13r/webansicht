const nodeSchedule = require('node-schedule');

const jobs = {};

function schedule({data: todo, app}) {
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
                body: todo.description
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
