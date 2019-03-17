import {messages} from "~/app";
import {auth} from ".";

export default class NotificationStore {
    system;
    notified = {};

    init(system) {
        this.system = system;
        messages.on('patched', this.messageUpdated);
    }

    messageUpdated = message => {
        if (!auth.loggedIn || auth.user._id !== message.userId || this.notified[message._id]) {
            return;
        }
        this.notified[message._id] = true;
        if (message.state === 'delivered') {
            this.success(`Zustellung an ${message.destination} erfolgreich`, 'Nachricht zugestellt');
        } else if (message.errorType) {
            const reason = message.errorType === 'no_radio' ? 'kein Funkgerät verfügbar' : 'TETRA-Fehler';
            this.error(`Nachricht an ${message.destination} nicht erfolgreich: ${reason}.`, 'Zustellfehler');
        }
        setTimeout(() => delete this.notified[message._id], 1000);
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
