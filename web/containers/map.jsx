import React from 'react';
import authenticate from '~/components/authenticate';
import {inject, observer} from 'mobx-react';
// import {Layers, Map, layer} from "react-openlayers";
// import Style from 'ol/style/style';
// import Fill from 'ol/style/fill';
// import Circle from 'ol/style/circle';
// import Stroke from 'ol/style/stroke';
import * as ol from 'openlayers';
import 'openlayers/css/ol.css';
import '~/styles/map.css';
import {reaction, when} from "mobx";

const pointStyle = feature => {
    return new ol.style.Style({
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({color: 'red'}),
            // stroke: new ol.style.Stroke({color: 'black', width: 2})
        }),
        text: new ol.style.Text({
            text: feature.get('name'),
            offsetX: 22,
            font: '12px sans-serif',
            fill: new ol.style.Fill({color: 'black'}),
            stroke: new ol.style.Stroke({color: 'white', width: 4})
        })
    });
};

@authenticate
@inject('map')
class MapComponent extends React.Component {

    componentDidMount() {
        this.map = new ol.Map({target: this.div});

        fetch('https://webansicht.bran.at/basemap/wmts/1.0.0/WMTSCapabilities.xml').then(response => response.text())
            .then(text => {
                const capabilities = new ol.format.WMTSCapabilities().read(text);
                const options = ol.source.WMTS.optionsFromCapabilities(capabilities, {
                    layer: 'bmapgrau',
                    matrixSet: capabilities.Contents.TileMatrixSet[0].Identifier
                });
                this.map.addLayer(new ol.layer.Tile({
                    source: new ol.source.WMTS(options),
                    zIndex: -1
                }));
            });
        when(() => this.props.map.mls, () => {
            const {mls} = this.props.map;
            this.map.setView(new ol.View({
                center: new ol.geom.Point([mls.lon, mls.lat]).transform('EPSG:4326', 'EPSG:3857').getCoordinates(),
                zoom: 15
            }))
        });
        const vectorLayer = new ol.layer.Vector({style: pointStyle});
        this.map.addLayer(vectorLayer);
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
