import {positions, resources} from '~/app';
import {loginReaction} from "~/stores/index";
import {action, computed, makeObservable, observable} from "mobx";
import _ from "lodash";
import States from '../shared/states';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from "ol/source/Vector";

export const NO_RESOURCE_COLOR = 'red';
export const UNKNOWN_STATE_COLOR = 'grey';

export function positionColor(resource) {
    if (!resource) {
        return NO_RESOURCE_COLOR;
    }
    if (resource.state == null) {
        return UNKNOWN_STATE_COLOR;
    }
    return States.get(resource.state).rowStyle.backgroundColor || UNKNOWN_STATE_COLOR;
}

export class MapStore {
    positions = [];
    selectedPosition = {};
    view;

    constructor() {
        makeObservable(this, {
            positions: observable,
            selectedPosition: observable,
            onPositionCreated: action,
            onPositionUpdated: action,
            onPositionRemoved: action,
            onResourceUpdated: action,
            selectPosition: action,
            vectorSource: computed,
            positionFeatures: computed,
            mls: computed,
        });
        loginReaction(() => {
            // remove first so repeated logins never register the handlers twice
            this.removeListeners();
            this.find();
            this.addListeners();
        }, () => this.removeListeners());
    }

    addListeners() {
        positions.on('created', this.onPositionCreated);
        positions.on('updated', this.onPositionUpdated);
        positions.on('patched', this.onPositionUpdated);
        positions.on('removed', this.onPositionRemoved);
        resources.on('updated', this.onResourceUpdated);
        resources.on('patched', this.onResourceUpdated);
    }

    removeListeners() {
        positions.off('created', this.onPositionCreated);
        positions.off('updated', this.onPositionUpdated);
        positions.off('patched', this.onPositionUpdated);
        positions.off('removed', this.onPositionRemoved);
        resources.off('updated', this.onResourceUpdated);
        resources.off('patched', this.onResourceUpdated);
    }

    find() {
        positions.find().then(action(t => this.positions = t));
    }

    onPositionCreated = entry => {
        if (!_.find(this.positions, {_id: entry._id})) {
            this.positions.push(entry);
        }
    };

    onPositionUpdated = entry => {
        const existing = _.find(this.positions, {_id: entry._id});
        if (existing) {
            _.merge(existing, entry);
        } else {
            this.find();
        }
    };

    onPositionRemoved = ({_id}) => _.remove(this.positions, {_id});

    onResourceUpdated = resource => {
        const position = _.find(this.positions, {issi: resource.tetra});
        if (position) {
            position.resource = resource;
        }
    };

    selectPosition = position => {
        this.selectedPosition = position;
    };

    get vectorSource() {
        return new VectorSource({features: [...this.positionFeatures]});
    }

    get positionFeatures() {
        return this.positions.filter(p => p.lat && p.lon && (!p.resource || p.resource.showOnMap)).map(pos => new Feature({
            geometry: new Point([pos.lon, pos.lat]).transform('EPSG:4326', 'EPSG:3857'),
            name: pos.resource ? pos.resource.callSign : (pos.issi || pos.name || 'Unbekannt'),
            color: positionColor(pos.resource),
            position: pos,
            accuracy: pos.accuracy,
            resource: pos.resource
        }));
    }

    get mls() {
        return _.find(this.positions, {name: 'MLS'});
    }
}
