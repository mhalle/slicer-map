import {CompositeLayer} from '@deck.gl/core';
import {TextLayer} from '@deck.gl/layers';
import Supercluster from 'supercluster';

export default class TextClusterLayer extends CompositeLayer {
  shouldUpdateState({changeFlags}) {
    return changeFlags.somethingChanged;
  }

  updateState({props, oldProps, changeFlags}) {
    const rebuildIndex = changeFlags.dataChanged || props.sizeScale !== oldProps.sizeScale;

    if (rebuildIndex) {
      const index = new Supercluster({maxZoom: 16, radius: props.sizeScale*90 * Math.sqrt(2)});
      console.log(index);
      index.load(
        props.data.map(d => ({
          geometry: {coordinates: props.getPosition(d)},
          properties: d
        }))
      );
      this.setState({index});
    }

    const z = Math.floor(this.context.viewport.zoom);
    if (rebuildIndex || z !== this.state.z) {
        const data = this.state.index
        .getClusters([-180, -85, 180, 85], z)
        .filter(d => d.properties.cluster);
        console.log('data length: ', data.length );

      this.setState({
          z,
        data
      });
    }
  }

  getPickingInfo({info, mode}) {
    const pickedObject = info.object && info.object.properties;
    if (pickedObject) {
      if (pickedObject.cluster && mode !== 'hover') {
        info.objects = this.state.index
          .getLeaves(pickedObject.cluster_id, 25)
          .map(f => f.properties);
      }
      info.object = pickedObject;
    }
    return info;
  }

  renderLayers() {
    const {data} = this.state;

    return new TextLayer(
      this.getSubLayerProps({
        id: 'text-layer',
        data,
        getColor: this.props.getTextColor,
        background: true,
        fontFamily: 'Arial, sans-serif',
        getBackgroundColor: [0, 0, 0, 50],
        getBackgroundPadding: [7, 7],
        sizeScale: this.props.sizeScale,
        getPosition: d => d.geometry.coordinates,
        getText: d => d.properties.point_count.toString()
      })
    );
  }
}
TextClusterLayer.layerName = 'TextClusterLayer';

