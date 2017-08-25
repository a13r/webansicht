export default class NotificationStore {
    system;

    error(message, title = 'Fehler') {
        this.system.addNotification({
            message, title, level: 'error'
        });
    }

    success(message, title) {
        this.system.addNotification({
            message, title, level: 'success'
        });
    }
}
