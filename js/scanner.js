// ./js/scanner.js (2811_R440) - 3-Tab Pilot Scan Hub Hardware & UI Controller
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import { showToast } from './notifications.js';
import { getProfileData, getScanHistory } from './storage.js';
import { animateTabBounce, animateTabContentEntrance } from './animations.js';

let qrScanner = null;
let currentCameraDeviceId = null;
let availableCameraDevices = [];
let activeMediaStream = null;
let torchActive = false;
let idleTimer = null;
let adaptiveWeightTimer = null;
let adaptiveWeightTimerPhase2 = null;

let wakeLock = null;
let currentZoomLevel = 1.0;

// Session and Single-Decode Safeguards
let scannerSessionId = 0;

// IDLE TIMEOUT THRESHOLD: 60 Seconds
const IDLE_TIMEOUT_MS = 60000;

// Filter out front/selfie/user-facing cameras strictly
function filterRearCameras(cameras) {
  if (!Array.isArray(cameras)) return [];
  return cameras.filter(cam => {
    const label = (cam.label || '').toLowerCase();
    if (label.includes('front') || label.includes('user') || label.includes('selfie') || label.includes('facing front')) {
      return false;
    }
    return true;
  });
}

// Format camera device or macro/zoom level labels for clear user feedback
function formatCameraLabel(device, index, total) {
  if (!device) return 'Switch Lens';
  const label = (device.label || '').toLowerCase();
  if (label.includes('telephoto') || label.includes('zoom')) return 'Telephoto Lens';
  if (label.includes('ultra') || label.includes('wide')) return 'Ultra Wide Lens';
  if (label.includes('main') || label.includes('wide') || label.includes('back')) return 'Main Lens';
  return ;
}

export function updateCameraControlUI() {
  const cycleBtn = document.getElementById('camera-cycle-btn');
  const cycleLabel = document.getElementById('camera-cycle-label');
  const uploadBtn = document.getElementById('upload-qr-btn');
  const targetEl = cycleLabel || cycleBtn;

  if (!availableCameraDevices || availableCameraDevices.length === 0) {
    try {
      if (window.QrScanner) {
        window.QrScanner.listCameras(true).then(cameras => {
          availableCameraDevices = filterRearCameras(cameras || []);
          updateCameraControlUI();
        }).catch(() => {});
      }
    } catch (e) {}
  }

  const numRearCams = availableCameraDevices ? availableCameraDevices.length : 0;
  const track = activeMediaStream ? activeMediaStream.getVideoTracks()[0] : null;
  const caps = (track && track.getCapabilities) ? track.getCapabilities() : {};
  const hasZoom = Boolean(caps.zoom);
  const isIPad = /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (numRearCams > 1) {
    if (cycleBtn) {
      cycleBtn.classList.remove('hidden');
      cycleBtn.classList.add('flex');
    }
    if (uploadBtn) {
      uploadBtn.classList.remove('col-span-2');
      uploadBtn.classList.add('col-span-1');
    }
    if (targetEl) {
      const index = availableCameraDevices.findIndex(c => c.id === currentCameraDeviceId);
      const current = availableCameraDevices[index >= 0 ? index : 0];
      targetEl.innerText = formatCameraLabel(current, index >= 0 ? index : 0, numRearCams);
    }
  } else if (hasZoom && !isIPad) {
    if (cycleBtn) {
      cycleBtn.classList.remove('hidden');
      cycleBtn.classList.add('flex');
    }
    if (uploadBtn) {
      uploadBtn.classList.remove('col-span-2');
      uploadBtn.classList.add('col-span-1');
    }
    if (targetEl) {
      if (currentZoomLevel === 1.0) targetEl.innerText = 'Zoom 1.0x'; else if (currentZoomLevel === 1.8) targetEl.innerText = 'Macro 1.8x'; else targetEl.innerText = `Zoom ${currentZoomLevel.toFixed(1)}x`;
    }
  } else {
    if (cycleBtn) {
      cycleBtn.classList.add('hidden');
      cycleBtn.classList.remove('flex');
    }
    if (uploadBtn) {
      uploadBtn.classList.remove('col-span-1');
      uploadBtn.classList.add('col-span-2');
    }
  }
}

export function updateCameraCycleButtonLabel() {
  updateCameraControlUI();
}

// ============================================================================
// 2. TAB 1: LIVE CAMERA SCANNER & HARDWARE STREAM CONTROLLER
// ============================================================================

export function startScanner(onDecodeCallback, onErrorCallback, customVideoElemId = "qr-video") {
  if (!navigator.onLine) {
    if (typeof window.showToast === "function") {
      window.showToast("Camera scanning requires an active internet connection.", "warning");
    }
    stopScanner();
    if (onErrorCallback) onErrorCallback("Camera scanner unavailable offline.");
    return;
  }
  const errorMsg = document.getElementById("error-message");
  if (errorMsg) errorMsg.innerText = "";

  const videoElem = document.getElementById(customVideoElemId);
  if (!videoElem) {
    if (onErrorCallback) onErrorCallback("Camera feed element not found.");
    return;
  }

  // Hide paused overlay if visible
  const pausedOverlay = document.getElementById("scanner-paused-overlay");
  if (pausedOverlay) pausedOverlay.classList.add("hidden");

  // Maintain stream if scanner is already active and playing
  if (qrScanner && activeMediaStream && activeMediaStream.active && videoElem && videoElem.readyState >= 2 && !videoElem.paused) {
    resetIdleTimer(onDecodeCallback, onErrorCallback);
    return;
  }

  // Session Token and One-Shot Decode Guard
  const currentSession = ++scannerSessionId;
  let decodeHandled = false;

  // Reset idle timer
  resetIdleTimer(onDecodeCallback, onErrorCallback);

  if (qrScanner) {
    try {
      qrScanner.destroy();
    } catch (e) {}
    qrScanner = null;
  }

  if (adaptiveWeightTimer) clearTimeout(adaptiveWeightTimer);
  if (adaptiveWeightTimerPhase2) clearTimeout(adaptiveWeightTimerPhase2);

  const handleQrSuccess = (cleanScannedText) => {
    if (decodeHandled) return;
    if (currentSession !== scannerSessionId) return;
    decodeHandled = true;

    if (adaptiveWeightTimer) clearTimeout(adaptiveWeightTimer);
    if (adaptiveWeightTimerPhase2) clearTimeout(adaptiveWeightTimerPhase2);

    stopScanner();
    if (navigator.vibrate) {
      try { navigator.vibrate(100); } catch (e) {}
    }
    const callback = onDecodeCallback || window.processLicenseUrl;
    if (typeof callback === 'function') {
      callback(cleanScannedText);
    }
  };

  if (window.QrScanner) {
    qrScanner = new window.QrScanner(
      videoElem,
      (result) => {
        const decodedText = (typeof result === 'object' ? (result.data || result.text) : result) || "";
        const cleanScannedText = decodedText ? decodedText.trim() : "";
        if (cleanScannedText) {
          handleQrSuccess(cleanScannedText);
        }
      },
      {
        onDecodeError: () => {},
        highlightScanRegion: false,
        highlightCodeOutline: true,
        maxScansPerSecond: 22,
        alsoTryWithoutScanRegion: true,
        calculateScanRegion: (v) => {
          const w = v.videoWidth || 1280;
          const h = v.videoHeight || 720;
          const minDim = Math.min(w, h);
          const factor = 0.52;
          const size = Math.round(minDim * factor);
          return {
            x: Math.round((w - size) / 2),
            y: Math.round((h - size) / 2),
            width: size,
            height: size,
            downScaledWidth: 560,
            downScaledHeight: 560
          };
        },
        preferredCamera: currentCameraDeviceId || 'environment'
      }
    );

    // ADAPTIVE GRAYSCALE WEIGHTS PIPELINE FOR DIM / WARM / OFFSET LIGHTING:
    // Phase 1 (0.0s - 0.8s): Warm-Lighting Balanced Weights (Red 35%, Green 55%, Blue 10%)
    if (qrScanner && typeof qrScanner.setGrayscaleWeights === 'function') {
      qrScanner.setGrayscaleWeights(0.35, 0.55, 0.10, true);
    }

    if (adaptiveWeightTimer) clearTimeout(adaptiveWeightTimer);
    if (adaptiveWeightTimerPhase2) clearTimeout(adaptiveWeightTimerPhase2);

    // Phase 2 (0.8s Timeout): Equalized Edge-Enhancement Weights (Red 15%, Green 75%, Blue 10%)
    adaptiveWeightTimer = setTimeout(() => {
      if (qrScanner && typeof qrScanner.setGrayscaleWeights === 'function' && currentSession === scannerSessionId) {
        console.log('[Scanner] Phase 2: Switching to Equalized Edge-Enhancement weights (Red=0.15, Green=0.75, Blue=0.10)');
        qrScanner.setGrayscaleWeights(0.15, 0.75, 0.10, true);
      }
    }, 800);

    // Phase 3 (1.8s Timeout): Ghost-Cancellation Weights (Red 0%, Green 85%, Blue 15%)
    adaptiveWeightTimerPhase2 = setTimeout(() => {
      if (qrScanner && typeof qrScanner.setGrayscaleWeights === 'function' && currentSession === scannerSessionId) {
        console.log('[Scanner] Phase 3: Switching to Ghost-Cancellation weights (Red=0.0, Green=0.85, Blue=0.15)');
        qrScanner.setGrayscaleWeights(0.0, 0.85, 0.15, true);
      }
    }, 1800);

    qrScanner.start().then(() => {
      if (currentSession !== scannerSessionId) {
        if (qrScanner) {
          try { qrScanner.destroy(); } catch (e) {}
          qrScanner = null;
        }
        return;
      }

      try {
        const stream = videoElem.srcObject;
        if (stream) {
          activeMediaStream = stream;
          const track = stream.getVideoTracks()[0];
          const isIPad = /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
          currentZoomLevel = isIPad ? 1.8 : 1.0;

          const guidancePill = document.getElementById(customVideoElemId === "profile-qr-video" ? "profile-qr-guidance-pill" : "qr-guidance-pill");
          if (videoElem) {
            videoElem.style.transform = "none";
          }
          if (guidancePill) {
            guidancePill.innerHTML = '<span>Place QR code within scan area</span><span class="text-[9px] text-slate-300 font-medium normal-case tracking-normal">Avoid glare & shadows</span>';
          }

          if (track && typeof track.getCapabilities === 'function' && typeof track.applyConstraints === 'function') {
            const caps = track.getCapabilities();
            const advancedConstraints = [];
            if (caps.focusMode && caps.focusMode.includes('macro')) {
              advancedConstraints.push({ focusMode: 'macro' });
            } else if (caps.focusMode && caps.focusMode.includes('continuous')) {
              advancedConstraints.push({ focusMode: 'continuous' });
            }
            if (caps.exposureMode && caps.exposureMode.includes('continuous')) {
              advancedConstraints.push({ exposureMode: 'continuous' });
            }
            if (caps.whiteBalanceMode && caps.whiteBalanceMode.includes('continuous')) {
              advancedConstraints.push({ whiteBalanceMode: 'continuous' });
            }
            if (caps.zoom) {
              const targetZoom = Math.min(caps.zoom.max, Math.max(caps.zoom.min, currentZoomLevel));
              advancedConstraints.push({ zoom: targetZoom });
            }

            if (advancedConstraints.length > 0) {
              track.applyConstraints({ advanced: advancedConstraints }).catch(() => {});
            }

            if (typeof track.getSettings === 'function') {
              const settings = track.getSettings();
              console.log("[Scanner] Active Track Settings:", settings.width, "x", settings.height, "Focus:", settings.focusMode);
            }
          }

          const torchBtn = document.getElementById("torch-toggle-btn");
          if (torchBtn) {
            const caps = (track && typeof track.getCapabilities === 'function') ? track.getCapabilities() : null;
            if (caps && caps.torch) {
              torchBtn.classList.remove("hidden");
              torchBtn.classList.add("flex");
            } else {
              torchBtn.classList.add("hidden");
              torchBtn.classList.remove("flex");
            }
          }
        }
      } catch (e) {}

      window.QrScanner.listCameras(true).then((cameras) => {
        if (currentSession !== scannerSessionId) return;
        availableCameraDevices = filterRearCameras(cameras || []);
        updateCameraCycleButtonLabel();
      }).catch(() => {});
    }).catch((err) => {
      if (currentSession !== scannerSessionId) return;
      console.error("Camera start failed:", err);
      if (onErrorCallback) onErrorCallback("Unable to access camera. Please verify permissions.");
    });
  }
}

export function stopScanner() {
  scannerSessionId++;

  const videoElem = document.getElementById("qr-video");
  if (videoElem) {
    videoElem.style.transform = "none";
  }

  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  if (adaptiveWeightTimer) {
    clearTimeout(adaptiveWeightTimer);
    adaptiveWeightTimer = null;
  }
  if (adaptiveWeightTimerPhase2) {
    clearTimeout(adaptiveWeightTimerPhase2);
    adaptiveWeightTimerPhase2 = null;
  }

  if (qrScanner) {
    try {
      qrScanner.stop();
      qrScanner.destroy();
    } catch (e) {}
    qrScanner = null;
  }

  if (activeMediaStream) {
    try {
      activeMediaStream.getTracks().forEach(track => track.stop());
    } catch (e) {}
    activeMediaStream = null;
  }

  torchActive = false;
  const torchBtn = document.getElementById("torch-toggle-btn");
  if (torchBtn) {
    torchBtn.classList.add("hidden");
    torchBtn.classList.remove("flex");
  }

  releaseWakeLock();
}

export function switchScanHubTab(tabName) {
  const tabCamera = document.getElementById('camera-scan-tab');
  const tabQrPass = document.getElementById('my-qr-pass-tab');
  const tabManual = document.getElementById('manual-entry-tab');

  const btnCamera = document.getElementById('tab-camera-btn');
  const btnQrPass = document.getElementById('tab-qrpass-btn');
  const btnManual = document.getElementById('tab-manual-btn');

  const activeBtnClass = 'py-2.5 px-1 rounded-xl text-xs font-bold transition-colors bg-blue-600 text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer';
  const inactiveBtnClass = 'py-2.5 px-1 rounded-xl text-xs font-bold transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer';

  if (tabCamera) tabCamera.classList.add('hidden');
  if (tabQrPass) tabQrPass.classList.add('hidden');
  if (tabManual) tabManual.classList.add('hidden');

  if (btnCamera) btnCamera.className = inactiveBtnClass;
  if (btnQrPass) btnQrPass.className = inactiveBtnClass;
  if (btnManual) btnManual.className = inactiveBtnClass;

  let activeBtn = btnCamera;

  if (tabName === 'camera' || tabName === 'manual') {
    if (!navigator.onLine) {
      if (typeof window.showToast === 'function') {
        const msg = tabName === 'camera'
          ? 'Camera scanning requires an active internet connection.'
          : 'Manual URL entry requires an active internet connection.';
        window.showToast(msg, 'warning');
      }
      stopScanner();
      switchScanHubTab('qrpass');
      return;
    }
  }

  if (tabName === 'camera') {
    if (!navigator.onLine) {
      if (typeof window.showToast === 'function') {
        window.showToast('Camera scanning requires an active internet connection.', 'warning');
      }
      stopScanner();
      switchScanHubTab('qrpass');
      return;
    }

    activeBtn = btnCamera;
    if (tabCamera) {
      const wasHidden = tabCamera.classList.contains('hidden');
      tabCamera.classList.remove('hidden');
      if (wasHidden && typeof animateTabContentEntrance === 'function') animateTabContentEntrance(tabCamera);
    }
    if (btnCamera) btnCamera.className = activeBtnClass;

    startScanner(
      (scannedUrl) => {
        if (typeof window.processLicenseUrl === 'function') {
          window.processLicenseUrl(scannedUrl);
        }
      },
      (err) => {
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) errorMsg.innerText = err;
      }
    );

  } else if (tabName === 'qrpass') {
    activeBtn = btnQrPass;
    if (tabQrPass) {
      const wasHidden = tabQrPass.classList.contains('hidden');
      tabQrPass.classList.remove('hidden');
      if (wasHidden && typeof animateTabContentEntrance === 'function') animateTabContentEntrance(tabQrPass);
    }
    if (btnQrPass) btnQrPass.className = activeBtnClass;

    stopScanner();
    if (typeof window.renderMyQrPass === 'function') {
      window.renderMyQrPass();
    } else {
      renderMyQrPass();
    }

  } else if (tabName === 'manual') {
    activeBtn = btnManual;
    if (tabManual) {
      const wasHidden = tabManual.classList.contains('hidden');
      tabManual.classList.remove('hidden');
      if (wasHidden && typeof animateTabContentEntrance === 'function') animateTabContentEntrance(tabManual);
    }
    if (btnManual) btnManual.className = activeBtnClass;

    stopScanner();
    renderRecentPilotsList();
  }

  if (activeBtn && typeof animateTabBounce === 'function') {
    animateTabBounce(activeBtn);
  }
}

// ============================================================================
// 3. TAB 2: MY QR PASS GENERATOR & DISPLAY CONTROLLER
// ============================================================================

export function renderMyQrPass() {
  if (typeof window.renderMyQrPass === 'function' && window.renderMyQrPass !== renderMyQrPass) {
    window.renderMyQrPass();
  }
}

// ============================================================================
// 4. TAB 3: MANUAL URL ENTRY & RECENT PILOTS CONTROLLER
// ============================================================================

export function renderRecentPilotsList() {
  const container = document.getElementById('recent-pilots-list');
  const countTag = document.getElementById('recent-count-tag');
  if (!container) return;

  const history = getScanHistory();
  if (countTag) countTag.innerText = history.length;
}

// ============================================================================
// 5. HARDWARE TOOLBAR CONTROLLERS (LENS SWITCHER & FLASHLIGHT)
// ============================================================================


export async function handleClipboardPaste() {
  const input = document.getElementById('manual-url-input');
  if (!input) return;
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      if (text) {
        input.value = text.trim();
      }
    }
  } catch (err) {
    console.warn('Clipboard permission denied:', err);
  }
}

export async function cycleCameraLens() {
  if (!navigator.onLine) {
    if (typeof window.showToast === 'function') {
      window.showToast('Camera functions require an active internet connection.', 'warning');
    }
    return;
  }

  const cycleBtn = document.getElementById('camera-cycle-btn');
  const cycleLabel = document.getElementById('camera-cycle-label');
  const targetEl = cycleLabel || cycleBtn;

  if (targetEl) targetEl.innerText = 'Switching...';

  if (!availableCameraDevices || availableCameraDevices.length === 0) {
    try {
      if (window.QrScanner) {
        const cameras = await window.QrScanner.listCameras(true);
        availableCameraDevices = filterRearCameras(cameras || []);
      }
    } catch (e) {}
  }

  if (availableCameraDevices && availableCameraDevices.length > 1) {
    const currentIndex = availableCameraDevices.findIndex(c => c.id === currentCameraDeviceId);
    const nextIndex = (currentIndex + 1) % availableCameraDevices.length;
    const nextCamera = availableCameraDevices[nextIndex];
    currentCameraDeviceId = nextCamera.id;

    try {
      if (qrScanner) {
        await qrScanner.setCamera(currentCameraDeviceId);
      } else {
        startScanner(
          (url) => { if (typeof window.processLicenseUrl === 'function') window.processLicenseUrl(url); },
          null
        );
      }
      updateCameraCycleButtonLabel();
      return;
    } catch (err) {
      console.warn('Lens switch failed, attempting zoom/macro mode fallback:', err);
    }
  }

  const isIPad = /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIPad) {
    currentZoomLevel = 1.8;
    return;
  }

  if (currentZoomLevel === 1.0) {
    currentZoomLevel = 1.8;
  } else if (currentZoomLevel === 1.8) {
    currentZoomLevel = 2.5;
  } else {
    currentZoomLevel = 1.0;
  }

  try {
    const videoElem = document.getElementById('qr-video');
    if (videoElem && videoElem.srcObject) {
      const track = videoElem.srcObject.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        const advanced = [];

        if (capabilities.focusMode && capabilities.focusMode.includes('macro')) {
          advanced.push({ focusMode: 'macro' });
        }
        if (capabilities.zoom) {
          const targetZoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, currentZoomLevel));
          advanced.push({ zoom: targetZoom });
        }

        if (advanced.length > 0) {
          await track.applyConstraints({ advanced });
        }
      }
    }
  } catch (e) {}

  updateCameraCycleButtonLabel();
}

export function toggleTorch() {
  if (!navigator.onLine) {
    if (typeof window.showToast === 'function') {
      window.showToast('Flashlight function requires an active internet connection.', 'warning');
    }
    return;
  }

  if (!qrScanner) return;

  torchActive = !torchActive;
  if (torchActive) {
    qrScanner.turnFlashOn().catch(() => { torchActive = false; });
  } else {
    qrScanner.turnFlashOff().catch(() => {});
  }
}

// ============================================================================
// 6. AUTO-TEARDOWN & POWER MANAGEMENT (60s IDLE TIMEOUT & WAKE LOCK)
// ============================================================================

function resetIdleTimer(onDecodeCallback, onErrorCallback) {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    stopScanner();
    const pausedOverlay = document.getElementById('scanner-paused-overlay');
    if (pausedOverlay) pausedOverlay.classList.remove('hidden');
  }, IDLE_TIMEOUT_MS);
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (e) {}
}

function releaseWakeLock() {
  try {
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }
  } catch (e) {}
}



// MULTI-PASS FALLBACK CANVAS PHOTO SCANNER

// ============================================================================
// HEIC / HEIF IN-MEMORY AUTO-CONVERSION HELPER
// ============================================================================

export async function ensureDecodableImageFile(file) {
  if (!file) return file;
  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();
  const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || fileType === 'image/heic' || fileType === 'image/heif';

  if (!isHeic) return file;

  // Step 1: Test if current browser engine can natively load this HEIC file
  const canNativeLoad = await new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    let resolved = false;
    img.onload = () => {
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(url);
        resolve(true);
      }
    };
    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(url);
        resolve(false);
      }
    };
    img.src = url;
  });

  if (canNativeLoad) return file;

  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // Step 2: In-memory conversion using heic2any
  try {
    let converter = (typeof window !== 'undefined' && typeof window.heic2any === 'function') ? window.heic2any : null;

    if (!converter && typeof document !== 'undefined') {
      try {
        await loadScript('./js/vendor/heic2any.min.js');
      } catch (localErr) {
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js');
        } catch (cdnErr) {
          console.warn('[Scanner] Unable to load heic2any from local vendor or CDN.');
        }
      }
      if (typeof window !== 'undefined' && typeof window.heic2any === 'function') {
        converter = window.heic2any;
      }
    }

    if (typeof converter === 'function') {
      const convertedResult = await converter({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92
      });
      const blob = Array.isArray(convertedResult) ? convertedResult[0] : convertedResult;
      const targetName = file.name ? file.name.replace(/\.hei[cf]$/i, '.jpg') : 'converted_photo.jpg';
      return new File([blob], targetName, { type: 'image/jpeg' });
    }
  } catch (conversionErr) {
    console.warn('[Scanner] HEIC auto-conversion failed:', conversionErr);
  }

  return file;
}

export async function scanPhotoWithFallback(inputFile) {
  if (!inputFile || !window.QrScanner) return '';

  const file = await ensureDecodableImageFile(inputFile);
  if (!file || !window.QrScanner) return '';

  const extractText = (res) => {
    const t = (typeof res === 'object' ? (res.data || res.text) : res) || '';
    return t ? t.trim() : '';
  };

  const scanRunner = window.QrScanner._originalScanImage || window.QrScanner.scanImage;

  // PASS 1: Standard raw file scan
  try {
    const res1 = await scanRunner.call(window.QrScanner, file, {
      returnDetailedScanResult: true,
      alsoTryWithoutScanRegion: true
    });
    const text1 = extractText(res1);
    if (text1) {
      console.log('[Scanner] Photo scan succeeded on Pass 1 (Standard)');
      return text1;
    }
  } catch (err1) {}

  let img = null;
  try {
    img = await window.QrScanner._loadImage(file);
  } catch (imgErr) {
    console.warn('[Scanner] Unable to load image file:', imgErr);
    return '';
  }

  const origW = img.naturalWidth || img.width || 640;
  const origH = img.naturalHeight || img.height || 640;
  const maxDim = Math.max(origW, origH);

  let targetW = origW;
  let targetH = origH;
  if (maxDim > 1280) {
    const scale = 1280 / maxDim;
    targetW = Math.round(origW * scale);
    targetH = Math.round(origH * scale);
  } else if (maxDim < 300 && maxDim > 0) {
    const scale = 600 / maxDim;
    targetW = Math.round(origW * scale);
    targetH = Math.round(origH * scale);
  }

  const pad = Math.round(Math.max(targetW, targetH) * 0.15);
  const paddedW = targetW + pad * 2;
  const paddedH = targetH + pad * 2;

  const createBasePaddedCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = paddedW;
    canvas.height = paddedH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, paddedW, paddedH);
    ctx.drawImage(img, pad, pad, targetW, targetH);
    return { canvas, ctx };
  };

  // PASS 2: Quiet Zone Padding & Multi-Scale Scaling Pass
  try {
    const { canvas: canvas2 } = createBasePaddedCanvas();
    const res2 = await scanRunner.call(window.QrScanner, canvas2, {
      returnDetailedScanResult: true,
      alsoTryWithoutScanRegion: true
    });
    const text2 = extractText(res2);
    if (text2) {
      console.log('[Scanner] Photo scan succeeded on Pass 2 (Quiet Zone Padding)');
      return text2;
    }
  } catch (err2) {}

  // PASS 3: Individual RGB Channel Isolation Pass (Blue, Red, Green)
  // - Blue channel isolates cyan offset printing ghosting (FullSizeRender.HEIC)
  // - Red channel isolates laminated plastic glare & blue card backgrounds (IMG_3340.heic)
  // - Green channel isolates cyan/magenta printing artifacts
  const channels = [
    { name: 'Blue Channel (Offset Printing Fix)', colIdx: 2 },
    { name: 'Red Channel (Plastic Glare & Blue Card Contrast)', colIdx: 0 },
    { name: 'Green Channel (Monochrome Balance)', colIdx: 1 }
  ];

  for (const ch of channels) {
    try {
      const { canvas: chCanvas, ctx: chCtx } = createBasePaddedCanvas();
      const imgData = chCtx.getImageData(0, 0, paddedW, paddedH);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const val = data[i + ch.colIdx];
        data[i]     = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      chCtx.putImageData(imgData, 0, 0);

      const chRes = await scanRunner.call(window.QrScanner, chCanvas, {
        returnDetailedScanResult: true,
        alsoTryWithoutScanRegion: true
      });
      const chText = extractText(chRes);
      if (chText) {
        console.log('[Scanner] Photo scan succeeded on Pass 7 (Rotation ' + angle + ' deg)');
        return chText;
      }
    } catch (chErr) {}
  }

  // PASS 4: Camera Viewfinder Overlay & Yellow Bracket Suppression (IMG_4233.PNG)
  try {
    const { canvas: canvas4, ctx: ctx4 } = createBasePaddedCanvas();
    const imgData4 = ctx4.getImageData(0, 0, paddedW, paddedH);
    const data4 = imgData4.data;

    for (let i = 0; i < data4.length; i += 4) {
      const r = data4[i];
      const g = data4[i + 1];
      const b = data4[i + 2];

      // Detect yellow camera bracket overlay (High R, High G, Low B)
      if (r > 160 && g > 140 && b < 120) {
        data4[i]     = 255;
        data4[i + 1] = 255;
        data4[i + 2] = 255;
      }
    }

    ctx4.putImageData(imgData4, 0, 0);

    const res4 = await scanRunner.call(window.QrScanner, canvas4, {
      returnDetailedScanResult: true,
      alsoTryWithoutScanRegion: true
    });
    const text4 = extractText(res4);
    if (text4) {
      console.log('[Scanner] Photo scan succeeded on Pass 4 (Yellow Camera Overlay Suppression)');
      return text4;
    }
  } catch (err4) {}

  // PASS 5: Adaptive Local Thresholding Pass (QR_Code_Sign_doubled.jpg & IMG_4234.HEIC)
  try {
    const { canvas: canvas5, ctx: ctx5 } = createBasePaddedCanvas();
    const imgData5 = ctx5.getImageData(0, 0, paddedW, paddedH);
    const data5 = imgData5.data;
    const width = paddedW;
    const height = paddedH;

    const grayArr = new Uint8Array(width * height);
    for (let i = 0; i < grayArr.length; i++) {
      const p = i * 4;
      grayArr[i] = Math.round(0.299 * data5[p] + 0.587 * data5[p + 1] + 0.114 * data5[p + 2]);
    }

    const blockSize = 32;
    for (let by = 0; by < height; by += blockSize) {
      for (let bx = 0; bx < width; bx += blockSize) {
        let sum = 0, count = 0;
        const maxY = Math.min(by + blockSize, height);
        const maxX = Math.min(bx + blockSize, width);

        for (let y = by; y < maxY; y++) {
          for (let x = bx; x < maxX; x++) {
            sum += grayArr[y * width + x];
            count++;
          }
        }

        const avg = count > 0 ? sum / count : 128;
        for (let y = by; y < maxY; y++) {
          for (let x = bx; x < maxX; x++) {
            const idx = y * width + x;
            const pIdx = idx * 4;
            const val = grayArr[idx] > (avg - 6) ? 255 : 0;
            data5[pIdx]     = val;
            data5[pIdx + 1] = val;
            data5[pIdx + 2] = val;
          }
        }
      }
    }

    ctx5.putImageData(imgData5, 0, 0);

    const res5 = await scanRunner.call(window.QrScanner, canvas5, {
      returnDetailedScanResult: true,
      alsoTryWithoutScanRegion: true
    });
    const text5 = extractText(res5);
    if (text5) {
      console.log('[Scanner] Photo scan succeeded on Pass 5 (Adaptive Local Thresholding)');
      return text5;
    }
  } catch (err5) {}

  // PASS 6: Native High-DPI Sub-Region Auto-Crop Pass (IMG_4234.HEIC)
  try {
    const cropCanvas = document.createElement('canvas');
    const cropW = Math.round(origW * 0.45);
    const cropH = Math.round(origH * 0.45);
    const cropX = Math.round((origW - cropW) / 2);
    const cropY = Math.round((origH - cropH) / 2);

    cropCanvas.width = cropW + pad * 2;
    cropCanvas.height = cropH + pad * 2;
    const cropCtx = cropCanvas.getContext('2d');

    cropCtx.fillStyle = '#FFFFFF';
    cropCtx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
    cropCtx.drawImage(img, cropX, cropY, cropW, cropH, pad, pad, cropW, cropH);

    const res6 = await scanRunner.call(window.QrScanner, cropCanvas, {
      returnDetailedScanResult: true,
      alsoTryWithoutScanRegion: true
    });
    const text6 = extractText(res6);
    if (text6) {
      console.log('[Scanner] Photo scan succeeded on Pass 6 (Native High-DPI Sub-Region Auto-Crop)');
      return text6;
    }
  } catch (err6) {}

  // PASS 7: Multi-Angle Canvas Rotation Pass (90 deg, 180 deg, 270 deg)
  const angles = [90, 180, 270];
  for (const angle of angles) {
    try {
      const rotCanvas = document.createElement('canvas');
      const is90or270 = angle === 90 || angle === 270;
      const rotTargetW = is90or270 ? targetH : targetW;
      const rotTargetH = is90or270 ? targetW : targetH;
      const rotPaddedW = rotTargetW + pad * 2;
      const rotPaddedH = rotTargetH + pad * 2;

      rotCanvas.width = rotPaddedW;
      rotCanvas.height = rotPaddedH;
      const rotCtx = rotCanvas.getContext('2d');

      rotCtx.fillStyle = '#FFFFFF';
      rotCtx.fillRect(0, 0, rotPaddedW, rotPaddedH);

      rotCtx.translate(rotPaddedW / 2, rotPaddedH / 2);
      rotCtx.rotate((angle * Math.PI) / 180);
      rotCtx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);

      const resRot = await scanRunner.call(window.QrScanner, rotCanvas, {
        returnDetailedScanResult: true,
        alsoTryWithoutScanRegion: true
      });
      const textRot = extractText(resRot);
      if (textRot) {
        console.log('[Scanner] Photo scan succeeded on Pass 7 (Rotation ' + angle + ' deg)');
        return textRot;
      }
    } catch (errRot) {}
  }

  return '';
}

if (typeof window !== 'undefined') {
  window.startScanner = startScanner;
  window.stopScanner = stopScanner;
  window.switchScanHubTab = switchScanHubTab;
  window.cycleCameraLens = cycleCameraLens;
  window.toggleTorch = toggleTorch;
  window.updateCameraControlUI = updateCameraControlUI;
  window.scanPhotoWithFallback = scanPhotoWithFallback;
  window.ensureDecodableImageFile = ensureDecodableImageFile;
  window.handleClipboardPaste = handleClipboardPaste;
}
