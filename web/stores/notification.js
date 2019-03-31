import {messages, notifications} from "~/app";
import {auth} from ".";

export class NotificationStore {
    system;

    constructor() {
        messages.on('patched', this.messageUpdated);
        notifications.on('created', this.onNotification);
    }

    init(system) {
        this.system = system;
    }

    messageUpdated = message => {
        if (!auth.loggedIn || auth.user._id !== message.userId) {
            console.log('not for this user');
            return;
        }
        if (message.state === 'delivered') {
            this.success(`Zustellung an ${message.destination} erfolgreich`, 'Nachricht zugestellt');
        } else if (message.errorType) {
            const reason = message.errorType === 'no_radio' ? 'kein Funkgerät verfügbar' : 'TETRA-Fehler';
            this.error(`Nachricht an ${message.destination} nicht erfolgreich: ${reason}.`, 'Zustellfehler');
        }
    };

    onNotification = n => {
        if (n.type !== 'showNotification') return;
        console.log(n.data);
        this.system.addNotification(n.data);
        if (!window.document.hasFocus()) {
            const notification = new Notification(n.data.title, {body: n.data.message});
            notification.onclick = () => window.focus();
        }
    };

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
