import React from 'react';
import authenticate from '~/components/authenticate';
import {inject, observer} from 'mobx-react';
import {observable, reaction, when} from "mobx";
import {defaults as defaultControls, Control} from "ol/control"
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Circle from 'ol/style/Circle';
import Stroke from 'ol/style/Stroke';
import RegularShape from 'ol/style/RegularShape';
import Text from 'ol/style/Text';
import Map from 'ol/Map';
import WMTS, {optionsFromCapabilities} from "ol/source/WMTS";
import Tile from 'ol/layer/Tile';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import Vector from 'ol/layer/Vector';
import Select from 'ol/interaction/Select';
import 'ol/ol.css';
import '~/styles/map.css';
import VectorSource from "ol/source/Vector";
import GeomCircle from 'ol/geom/Circle';
import Feature from "ol/Feature";
import {pointerMove} from "ol/events/condition";
import Overlay from "ol/Overlay";
import {fromExtent} from "ol/geom/Polygon";
import ResourceEditor from "~/components/ResourceEditor";
import moment from "moment";
import umfeld from "~/pois/umfeld.json";

const pointStyle = selected => feature => {
    return new Style({
        image: new Circle({
            radius: 7,
            fill: new Fill({color: feature.get('color')}),
            stroke: new Stroke({color: 'black', width: selected ? 2 : 1})
        }),
        text: new Text({
            text: feature.get('name'),
            offsetX: 13,
            offsetY: 1,
            font: (selected ? 'bold ' : '') + '14px sans-serif',
            textAlign: 'left',
            fill: new Fill({color: 'black'}),
            stroke: new Stroke({color: 'white', width: 4})
        })
    });
};
const rectangleStyle = selected => feature => new Style({
    stroke: new Stroke({
        color: selected ? '#000' : '#999',
        width: 1
    }),
    text: new Text({
        text: feature.get('name'),
        font: '20px sans-serif',
        textAlign: 'center',
        fill: new Fill({color: selected ? '#333' : '#AAA'})
    }),
    fill: new Fill({
        color: selected ? '#CCCCCC33' : '#FFFFFF00'
    })
});
const vcmPoiStyle = feature => {
    let color = '#3333FF';
    const text = feature.get('text');
    if (text.startsWith('Ü')) {
        color = '#339933';
    } else if (text.startsWith('S')) {
        color = '#ccba00';
    }
    return new Style({
        image: new RegularShape({
            radius: 15,
            points: 3,
            fill: new Fill({color})
        }),
        text: new Text({
            text,
            font: 'bold 12px sans-serif',
            textAlign: 'center',
            fill: new Fill({color}),
            stroke: new Stroke({color: 'white', width: 4})
        })
    });
};

class DefaultViewControl extends Control {
    defaultView;

    constructor(opt_options) {
        const options = opt_options || {};

        super({
            element: document.createElement('div'),
            render: options.render,
            target: options.target
        });

        const i = document.createElement('i');
        i.className = 'fa fa-home';

        const button = document.createElement('button');
        button.appendChild(i);

        const element = this.element;
        element.className = 'default-view ol-unselectable ol-control';
        element.appendChild(button);

        button.addEventListener('click', this.handleClick.bind(this), false);
    }

    handleClick() {
        // this.getMap().setView(this.defaultView);
        this.getMap().getView().animate({
            center: this.defaultView.getCenter(),
            zoom: this.defaultView.getZoom(),
            rotation: this.defaultView.getRotation(),
            duration: 750
        });
    }
}

const ResourceOverlay = inject('map')(observer(({map, id}) =>
    <div className="panel panel-default" id={id}>
        {map.selectedPosition.resource && <div className="panel-heading">
            <h2 className="panel-title">{map.selectedPosition.resource.callSign}</h2>
        </div>}
        {map.selectedPosition.updatedAt && <div className="panel-body">
            Letzter Standort: {moment(map.selectedPosition.updatedAt).format('L LT')}
        </div>}
    </div>));

@authenticate
@inject('map', 'resources', 'auth')
@observer
class MapComponent extends React.Component {
    @observable
    showEditor = false;
    map;

    componentDidMount() {
        const defaultViewControl = new DefaultViewControl();
        this.map = new Map({
            target: this.div,
            controls: defaultControls().extend([
                defaultViewControl
            ])
        });
        const {map: mapStore, resources: resourceListStore, auth} = this.props;

        fetch('https://webansicht.bran.at/basemap/wmts/1.0.0/WMTSCapabilities.xml').then(response => response.text())
            .then(text => {
                const capabilities = new WMTSCapabilities().read(text);
                const options = optionsFromCapabilities(capabilities, {
                    layer: 'bmapgrau',
                    matrixSet: capabilities.Contents.TileMatrixSet[0].Identifier
                });
                this.map.addLayer(new Tile({
                    source: new WMTS(options),
                    zIndex: -1
                }));
            });

        const defaultView = new View({
            // AKW Zwentendorf
            center: new Point([15.888, 48.353]).transform('EPSG:4326', 'EPSG:3857').getCoordinates(),
	        zoom: 16
            // default view for VCM
            //zoom: 17,
            //rotation: 1.375
        });
        defaultViewControl.defaultView = defaultView;

        when(() => mapStore.mls, () => {
             const {mls} = mapStore;
             const [x, y] = new Point([mls.lon, mls.lat]).transform('EPSG:4326', 'EPSG:3857').getCoordinates();
             this.map.setView(new View({
                 center: [x, y],
                 zoom: 13
             }));
         });

        // set map view
        if (mapStore.view) {
            this.map.setView(mapStore.view);
        } else {
            this.map.setView(defaultView);
        }
        this.map.on('moveend', e => {
            mapStore.view = e.map.getView();
        });
        const resourceLayer = new Vector({style: pointStyle(false), zIndex: 10});
        const accuracyLayer = new Vector({
            source: new VectorSource(),
            zIndex: 8
        });
        const vcmPoiLayer = new Vector({
            style: vcmPoiStyle,
            source: new VectorSource({
                features: umfeld.map(p => new Feature({
                    geometry: new Point([p.coordinates.lng, p.coordinates.lat]).transform('EPSG:4326', 'EPSG:3857'),
                    text: p.text.split('\n')[0]
                }))
            }),
            zIndex: 5
        });
        this.map.addLayer(vcmPoiLayer);
        this.map.addLayer(resourceLayer);
        this.map.addLayer(accuracyLayer);
        const hoverInteraction = new Select({
            style: pointStyle(true),
            layers: [resourceLayer],
            condition: pointerMove
        });
        const clickInteraction = new Select({
            layers: [resourceLayer],
            style: pointStyle(true)
        });
        this.overlay = new Overlay({
            element: document.getElementById('popover'),
            positioning: 'bottom-center'
        });
        this.map.addOverlay(this.overlay);
        hoverInteraction.on('select', e => {
            if (e.selected.length > 0) {
                const accuracy = e.selected[0].get('accuracy');
                if (accuracy) {
                    const center = e.selected[0].getGeometry().getCoordinates();
                    accuracyLayer.getSource().addFeature(new Feature(new GeomCircle(center, accuracy)));
                }
                const position = e.selected[0].get('position');
                mapStore.selectPosition(position);
                this.overlay.setPosition(e.selected[0].getGeometry().getCoordinates());
            } else {
                accuracyLayer.getSource().clear();
                this.overlay.setPosition(null);
            }
        });
        clickInteraction.on('select', e => {
            console.log('select', e.selected);
            if (e.selected.length > 0) {
                const resource = e.selected[0].get('resource');
                if (resource) {
                    this.showEditor = true;
                    resourceListStore.selectResource(resource._id);
                    return;
                }
            }
            this.showEditor = false;
        });
        if (auth.isDispo) {
            this.map.addInteraction(hoverInteraction);
            this.map.addInteraction(clickInteraction);
        }
        reaction(() => this.showEditor, showEditor => {
            if (!showEditor) {
                clickInteraction.getFeatures().clear();
            }
        });
        reaction(() => mapStore.vectorSource, vectorSource => {
            if (vectorSource) {
                accuracyLayer.getSource().clear();
                clickInteraction.getFeatures().clear();
                resourceLayer.setSource(vectorSource);
            }
        }, true);
    }

    /**
     * Shows rectangular grid on the map.
     * Example on how to create a grid: this.createGrid([x - 500, y + 500], 10, 10, 100, -100)
     *
     * @param startX the corner of the grid with the smallest latitude and longitude
     * @param startY
     * @param cols number of columns
     * @param rows number of rows
     * @param xSize cell size in x direction
     * @param ySize cell size in y direction
     */
    createGrid([startX, startY], cols, rows, xSize, ySize) {
        const source = new VectorSource();
        const gridLayer = new Vector({
            source,
            style: rectangleStyle(false),
            zIndex: 0
        });
        for (let x = startX, i = 0; i < cols; i++, x += xSize) {
            for (let y = startY, j = 0; j < rows; j++, y += ySize) {
                source.addFeature(new Feature({
                    geometry: fromExtent([x, y, x + xSize, y + ySize]),
                    name: String.fromCharCode('A'.charCodeAt(0) + i) + (j + 1)
                }));
            }
        }
        this.map.addLayer(gridLayer);
        const gridHoverInteraction = new Select({
            style: rectangleStyle(true),
            condition: pointerMove,
            layers: [gridLayer]
        });
        this.map.addInteraction(gridHoverInteraction);
    }

    render() {
        return <div>
            <div className="openlayers-map" ref={el => this.div = el}/>
            {this.showEditor && <div className="row">
                <div className="col-md-3 col-md-offset-9" style={{marginTop: '25px'}}>
                    <ResourceEditor onClose={() => this.showEditor = false}/>
                </div>
            </div>}
            <ResourceOverlay id="popover"/>
        </div>;
    }
}

export default MapComponent;
