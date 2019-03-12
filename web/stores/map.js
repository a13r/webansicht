import {positions} from '~/app';
import {loginReaction} from "~/stores/index";
import {action, computed, observable} from "mobx";
import _ from "lodash";
import States from '../shared/states';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from "ol/source/Vector";

export class MapStore {
    @observable
    positions = [];

    constructor() {
        loginReaction(() => {
            this.find();
            positions.on('created', this.onPositionCreated);
            positions.on('updated', this.onPositionUpdated);
            positions.on('patched', this.onPositionUpdated);
            positions.on('removed', this.onPositionRemoved);
        });
    }

    find() {
        positions.find().then(action(t => this.positions = t));
    }

    @action
    onPositionCreated = entry => {
        this.positions.unshift(entry);
    };

    @action
    onPositionUpdated = entry => {
        const existing = _.find(this.positions, {_id: entry._id});
        if (existing) {
            _.merge(existing, entry);
        } else {
            this.find();
        }
    };

    @action
    onPositionRemoved = ({_id}) => _.remove(this.positions, {_id});

    @computed
    get vectorSource() {
        return new VectorSource({features: [...this.positionFeatures]});
    }

    @computed
    get positionFeatures() {
        return this.positions.map(pos => new Feature({
            geometry: new Point([pos.lon, pos.lat]).transform('EPSG:4326', 'EPSG:3857'),
            name: pos.resource ? pos.resource.callSign : pos.name,
            color: pos.resource && pos.resource.state ? States[pos.resource.state].rowStyle.backgroundColor : 'red',
            accuracy: pos.accuracy
        }));
    }

    @computed
    get mls() {
        return _.find(this.positions, {name: 'MLS'});
    }
}
