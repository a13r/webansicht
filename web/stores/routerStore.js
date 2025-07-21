import { makeAutoObservable } from 'mobx';
import { createBrowserHistory } from 'history';

class RouterStore {
    location = null;
    history = createBrowserHistory();

    constructor() {
        makeAutoObservable(this);

        // Subscribe to history changes
        this.history.listen((update) => {
            this.location = update.location;
        });

        // Set the initial location
        this.location = this.history.location;
    }

    // Navigation methods
    push(path) {
        this.history.push(path);
    }

    replace(path) {
        this.history.replace(path);
    }

    go(n) {
        this.history.go(n);
    }

    goBack() {
        this.history.back();
    }

    goForward() {
        this.history.forward();
    }
}

export const routerStore = new RouterStore();
