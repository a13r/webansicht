import {action, computed, observable} from "mobx";
import {auth, notification} from "~/stores";
import "whatwg-fetch";

export default class ImportExportStore {
    @observable
    importFile;

    sendFile = () => {
        const formData = new FormData();
        formData.append('import', this.importFile);
        const options = {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer ' + auth.token
            }
        };
        fetch('/import.tar', options)
            .then(response => {
                if (response.status !== 200) {
                    notification.error(result.data);
                }
            });
    };

    @action
    setImportFile = e => {
        this.importFile = e.target.files[0];
    };

    @computed
    get isValidFile() {
        return !this.importFile || this.importFile.type === 'application/x-tar';
    }
}
