// js/scanner.js (2909_R063) - 3-Tab Pilot Scan Hub Hardware & UI Controller

import { getProfileData, getScanHistory } from './storage.js';

let qrScanner = null;
let currentCameraDeviceId = null;
let availableCameraDevices = [];
let activeMediaStream = null;
let torchActive = false;
let idleTimer = null;
let wakeLock = null;
let currentZoomLevel = 1.8;

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
function formatCameraLabel(camObj, index, total) {
  if (!camObj && total <= 1) {
    if (currentZoomLevel === 1.0) return 'Back 1.0x';
    if (currentZoomLevel === 1.8) return 'Macro / Close-Up (1.8x)';
    return `Back ${currentZoomLevel.toFixed(1)}x`;
  }
  const label = camObj ? (camObj.label || '').toLowerCase() : '';
  if (label.includes('ultra') || label.includes('0.5x') || label.includes('wide-angle') || label.includes('macro')) {
    return 'Macro Mode (0.5x)';
  }
  if (label.includes('telephoto') || label.includes('zoom') || label.includes('2x') || label.includes('3x')) {
    return 'Telephoto 2.0x';
  }
  if (label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('wide')) {
    return index === 0 ? 'Back 1.0x' : `Back Lens ${index + 1}`;
  }
  if (total > 1) {
    return `Back Lens ${index + 1}`;
  }
  return `Back ${currentZoomLevel.toFixed(1)}x`;
}

export function updateCameraCycleButtonLabel() {
  const cycleLabel = document.getElementById("camera-cycle-label");
  const cycleBtn = document.getElementById("camera-cycle-btn");
  const targetEl = cycleLabel || cycleBtn;
  if (!targetEl) return;

  if (!availableCameraDevices || availableCameraDevices.length <= 1) {
    targetEl.innerText = formatCameraLabel(null, 0, 1);
    return;
  }

  const index = availableCameraDevices.findIndex(c => c.id === currentCameraDeviceId);
  const current = availableCameraDevices[index >= 0 ? index : 0];
  targetEl.innerText = formatCameraLabel(current, index >= 0 ? index : 0, availableCameraDevices.length);
}

// ============================================================================
// 1. TAB 1: LIVE CAMERA SCANNER & HARDWARE STREAM CONTROLLER
// ============================================================================

export function startScanner(onDecodeCallback, onErrorCallback, customVideoElemId = "qr-video") {
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

  // Reset idle timer
  resetIdleTimer(onDecodeCallback, onErrorCallback);

  // Destroy existing active scanner instance
  if (qrScanner) {
    try {
      qrScanner.destroy();
    } catch (e) {}
    qrScanner = null;
  }

  if (window.QrScanner) {
    qrScanner = new window.QrScanner(
      videoElem,
      (result) => {
        const decodedText = (typeof result === 'object' ? (result.data || result.text) : result) || "";
        const cleanScannedText = decodedText ? decodedText.trim() : "";
        if (cleanScannedText) {
          stopScanner();
          if (navigator.vibrate) {
            try { navigator.vibrate(100); } catch (e) {}
          }
          const callback = onDecodeCallback || window.processLicenseUrl;
          if (typeof callback === 'function') {
            callback(cleanScannedText);
          }
        }
      },
      {
        onDecodeError: () => {},
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 25,
        calculateScanRegion: (v) => {
          const minDim = Math.min(v.videoWidth, v.videoHeight);
          const factor = 0.85;
          const size = Math.round(minDim * factor);
          return {
            x: Math.round((v.videoWidth - size) / 2),
            y: Math.round((v.videoHeight - size) / 2),
            width: size,
            height: size
          };
        },
        preferredCamera: currentCameraDeviceId || 'environment'
      }
    );

    qrScanner.start().then(() => {
      // Option 3: Enforce 1080p Full HD resolution & Macro Focus constraints
      try {
        const stream = videoElem.srcObject;
        if (stream) {
          activeMediaStream = stream;
          const track = stream.getVideoTracks()[0];
          if (track && track.applyConstraints) {
            const advancedConstraints = [];
            let caps = null;
            if (track.getCapabilities) {
              caps = track.getCapabilities();
              if (caps.focusMode && caps.focusMode.includes('macro')) {
                advancedConstraints.push({ focusMode: 'macro' });
              } else if (caps.focusMode && caps.focusMode.includes('continuous')) {
                advancedConstraints.push({ focusMode: 'continuous' });
              }
              if (caps.zoom) {
                const targetZoom = Math.min(caps.zoom.max, Math.max(caps.zoom.min, currentZoomLevel));
                advancedConstraints.push({ zoom: targetZoom });
              }
            }
            track.applyConstraints({
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              advanced: advancedConstraints.length > 0 ? advancedConstraints : undefined
            }).catch(() => {});

            // Check torch availability
            const torchBtn = document.getElementById("torch-toggle-btn");
            if (torchBtn) {
              if (caps && caps.torch) {
                torchBtn.classList.remove("hidden");
                torchBtn.classList.add("flex");
              } else {
                torchBtn.classList.add("hidden");
                torchBtn.classList.remove("flex");
              }
            }
          }
        }
      } catch (e) {}

      // Enumerate and filter rear cameras for lens switcher
      window.QrScanner.listCameras(true).then((cameras) => {
        availableCameraDevices = filterRearCameras(cameras || []);
        updateCameraCycleButtonLabel();
      }).catch(() => {});
    }).catch((err) => {
      console.error("Camera start failed:", err);
      if (onErrorCallback) onErrorCallback("Unable to access camera. Please verify permissions.");
    });
  }
}

export function stopScanner() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
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

  const activeBtnClass = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-xs';
  const inactiveBtnClass = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100';

  if (tabCamera) tabCamera.classList.add('hidden');
  if (tabQrPass) tabQrPass.classList.add('hidden');
  if (tabManual) tabManual.classList.add('hidden');

  if (btnCamera) btnCamera.className = inactiveBtnClass;
  if (btnQrPass) btnQrPass.className = inactiveBtnClass;
  if (btnManual) btnManual.className = inactiveBtnClass;

  if (tabName === 'camera') {
    if (tabCamera) tabCamera.classList.remove('hidden');
    if (btnCamera) btnCamera.className = activeBtnClass;
    startScanner(
      (scannedUrl) => {
        if (typeof window.processLicenseUrl === 'function') {
          window.processLicenseUrl(scannedUrl);
        }
      },
      (err) => {
        const errorMsg = document.getElementById("error-message");
        if (errorMsg) errorMsg.innerText = err;
      }
    );
  } else if (tabName === 'qrpass') {
    if (tabQrPass) tabQrPass.classList.remove('hidden');
    if (btnQrPass) btnQrPass.className = activeBtnClass;
    stopScanner();
    renderMyQrPass();
  } else if (tabName === 'manual') {
    if (tabManual) tabManual.classList.remove('hidden');
    if (btnManual) btnManual.className = activeBtnClass;
    stopScanner();
    renderRecentPilotsList();
  }
}

// ============================================================================
// 2. TAB 2: MY QR PASS GENERATOR & DISPLAY CONTROLLER
// ============================================================================

export function renderMyQrPass() {
  const profile = getProfileData();
  const canvas = document.getElementById("pass-qr-canvas");
  const pilotNameEl = document.getElementById("pass-pilot-name");
  const licenceNoEl = document.getElementById("pass-licence-no");
  const badgeEl = document.getElementById("pass-eligibility-badge");
  const freshnessTag = document.getElementById("pass-freshness-tag");

  if (pilotNameEl) pilotNameEl.innerText = profile.name || "-";
  if (licenceNoEl) {
    const lType = profile.licenceType || "-";
    const lNo = profile.licenceNo || "-";
    licenceNoEl.innerText = `${lType} • ${lNo}`;
  }

  const isEligible = profile.dutyStatus ? profile.dutyStatus === 'ELIGIBLE' : true;
  if (badgeEl) {
    if (isEligible) {
      badgeEl.innerText = "ELIGIBLE FOR FLIGHT DUTY";
      badgeEl.className = "mt-3 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    } else {
      badgeEl.innerText = "LAPSED / INELIGIBLE";
      badgeEl.className = "mt-3 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
    }
  }

  if (freshnessTag) {
    freshnessTag.innerText = profile.lastVerified ? `Verified ${profile.lastVerified}` : "Cached Offline";
  }

  if (canvas && window.QrScanner) {
    const qrContent = profile.url || "https://eclipse.caam.gov.my";
    try {
      window.QrScanner.hasCamera();
    } catch (e) {}
  }

  requestWakeLock();
}

// ============================================================================
// 3. TAB 3: MANUAL URL ENTRY & RECENT PILOTS CONTROLLER
// ============================================================================

export function renderRecentPilotsList() {
  const container = document.getElementById("recent-pilots-list");
  const countTag = document.getElementById("recent-count-tag");
  if (!container) return;

  const history = getScanHistory();
  if (countTag) countTag.innerText = history.length;

  if (history.length === 0) {
    container.innerHTML = '<div class="py-4 text-center text-xs text-slate-400 font-medium">No recently verified pilots</div>';
    return;
  }

  container.innerHTML = "";
  history.slice(0, 5).forEach(item => {
    const name = item.pilotName || "Verified Crew";
    const licence = item.licenceNo || "ATPL(A)";
    const time = item.timestamp || "Recent";

    const div = document.createElement("div");
    div.className = "py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors";
    div.innerHTML = `
      <div class="flex flex-col">
        <span class="text-xs font-bold text-slate-800 dark:text-slate-200">${name}</span>
        <span class="text-[10px] text-slate-400 font-medium">${licence} • ${time}</span>
      </div>
      <span class="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase">View</span>
    `;
    div.onclick = () => {
      if (window.loadHistoricalRecord) window.loadHistoricalRecord(item.id);
    };
    container.appendChild(div);
  });
}

export async function handleClipboardPaste() {
  const input = document.getElementById("manual-url-input");
  if (!input) return;

  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      if (text) {
        input.value = text.trim();
      }
    }
  } catch (err) {
    console.warn("Clipboard permission denied:", err);
  }
}

// ============================================================================
// 4. HARDWARE TOOLBAR CONTROLLERS (LENS SWITCHER & FLASHLIGHT)
// ============================================================================

export async function cycleCameraLens() {
  const cycleBtn = document.getElementById("camera-cycle-btn");
  const cycleLabel = document.getElementById("camera-cycle-label");
  const targetEl = cycleLabel || cycleBtn;

  if (targetEl) targetEl.innerText = "Switching...";

  if (!availableCameraDevices || availableCameraDevices.length === 0) {
    try {
      if (window.QrScanner) {
        const cameras = await window.QrScanner.listCameras(true);
        availableCameraDevices = filterRearCameras(cameras || []);
      }
    } catch (e) {}
  }

  // MODE A: Multiple Rear Cameras Detected (Wide, Ultra Wide / Macro, Telephoto)
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
      console.warn("Lens switch failed, attempting zoom/macro mode fallback:", err);
    }
  }

  // MODE B: Single Rear Camera Stream -> Cycle Macro/Zoom modes (1.0x -> 1.8x Close-Up -> 2.5x Telephoto)
  if (currentZoomLevel === 1.0) {
    currentZoomLevel = 1.8; // Macro / Close-Up
  } else if (currentZoomLevel === 1.8) {
    currentZoomLevel = 2.5; // Telephoto
  } else {
    currentZoomLevel = 1.0; // Standard Back Wide
  }

  try {
    const videoElem = document.getElementById("qr-video");
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
  if (!qrScanner) return;
  torchActive = !torchActive;
  if (torchActive) {
    qrScanner.turnFlashOn().catch(() => { torchActive = false; });
  } else {
    qrScanner.turnFlashOff().catch(() => {});
  }
}

// ============================================================================
// 5. AUTO-TEARDOWN & POWER MANAGEMENT (60s IDLE TIMEOUT & WAKE LOCK)
// ============================================================================

function resetIdleTimer(onDecodeCallback, onErrorCallback) {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    stopScanner();
    const pausedOverlay = document.getElementById("scanner-paused-overlay");
    if (pausedOverlay) pausedOverlay.classList.remove("hidden");
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
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}
