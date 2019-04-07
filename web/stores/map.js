import {positions, resources} from '~/app';
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
    @observable
    selectedPosition = {};
    view;

    constructor() {
        loginReaction(() => {
            this.find();
            positions.on('created', this.onPositionCreated);
            positions.on('updated', this.onPositionUpdated);
            positions.on('patched', this.onPositionUpdated);
            positions.on('removed', this.onPositionRemoved);
            resources.on('updated', this.onResourceUpdated);
            resources.on('patched', this.onResourceUpdated);
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

    @action
    onResourceUpdated = resource => {
        const position = _.find(this.positions, {issi: resource.tetra});
        if (position) {
            position.resource = resource;
        }
    };

    @action
    selectPosition = position => {
        this.selectedPosition = position;
    };

    @computed
    get vectorSource() {
        return new VectorSource({features: [...this.positionFeatures]});
    }

    @computed
    get positionFeatures() {
        return this.positions.filter(p => !p.resource || p.resource.showOnMap).map(pos => new Feature({
            geometry: new Point([pos.lon, pos.lat]).transform('EPSG:4326', 'EPSG:3857'),
            name: pos.resource ? pos.resource.callSign : pos.issi,
            color: pos.resource && pos.resource.state ? States[pos.resource.state].rowStyle.backgroundColor : 'red',
            position: pos,
            accuracy: pos.accuracy,
            resource: pos.resource
        }));
    }

    @computed
    get mls() {
        return _.find(this.positions, {name: 'MLS'});
    }
}
