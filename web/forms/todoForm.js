import {BaseForm} from "~/forms/baseForm";
import {action, observable} from 'mobx';
import _ from 'lodash';
import moment from "moment";
import {todos} from "~/app";
import {notification} from "~/stores";

const format = 'L HH:mm';

export class TodoForm extends BaseForm {
    @observable
    isVisible;

    setup() {
        return {
            fields: {
                _id: {
                    label: 'ID'
                },
                description: {
                    label: 'Beschreibung'
                },
                dueDate: {
                    label: 'Fälligkeit'
                }
            }
        };
    }

    hooks() {
        return {
            onSuccess(form) {
                const values = _.assign({}, form.values());
                const {_id, dueDate} = values;
                values.dueDate = moment(values.dueDate, 'L HH:mm').toISOString();
                if (!_id) {
                    delete values._id;
                    todos.create(values)
                        .then(() => notification.success('Todo erstelt'))
                        .then(form.hide)
                        .catch(e => notification.error(e.message));
                } else {
                    todos.patch(_id, values)
                        .then(() => notification.success('Todo aktualisiert'))
                        .then(form.hide)
                        .catch(e => notification.error(e.message));
                }
            }
        };
    }

    @action
    show = () => this.isVisible = true;

    @action
    hide = () => this.isVisible = false;

    remove = () => {
        todos.remove(this.values()._id)
            .then(() => notification.success('Todo gelöscht'))
            .then(this.hide)
            .catch(e => notification.error(e.message));
    };

    setNow = () => this.set({dueDate: moment().format(format)});

    trimMinutes = () => this.set({dueDate: moment(this.values().dueDate, format).minute(0).format(format)});

    addMinutes = m => () => this.set({dueDate: moment(this.values().dueDate, format).add(m, 'minutes').format(format)});
}
