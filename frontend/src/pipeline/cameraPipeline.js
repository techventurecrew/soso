// ==========================
// FILE: pipeline/cameraPipeline.js
// Real-time camera processing pipeline with canvas filters
// ==========================

import * as faceapi from 'face-api.js';
import { applyFilter } from '../filters/main.js';

const DEFAULT_ADJUSTMENTS = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  sharpness: 0,
};

const resolveElement = (target, selectorDescription) => {
  if (!target) {
    throw new Error(`Missing ${selectorDescription} reference`);
  }
  if (typeof target === 'string') {
    const el = document.querySelector(target);
    if (!el) {
      throw new Error(`Could not find ${selectorDescription} using selector: ${target}`);
    }
    return el;
  }
  return target;
};

export default class CameraPipeline {
  constructor({
    videoEl,
    outputCanvas,
    modelPath = '/models',
    defaultFilter = 'smoothSkin',
    enableFaceDetection = true,
    adjustments = {},
    onFaceDetection,
  } = {}) {
    this.video = resolveElement(videoEl, 'video element');
    this.canvas = resolveElement(outputCanvas, 'canvas element');

    this.displayCtx = this.canvas.getContext('2d', { willReadFrequently: false });
    this.offscreen = document.createElement('canvas');
    this.offscreenCtx = this.offscreen.getContext('2d', { willReadFrequently: false });
    
    // Performance optimizations
    this.displayCtx.imageSmoothingEnabled = true;
    this.offscreenCtx.imageSmoothingEnabled = true;

    this.adjustments = { ...DEFAULT_ADJUSTMENTS, ...adjustments };
    this.filter = defaultFilter;
    this.running = false;
    this.stream = null;
    this.modelPath = modelPath;
    this.enableFaceDetection = enableFaceDetection;
    this.modelsLoaded = false;
    this._rafId = null;
    this._vfcId = null; // Video frame callback ID
    this._onFrame = this._onFrame.bind(this);
    this._detecting = false;
    this._useVideoFrameCallback = typeof HTMLVideoElement.prototype.requestVideoFrameCallback === 'function';
    this.frameCount = 0;
    this.detectionStride = 6;
    this.lastDetection = null;
    this.onFaceDetection = onFaceDetection;
  }

  async start() {
    if (this.running) {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API not available in this browser');
    }

    if (this.enableFaceDetection) {
      await this._ensureModels();
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    });

    this.video.srcObject = this.stream;
    this.video.playsInline = true;
    this.video.muted = true;

    await new Promise((resolve) => {
      if (this.video.readyState >= 2) {
        resolve();
        return;
      }
      const handler = () => {
        this.video.removeEventListener('loadedmetadata', handler);
        resolve();
      };
      this.video.addEventListener('loadedmetadata', handler);
    });

    try {
      await this.video.play();
    } catch (err) {
      console.warn('Camera stream could not start playback automatically', err);
    }

    this._syncCanvasSize();

    this.running = true;
    
    // Use requestVideoFrameCallback if available (more efficient for video)
    if (this._useVideoFrameCallback) {
      this._scheduleNextFrame();
    } else {
      this._rafId = requestAnimationFrame(this._onFrame);
    }
  }

  stop() {
    this.running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._vfcId && this.video && typeof this.video.cancelVideoFrameCallback === 'function') {
      this.video.cancelVideoFrameCallback(this._vfcId);
      this._vfcId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }
    this.onFaceDetection?.(false);
  }

  setFilter(filterName = 'none') {
    this.filter = filterName;
  }

  setAdjustments(partial = {}) {
    this.adjustments = { ...this.adjustments, ...partial };
  }

  capturePhoto({ type = 'image/jpeg', quality = 0.95 } = {}) {
    if (!this.canvas.width || !this.canvas.height) {
      return null;
    }
    try {
      return this.canvas.toDataURL(type, quality);
    } catch (err) {
      console.error('Unable to capture photo from canvas', err);
      return null;
    }
  }

  async _ensureModels() {
    if (!this.enableFaceDetection || this.modelsLoaded) {
      return;
    }
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelPath),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(this.modelPath),
      ]);
      this.modelsLoaded = true;
    } catch (error) {
      console.warn('Failed to load face detection models, continuing without detection', error);
      this.enableFaceDetection = false;
      this.modelsLoaded = false;
    }
  }

  _syncCanvasSize() {
    const width = this.video.videoWidth || 1280;
    const height = this.video.videoHeight || 720;
    if (width === 0 || height === 0) {
      return;
    }
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (this.offscreen.width !== width || this.offscreen.height !== height) {
      this.offscreen.width = width;
      this.offscreen.height = height;
    }
  }

  _buildFilterString() {
    const { brightness, contrast, saturation } = this.adjustments;
    return [
      `brightness(${brightness})`,
      `contrast(${contrast})`,
      `saturate(${saturation})`,
    ].join(' ');
  }

  _scheduleDetection() {
    if (!this.enableFaceDetection || !this.modelsLoaded || this._detecting) {
      return;
    }
    this._detecting = true;
    faceapi
      .detectSingleFace(this.offscreen, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .then((result) => {
        this.lastDetection = result || null;
        this.onFaceDetection?.(Boolean(result));
      })
      .catch((error) => {
        console.warn('Face detection failed', error);
      })
      .finally(() => {
        this._detecting = false;
      });
  }

  _applySharpen(amount = 0) {
    if (amount <= 0) return;
    const ctx = this.offscreenCtx;
    const { width, height } = this.offscreen;
    const imageData = ctx.getImageData(0, 0, width, height);
    const src = new Uint8ClampedArray(imageData.data);

    const strength = Math.min(1.5, amount * 0.2);
    const dst = imageData.data;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          const current = src[idx + c];
          const north = src[idx + c - width * 4];
          const south = src[idx + c + width * 4];
          const east = src[idx + c + 4];
          const west = src[idx + c - 4];
          const sharpened = current * (1 + 4 * strength) - strength * (north + south + east + west);
          dst[idx + c] = Math.min(255, Math.max(0, sharpened));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  _scheduleNextFrame() {
    if (!this.running || !this.video) return;
    if (this._useVideoFrameCallback) {
      this._vfcId = this.video.requestVideoFrameCallback(this._onFrame);
    } else {
      this._rafId = requestAnimationFrame(this._onFrame);
    }
  }

  _onFrame() {
    if (!this.running) {
      return;
    }

    if (!this.video.videoWidth || !this.video.videoHeight) {
      this._scheduleNextFrame();
      return;
    }

    this._syncCanvasSize();

    const filterString = this._buildFilterString();
    this.offscreenCtx.filter = filterString;
    this.offscreenCtx.drawImage(this.video, 0, 0, this.offscreen.width, this.offscreen.height);
    this.offscreenCtx.filter = 'none';

    if (this.adjustments.sharpness > 0) {
      this._applySharpen(this.adjustments.sharpness);
    }

    try {
      applyFilter(this.filter, this.offscreen, this.lastDetection);
    } catch (error) {
      console.warn(`Filter ${this.filter} failed`, error);
    }

    this.displayCtx.drawImage(this.offscreen, 0, 0, this.canvas.width, this.canvas.height);

    this.frameCount += 1;
    if (this.enableFaceDetection && this.modelsLoaded && this.frameCount % this.detectionStride === 0) {
      this._scheduleDetection();
    }

    this._scheduleNextFrame();
  }
}


