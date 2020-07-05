/* eslint-disable no-continue */
/* eslint-disable no-underscore-dangle */
/* global document Cesium */

const viewer = new Cesium.Viewer('cesiumContainer', {});
const cover = document.getElementById('cover');
const checkboxClustered = document.getElementById('checkboxClustered');
const checkboxIsolated = document.getElementById('checkboxIsolated');
const textboxDistance = document.getElementById('textboxDistance');

let currentEarthquakesData;
const defaultNearnessDistance = 50;

function showCover() {
  cover.style.display = 'block';
}

function hideCover() {
  cover.style.display = 'none';
}

// Computes the overland distance between two Cartesian positions on the globe.
function computeSurfaceDistance(position1, position2) {
  if (position1 && position2) {
    const positions = [
      position1._value,
      position2._value,
    ];

    const surfacePositions = Cesium.PolylinePipeline.generateArc({
      positions,
    });

    const scratchCartesian3 = new Cesium.Cartesian3();
    const surfacePositionsLength = surfacePositions.length;

    for (let i = 3; i < surfacePositionsLength; i += 3) {
      scratchCartesian3.x = surfacePositions[i] - surfacePositions[i - 3];
      scratchCartesian3.y = surfacePositions[i + 1] - surfacePositions[i - 2];
      scratchCartesian3.z = surfacePositions[i + 2] - surfacePositions[i - 1];
      const distance = Cesium.Cartesian3.magnitude(scratchCartesian3);

      return distance;
    }
  }

  return -1;
}

// Loads earthquake data from a KML file at the supplied path.
async function loadKml(path) {
  const kmlOptions = {
    camera: viewer.scene.camera,
    canvas: viewer.scene.canvas,
  };

  return Cesium.KmlDataSource.load(path, kmlOptions);
}

// Marks each earthquake in a earthquakesData KmlDataSource
// as either being near another earthquake or not,
// based on the nearnessDistance (in meters).
async function markNearness(nearnessDistance, earthquakesData) {
  const earthquakes = earthquakesData.entities.values;

  // Perform pairwise O(n^2) comparison of distances between earthquakes.
  for (let i = 0; i < earthquakes.length; i += 1) {
    // The data source may contain entities other than earthquakes (e.g., folders).
    // If the first entity does not have a position, assume it is not an earthquake and skip it.
    if (!earthquakes[i]._position) {
      continue;
    }

    for (let j = i + 1; j < earthquakes.length; j += 1) {
      // If the second entity does not have a position, skip it.
      if (!earthquakes[j]._position) {
        continue;
      }

      // If both earthquakes have already been marked as near another earthquake,
      // no comparison is needed; skip the pair.
      if (earthquakes[i].nearOther && earthquakes[j].nearOther) {
        continue;
      }

      const distance = computeSurfaceDistance(earthquakes[i]._position, earthquakes[j]._position);

      // If the earthquakes are near each other, mark them both as such.
      if (distance >= 0 && distance <= nearnessDistance) {
        earthquakes[i].nearOther = true;
        earthquakes[j].nearOther = true;
      }
    }
  }
}

// Verifies that a string represents a valid visibility mode.
// Acceptable modes:
// 'all': Shows all earthquakes.
// 'near': Shows clusters of earthquakes (i.e., that occurred near other recent earthquakes).
// 'far': Shows isolated earthquakes (i.e., that occurred nowhere near other recent earthquakes).
// 'none': Shows no earthquakes.
function isValidMode(mode) {
  if (mode === 'all' || mode === 'near' || mode === 'far' || mode === 'none') {
    return true;
  }

  return false;
}

// Marks each earthquake in a earthquakesData KmlDataSource
// as either being visible or not, based on the mode.
function markVisibility(earthquakesData, mode) {
  if (!isValidMode(mode)) {
    return;
  }

  const earthquakes = earthquakesData.entities.values;

  // Based on the mode, show either clustered earthquakes or isolated earthquakes.
  for (let i = 0; i < earthquakes.length; i += 1) {
    const earthquake = earthquakes[i];

    // If the entity does not have a position, assume it is not an earthquake. Leave it visible.
    if (!earthquake._position) {
      earthquake.show = true;
      continue;
    }

    switch (mode) {
      case 'all':
        earthquake.show = true;
        break;
      case 'near':
        earthquake.show = earthquake.nearOther;
        break;
      case 'far':
        earthquake.show = !earthquake.nearOther;
        break;
      case 'none':
        earthquake.show = false;
        break;
      default:
        earthquake.show = false;
    }
  }
}

// Determines which mode is appropriate based on checkboxes in the GUI
// and updates the visibility of earthquakes accordingly.
async function showEarthquakes() {
  let mode;

  if (checkboxClustered.checked && checkboxIsolated.checked) {
    mode = 'all';
  } else if (checkboxClustered.checked) {
    mode = 'near';
  } else if (checkboxIsolated.checked) {
    mode = 'far';
  } else {
    mode = 'none';
  }

  markVisibility(currentEarthquakesData, mode);
}

// Preprocessing step.
// Loads earthquake data and marks earthquakes as clustered or isolated,
// based on the nearnessDistance provided in the GUI.
async function computeClusters() {
  showCover();

  // If an earthquake is within this distance from another earthquake,
  // the two are considered to be near each other.
  let nearnessDistance = Number(textboxDistance.value);

  // Handle bad user input.
  if (Number.isNaN(nearnessDistance)) {
    nearnessDistance = defaultNearnessDistance;
    textboxDistance.value = nearnessDistance;
  }

  // Convert kilometers to meters.
  nearnessDistance *= 1000;

  if (currentEarthquakesData) {
    viewer.dataSources.remove(currentEarthquakesData);
  }

  currentEarthquakesData = await loadKml('data/earthquakes.kml');
  markNearness(nearnessDistance, currentEarthquakesData);
  showEarthquakes('all', currentEarthquakesData);

  viewer.dataSources.add(currentEarthquakesData);

  hideCover();
}

computeClusters();
