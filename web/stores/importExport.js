import {action, computed, makeObservable, observable} from "mobx";
import {auth, notification} from "~/stores";
import "whatwg-fetch";

export default class ImportExportStore {
    importFile;

    constructor() {
        makeObservable(this, {
            importFile: observable,
            isValidFile: computed,
            setImportFile: action,
        });
    }

    sendFile = () => {
        const formData = new FormData();
        formData.append('import', this.importFile);
        const options = {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer ' + auth.accessToken
            }
        };
        return fetch('/import.tar', options)
            .then(response => {
                if (response.status === 200) {
                    notification.success('Datenbank wurde importiert');
                    return;
                }
                return response.json()
                    .then(body => body.message, () => null)
                    .then(message => notification.error(message || response.statusText || `Fehler ${response.status}`));
            })
            .catch(error => notification.error(error.message || 'Import fehlgeschlagen'));
    };

    setImportFile = e => {
        this.importFile = e.target.files[0];
    };

    get isValidFile() {
        return !this.importFile || this.importFile.type === 'application/x-tar';
    }
}
