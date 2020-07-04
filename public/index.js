/* eslint-disable no-continue */
/* eslint-disable no-underscore-dangle */
/* global Cesium */

const viewer = new Cesium.Viewer('cesiumContainer', {});

const kmlOptions = {
  camera: viewer.scene.camera,
  canvas: viewer.scene.canvas,
};

// If an earthquake is within this distance from another earthquake,
// the two are considered to be near each other.
// TODO: Make this value controllable by a UI element.
const epsilon = 50000;

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

// Displays a subset of earthquakes contained in the data file.
// Acceptable values for mode:
// 'near': Shows clusters of earthquakes (i.e., that occurred near other recent earthquakes).
// 'far': Shows isolated earthquakes (i.e., that occurred nowhere near other recent earthquakes).
// 'all': Shows all earthquakes.
async function showEarthquakes(mode) {
  if (mode !== 'near' && mode !== 'far' && mode !== 'all') {
    return;
  }

  const earthquakesData = await Cesium.KmlDataSource.load('data/earthquakes.kml', kmlOptions);
  const earthquakes = earthquakesData.entities.values;

  if (mode !== 'all') {
    // Pairwise O(n^2) comparison of distances between earthquakes
    // with early termination when possible.
    for (let i = 0; i < earthquakes.length; i += 1) {
      for (let j = i + 1; j < earthquakes.length; j += 1) {
      // Both earthquakes have already been marked as near another earthquake.
      // No comparison needed; skip this pair.
        if (earthquakes[i].nearOther && earthquakes[j].nearOther) {
          continue;
        }

        const distance = computeSurfaceDistance(earthquakes[i]._position, earthquakes[j]._position);

        // If the earthquakes are near each other, mark them both as such.
        if (distance >= 0 && distance <= epsilon) {
          earthquakes[i].nearOther = true;
          earthquakes[j].nearOther = true;
        }
      }
    }

    const idsToRemove = [];

    // Based on the mode, remove either clustered earthquakes or isolated earthquakes.
    for (let i = 0; i < earthquakes.length; i += 1) {
      const earthquake = earthquakes[i];

      if (mode === 'near') {
        if (!earthquake.nearOther) {
          idsToRemove.push(earthquake.id);
        }
      } else if (mode === 'far') {
        if (earthquake.nearOther) {
          idsToRemove.push(earthquake.id);
        }
      }
    }

    idsToRemove.forEach((id) => {
      earthquakesData._entityCollection.removeById(id);
    });
  }

  viewer.dataSources.add(earthquakesData);
}

// TODO: Make the mode controllable by a UI element.
showEarthquakes('near');
