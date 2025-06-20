/**
 * Browser Compatibility Utilities
 * Provides fallbacks and polyfills for production deployment
 */

// Check for MediaRecorder support with fallbacks
export function checkMediaRecorderSupport() {
  if (typeof MediaRecorder !== 'undefined') {
    return {
      supported: true,
      mimeType: MediaRecorder.isTypeSupported('video/webm; codecs=vp9') ? 'video/webm; codecs=vp9' :
                MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' :
                MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm'
    };
  }
  
  return {
    supported: false,
    fallback: 'canvas-export'
  };
}

// Storage fallback system
export class SafeStorage {
  constructor() {
    this.isAvailable = this.checkAvailability();
    this.memoryStorage = new Map();
  }

  checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage not available, using memory storage');
      return false;
    }
  }

  setItem(key, value) {
    try {
      if (this.isAvailable) {
        localStorage.setItem(key, value);
      } else {
        this.memoryStorage.set(key, value);
      }
    } catch (e) {
      console.warn('Storage failed, using memory fallback');
      this.memoryStorage.set(key, value);
    }
  }

  getItem(key) {
    try {
      if (this.isAvailable) {
        return localStorage.getItem(key);
      } else {
        return this.memoryStorage.get(key) || null;
      }
    } catch (e) {
      return this.memoryStorage.get(key) || null;
    }
  }

  removeItem(key) {
    try {
      if (this.isAvailable) {
        localStorage.removeItem(key);
      }
      this.memoryStorage.delete(key);
    } catch (e) {
      this.memoryStorage.delete(key);
    }
  }
}

// Audio compatibility layer
export class SafeAudio {
  constructor(src, options = {}) {
    this.src = src;
    this.options = options;
    this.audio = null;
    this.duration = 0;
    this.loaded = false;
    this.callbacks = {
      onload: [],
      onerror: [],
      onloadedmetadata: []
    };
    
    this.init();
  }

  async init() {
    try {
      // Try native Audio first
      if (typeof Audio !== 'undefined') {
        this.audio = new Audio(this.src);
        this.setupNativeAudio();
        return;
      }
      
      // Fallback for environments without Audio
      console.warn('Audio not supported, using silent fallback');
      this.createSilentFallback();
    } catch (error) {
      console.error('Audio initialization failed:', error);
      this.createSilentFallback();
    }
  }

  setupNativeAudio() {
    if (!this.audio) return;

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio.duration || 0;
      this.loaded = true;
      this.callbacks.onloadedmetadata.forEach(cb => cb());
    });

    this.audio.addEventListener('error', (error) => {
      console.error('Audio load error:', error);
      this.callbacks.onerror.forEach(cb => cb(error));
    });

    this.audio.addEventListener('canplaythrough', () => {
      this.callbacks.onload.forEach(cb => cb());
    });

    // Start loading
    try {
      this.audio.load();
    } catch (e) {
      console.warn('Audio load failed:', e);
      this.createSilentFallback();
    }
  }

  createSilentFallback() {
    // Create a silent fallback with estimated duration
    this.duration = this.options.estimatedDuration || 30;
    this.loaded = true;
    
    // Notify callbacks after a short delay
    setTimeout(() => {
      this.callbacks.onloadedmetadata.forEach(cb => cb());
      this.callbacks.onload.forEach(cb => cb());
    }, 100);
  }

  onloadedmetadata(callback) {
    this.callbacks.onloadedmetadata.push(callback);
    if (this.loaded) callback();
  }

  onload(callback) {
    this.callbacks.onload.push(callback);
    if (this.loaded) callback();
  }

  onerror(callback) {
    this.callbacks.onerror.push(callback);
  }

  getDuration() {
    return this.duration;
  }

  play() {
    if (this.audio && typeof this.audio.play === 'function') {
      return this.audio.play().catch(e => console.warn('Audio play failed:', e));
    }
    return Promise.resolve();
  }

  pause() {
    if (this.audio && typeof this.audio.pause === 'function') {
      this.audio.pause();
    }
  }
}

// Feature detection
export function detectBrowserFeatures() {
  return {
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    webgl: !!window.WebGLRenderingContext,
    canvas: !!document.createElement('canvas').getContext,
    localStorage: (() => {
      try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    audio: typeof Audio !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    promises: typeof Promise !== 'undefined',
    webworkers: typeof Worker !== 'undefined'
  };
}

// Initialize compatibility layer
export function initBrowserCompat() {
  const features = detectBrowserFeatures();
  
  console.log('🔍 Browser Feature Detection:', features);
  
  // Polyfill fetch if needed
  if (!features.fetch) {
    console.warn('⚠️ Fetch API not supported, some features may not work');
  }
  
  // Polyfill Promise if needed
  if (!features.promises) {
    console.error('❌ Promises not supported, app may not function properly');
  }
  
  return features;
}

// Global safe storage instance
export const safeStorage = new SafeStorage(); 