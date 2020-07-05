# Earthquakes Visualizer

Displays earthquakes (magnitude 2.5+) from https://earthquake.usgs.gov/earthquakes/search/ over the period 2020-06-26 to 2020-07-03.

Can display clustered earthquakes (i.e., earthquakes that occurred near other earthquakes in the same time period), isolated earthquakes, or both. The distance for defining whether or not two earthquakes are clustered is configurable via the GUI.



## Instructions

1. Install [Node.js](https://nodejs.org/en/)
2. Clone the repository
3. _(Optional)_ In the repository's root directory, add a file `.env` with content `CESIUM_ION_KEY=insert-your-API-key-here` (inserting your Cesium Ion key after the '=' sign)
4. In the repository's root directory, run `npm install`
5. In the repository's root directory, run `npm start`
6. In a web browser, navigate to `http://localhost:8080/`



## References

1. https://cesium.com/docs/tutorials/getting-started/
2. https://sandcastle.cesium.com/index.html?src=KML.html
3. https://cesium.com/docs/tutorials/cesium-workshop/
4. https://gis.stackexchange.com/questions/175399/cesium-js-line-length/175430
5. https://earthquake.usgs.gov/earthquakes/search/
