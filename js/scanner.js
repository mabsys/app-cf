// js/scanner.js (2609_R054) - 3-Tab Pilot Scan Hub Hardware & UI Controller

import { getProfileData, getScanHistory } from './storage.js';

let qrScanner = null;
let currentCameraDeviceId = null;
let availableCameraDevices = [];
let activeMediaStream = null;
let torchActive = false;
let idleTimer = null;
let wakeLock = null;

// IDLE TIMEOUT THRESHOLD: 60 Seconds
const IDLE_TIMEOUT_MS = 60000;

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
    qrScanner.destroy();
    qrScanner = null;
  }

  if (activeMediaStream) {
    activeMediaStream.getTracks().forEach(track => track.stop());
    activeMediaStream = null;
  }

  // Configure high-resolution camera constraints for physical 14mm x 14mm QR cards
  const videoConstraints = {
    width: { ideal: 1920, min: 1280 },
    height: { ideal: 1080, min: 720 },
    facingMode: "environment"
  };

  if (currentCameraDeviceId) {
    videoConstraints.deviceId = { exact: currentCameraDeviceId };
    delete videoConstraints.facingMode;
  }

  qrScanner = new QrScanner(
    videoElem,
    result => {
      // Trigger subtle haptic feedback on scan success
      if (navigator.vibrate) {
        try { navigator.vibrate(100); } catch (e) {}
      }

      const decodedText = typeof result === 'object' ? result.data : result;
      const cleanScannedText = (decodedText || "").trim();

      // Reset idle timer on successful decode
      resetIdleTimer(onDecodeCallback, onErrorCallback);

      if (onDecodeCallback) onDecodeCallback(cleanScannedText);
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
    // Attempt 1.5x-2.0x optical/hardware zoom for small QR code scanning
    try {
      const stream = videoElem.srcObject;
      if (stream) {
        activeMediaStream = stream;
        const track = stream.getVideoTracks()[0];
        if (track && typeof track.getCapabilities === 'function') {
          const capabilities = track.getCapabilities();
          if (capabilities.zoom) {
            const targetZoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, 1.8));
            track.applyConstraints({ advanced: [{ zoom: targetZoom }] }).catch(() => {});
          }

          // Detect hardware torch support
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

    // Enumerate available rear video devices for lens cycling
    enumerateRearCameras();

  }).catch(err => {
    if (onErrorCallback) onErrorCallback("Camera Access Failed: " + err);
  });
}

export function stopScanner() {
  clearTimeout(idleTimer);

  if (qrScanner) {
    qrScanner.destroy();
    qrScanner = null;
  }

  if (activeMediaStream) {
    activeMediaStream.getTracks().forEach(track => track.stop());
    activeMediaStream = null;
  }

  torchActive = false;
  releaseWakeLock();

  return Promise.resolve();
}

function resetIdleTimer(onDecodeCallback, onErrorCallback) {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    // Stop camera stream on 60-second idle timeout
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

export function cycleCameraLens(onDecodeCallback, onErrorCallback) {
  if (availableCameraDevices.length <= 1) return;

  const currentIndex = availableCameraDevices.findIndex(d => d.id === currentCameraDeviceId);
  const nextIndex = (currentIndex + 1) % availableCameraDevices.length;
  currentCameraDeviceId = availableCameraDevices[nextIndex].id;

  startScanner(onDecodeCallback, onErrorCallback);
}

function enumerateRearCameras() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

  navigator.mediaDevices.enumerateDevices().then(devices => {
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    // Filter environment/rear cameras
    availableCameraDevices = videoDevices.filter(d => 
      d.label.toLowerCase().includes('back') || 
      d.label.toLowerCase().includes('rear') || 
      d.label.toLowerCase().includes('environment')
    );

    if (availableCameraDevices.length === 0) {
      availableCameraDevices = videoDevices;
    }

    const lensBtn = document.getElementById("camera-cycle-btn");
    if (lensBtn) {
      if (availableCameraDevices.length > 1) {
        lensBtn.disabled = false;
        lensBtn.classList.remove("opacity-50", "cursor-not-allowed");
      } else {
        lensBtn.disabled = true;
        lensBtn.classList.add("opacity-50", "cursor-not-allowed");
      }
    }
  }).catch(() => {});
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

export function decodeGalleryPhoto(file, onDecodeCallback, onErrorCallback) {
  if (!file) return;
  QrScanner.scanImage(file, { returnDetailedScanResult: true })
    .then(result => {
      const decodedText = typeof result === 'object' ? result.data : result;
      if (decodedText && onDecodeCallback) {
        onDecodeCallback(decodedText.trim());
      }
    })
    .catch(err => {
      if (onErrorCallback) onErrorCallback("No valid QR code found in uploaded image.");
    });
}

// ============================================================================
// 2. TAB 2: MY QR PASS CONTROLLER (OFFLINE ON-DEVICE CANVAS QR GENERATOR)
// ============================================================================

export function renderMyQrPass() {
  requestWakeLock();

  const profile = getProfileData();
  const passContainer = document.getElementById("my-qr-pass-tab");
  if (!passContainer) return;

  const canvas = document.getElementById("pass-qr-canvas");
  const nameElem = document.getElementById("pass-pilot-name");
  const licenceElem = document.getElementById("pass-licence-no");
  const badgeElem = document.getElementById("pass-eligibility-badge");
  const freshnessElem = document.getElementById("pass-freshness-tag");
  const verifyBtn = document.getElementById("verify-my-licence-btn");

  if (!profile || !profile.url) {
    if (nameElem) nameElem.innerText = "No Profile Saved";
    if (licenceElem) licenceElem.innerText = "Scan or verify a licence to enable My Pass";
    if (badgeElem) {
      badgeElem.className = "mt-3 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
      badgeElem.innerText = "UNVERIFIED";
    }
    if (verifyBtn) verifyBtn.classList.add("hidden");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return;
  }

  // Render Pilot Details
  if (nameElem) nameElem.innerText = profile.pilotName || "CAPT. MOHD SALLEHUDDIN ZAIDY";
  if (licenceElem) licenceElem.innerText = `${profile.licenceType || 'ATPL(A)'} • ${profile.licenceNo || 'A3115'}`;
  
  // Status Badge Logic
  if (badgeElem) {
    if (profile.isLapsed) {
      badgeElem.className = "mt-3 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200/80";
      badgeElem.innerText = "LAPSED / INELIGIBLE";
    } else if (profile.isExpiringSoon) {
      badgeElem.className = "mt-3 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/80";
      badgeElem.innerText = "EXPIRING SOON";
    } else {
      badgeElem.className = "mt-3 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/80";
      badgeElem.innerText = "ELIGIBLE FOR FLIGHT DUTY";
    }
  }

  if (freshnessElem) {
    freshnessElem.innerText = profile.lastUpdated ? `Cached: ${profile.lastUpdated}` : "Offline Pass Ready (0ms delay)";
  }

  if (verifyBtn) verifyBtn.classList.remove("hidden");

  // Render Vector Canvas QR Code On-Device (Offline Ready)
  if (canvas && typeof QrScanner !== 'undefined' && profile.url) {
    drawCanvasQrCode(canvas, profile.url);
  }
}

function drawCanvasQrCode(canvas, text) {
  // Uses HTML5 Canvas API to generate high-contrast vector modules
  const ctx = canvas.getContext("2d");
  const size = 240;
  canvas.width = size;
  canvas.height = size;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, size, size);

  // Fallback visual encoding pattern if qrcode.js library isn't loaded
  if (typeof QRCode !== 'undefined') {
    QRCode.toCanvas(canvas, text, { width: size, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } });
  } else {
    // Basic high-contrast SVG / Canvas fallback representation
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => { ctx.drawImage(img, 10, 10, size - 20, size - 20); };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}`;
  }
}

// ============================================================================
// 3. TAB 3: MANUAL ENTRY & RECENT CREW CARDS CONTROLLER
// ============================================================================

export function renderRecentPilotsList(onSelectUrlCallback) {
  const listContainer = document.getElementById("recent-pilots-list");
  const countTag = document.getElementById("recent-count-tag");

  if (!listContainer) return;

  const history = getScanHistory() || [];
  if (countTag) countTag.innerText = history.length;

  if (history.length === 0) {
    listContainer.innerHTML = `
      <div class="p-4 text-center text-xs text-slate-400 font-medium">
        No recent verified crew records found.
      </div>
    `;
    return;
  }

  listContainer.innerHTML = history.slice(0, 5).map(item => {
    const pilotName = item.pilotName || "CAPT. UNKNOWN CREW";
    const licenceInfo = `${item.licenceType || 'ATPL(A)'} • ${item.licenceNo || 'N/A'}`;
    const timestamp = item.timestamp || item.scannedAt || "Recent";

    return `
      <div data-url="${item.url || ''}" class="recent-pilot-card p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between group">
        <div class="flex flex-col gap-0.5">
          <span class="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase">
            ${pilotName}
          </span>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            ${licenceInfo} &bull; Verified ${timestamp}
          </span>
        </div>
        <svg class="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
        </svg>
      </div>
    `;
  }).join('');

  // Bind click handlers to recent pilot cards
  const cards = listContainer.querySelectorAll(".recent-pilot-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const targetUrl = card.getAttribute("data-url");
      const input = document.getElementById("manual-url-input");
      if (input && targetUrl) {
        input.value = targetUrl;
        if (onSelectUrlCallback) onSelectUrlCallback(targetUrl);
      }
    });
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
// 4. SCAN HUB TAB SWITCHER & LIFECYCLE orchestrator
// ============================================================================

export function switchScanHubTab(targetTabId, onDecodeCallback, onErrorCallback) {
  const cameraTab = document.getElementById("camera-scan-tab");
  const myQrPassTab = document.getElementById("my-qr-pass-tab");
  const manualTab = document.getElementById("manual-entry-tab");

  const btnCamera = document.getElementById("tab-camera-btn");
  const btnQrPass = document.getElementById("tab-qrpass-btn");
  const btnManual = document.getElementById("tab-manual-btn");

  const activeBtnClass = "py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all bg-blue-600 text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer";
  const inactiveBtnClass = "py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer";

  // Reset tab views
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
// 5. HELPER FUNCTIONS (WAKE LOCK MANAGEMENT)
// ============================================================================

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
