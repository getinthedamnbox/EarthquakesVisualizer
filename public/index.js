/* global Cesium */

const viewer = new Cesium.Viewer('cesiumContainer', {});

const kmlOptions = {
  camera: viewer.scene.camera,
  canvas: viewer.scene.canvas,
};

const earthquakesPromise = Cesium.KmlDataSource.load('data/earthquakes.kml', kmlOptions);

earthquakesPromise.then((dataSource) => {
  viewer.dataSources.add(dataSource);
});
