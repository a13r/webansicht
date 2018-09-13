export default class NotificationStore {
    system;

    error(message, title = 'Fehler') {
        this.system.addNotification({
            message, title, level: 'error'
        });
    }

    warning(message, title) {
        this.system.addNotification({
            message, title, level: 'warning'
        })
    }

    success(message, title) {
        this.system.addNotification({
            message, title, level: 'success'
        });
    }

    info(message, title) {
        this.system.addNotification({
            message, title, level: 'info'
        })
    }
}
