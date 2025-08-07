import React from 'react';
import {messages, notifications} from "~/app";
import {auth} from ".";
import {toast} from "react-toastify";

function CustomNotification({data}) {
    return (
        <div className={`flex flex-column w-100`}>
            <p><strong>{data.title}</strong></p>
            <p>{data.message}</p>
        </div>
    );
}

export class NotificationStore {

    constructor() {
        messages.on('patched', this.messageUpdated);
        notifications.on('created', this.onNotification);
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
        toast(<CustomNotification/>, {
            type: n.data.level,
            data: {title: n.data.title, message: n.data.message},
            theme: 'colored'
        });
        if (!window.document.hasFocus()) {
            const notification = new Notification(n.data.title, {body: n.data.message});
            notification.onclick = () => window.focus();
        }
    };

    error(message, title = 'Fehler') {
        toast(<CustomNotification/>, {
            type: 'error',
            data: {title, message},
            theme: 'colored'
        });
    }

    warning(message, title) {
        toast(<CustomNotification/>, {
            type: 'warning',
            data: {title, message},
            theme: 'colored'
        });
    }

    success(message, title) {
        toast(<CustomNotification/>, {
            type: 'success',
            data: {title, message},
            theme: 'colored'
        });
    }

    info(message, title) {
        toast(<CustomNotification/>, {
            type: 'info',
            data: {title, message},
            theme: 'colored'
        });
    }
}
