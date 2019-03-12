import React from 'react';
import authenticate from '~/components/authenticate';
import {inject} from 'mobx-react';
import {reaction, when} from "mobx";
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Circle from 'ol/style/Circle';
import Stroke from 'ol/style/Stroke';
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

@authenticate
@inject('map')
class MapComponent extends React.Component {

    componentDidMount() {
        this.map = new Map({target: this.div});

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
        when(() => this.props.map.mls, () => {
            const {mls} = this.props.map;
            this.map.setView(new View({
                center: new Point([mls.lon, mls.lat]).transform('EPSG:4326', 'EPSG:3857').getCoordinates(),
                zoom: 15
            }))
        });
        const vectorLayer = new Vector({style: pointStyle(false), zIndex: 0});
        const accuracyLayer = new Vector({
            source: new VectorSource(),
            zIndex: 1
        });
        this.map.addLayer(vectorLayer);
        this.map.addLayer(accuracyLayer);
        const select = new Select({
            style: pointStyle(true),
            layers: [vectorLayer]
        });
        select.on('select', e => {
            if (e.selected.length > 0) {
                const accuracy = e.selected[0].get('accuracy');
                if (!accuracy) {
                    return;
                }
                const center = e.selected[0].getGeometry().getCoordinates();
                accuracyLayer.getSource().addFeature(new Feature(new GeomCircle(center, accuracy)));
            } else {
                accuracyLayer.getSource().clear();
            }
        });
        this.map.addInteraction(select);
        reaction(() => this.props.map.vectorSource, vectorSource => {
            if (vectorSource) {
                vectorLayer.setSource(vectorSource);
            }
        }, true);
    }

    render() {
        return <div className="openlayers-map" ref={el => this.div = el}/>;
    }
}

export default MapComponent;
