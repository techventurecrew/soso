// ==========================
// FILE: pipeline/cameraPipeline.js
// Real-time camera pipeline for Electron renderer
// Requires: face-api.js (for face detection), and your filters/main.js applyFilter
// ==========================

import * as faceapi from 'face-api.js';
import { applyFilter } from '../filters/main.js';

export default class CameraPipeline {
  constructor({videoEl, outputCanvas, modelPath, defaultFilter='smoothSkin'}) {
    this.video = document.querySelector(videoEl) || videoEl;
    this.canvas = document.querySelector(outputCanvas) || outputCanvas;
    this.modelPath = modelPath || '/models';
    this.filter = defaultFilter;
    this.running = false;
    this._onFrame = this._onFrame.bind(this);
  }

  async loadModels() {
    // load small models for performance (tiny face detector + landmarks)
    await faceapi.nets.tinyFaceDetector.loadFromUri(this.modelPath);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(this.modelPath);
  }

  async start() {
    if (this.running) return;
    await this.loadModels();

    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    this.video.srcObject = stream;
    await this.video.play();

    // ensure canvas size matches video
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    this.running = true;
    requestAnimationFrame(this._onFrame);
  }

  stop() {
    this.running = false;
    const tracks = this.video.srcObject ? this.video.srcObject.getTracks() : [];
    tracks.forEach(t => t.stop());
    this.video.pause();
    this.video.srcObject = null;
  }

  setFilter(filterName) {
    this.filter = filterName;
  }

  async _onFrame() {
    if (!this.running) return;
    const ctx = this.canvas.getContext('2d');

    // draw current video frame to canvas
    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    // detect face (fast tiny detector)
    const detection = await faceapi.detectSingleFace(this.canvas, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true);

    // apply filter from filters/main.js — each filter accepts (canvas, detection)
    try {
      applyFilter(this.filter, this.canvas, detection);
    } catch (e) {
      // swallow errors to keep real-time loop running
      console.error('Filter error:', e);
    }

    requestAnimationFrame(this._onFrame);
  }
}
