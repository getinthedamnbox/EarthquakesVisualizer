/* eslint-disable no-console */
const express = require('express');
const compression = require('compression');
require('dotenv').config();

// Eventually, this mime type configuration will need to change.
// https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
// Any changes made here must be mirrored in web.config.
const { mime } = express.static;
mime.define({
  'application/json': ['czml', 'json', 'geojson', 'topojson'],
  'image/crn': ['crn'],
  'image/ktx': ['ktx'],
  'model/gltf+json': ['gltf'],
  'model/gltf.binary': ['bgltf', 'glb'],
  'text/plain': ['glsl'],
});

const app = express();
app.use(compression());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(express.static('public'));

// Insecure workaround to avoid having to push API key to repo.
// Serves API key directly to front end.
app.get('/key', (req, res) => {
  res.setHeader('Content-Type', 'text/javascript');
  res.send(`Cesium.Ion.defaultAccessToken = '${process.env.CESIUM_ION_KEY}';`);
});

const port = 8080;
const server = app.listen(port);

server.on('error', (e) => {
  console.log(e);
  process.exit(1);
});

server.on('close', () => {
  console.log('Server stopped.');
});

let isFirstSig = true;
process.on('SIGINT', () => {
  if (isFirstSig) {
    console.log('Server shutting down.');
    server.close(() => {
      process.exit(0);
    });
    isFirstSig = false;
  } else {
    console.log('Server force kill.');
    process.exit(1);
  }
});
