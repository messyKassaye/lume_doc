import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactMapGL, { Marker, Popup, NavigationControl, setRTLTextPlugin } from 'react-map-gl';
import Immutable from 'immutable';
import { Icon } from 'UI';
import Supercluster from 'supercluster'; //eslint-disable-line
import settingsAPI from 'app/Settings/SettingsAPI';
import _style from './style.json';
import { getMarkersBoudingBox, markersToStyleFormat, TRANSITION_PROPS } from './helper';

setRTLTextPlugin(
  'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
  null, //callback
  true //lazy load
);

const PRIME_MERIDIAN = 0;

const getStateDefaults = ({ latitude, longitude, width, height, zoom }) => ({
  viewport: {
    latitude: latitude || PRIME_MERIDIAN,
    longitude: longitude || PRIME_MERIDIAN,
    width: width || 250,
    height: height || 200,
    zoom,
  },
  selectedMarker: null,
  settings: { scrollZoom: true, touchZoom: true },
  showControls: false,
});

export default class Map extends Component {
  constructor(props) {
    super(props);
    this.state = getStateDefaults(props);
    this.state.settings.scrollZoom = props.scrollZoom;
    this.state.settings.touchZoom = props.scrollZoom;
    this.state.showControls = props.showControls;

    this.mapStyle = Immutable.fromJS(_style);
    this.supercluster = new Supercluster({
      radius: _style.sources.markers.clusterRadius,
      maxZoom: _style.sources.markers.clusterMaxZoom,
    });

    this.updateMapStyle(props);
    this.bindActions();
    this.assignDefaults();
  }

  async componentDidMount() {
    this.collectionSettings = await settingsAPI.get();
    this.setDefaultCoordinates();

    this.replaceKeysMapStyleJson();

    this.setSize();
    const map = this.map && this.map.getMap();
    if (map) {
      map.on('load', () => this.centerOnMarkers(this.props.markers));
      map.on('moveend', e => {
        if (e.autoCentered) {
          this.setViewport(map);
        }
      });
    }
    this.eventListener = window.addEventListener('resize', this.setSize);
  }

  componentWillReceiveProps(props) {
    const { viewport } = this.state;
    const { markers } = props;
    const latitude = props.latitude || viewport.latitude;
    const longitude = props.longitude || viewport.longitude;
    const newViewport = { ...viewport, latitude, longitude, markers };

    if (!Immutable.fromJS(this.props.markers).equals(Immutable.fromJS(markers))) {
      this.autoCenter(markers);
      this.updateMapStyle(props);
    }
    this.setState({ viewport: newViewport });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
  }

  onClick(e) {
    const { markers, onClick } = this.props;
    const unclusteredPoints = e.features.filter(f => f.layer.id === 'unclustered-point');
    const cluster = e.features.find(f => f.layer.id === 'clusters');

    switch (true) {
      case unclusteredPoints.length === 1:
        this.clickOnMarker(markers[unclusteredPoints[0].properties.index]);
        break;
      case unclusteredPoints.length > 1:
        this.clickOnCluster(unclusteredPoints.map(marker => markers[marker.properties.index]));
        break;
      default:
        break;
    }

    if (cluster) {
      this.processClusterOnClick(cluster);
    }

    onClick(e);
  }

  onHover(e) {
    const { markers, cluster } = this.props;
    const { selectedMarker } = this.state;
    let feature = null;

    if (e.features) {
      feature = e.features.find(f => f.layer.id === 'unclustered-point');
      if (feature) {
        this.hoverOnMarker(markers[feature.properties.index]);
      }
    }
    if (!feature && selectedMarker && cluster) {
      this.setState({ selectedMarker: null });
    }
  }

  setDefaultCoordinates() {
    const { viewport } = this.state;
    if (viewport.latitude === PRIME_MERIDIAN && viewport.longitude === PRIME_MERIDIAN) {
      viewport.latitude = this.collectionSettings.mapStartingPoint[0].lat;
      viewport.longitude = this.collectionSettings.mapStartingPoint[0].lon;
      this.setState({ viewport });
    }
  }

  setSize() {
    const { viewport } = this.state;
    const { width, height } = this.props;
    viewport.width = width || (this.container && this.container.offsetWidth);
    viewport.height = height || (this.container && this.container.offsetHeight);
    this.setState({ viewport });
  }

  setViewport(map) {
    const { viewport } = this.state;
    const newViewport = Object.assign(viewport, {
      latitude: map.getCenter().lat,
      longitude: map.getCenter().lng,
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
    });
    this.setState({ viewport: newViewport });
  }

  bindActions() {
    this.zoom = this.zoom.bind(this);
    this.setSize = this.setSize.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onHover = this.onHover.bind(this);
  }

  assignDefaults() {
    this._onViewportChange = viewport => {
      this.setState({ viewport });
    };
    this._onViewStateChange = viewport => {
      this.setState({ viewport });
    };

    this.zoomIn = () => this.zoom(+1);
    this.zoomOut = () => this.zoom(-1);

    this.interactiveLayerIds = [];
    if (this.mapStyle.has('layers')) {
      this.interactiveLayerIds = this.mapStyle
        .get('layers')
        .filter(l => l.get('interactive'))
        .map(l => l.get('id'))
        .toJS();
    }
  }

  processClusterOnClick(cluster) {
    const currentData = this.mapStyle.getIn(['sources', 'markers', 'data', 'features']).toJS();
    this.supercluster.load(currentData);
    const markersOnCluster = this.supercluster.getLeaves(cluster.properties.cluster_id, Infinity);
    this.clickOnCluster(markersOnCluster);
  }

  autoCenter(markers) {
    const { autoCenter } = this.props;
    if (autoCenter) {
      this.centerOnMarkers(markers);
    }
  }

  centerOnMarkers(markers) {
    if (!this.map || !markers.length) {
      return;
    }
    const map = this.map.getMap();
    const boundaries = getMarkersBoudingBox(markers);
    map
      .stop()
      .fitBounds(
        boundaries,
        { padding: { top: 70, left: 20, right: 20, bottom: 20 }, maxZoom: 5, duration: 0 },
        { autoCentered: true }
      );
  }

  zoom(amount) {
    const { viewport } = this.state;
    if (!this.map) {
      return;
    }
    const map = this.map.getMap();
    this._onViewStateChange({
      ...viewport,
      zoom: map.getZoom() + amount,
      ...TRANSITION_PROPS,
      transitionDuration: 500,
    });
  }

  updateMapStyle({ cluster, markers }) {
    if (!cluster) {
      return;
    }

    const markersData = markersToStyleFormat(markers);
    const currentData = this.mapStyle.getIn(['sources', 'markers', 'data', 'features']);
    if (!currentData.equals(Immutable.fromJS(markersData))) {
      const style = this.mapStyle.setIn(
        ['sources', 'markers', 'data', 'features'],
        Immutable.fromJS(markersData)
      );
      this.mapStyle = style;
      this.supercluster.load(markersData);
    }
  }

  clickOnMarker(marker) {
    const { clickOnMarker } = this.props;
    clickOnMarker(marker);
  }

  clickOnCluster(cluster) {
    const { clickOnCluster } = this.props;
    clickOnCluster(cluster);
  }

  hoverOnMarker(marker) {
    const { selectedMarker } = this.state;
    const { hoverOnMarker } = this.props;

    if (selectedMarker !== marker) {
      this.setState({ selectedMarker: marker });
    }

    hoverOnMarker(marker);
  }

  replaceKeysMapStyleJson() {
    const { mapTilerKey } = this.collectionSettings;
    const mapTilerKeyPlaceholder = /{{MAP_TILER_KEY}}/g;
    const stringifyStyle = JSON.stringify(this.mapStyle).replace(
      mapTilerKeyPlaceholder,
      mapTilerKey
    );
    this.mapStyle = Immutable.fromJS(JSON.parse(stringifyStyle));
    this.setState({ mapStyleLoaded: true });
  }

  renderMarker(marker, onClick, onMouseEnter, onMouseLeave) {
    const { renderMarker } = this.props;
    if (renderMarker) {
      return renderMarker(marker, onClick);
    }
    return (
      <Icon
        style={{
          position: 'relative',
          top: '-25px',
          right: '15px',
          color: (marker.properties && marker.properties.color) || '#d9534e',
        }}
        icon="map-marker"
        size="2x"
        fixedWidth
        onClick={onClick}
        onMouseOver={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  renderPopup() {
    const { selectedMarker } = this.state;
    const { renderPopupInfo } = this.props;
    if (
      selectedMarker &&
      (renderPopupInfo ||
        (selectedMarker && selectedMarker.properties && selectedMarker.properties.info))
    ) {
      const { longitude, latitude } = selectedMarker;
      return (
        <Popup
          tipSize={6}
          anchor="bottom"
          longitude={longitude}
          latitude={latitude}
          offsetTop={-20}
          closeButton={false}
        >
          <div>
            {renderPopupInfo ? renderPopupInfo(selectedMarker) : selectedMarker.properties.info}
          </div>
        </Popup>
      );
    }
    return false;
  }

  renderMarkers() {
    const { markers, cluster } = this.props;
    if (cluster) {
      return false;
    }

    return markers.map((marker, index) => {
      const onClick = this.clickOnMarker.bind(this, marker);
      const onMouseEnter = this.hoverOnMarker.bind(this, marker);
      const onMouseLeave = this.hoverOnMarker.bind(this, null);
      return (
        <Marker {...marker} key={index} offsetLeft={0} offsetTop={0}>
          {this.renderMarker(marker, onClick, onMouseEnter, onMouseLeave)}
        </Marker>
      );
    });
  }

  renderControls() {
    const { showControls } = this.state;
    if (showControls) {
      return (
        <div className="mapbox-navigation">
          <NavigationControl onViewportChange={this._onViewportChange} />
        </div>
      );
    }

    return false;
  }

  render() {
    const { viewport, settings } = this.state;

    return (
      <div
        className="map-container"
        ref={container => {
          this.container = container;
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {this.state && this.state.mapStyleLoaded && (
          <ReactMapGL
            ref={ref => {
              this.map = ref;
            }}
            {...viewport}
            {...settings}
            dragRotate
            mapStyle={this.mapStyle}
            onViewportChange={this._onViewportChange}
            onViewStateChange={this._onViewStateChange}
            onClick={this.onClick}
            onHover={this.onHover}
            interactiveLayerIds={this.interactiveLayerIds}
          >
            {this.renderMarkers()}
            {this.renderPopup()}
            {this.renderControls()}
            <span className="mapbox-help">
              <Icon icon="question-circle" />
              <span className="mapbox-tooltip">Hold shift to rotate the map</span>
            </span>
          </ReactMapGL>
        )}
      </div>
    );
  }
}

Map.defaultProps = {
  markers: [],
  latitude: null,
  longitude: null,
  zoom: 4,
  width: null,
  height: null,
  onClick: () => {},
  clickOnMarker: () => {},
  hoverOnMarker: () => {},
  clickOnCluster: () => {},
  renderPopupInfo: null,
  renderMarker: null,
  cluster: false,
  autoCenter: true,
  scrollZoom: true,
  showControls: false,
  interactiveLayerIds: [],
};

Map.propTypes = {
  markers: PropTypes.arrayOf(PropTypes.object),
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  zoom: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  onClick: PropTypes.func,
  clickOnMarker: PropTypes.func,
  renderPopupInfo: PropTypes.func,
  clickOnCluster: PropTypes.func,
  hoverOnMarker: PropTypes.func,
  renderMarker: PropTypes.func,
  cluster: PropTypes.bool,
  autoCenter: PropTypes.bool,
  scrollZoom: PropTypes.bool,
  showControls: PropTypes.bool,
  interactiveLayerIds: PropTypes.arrayOf(PropTypes.string),
};
