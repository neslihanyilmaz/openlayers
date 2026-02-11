import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import {
  Control,
  MousePosition,
  OverviewMap,
  FullScreen,
  ZoomSlider,
  ScaleLine,
  defaults as defaultControls
} from 'ol/control';
import LayerGroup from 'ol/layer/Group';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Geolocation } from 'ol';
import Feature from 'ol/Feature';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Point from 'ol/geom/Point';
import Draw from 'ol/interaction/Draw';
import DragAndDrop from 'ol/interaction/DragAndDrop';
import GeoJSON from 'ol/format/GeoJSON';
import Modify from 'ol/interaction/Modify';

///////////////////////////////////////////////////////////////
// VIEW
///////////////////////////////////////////////////////////////

const view = new View({
  center: [0, 0],
  zoom: 2,
  minZoom: 2,
  maxZoom: 20,
});

///////////////////////////////////////////////////////////////
// DRAW SOURCE + LOCAL STORAGE
///////////////////////////////////////////////////////////////

const drawSource = new VectorSource();

const saved = localStorage.getItem('drawnFeatures');
if (saved) {
  const features = new GeoJSON().readFeatures(saved, {
    featureProjection: 'EPSG:3857',
  });
  drawSource.addFeatures(features);
}

drawSource.on(['addfeature', 'removefeature', 'changefeature'], () => {
  const geojson = new GeoJSON().writeFeatures(drawSource.getFeatures());
  localStorage.setItem('drawnFeatures', geojson);
});

///////////////////////////////////////////////////////////////
// BASEMAPS
///////////////////////////////////////////////////////////////

const osmLayer = new TileLayer({
  source: new OSM(),
  visible: true,
  className: 'osm',
});

const cartoLayer = new TileLayer({
  source: new XYZ({
    url: 'https://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attributions: '© OpenStreetMap contributors © CartoDB',
  }),
  visible: false,
  className: 'cartoDB',
});

const stamenLayer = new TileLayer({
  source: new XYZ({
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.jpg',
    attributions: '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors',
  }),
  visible: false,
  className: 'stamen',
});


const esriLayer = new TileLayer({
  source: new XYZ({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attributions: 'Tiles © Esri — Source: Esri, Maxar',
  }),
  visible: false,
  className: 'esriSatellite',
});

const tileLayerGroup = new LayerGroup({
  layers: [osmLayer, cartoLayer, stamenLayer, esriLayer],
});

///////////////////////////////////////////////////////////////
// GEOLOCATION
///////////////////////////////////////////////////////////////

const positionFeature = new Feature();

positionFeature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: '#3399CC' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
  })
);

const geoLayer = new VectorLayer({
  source: new VectorSource({
    features: [positionFeature],
  }),
  zIndex: 20,
});

///////////////////////////////////////////////////////////////
// DRAW LAYER
///////////////////////////////////////////////////////////////

const vectorLayer = new VectorLayer({
  source: drawSource,
  zIndex: 10,
});

///////////////////////////////////////////////////////////////
// MAP
///////////////////////////////////////////////////////////////

const map = new Map({
  target: 'map',
  layers: [tileLayerGroup, vectorLayer, geoLayer],
  view: view,
  controls: defaultControls().extend([
    new ScaleLine({ minWidth: 100, bar: true, steps: 4, text: true }),
    new ZoomSlider(),
    new OverviewMap({
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          }),
        }),
      ],
      collapsed: false,
    }),
    new MousePosition(),
    new FullScreen(),
  ]),
});

///////////////////////////////////////////////////////////////
// LAYER SWITCHER
///////////////////////////////////////////////////////////////

class layerSwitcherControl extends Control {
  constructor() {
    const element = document.getElementById('layerbtn-group');
    element.className = 'ol-control layerSwitcherControl';
    super({ element });

    const layerButtons = document.querySelectorAll('.layerButton');

    layerButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.id;

        tileLayerGroup.getLayers().forEach((layer) => {
          const cls = layer.getClassName?.();
          if (cls) layer.setVisible(cls === id);
        });
      });
    });
  }
}

map.addControl(new layerSwitcherControl());

///////////////////////////////////////////////////////////////
// GEOLOCATION CONTROL
///////////////////////////////////////////////////////////////

class geoLocationControl extends Control {
  constructor() {
    const geoButton = document.getElementById('geoButton');
    const element = document.getElementById('geoButtonContainer');
    element.className = 'geoLocationControl ol-control';
    super({ element });

    const geolocation = new Geolocation({
      projection: view.getProjection(),
    });

    geoButton.addEventListener('click', () =>
      geolocation.setTracking(true)
    );

    geolocation.on('change:position', () => {
      const coords = geolocation.getPosition();
      positionFeature.setGeometry(coords ? new Point(coords) : null);
      view.animate({ center: coords, zoom: 17, duration: 1500 });
    });
  }
}

map.addControl(new geoLocationControl());

///////////////////////////////////////////////////////////////
// DRAW CONTROL
///////////////////////////////////////////////////////////////

class drawControl extends Control {
  constructor() {
    let draw;
    const drawButtons = document.querySelectorAll('.drawButton');
    const element = document.getElementById('drawbtn-group');
    element.className = 'drawControl ol-control';
    super({ element });

    drawButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (draw) map.removeInteraction(draw);
        draw = new Draw({
          type: button.id,
          source: drawSource,
        });
        map.addInteraction(draw);
      });
    });
  }
}

map.addControl(new drawControl());

///////////////////////////////////////////////////////////////
// EDIT CONTROL
///////////////////////////////////////////////////////////////

class editControl extends Control {
  constructor() {
    const element = document.getElementById('editButtons');
    element.className = 'ol-control editControl';
    super({ element });

    document
      .getElementById('clear')
      .addEventListener('click', () => drawSource.clear());

    const format = new GeoJSON({ featureProjection: 'EPSG:3857' });
    const download = document.getElementById('download');

    drawSource.on('change', () => {
      const features = drawSource.getFeatures();
      download.href =
        'data:application/json;charset=utf-8,' +
        encodeURIComponent(format.writeFeatures(features));
    });
  }
}

map.addControl(new editControl());

///////////////////////////////////////////////////////////////
// DRAG & DROP + MODIFY
///////////////////////////////////////////////////////////////

map.addInteraction(
  new DragAndDrop({
    source: drawSource,
    formatConstructors: [GeoJSON],
  })
);

map.addInteraction(
  new Modify({
    source: drawSource,
  })
);
