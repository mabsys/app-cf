// js/scanner.js (2809_R062) - 3-Tab Pilot Scan Hub Hardware & UI Controller

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

// Format camera device or zoom level labels for clear user feedback
function formatCameraLabel(camObj, index, total) {
  if (!camObj && total <= 1) {
    return `Back ${currentZoomLevel.toFixed(1)}x`;
  }
  const label = camObj ? (camObj.label || '').toLowerCase() : '';
  if (label.includes('ultra') || label.includes('0.5x') || label.includes('wide-angle')) {
    return 'Ultra Wide 0.5x';
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
  const cycleBtn = document.getElementById("camera-cycle-btn");
  const cycleLabel = document.getElementById("camera-cycle-label");
  const targetEl = cycleLabel || cycleBtn;
  if (!targetEl) return;

  if (!availableCameraDevices || availableCameraDevices.length <= 1) {
    targetEl.innerText = `Back ${currentZoomLevel.toFixed(1)}x`;
    return;
  }

  const index = availableCameraDevices.findIndex(d => d.id === currentCameraDeviceId);
  const current = availableCameraDevices[index >= 0 ? index : 0];
  targetEl.innerText = formatCameraLabel(current, index >= 0 ? index : 0, availableCameraDevices.length);
}

function enumerateRearCameras() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  navigator.mediaDevices.enumerateDevices().then(devices => {
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    // Filter environment/rear cameras, strictly excluding front/selfie cameras
    availableCameraDevices = videoDevices.filter(d => {
      const l = (d.label || '').toLowerCase();
      if (l.includes('front') || l.includes('user') || l.includes('selfie') || l.includes('facing front')) {
        return false;
      }
      return l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('wide');
    });

    if (availableCameraDevices.length === 0) {
      availableCameraDevices = videoDevices.filter(d => {
        const l = (d.label || '').toLowerCase();
        return !(l.includes('front') || l.includes('user') || l.includes('selfie'));
      });
    }

    updateCameraCycleButtonLabel();
  }).catch(() => {});
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
    const videoConstraints = {
      width: { ideal: 1920, min: 1280 },
      height: { ideal: 1080, min: 720 },
      facingMode: "environment"
    };

    if (currentCameraDeviceId) {
      videoConstraints.deviceId = { exact: currentCameraDeviceId };
      delete videoConstraints.facingMode;
    }

    qrScanner = new window.QrScanner(
      videoElem,
      result => {
        if (navigator.vibrate) {
          try { navigator.vibrate(100); } catch (e) {}
        }

        const decodedText = typeof result === 'object' ? (result.data || result.text) : result;
        const cleanScannedText = (decodedText || "").trim();

        if (cleanScannedText) {
          stopScanner();
          const callback = onDecodeCallback || window.processLicenseUrl;
          if (typeof callback === 'function') {
            callback(cleanScannedText);
          } else {
            console.warn("QR decoded but no callback registered:", cleanScannedText);
          }
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 25,
        preferredCamera: 'environment',
        constraints: videoConstraints,
        calculateScanRegion: (video) => {
          const smallerDimension = Math.min(video.videoWidth, video.videoHeight);
          const scanRegionSize = Math.round(smallerDimension * 0.85);
          return {
            x: Math.round((video.videoWidth - scanRegionSize) / 2),
            y: Math.round((video.videoHeight - scanRegionSize) / 2),
            width: scanRegionSize,
            height: scanRegionSize,
            downScaledWidth: 800,
            downScaledHeight: 800
          };
        }
      }
    );

    qrScanner.start().then(() => {
      try {
        const stream = videoElem.srcObject;
        if (stream) {
          activeMediaStream = stream;
          const track = stream.getVideoTracks()[0];
          if (track && typeof track.getCapabilities === 'function') {
            const capabilities = track.getCapabilities();
            if (capabilities.zoom) {
              const targetZoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, currentZoomLevel));
              track.applyConstraints({ advanced: [{ zoom: targetZoom }] }).catch(() => {});
            }

            const torchBtn = document.getElementById("torch-toggle-btn");
            if (torchBtn) {
              if (capabilities.torch) {
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

      enumerateRearCameras();
    }).catch(err => {
      console.error("Camera access failed:", err);
      if (onErrorCallback) onErrorCallback("Camera Access Failed: " + err);
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
  releaseWakeLock();
  return Promise.resolve();
}

export function switchScanHubTab(targetTabId, onDecodeCallback, onErrorCallback) {
  const cameraTab = document.getElementById("camera-scan-tab");
  const myQrPassTab = document.getElementById("my-qr-pass-tab");
  const manualTab = document.getElementById("manual-entry-tab");

  const btnCamera = document.getElementById("tab-camera-btn");
  const btnQrPass = document.getElementById("tab-qrpass-btn");
  const btnManual = document.getElementById("tab-manual-btn");

  const activeBtnClass = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-xs flex-1 cursor-pointer";
  const inactiveBtnClass = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex-1 cursor-pointer";

  if (cameraTab) cameraTab.classList.add("hidden");
  if (myQrPassTab) myQrPassTab.classList.add("hidden");
  if (manualTab) manualTab.classList.add("hidden");

  if (btnCamera) btnCamera.className = inactiveBtnClass;
  if (btnQrPass) btnQrPass.className = inactiveBtnClass;
  if (btnManual) btnManual.className = inactiveBtnClass;

  if (targetTabId === "camera") {
    if (cameraTab) cameraTab.classList.remove("hidden");
    if (btnCamera) btnCamera.className = activeBtnClass;
    releaseWakeLock();
    startScanner(onDecodeCallback, onErrorCallback);
  } else if (targetTabId === "qrpass") {
    if (myQrPassTab) myQrPassTab.classList.remove("hidden");
    if (btnQrPass) btnQrPass.className = activeBtnClass;
    stopScanner();
    renderMyQrPass();
  } else if (targetTabId === "manual") {
    if (manualTab) manualTab.classList.remove("hidden");
    if (btnManual) btnManual.className = activeBtnClass;
    stopScanner();
    releaseWakeLock();
    renderRecentPilotsList();
  }
}

// ============================================================================
// 2. TAB 2: MY QR PASS CONTROLLER (OFFLINE ON-DEVICE CANVAS QR GENERATOR)
// ============================================================================

export function renderMyQrPass() {
  requestWakeLock();
  const profile = getProfileData();

  const nameElem = document.getElementById("pass-pilot-name");
  const licenceElem = document.getElementById("pass-licence-no");
  const badgeElem = document.getElementById("pass-eligibility-badge");
  const freshnessElem = document.getElementById("pass-freshness-tag");

  if (nameElem) nameElem.innerText = profile.name || "-";
  if (licenceElem) {
    const lType = profile.licenceType || "-";
    const lNo = profile.licenceNo || "-";
    licenceElem.innerText = `${lType} • ${lNo}`;
  }

  const isEligible = profile.dutyStatus ? profile.dutyStatus === 'ELIGIBLE' : true;
  if (badgeElem) {
    if (isEligible) {
      badgeElem.innerText = "ELIGIBLE FOR FLIGHT DUTY";
      badgeElem.className = "mt-3 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    } else {
      badgeElem.innerText = "LAPSED / INELIGIBLE";
      badgeElem.className = "mt-3 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
    }
  }

  if (freshnessElem) {
    freshnessElem.innerText = profile.lastVerified ? `Verified ${profile.lastVerified}` : "Cached Offline";
  }
}

// ============================================================================
// 3. TAB 3: MANUAL ENTRY & RECENT CREW CARDS CONTROLLER
// ============================================================================

export function renderRecentPilotsList(onSelectUrlCallback) {
  const container = document.getElementById("recent-pilots-list");
  const countTag = document.getElementById("recent-count-tag");
  if (!container) return;

  const history = getScanHistory() || [];
  if (countTag) countTag.innerText = history.length;

  if (history.length === 0) {
    container.innerHTML = '<div class="py-4 text-center text-xs text-slate-400 font-medium">No recent verified crew records found.</div>';
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

export function handleClipboardPaste(inputElemId = "manual-url-input") {
  const inputElem = document.getElementById(inputElemId);
  if (!inputElem) return;

  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText()
      .then(text => {
        if (text) {
          inputElem.value = text.trim();
        }
      })
      .catch(() => {});
  }
}

// ============================================================================
// 4. HARDWARE TOOLBAR CONTROLLERS (LENS SWITCHER & FLASHLIGHT)
// ============================================================================

export function cycleCameraLens(onDecodeCallback, onErrorCallback) {
  const cycleBtn = document.getElementById("camera-cycle-btn");
  const cycleLabel = document.getElementById("camera-cycle-label");
  const targetEl = cycleLabel || cycleBtn;

  if (targetEl) targetEl.innerText = "Switching...";

  if (availableCameraDevices.length <= 1) {
    enumerateRearCameras();
  }

  if (availableCameraDevices.length > 1) {
    const currentIndex = availableCameraDevices.findIndex(d => d.id === currentCameraDeviceId);
    const nextIndex = (currentIndex + 1) % availableCameraDevices.length;
    currentCameraDeviceId = availableCameraDevices[nextIndex].id;
    startScanner(onDecodeCallback, onErrorCallback);
    updateCameraCycleButtonLabel();
    return;
  }

  currentZoomLevel = currentZoomLevel >= 1.8 ? 1.0 : 2.0;
  if (activeMediaStream) {
    const track = activeMediaStream.getVideoTracks()[0];
    if (track && typeof track.getCapabilities === 'function') {
      const capabilities = track.getCapabilities();
      if (capabilities.zoom) {
        const targetZoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, currentZoomLevel));
        track.applyConstraints({ advanced: [{ zoom: targetZoom }] }).catch(() => {});
      }
    }
  }
  updateCameraCycleButtonLabel();
}

export function toggleTorch() {
  if (!activeMediaStream) return;
  const track = activeMediaStream.getVideoTracks()[0];
  if (track && typeof track.getCapabilities === 'function') {
    const capabilities = track.getCapabilities();
    if (capabilities.torch) {
      torchActive = !torchActive;
      track.applyConstraints({ advanced: [{ torch: torchActive }] }).catch(() => {});
    }
  }
}

// ============================================================================
// 5. HELPER FUNCTIONS (IDLE TIMEOUT & WAKE LOCK MANAGEMENT)
// ============================================================================

function resetIdleTimer(onDecodeCallback, onErrorCallback) {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (qrScanner) {
      qrScanner.stop();
    }
    if (activeMediaStream) {
      activeMediaStream.getTracks().forEach(track => track.stop());
      activeMediaStream = null;
    }
    const pausedOverlay = document.getElementById("scanner-paused-overlay");
    if (pausedOverlay) {
      pausedOverlay.classList.remove("hidden");
      pausedOverlay.classList.add("flex");
    }
  }, IDLE_TIMEOUT_MS);
}

function requestWakeLock() {
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen')
      .then(lock => { wakeLock = lock; })
      .catch(() => {});
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release()
      .then(() => { wakeLock = null; })
      .catch(() => {});
  }
}
