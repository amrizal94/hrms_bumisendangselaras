'use strict';

const path    = require('path');
const express = require('express');
const multer  = require('multer');

// 1. TF + WASM backend with explicit wasm binary path
const tf = require('@tensorflow/tfjs');
const { setWasmPaths } = require('@tensorflow/tfjs-backend-wasm');
setWasmPaths(path.join(__dirname, 'node_modules/@tensorflow/tfjs-backend-wasm/dist/'));
require('@tensorflow/tfjs-backend-wasm');

// 2. face-api WASM variant
const { Canvas, Image, ImageData, createCanvas, loadImage } = require('canvas');
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const PORT       = 3003;
const MODEL_PATH = '/www/wwwroot/facehrm/web/public/models';

let modelsLoaded = false;

async function loadModels() {
  await tf.setBackend('wasm');
  await tf.ready();
  console.log('[face-service] TF backend:', tf.getBackend());

  await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68TinyNet.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
  modelsLoaded = true;
  console.log('[face-service] Models loaded OK');
}

const app    = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.get('/health', (_, res) =>
  res.json({ ok: true, modelsLoaded, backend: tf.getBackend(), uptime: process.uptime() })
);

app.post('/extract', upload.single('image'), async (req, res) => {
  if (!modelsLoaded) return res.status(503).json({ error: 'Models not ready, retry later.' });
  if (!req.file)    return res.status(400).json({ error: 'No image field in request.' });

  try {
    const img    = await loadImage(req.file.buffer);
    const canvas = createCanvas(img.width, img.height);
    canvas.getContext('2d').drawImage(img, 0, 0);

    // Larger inputSize for bigger images — better detection quality
    const inputSize = img.width > 800 ? 608 : 416;
    const opts      = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: 0.3 });
    const detection = await faceapi
      .detectSingleFace(canvas, opts)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) return res.status(422).json({ error: 'No face detected in image.' });

    return res.json({
      descriptor: Array.from(detection.descriptor),   // 128 floats — compatible with face-api.js web
      confidence: parseFloat(detection.detection.score.toFixed(4)),
      box: {
        x:      Math.round(detection.detection.box.x),
        y:      Math.round(detection.detection.box.y),
        width:  Math.round(detection.detection.box.width),
        height: Math.round(detection.detection.box.height),
      },
    });
  } catch (err) {
    console.error('[face-service] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

loadModels()
  .then(() => app.listen(PORT, '127.0.0.1', () =>
    console.log(`[face-service] Ready on 127.0.0.1:${PORT}`)
  ))
  .catch(err => { console.error('[face-service] Boot failed:', err); process.exit(1); });
