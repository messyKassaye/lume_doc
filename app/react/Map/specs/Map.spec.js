/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import ReactMapGL, { Marker, Popup } from 'react-map-gl';

import { Icon } from 'UI';
import settingsAPI from 'app/Settings/SettingsAPI';
import Map from '../Map';
import { TRANSITION_PROPS } from '../helper';

jest.mock('app/Settings/SettingsAPI');

describe('Map', () => {
  let component;
  let instance;
  let props;
  let markers;
  let map;

  beforeEach(() => {
    props = {
      onClick: jasmine.createSpy('onClick'),
      clickOnMarker: jasmine.createSpy('clickOnMarker'),
      hoverOnMarker: jasmine.createSpy('hoverOnMarker'),
      clickOnCluster: jasmine.createSpy('clickOnCluster'),
      latitude: 103,
      longitude: -63,
      zoom: 8,
      markers: [
        { latitude: 2, longitude: 32, properties: { info: 'Some info', color: 'red' } },
        { latitude: 23, longitude: 21 },
      ],
    };
  });

  const render = () => {
    component = shallow(<Map {...props} />, { disableLifecycleMethods: true });
    instance = component.instance();
    instance.container = {
      style: {},
      offsetWidth: 400,
      offsetHeight: 300,
      childNodes: [{ style: {} }],
    };
    map = jasmine.createSpyObj(['on', 'fitBounds', 'getZoom', 'stop']);
    map.getZoom.and.returnValue(5);
    instance.map = { getMap: () => map };
    instance.setState({ mapStyleLoaded: true });
    markers = component.find(Marker);
  };

  const firstMarker = () => markers.first();
  const secondMarker = () => markers.last();

  describe('render', () => {
    beforeEach(render);
    it('should render a ReactMapGL with the props', () => {
      const reactMap = component.find(ReactMapGL);
      expect(reactMap.props().latitude).toBe(103);
      expect(reactMap.props().longitude).toBe(-63);
      expect(reactMap.props().onClick).toBe(instance.onClick);
    });

    it('should render a Markers component', () => {
      expect(markers.length).toBe(2);
      expect(firstMarker().props().latitude).toBe(2);
      expect(
        firstMarker()
          .find(Icon)
          .props().icon
      ).toBe('map-marker');
      expect(
        firstMarker()
          .find(Icon)
          .props().style.color
      ).toBe('red');
      expect(firstMarker().props().longitude).toBe(32);

      expect(secondMarker().props().latitude).toBe(23);
      expect(secondMarker().props().longitude).toBe(21);
      expect(
        secondMarker()
          .find(Icon)
          .props().style.color
      ).toBe('#d9534e');
    });

    it('should use custom renderMarker method', () => {
      props.renderMarker = (_marker, onClick) => <div className="custom-class" onClick={onClick} />;
      render();
      expect(
        firstMarker()
          .find('div')
          .hasClass('custom-class')
      ).toBe(true);
    });

    describe('when clustering', () => {
      it('should not render any marker', () => {
        props.cluster = true;
        render();
        expect(markers.length).toBe(0);
      });
    });
  });

  describe('autoCenter()', () => {
    it('should call centerOnMarkers by default center', () => {
      render();
      spyOn(instance, 'centerOnMarkers');
      const _markers = [{ latitude: 2, longitude: 32 }];
      instance.autoCenter(_markers);
      expect(instance.centerOnMarkers).toHaveBeenCalled();
    });

    describe('when autoCenter prop is false', () => {
      it('should not center', () => {
        props.autoCenter = false;
        render();
        spyOn(instance, 'centerOnMarkers');
        const _markers = [{ latitude: 2, longitude: 32 }];
        instance.autoCenter(_markers);
        expect(instance.centerOnMarkers).not.toHaveBeenCalled();
      });
    });
  });

  describe('centerOnMarkers', () => {
    it('should call the map with the markers bounding box to center on them', () => {
      render();
      const _markers = [
        { latitude: 2, longitude: 32 },
        { latitude: 23, longitude: 21 },
        { latitude: 7, longitude: 11 },
        { latitude: 22, longitude: -21 },
      ];

      map.stop.and.returnValue(map);
      instance.centerOnMarkers(_markers);
      expect(map.fitBounds).toHaveBeenCalledWith(
        [
          [-21, 2],
          [32, 23],
        ],
        { padding: { bottom: 20, left: 20, right: 20, top: 70 }, maxZoom: 5, duration: 0 },
        { autoCentered: true }
      );
    });
  });

  describe('updateDataSource', () => {
    it('should update the clusters data layer of the map style', () => {
      props.cluster = true;
      render();
      const { mapStyle } = component.find(ReactMapGL).props();
      const markersData = mapStyle.getIn(['sources', 'markers', 'data', 'features']).toJS();
      expect(markersData.length).toBe(2);
      expect(markersData[0].properties.index).toBe(0);
      expect(markersData[0].geometry.coordinates).toEqual([32, 2]);
      expect(markersData[1].properties.index).toBe(1);
      expect(markersData[1].geometry.coordinates).toEqual([21, 23]);
    });
  });

  describe('when map moves', () => {
    let newViewport;

    beforeEach(() => {
      render();
      newViewport = {
        latitude: 1,
        longitude: 2,
        width: 100,
        height: 100,
        zoom: 7,
      };
    });

    it('should update it throught viewport change', () => {
      instance._onViewportChange(newViewport);
      expect(component.state().viewport).toBe(newViewport);
    });

    it('should update it throught view statechange', () => {
      instance._onViewStateChange(newViewport);
      expect(component.state().viewport).toBe(newViewport);
    });
  });

  describe('setSize()', () => {
    it('should adapt the map size to the container', () => {
      render();
      instance.setSize();
      expect(component.state().viewport.width).toBe(400);
      expect(component.state().viewport.height).toBe(300);
    });
  });

  describe('componentDidMount', () => {
    const testMapTilerKey = 'TestMapTilerKey';

    beforeEach(async () => {
      spyOn(window, 'addEventListener');
      spyOn(window, 'removeEventListener');
      render();
      spyOn(instance, 'centerOnMarkers');
      spyOn(instance, 'setViewport');
      settingsAPI.get.mockResolvedValue({ mapTilerKey: testMapTilerKey });
      await instance.componentDidMount();
    });

    it('should add and remove event listeners for resize', () => {
      expect(window.addEventListener).toHaveBeenCalledWith('resize', component.instance().setSize);
      component.instance().componentWillUnmount();
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'resize',
        component.instance().setSize
      );
    });

    it('should add events to the map for after is loaded', () => {
      expect(map.on.calls.all()[0].args[0]).toBe('load');
      const callback = map.on.calls.all()[0].args[1];
      callback();
      expect(instance.centerOnMarkers).toHaveBeenCalled();
    });

    it('should add events to the map for after the map moves', () => {
      expect(map.on.calls.all()[1].args[0]).toBe('moveend');
      const callback = map.on.calls.all()[1].args[1];
      callback({});
      expect(instance.setViewport).not.toHaveBeenCalled();
      callback({ autoCentered: true });
      expect(instance.setViewport).toHaveBeenCalled();
    });

    it('should read and set the map tiler key in the style', () => {
      expect(JSON.stringify(instance.mapStyle)).toContain(testMapTilerKey);
    });

    it('should set the map tiler key from the settings', async () => {
      render();
      const expectedKey = 'XYZ';
      settingsAPI.get.mockResolvedValue({ mapTilerKey: expectedKey });
      await instance.componentDidMount();
      const stringifyStyle = JSON.stringify(instance.mapStyle);
      expect(stringifyStyle).not.toContain('{{MAP_TILER_KEY}}');
      expect(instance.mapStyle.getIn(['sources', 'openmaptiles', 'url'])).toContain(expectedKey);
      expect(instance.mapStyle.getIn(['glyphs'])).toContain(expectedKey);
    });

    it('should set the default map starting point from settings if the map does not have one', async () => {
      delete props.latitude;
      delete props.longitude;
      render();
      const mapStartingPoint = [{ lon: 7, lat: 45 }];
      settingsAPI.get.mockResolvedValue({ mapStartingPoint });
      await instance.componentDidMount();
      expect(instance.state.viewport.latitude).toBe(mapStartingPoint[0].lat);
      expect(instance.state.viewport.longitude).toBe(mapStartingPoint[0].lon);
    });
  });

  describe('zoom behavior', () => {
    it('should zoom in and out', () => {
      render();
      spyOn(instance, '_onViewStateChange');
      expect(instance._onViewStateChange).not.toHaveBeenCalled();
      instance.zoomIn();
      expect(instance._onViewStateChange.calls.mostRecent().args[0].zoom).toBe(6);
      instance.zoomOut();
      expect(instance._onViewStateChange.calls.mostRecent().args[0].zoom).toBe(4);

      Object.keys(TRANSITION_PROPS).forEach(prop => {
        if (prop !== 'transitionDuration') {
          expect(instance._onViewStateChange.calls.mostRecent().args[0][prop]).toBe(
            TRANSITION_PROPS[prop]
          );
        } else {
          expect(instance._onViewStateChange.calls.mostRecent().args[0][prop]).toBe(500);
        }
      });
    });
  });

  describe('clicking on a marker', () => {
    beforeEach(() => {
      render();
      firstMarker()
        .find(Icon)
        .first()
        .simulate('click');
      component.update();
    });

    it('should call clickOnMarker', () => {
      expect(props.clickOnMarker).toHaveBeenCalledWith(props.markers[0]);
    });
  });

  describe('hovering a marker', () => {
    let popup;
    beforeEach(() => {
      render();
      firstMarker()
        .find(Icon)
        .first()
        .simulate('mouseOver');
      component.update();
      popup = component.find(Popup);
    });

    it('should render a popup with the info', () => {
      expect(popup.length).toBe(1);
    });

    it('should not render a popup when has no info', () => {
      secondMarker()
        .find(Icon)
        .first()
        .simulate('mouseOver');
      component.update();
      popup = component.find(Popup);
      expect(popup.length).toBe(0);
    });
  });

  describe('onClick', () => {
    beforeEach(render);

    it('should call props.onClick with the event', () => {
      instance.onClick({ lngLat: [1, 2], features: [] });
      expect(props.onClick).toHaveBeenCalledWith({ lngLat: [1, 2], features: [] });
    });

    describe('when clicking a marker', () => {
      it('should call props.clickOnMarker with the marker', () => {
        const featureClicked = { layer: { id: 'unclustered-point' }, properties: { index: 2 } };
        instance.onClick({ lngLat: [1, 2], features: [featureClicked] });
        expect(props.clickOnMarker).toHaveBeenCalledWith(props.markers[2]);
      });
    });

    describe('when clicking more than one marker that are together', () => {
      it('should call props.clickOnCluster with the markers', () => {
        const features = [
          { layer: { id: 'unclustered-point' }, properties: { index: 0 } },
          { layer: { id: 'unclustered-point' }, properties: { index: 1 } },
        ];
        instance.onClick({ lngLat: [1, 2], features });
        expect(props.clickOnCluster).toHaveBeenCalledWith([props.markers[0], props.markers[1]]);
      });
    });

    describe('onHover', () => {
      beforeEach(() => {
        props.cluster = true;
        render();
      });
      describe('hovering over a marker', () => {
        it('should call hoverOnMarker with the marker', () => {
          const features = [{ layer: { id: 'unclustered-point' }, properties: { index: 0 } }];
          instance.onHover({ lngLat: [1, 2], features });
          expect(props.hoverOnMarker).toHaveBeenCalledWith(props.markers[0]);
          expect(instance.state.selectedMarker).toEqual(props.markers[0]);
        });
      });

      describe('hovering over nothing', () => {
        it('should empty the selectedMarker value', () => {
          const features = [];
          [instance.state.selectedMarker] = props.markers;
          instance.onHover({ lngLat: [1, 2], features });
          expect(props.hoverOnMarker).not.toHaveBeenCalled();
          expect(instance.state.selectedMarker).toBe(null);
        });
      });
    });

    describe('when clicking a cluster', () => {
      it('should call props.clickOnCluster with the markers', () => {
        map.getZoom.and.returnValue(0);
        const features = [{ layer: { id: 'clusters' }, properties: { cluster_id: 1 } }];
        spyOn(instance.supercluster, 'getLeaves').and.returnValue(props.markers);
        instance.onClick({ lngLat: [1, 2], features });
        expect(props.clickOnCluster).toHaveBeenCalledWith(props.markers);
      });
    });
  });

  describe('componentWillReceiveProps()', () => {
    it('should update the viewport with the markers, latitude and longitude', () => {
      render();
      instance.componentWillReceiveProps({ latitude: 73, longitude: 23, markers: [] });
      component.update();
      const { viewport } = component.state();
      expect(viewport.latitude).toBe(73);
      expect(viewport.longitude).toBe(23);
      expect(viewport.markers).toEqual([]);
    });

    it('should update the style and center on the new markers', () => {
      render();
      spyOn(instance, 'centerOnMarkers');
      spyOn(instance, 'updateMapStyle');
      instance.componentWillReceiveProps({ latitude: 73, longitude: 23, markers: [] });
      component.update();
      expect(instance.centerOnMarkers).toHaveBeenCalled();
      expect(instance.updateMapStyle).toHaveBeenCalled();
    });
  });
});
