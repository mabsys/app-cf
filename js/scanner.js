
// ./js/scanner.js (0711_R403)
// Optimized Nimiq QR Scanner
// Targets: iPad 10th Gen+, iPhone, Android
// Browsers: Safari and Chrome
// QR target: Version 7, 14mm x 14mm
// Scan distance: 5-10cm
//
// IMPORTANT:
// - Uses Nimiq's internal BarcodeDetector/Worker selection.
// - Does not run a competing external detector.
// - Retains the 52% central scan region.
// - Preserves more image detail with up to 640px processing.
// - Applies camera constraints to the actual MediaStreamTrack.

import { getProfileData, getScanHistory } from './storage.js';

// ============================================================================
// 1. CONFIGURATION
// ============================================================================

const CONFIG = Object.freeze({
    IDLE_TIMEOUT_MS: 60000,

    SCAN_REGION_FACTOR: 0.52,

    // Preserve detail without making processing excessively expensive.
    SCAN_PROCESSING_MAX: 640,

    MAX_SCANS_PER_SECOND: 22,

    CAMERA_WIDTH: 2560,
    CAMERA_HEIGHT: 1440,
    CAMERA_FALLBACK_WIDTH: 1920,
    CAMERA_FALLBACK_HEIGHT: 1080,

    CAMERA_FRAME_RATE: 30,

    // Avoid unnecessary digital zoom by default.
    DEFAULT_ZOOM: 1.0,

    // Supported zoom presets; actual values are clamped to capabilities.
    ZOOM_PRESETS: [1.0, 1.8, 2.5]
});

// ============================================================================
// 2. STATE
// ============================================================================

let qrScanner = null;

let currentCameraDeviceId = null;
let availableCameraDevices = [];

let activeMediaStream = null;

let torchActive = false;
let idleTimer = null;
let wakeLock = null;

let currentZoomLevel = CONFIG.DEFAULT_ZOOM;

let activeDecodeCallback = null;
let activeErrorCallback = null;

let scannerGeneration = 0;
let decodeHandled = false;
let scannerStarting = false;

// Native BarcodeDetector is deliberately NOT instantiated here.
// Nimiq manages native detection and worker fallback internally.

// ============================================================================
// 3. CAMERA UTILITIES
// ============================================================================

function getActiveVideoTrack() {
    if (!activeMediaStream) return null;

    const tracks = activeMediaStream.getVideoTracks();

    return tracks.length ? tracks[0] : null;
}

function filterRearCameras(cameras) {
    if (!Array.isArray(cameras)) return [];

    return cameras.filter(cam => {
        const label = (cam.label || '').toLowerCase();

        return !(
            label.includes('front') ||
            label.includes('user') ||
            label.includes('selfie') ||
            label.includes('facing front')
        );
    });
}

function formatCameraLabel(camObj, index, total) {
    if (!camObj && total <= 1) {
        return `Back ${currentZoomLevel.toFixed(1)}x`;
    }

    const label = camObj
        ? (camObj.label || '').toLowerCase()
        : '';

    if (
        label.includes('ultra') ||
        label.includes('0.5x') ||
        label.includes('wide-angle') ||
        label.includes('macro')
    ) {
        return 'Wide / Macro';
    }

    if (
        label.includes('telephoto') ||
        label.includes('zoom') ||
        label.includes('2x') ||
        label.includes('3x')
    ) {
        return 'Telephoto';
    }

    if (
        label.includes('back') ||
        label.includes('rear') ||
        label.includes('environment') ||
        label.includes('wide')
    ) {
        return index === 0
            ? 'Back Camera'
            : `Back Lens ${index + 1}`;
    }

    return total > 1
        ? `Back Lens ${index + 1}`
        : `Back ${currentZoomLevel.toFixed(1)}x`;
}

// ============================================================================
// 4. CAMERA CAPABILITY DETECTION
// ============================================================================

function supportsCapability(caps, name, value) {
    if (!caps || !caps[name]) return false;

    const supported = caps[name];

    return Array.isArray(supported)
        ? supported.includes(value)
        : false;
}

async function applyCameraOptimizations(videoElem) {
    if (!videoElem || !videoElem.srcObject) return;

    const stream = videoElem.srcObject;

    if (!(stream instanceof MediaStream)) return;

    const track = stream.getVideoTracks()[0];

    if (!track || track.readyState !== 'live') return;

    activeMediaStream = stream;

    let caps = {};

    try {
        if (typeof track.getCapabilities === 'function') {
            caps = track.getCapabilities();
        }
    } catch (e) {
        console.warn('[R403] Camera capabilities unavailable:', e);
    }

    // ------------------------------------------------------------
    // A. Resolution and frame rate
    // ------------------------------------------------------------

    const resolutionConstraints = {
        width: {
            ideal: CONFIG.CAMERA_WIDTH
        },
        height: {
            ideal: CONFIG.CAMERA_HEIGHT
        },
        frameRate: {
            ideal: CONFIG.CAMERA_FRAME_RATE,
            max: CONFIG.CAMERA_FRAME_RATE
        }
    };

    try {
        await track.applyConstraints(resolutionConstraints);
    } catch (firstError) {
        console.warn(
            '[R403] 1440p request unavailable. Trying 1080p.',
            firstError
        );

        try {
            await track.applyConstraints({
                width: {
                    ideal: CONFIG.CAMERA_FALLBACK_WIDTH
                },
                height: {
                    ideal: CONFIG.CAMERA_FALLBACK_HEIGHT
                },
                frameRate: {
                    ideal: CONFIG.CAMERA_FRAME_RATE,
                    max: CONFIG.CAMERA_FRAME_RATE
                }
            });
        } catch (fallbackError) {
            console.warn(
                '[R403] Camera resolution fallback unavailable.',
                fallbackError
            );
        }
    }

    // ------------------------------------------------------------
    // B. Focus and exposure
    // ------------------------------------------------------------

    const advanced = [];

    try {
        if (supportsCapability(caps, 'focusMode', 'continuous')) {
            advanced.push({
                focusMode: 'continuous'
            });
        }

        if (supportsCapability(caps, 'exposureMode', 'continuous')) {
            advanced.push({
                exposureMode: 'continuous'
            });
        }

        // Do not force macro mode.
        // Some devices report macro capability but cannot focus
        // reliably at the requested physical scanning distance.

        if (caps.zoom) {
            const zoom = Math.min(
                caps.zoom.max,
                Math.max(caps.zoom.min, currentZoomLevel)
            );

            advanced.push({ zoom });
        }

        if (advanced.length) {
            await track.applyConstraints({
                advanced
            });
        }
    } catch (e) {
        console.warn(
            '[R403] Optional focus/exposure/zoom settings unavailable:',
            e
        );
    }

    // ------------------------------------------------------------
    // C. Record actual camera settings
    // ------------------------------------------------------------

    try {
        const settings = track.getSettings();

        console.info('[R403] Active camera settings:', {
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            facingMode: settings.facingMode,
            focusMode: settings.focusMode,
            exposureMode: settings.exposureMode,
            zoom: settings.zoom
        });
    } catch (e) {}

    updateTorchButton(track);
}

function updateTorchButton(track) {
    const torchBtn = document.getElementById('torch-toggle-btn');

    if (!torchBtn) return;

    let hasTorch = false;

    try {
        const caps = track &&
            typeof track.getCapabilities === 'function'
            ? track.getCapabilities()
            : {};

        hasTorch = Boolean(caps.torch);
    } catch (e) {}

    torchBtn.classList.toggle('hidden', !hasTorch);
    torchBtn.classList.toggle('flex', hasTorch);
}

// ============================================================================
// 5. CAMERA CONTROL UI
// ============================================================================

export async function updateCameraControlUI() {
    const cycleBtn = document.getElementById('camera-cycle-btn');
    const cycleLabel = document.getElementById('camera-cycle-label');

    const targetEl = cycleLabel || cycleBtn;

    if (!availableCameraDevices.length) {
        try {
            if (window.QrScanner) {
                const cameras = await window.QrScanner.listCameras(true);

                availableCameraDevices = filterRearCameras(
                    cameras || []
                );
            }
        } catch (e) {}
    }

    const track = getActiveVideoTrack();

    let hasZoom = false;

    try {
        const caps = track && track.getCapabilities
            ? track.getCapabilities()
            : {};

        hasZoom = Boolean(caps.zoom);
    } catch (e) {}

    const multipleCameras = availableCameraDevices.length > 1;

    const showControl = multipleCameras || hasZoom;

    if (cycleBtn) {
        cycleBtn.classList.toggle('hidden', !showControl);
        cycleBtn.classList.toggle('flex', showControl);
    }

    if (!showControl || !targetEl) return;

    if (multipleCameras) {
        const index = availableCameraDevices.findIndex(
            c => c.id === currentCameraDeviceId
        );

        const actualIndex = index >= 0 ? index : 0;

        targetEl.innerText = formatCameraLabel(
            availableCameraDevices[actualIndex],
            actualIndex,
            availableCameraDevices.length
        );
    } else {
        targetEl.innerText = `Zoom ${currentZoomLevel.toFixed(1)}x`;
    }
}

export function updateCameraCycleButtonLabel() {
    updateCameraControlUI();
}

// ============================================================================
// 6. OPTIMIZED NIMIQ SCAN REGION
// ============================================================================

function calculateOptimizedScanRegion(video) {
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
    }

    const smallestDimension = Math.min(width, height);

    // Preserve the intended physical-card positioning area.
    const size = Math.round(
        smallestDimension * CONFIG.SCAN_REGION_FACTOR
    );

    const x = Math.round((width - size) / 2);
    const y = Math.round((height - size) / 2);

    // Do not force a 400x400 downscale.
    // Preserve the crop's original detail up to 640px.
    const processingSize = Math.min(
        size,
        CONFIG.SCAN_PROCESSING_MAX
    );

    return {
        x,
        y,
        width: size,
        height: size,

        downScaledWidth: processingSize,
        downScaledHeight: processingSize
    };
}

// ============================================================================
// 7. IDLE TIMER
// ============================================================================

function resetIdleTimer() {
    if (idleTimer) {
        clearTimeout(idleTimer);
    }

    idleTimer = setTimeout(() => {
        stopScanner();

        const pausedOverlay = document.getElementById(
            'scanner-paused-overlay'
        );

        if (pausedOverlay) {
            pausedOverlay.classList.remove('hidden');
        }
    }, CONFIG.IDLE_TIMEOUT_MS);
}

// ============================================================================
// 8. CAMERA START
// ============================================================================

export function startScanner(
    onDecodeCallback,
    onErrorCallback,
    customVideoElemId = 'qr-video'
) {
    const errorMsg = document.getElementById('error-message');

    if (errorMsg) errorMsg.innerText = '';

    const videoElem = document.getElementById(customVideoElemId);

    if (!videoElem) {
        if (onErrorCallback) {
            onErrorCallback('Camera feed element not found.');
        }

        return;
    }

    const pausedOverlay = document.getElementById(
        'scanner-paused-overlay'
    );

    if (pausedOverlay) {
        pausedOverlay.classList.add('hidden');
    }

    // Always update callbacks, even when reusing an active scanner.
    activeDecodeCallback = onDecodeCallback;
    activeErrorCallback = onErrorCallback;

    // Reuse a functioning scanner.
    if (
        qrScanner &&
        activeMediaStream &&
        activeMediaStream.active &&
        videoElem.readyState >= 2 &&
        !videoElem.paused
    ) {
        resetIdleTimer();
        return;
    }

    if (scannerStarting) return;

    stopNativeDetection();

    // Invalidate older asynchronous startup operations.
    const generation = ++scannerGeneration;

    if (qrScanner) {
        try {
            qrScanner.destroy();
        } catch (e) {}

        qrScanner = null;
    }

    activeMediaStream = null;

    decodeHandled = false;
    scannerStarting = true;

    const handleQrSuccess = (result) => {
        if (decodeHandled) return;

        const decodedText = (
            typeof result === 'object'
                ? result.data || result.text || ''
                : result
        );

        if (typeof decodedText !== 'string') return;

        const cleanScannedText = decodedText.trim();

        if (!cleanScannedText) return;

        // Single successful callback protection.
        decodeHandled = true;

        const callback =
            activeDecodeCallback ||
            window.processLicenseUrl;

        stopScanner();

        if (navigator.vibrate) {
            try {
                navigator.vibrate(80);
            } catch (e) {}
        }

        if (typeof callback === 'function') {
            callback(cleanScannedText);
        }
    };

    const reportError = (message) => {
        const callback = activeErrorCallback;

        if (typeof callback === 'function') {
            callback(message);
        }
    };

    if (!window.QrScanner) {
        scannerStarting = false;

        reportError('Nimiq QR scanner library is unavailable.');

        return;
    }

    // Use Nimiq's modern detailed-result API.
    // Its engine selects native BarcodeDetector or Worker internally.
    try {
        qrScanner = new window.QrScanner(
            videoElem,
            handleQrSuccess,
            {
                returnDetailedScanResult: true,

                onDecodeError: () => {},

                preferredCamera:
                    currentCameraDeviceId || 'environment',

                maxScansPerSecond:
                    CONFIG.MAX_SCANS_PER_SECOND,

                highlightScanRegion: false,

                highlightCodeOutline: true,

                calculateScanRegion:
                    calculateOptimizedScanRegion
            }
        );
    } catch (e) {
        scannerStarting = false;

        console.error('[R403] Scanner initialization failed:', e);

        reportError('Unable to initialize QR scanner.');

        return;
    }

    qrScanner.start()
        .then(async () => {
            if (generation !== scannerGeneration) {
                return;
            }

            scannerStarting = false;

            if (!qrScanner) return;

            try {
                await applyCameraOptimizations(videoElem);
            } catch (e) {
                console.warn(
                    '[R403] Camera optimization incomplete:',
                    e
                );
            }

            if (generation !== scannerGeneration) return;

            // Refresh the active stream after camera initialization.
            activeMediaStream = videoElem.srcObject;

            resetIdleTimer();

            // Camera enumeration after permission is granted.
            try {
                const cameras = await window.QrScanner.listCameras(true);

                availableCameraDevices = filterRearCameras(
                    cameras || []
                );

                await updateCameraControlUI();
            } catch (e) {
                console.warn(
                    '[R403] Camera enumeration unavailable:',
                    e
                );
            }
        })
        .catch(err => {
            if (generation !== scannerGeneration) return;

            scannerStarting = false;

            console.error('[R403] Camera start failed:', err);

            reportError(
                'Unable to access camera. Please verify permissions.'
            );
        });
}

// ============================================================================
// 9. STOP SCANNER
// ============================================================================

export function stopScanner() {
    // Invalidate outstanding asynchronous startup operations.
    scannerGeneration++;

    scannerStarting = false;

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

    // Nimiq normally stops its own video stream during destroy.
    // Stop any remaining active tracks defensively.
    if (activeMediaStream) {
        try {
            activeMediaStream.getTracks().forEach(track => {
                if (track.readyState === 'live') {
                    track.stop();
                }
            });
        } catch (e) {}

        activeMediaStream = null;
    }

    torchActive = false;

    decodeHandled = false;

    activeDecodeCallback = null;
    activeErrorCallback = null;

    const torchBtn = document.getElementById('torch-toggle-btn');

    if (torchBtn) {
        torchBtn.classList.add('hidden');
        torchBtn.classList.remove('flex');
    }

    releaseWakeLock();
}

// ============================================================================
// 10. TAB CONTROLLER
// ============================================================================

export function switchScanHubTab(tabName) {
    const tabCamera = document.getElementById('camera-scan-tab');
    const tabQrPass = document.getElementById('my-qr-pass-tab');
    const tabManual = document.getElementById('manual-entry-tab');

    const btnCamera = document.getElementById('tab-camera-btn');
    const btnQrPass = document.getElementById('tab-qrpass-btn');
    const btnManual = document.getElementById('tab-manual-btn');

    const activeBtnClass =
        'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-xs';

    const inactiveBtnClass =
        'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100';

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
            scannedUrl => {
                if (typeof window.processLicenseUrl === 'function') {
                    window.processLicenseUrl(scannedUrl);
                }
            },
            err => {
                const errorMsg = document.getElementById('error-message');

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
// 11. MY QR PASS
// ============================================================================

export function renderMyQrPass() {
    const profile = getProfileData();

    const canvas = document.getElementById('pass-qr-canvas');

    const pilotNameEl = document.getElementById('pass-pilot-name');
    const licenceNoEl = document.getElementById('pass-licence-no');

    const badgeEl = document.getElementById('pass-eligibility-badge');
    const freshnessTag = document.getElementById('pass-freshness-tag');

    if (pilotNameEl) {
        pilotNameEl.innerText = profile.name || '-';
    }

    if (licenceNoEl) {
        const lType = profile.licenceType || '-';
        const lNo = profile.licenceNo || '-';

        licenceNoEl.innerText = `${lType} • ${lNo}`;
    }

    const isEligible = profile.dutyStatus
        ? profile.dutyStatus === 'ELIGIBLE'
        : true;

    if (badgeEl) {
        if (isEligible) {
            badgeEl.innerText = 'ELIGIBLE FOR FLIGHT DUTY';

            badgeEl.className =
                'mt-3 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
        } else {
            badgeEl.innerText = 'LAPSED / INELIGIBLE';

            badgeEl.className =
                'mt-3 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
        }
    }

    if (freshnessTag) {
        freshnessTag.innerText = profile.lastVerified
            ? `Verified ${profile.lastVerified}`
            : 'Cached Offline';
    }

    if (canvas && window.QrScanner) {
        try {
            window.QrScanner.hasCamera();
        } catch (e) {}
    }

    requestWakeLock();
}

// ============================================================================
// 12. RECENT PILOTS
// ============================================================================

export function renderRecentPilotsList() {
    const container = document.getElementById('recent-pilots-list');

    const countTag = document.getElementById('recent-count-tag');

    if (!container) return;

    const history = getScanHistory();

    if (countTag) {
        countTag.innerText = history.length;
    }

    if (!history.length) {
        container.innerHTML =
            '<div class="py-4 text-center text-xs text-slate-400 font-medium">No recently verified pilots</div>';

        return;
    }

    container.innerHTML = '';

    history.slice(0, 5).forEach(item => {
        const name = item.pilotName || 'Verified Crew';
        const licence = item.licenceNo || 'ATPL(A)';
        const time = item.timestamp || 'Recent';

        const div = document.createElement('div');

        div.className =
            'py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors';

        const details = document.createElement('div');
        details.className = 'flex flex-col';

        const nameEl = document.createElement('span');
        nameEl.className = 'text-xs font-bold text-slate-800 dark:text-slate-200';
        nameEl.textContent = name;

        const infoEl = document.createElement('span');
        infoEl.className = 'text-[10px] text-slate-400 font-medium';
        infoEl.textContent = `${licence} • ${time}`;

        details.appendChild(nameEl);
        details.appendChild(infoEl);

        const viewEl = document.createElement('span');
        viewEl.className =
            'text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase';

        viewEl.textContent = 'View';

        div.appendChild(details);
        div.appendChild(viewEl);

        div.onclick = () => {
            if (window.loadHistoricalRecord) {
                window.loadHistoricalRecord(item.id);
            }
        };

        container.appendChild(div);
    });
}

// ============================================================================
// 13. MANUAL CLIPBOARD ENTRY
// ============================================================================

export async function handleClipboardPaste() {
    const input = document.getElementById('manual-url-input');

    if (!input) return;

    try {
        if (
            navigator.clipboard &&
            navigator.clipboard.readText
        ) {
            const text = await navigator.clipboard.readText();

            if (text) {
                input.value = text.trim();
            }
        }
    } catch (err) {
        console.warn('[R403] Clipboard permission denied:', err);
    }
}

// ============================================================================
// 14. CAMERA LENS / ZOOM SWITCHER
// ============================================================================

export async function cycleCameraLens() {
    const cycleBtn = document.getElementById('camera-cycle-btn');

    const cycleLabel = document.getElementById('camera-cycle-label');

    const targetEl = cycleLabel || cycleBtn;

    if (targetEl) {
        targetEl.innerText = 'Switching...';
    }

    if (!availableCameraDevices.length) {
        try {
            if (window.QrScanner) {
                const cameras = await window.QrScanner.listCameras(true);

                availableCameraDevices = filterRearCameras(
                    cameras || []
                );
            }
        } catch (e) {}
    }

    // ------------------------------------------------------------
    // A. Physical rear camera switching
    // ------------------------------------------------------------

    if (availableCameraDevices.length > 1) {
        const currentIndex = availableCameraDevices.findIndex(
            c => c.id === currentCameraDeviceId
        );

        const nextIndex =
            (currentIndex + 1) % availableCameraDevices.length;

        const nextCamera = availableCameraDevices[nextIndex];

        try {
            if (qrScanner) {
                currentCameraDeviceId = nextCamera.id;

                await qrScanner.setCamera(currentCameraDeviceId);

                const videoElem = document.getElementById('qr-video');

                if (videoElem) {
                    await applyCameraOptimizations(videoElem);
                }

                await updateCameraControlUI();

                return;
            }
        } catch (e) {
            console.warn('[R403] Physical lens switching failed:', e);
        }
    }

    // ------------------------------------------------------------
    // B. Hardware zoom
    // ------------------------------------------------------------

    const track = getActiveVideoTrack();

    if (!track || typeof track.getCapabilities !== 'function') {
        await updateCameraControlUI();
        return;
    }

    try {
        const caps = track.getCapabilities();

        if (!caps.zoom) return;

        const presets = CONFIG.ZOOM_PRESETS;

        const currentIndex = presets.findIndex(
            value => Math.abs(value - currentZoomLevel) < 0.05
        );

        const nextIndex = (currentIndex + 1) % presets.length;

        const requestedZoom = presets[nextIndex];

        const actualZoom = Math.min(
            caps.zoom.max,
            Math.max(caps.zoom.min, requestedZoom)
        );

        await track.applyConstraints({
            advanced: [
                { zoom: actualZoom }
            ]
        });

        currentZoomLevel = actualZoom;

    } catch (e) {
        console.warn('[R403] Zoom unavailable:', e);
    }

    await updateCameraControlUI();
}

// ============================================================================
// 15. TORCH CONTROL
// ============================================================================

export function toggleTorch() {
    if (!qrScanner) return;

    torchActive = !torchActive;

    if (torchActive) {
        qrScanner.turnFlashOn().catch(() => {
            torchActive = false;
        });
    } else {
        qrScanner.turnFlashOff().catch(() => {
            torchActive = false;
        });
    }
}

// ============================================================================
// 16. WAKE LOCK
// ============================================================================

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator && !wakeLock) {
            wakeLock = await navigator.wakeLock.request('screen');

            wakeLock.addEventListener('release', () => {
                wakeLock = null;
            });
        }
    } catch (e) {}
}

function releaseWakeLock() {
    if (wakeLock) {
        const lock = wakeLock;

        wakeLock = null;

        lock.release().catch(() => {});
    }
}

// ============================================================================
// END R403
// ============================================================================
