// ./js/modals/pdfViewerModal.js (1911_R118) - CertiFly EFB In-App PDF Document Viewer Component
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

let currentPdfTask = null;
let currentZoom = 1.0;
let activeBlobUrl = null;

// Unscaled base dimensions at 100% baseline zoom (Prevents double compounding & NaN math)
let unscaledStageWidth = 0;
let unscaledStageHeight = 0;

// Touch & Zoom Gesture Controller State
let isPinching = false;
let initialPinchDist = 0;
let initialZoom = 1.0;
let lastPinchCenter = { x: 0, y: 0 };
let lastTap = { time: 0, x: 0, y: 0 };
let rAFPending = false;

export const pdfViewerModalHTML = `
<!-- EFB IN-APP PDF VIEWER MODAL (iPad Safeguarded GPU CSS Transform Engine) -->
<div id="efb-pdf-viewer-modal" class="fixed inset-0 z-[80] bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-md flex flex-col hidden select-none transition-opacity duration-300 opacity-0" onclick="if(event.target === this) closePdfViewerModal()">
  <div class="w-full max-w-full md:max-w-5xl lg:max-w-6xl mx-auto h-full flex flex-col p-2 sm:p-4 pointer-events-none">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl pointer-events-auto">
      
      <!-- MODAL HEADER (Theme-aware, crisp icon, clean EFB style, no toolbar clutter) -->
      <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
        <div class="flex items-center gap-2.5 truncate pr-2">
          <div class="w-7 h-7 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 flex-none">
            <svg class="w-4 h-4 shrink-0 flex-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.967 0 016-2.292c1.052 0 2.062.18-3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div class="truncate">
            <span class="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">DOCUMENT VIEWER</span>
            <h3 id="pdf-modal-title" class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase truncate">Document Title</h3>
          </div>
        </div>

        <!-- HEADER ACTIONS (Zoom Badge & Close Button) -->
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" class="px-2.5 py-1 bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer" onclick="resetPdfViewerZoom()" title="Reset Zoom">
            <span id="pdf-modal-zoom-label">100%</span>
          </button>
          <button type="button" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer flex items-center justify-center" aria-label="Close PDF Viewer" onclick="closePdfViewerModal()">✕</button>
        </div>
      </div>

      <!-- PDF DOCUMENT VIEWPORT (Continuous vertical flow & GPU CSS Transform Engine with iPad touch safeguards) -->
      <div id="pdf-modal-viewport" class="relative flex-1 bg-slate-100 dark:bg-slate-950 w-full h-full overflow-y-auto overflow-x-auto p-0 sm:p-2 no-scrollbar touch-pan-x touch-pan-y" style="touch-action: pan-x pan-y;">
        
        <!-- LOADER SPINNER -->
        <div id="pdf-modal-loader" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/90 z-10 transition-opacity duration-200">
          <div class="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <span class="text-xs font-bold text-slate-600 dark:text-slate-400 animate-pulse">Loading Document...</span>
        </div>

        <!-- DYNAMIC SCROLL SPACER (Expands scrollable bounds matching transform scale without altering stage width) -->
        <div id="pdf-modal-stage-wrapper" class="relative w-full mx-auto min-h-full origin-top-left transition-none">
          <!-- GPU TRANSFORM CONTAINER (Canvas page stack scaled smoothly via CSS transform) -->
          <div id="pdf-modal-document-stage" class="absolute top-0 left-0 flex flex-col items-center gap-2 py-1 origin-top-left">
          </div>
        </div>

        <!-- IFRAME FALLBACK CONTAINER -->
        <iframe id="pdf-modal-iframe" class="w-full h-full border-0 bg-white dark:bg-slate-900 hidden" title="PDF Document Viewer"></iframe>

        <!-- FALLBACK NOTICE CONTAINER -->
        <div id="pdf-modal-fallback" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hidden z-20">
          <svg class="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 01-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p class="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Unable to Load Document</p>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mb-4 max-w-xs">The PDF document could not be rendered inside the viewer.</p>
        </div>
      </div>

    </div>
  </div>
</div>
`;

export function initPdfViewerModal() {
  if (!document.getElementById('efb-pdf-viewer-modal')) {
    document.body.insertAdjacentHTML('beforeend', pdfViewerModalHTML);
    setupGestureListeners();
  }
}

function resetPinchState() {
  isPinching = false;
  initialPinchDist = 0;
  rAFPending = false;
}

function setupGestureListeners() {
  const viewport = document.getElementById('pdf-modal-viewport');
  const stage = document.getElementById('pdf-modal-document-stage');
  if (!viewport || viewport.dataset.gesturesInit) return;
  viewport.dataset.gesturesInit = 'true';

  // Prevent iPad Safari native window zoom collision
  viewport.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  viewport.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });

  viewport.addEventListener('touchstart', (e) => {
    const vRect = viewport.getBoundingClientRect();

    if (e.touches.length === 2) {
      // Guard against pinch starting before unscaled base dimensions are measured
      if (!unscaledStageWidth || unscaledStageWidth <= 0) {
        if (stage) unscaledStageWidth = (stage.offsetWidth / (currentZoom || 1.0)) || (window.innerWidth - 32);
      }
      if (!unscaledStageHeight || unscaledStageHeight <= 0) {
        if (stage) unscaledStageHeight = (stage.offsetHeight / (currentZoom || 1.0)) || 600;
      }

      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      // Only engage pinch if distance between fingers is valid (> 10px)
      if (Number.isFinite(dist) && dist > 10) {
        isPinching = true;
        initialPinchDist = dist;
        initialZoom = currentZoom;

        const cX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - vRect.left;
        const cY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - vRect.top;
        lastPinchCenter = { x: cX, y: cY };

        if (stage) stage.style.transition = 'none';
      } else {
        resetPinchState();
      }
    } else if (e.touches.length === 1 && !isPinching) {
      const touchX = e.touches[0].clientX - vRect.left;
      const touchY = e.touches[0].clientY - vRect.top;
      const now = Date.now();
      const dist = Math.hypot(touchX - lastTap.x, touchY - lastTap.y);

      if (now - lastTap.time < 300 && dist < 40) {
        e.preventDefault();
        const targetZoom = currentZoom > 1.25 ? 1.0 : 2.0;
        setZoom(targetZoom, touchX, touchY, true);
        lastTap = { time: 0, x: 0, y: 0 };
      } else {
        lastTap = { time: now, x: touchX, y: touchY };
      }
    }
  }, { passive: false });

  viewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && isPinching && initialPinchDist > 10) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      if (!Number.isFinite(dist) || dist <= 0) return;

      const factor = dist / initialPinchDist;
      const targetZoom = initialZoom * factor;

      const vRect = viewport.getBoundingClientRect();
      const currX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - vRect.left;
      const currY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - vRect.top;

      if (!rAFPending) {
        rAFPending = true;
        requestAnimationFrame(() => {
          setZoomPinch(targetZoom, currX, currY);
          rAFPending = false;
        });
      }
    }
  }, { passive: false });

  const handleTouchEndOrCancel = (e) => {
    if (e.touches.length < 2 && isPinching) {
      resetPinchState();

      if (currentZoom < 1.02) {
        setZoom(1.0, undefined, undefined, true);
      }
    }
  };

  // Safely reset state on both touchend AND iPad touchcancel events
  viewport.addEventListener('touchend', handleTouchEndOrCancel, { passive: true });
  viewport.addEventListener('touchcancel', handleTouchEndOrCancel, { passive: true });

  viewport.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const vRect = viewport.getBoundingClientRect();
      const focalX = e.clientX - vRect.left;
      const focalY = e.clientY - vRect.top;
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      setZoom(currentZoom + delta, focalX, focalY, false);
    }
  }, { passive: false });
}

function setZoomPinch(targetZoom, currCenterX, currCenterY) {
  const viewport = document.getElementById('pdf-modal-viewport');
  const stage = document.getElementById('pdf-modal-document-stage');
  const wrapper = document.getElementById('pdf-modal-stage-wrapper');
  if (!viewport || !stage || !wrapper) return;

  const clampedZoom = Math.min(Math.max(1.0, targetZoom), 3.5);
  if (!Number.isFinite(clampedZoom)) return;

  const oldZoom = currentZoom;
  currentZoom = clampedZoom;
  const ratio = currentZoom / oldZoom;

  const deltaX = currCenterX - lastPinchCenter.x;
  const deltaY = currCenterY - lastPinchCenter.y;

  stage.style.transition = 'none';
  wrapper.style.transition = 'none';

  // Lock stage layout width to unscaled baseline to prevent double compounding
  if (unscaledStageWidth > 0) {
    stage.style.width = `${unscaledStageWidth}px`;
    wrapper.style.width = `${unscaledStageWidth * currentZoom}px`;
  }
  if (unscaledStageHeight > 0) {
    wrapper.style.height = `${unscaledStageHeight * currentZoom}px`;
  }

  // Apply GPU hardware scale cleanly
  stage.style.transform = `scale(${currentZoom})`;

  // Focal scroll shift: anchors 2-finger midpoint precisely
  viewport.scrollLeft = (viewport.scrollLeft + lastPinchCenter.x) * ratio - currCenterX;
  viewport.scrollTop = (viewport.scrollTop + lastPinchCenter.y) * ratio - currCenterY;

  lastPinchCenter = { x: currCenterX, y: currCenterY };
  updateZoomLabel();
}

function setZoom(targetZoom, focalX, focalY, animate = false) {
  const viewport = document.getElementById('pdf-modal-viewport');
  const stage = document.getElementById('pdf-modal-document-stage');
  const wrapper = document.getElementById('pdf-modal-stage-wrapper');
  if (!viewport || !stage || !wrapper) return;

  const clampedZoom = Math.min(Math.max(1.0, targetZoom), 3.5);
  if (!Number.isFinite(clampedZoom) || Math.abs(clampedZoom - currentZoom) < 0.001) return;

  const oldZoom = currentZoom;
  currentZoom = clampedZoom;
  const ratio = currentZoom / oldZoom;

  const vRect = viewport.getBoundingClientRect();
  const fX = typeof focalX === 'number' ? focalX : vRect.width / 2;
  const fY = typeof focalY === 'number' ? focalY : vRect.height / 2;

  if (animate) {
    stage.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
    wrapper.style.transition = 'width 0.25s cubic-bezier(0.25, 1, 0.5, 1), height 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
  } else {
    stage.style.transition = 'none';
    wrapper.style.transition = 'none';
  }

  if (unscaledStageWidth > 0) {
    stage.style.width = `${unscaledStageWidth}px`;
    wrapper.style.width = `${unscaledStageWidth * currentZoom}px`;
  }
  if (unscaledStageHeight > 0) {
    wrapper.style.height = `${unscaledStageHeight * currentZoom}px`;
  }

  stage.style.transform = `scale(${currentZoom})`;

  viewport.scrollLeft = (viewport.scrollLeft + fX) * ratio - fX;
  viewport.scrollTop = (viewport.scrollTop + fY) * ratio - fY;

  updateZoomLabel();
}

export function resetPdfViewerZoom() {
  setZoom(1.0, undefined, undefined, true);
}

function updateZoomLabel() {
  const label = document.getElementById('pdf-modal-zoom-label');
  if (label) {
    label.textContent = `${Math.round(currentZoom * 100)}%`;
  }
}

export async function openPdfViewerModal(pdfUrlOrBlob, title = 'Document Viewer') {
  let pdfUrl = pdfUrlOrBlob;
  if (typeof Blob !== 'undefined' && (pdfUrlOrBlob instanceof Blob || pdfUrlOrBlob instanceof File)) {
    if (activeBlobUrl) {
      try { URL.revokeObjectURL(activeBlobUrl); } catch (e) {}
    }
    activeBlobUrl = URL.createObjectURL(pdfUrlOrBlob);
    pdfUrl = activeBlobUrl;
  }
  initPdfViewerModal();

  const modal = document.getElementById('efb-pdf-viewer-modal');
  const titleEl = document.getElementById('pdf-modal-title');
  const stage = document.getElementById('pdf-modal-document-stage');
  const wrapper = document.getElementById('pdf-modal-stage-wrapper');
  const loader = document.getElementById('pdf-modal-loader');
  const fallback = document.getElementById('pdf-modal-fallback');
  const iframe = document.getElementById('pdf-modal-iframe');
  const viewportEl = document.getElementById('pdf-modal-viewport');

  if (!modal || !stage) return;

  if (titleEl) titleEl.textContent = title;

  resetPinchState();
  currentZoom = 1.0;
  updateZoomLabel();

  stage.style.transform = 'scale(1)';
  stage.style.width = '100%';
  if (wrapper) {
    wrapper.style.width = '100%';
    wrapper.style.height = 'auto';
  }
  stage.innerHTML = '';

  if (loader) loader.classList.remove('hidden');
  if (fallback) fallback.classList.add('hidden');
  if (iframe) iframe.classList.add('hidden');

  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
  });

  if (currentPdfTask) {
    try { currentPdfTask.destroy(); } catch (e) {}
    currentPdfTask = null;
  }

  try {
    const pdfLib = window.pdfjsLib;
    if (pdfLib) {
      if (!pdfLib.GlobalWorkerOptions.workerSrc) {
        pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      let loadingTask = null;
      if (typeof Blob !== 'undefined' && (pdfUrlOrBlob instanceof Blob || pdfUrlOrBlob instanceof File)) {
        const arrayBuffer = await pdfUrlOrBlob.arrayBuffer();
        loadingTask = pdfLib.getDocument({ data: arrayBuffer });
      } else {
        loadingTask = pdfLib.getDocument(pdfUrl);
      }

      currentPdfTask = loadingTask;
      const pdf = await currentPdfTask.promise;

      if (loader) loader.classList.add('hidden');

      const dpr = window.devicePixelRatio || 1;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        const containerWidth = viewportEl ? (viewportEl.clientWidth || (window.innerWidth - 32)) : (window.innerWidth - 32);
        const unscaledViewport = page.getViewport({ scale: 1 });

        const baseScale = Math.max(0.4, containerWidth / unscaledViewport.width);
        const renderScale = baseScale * Math.max(dpr, 2);
        const viewport = page.getViewport({ scale: renderScale });

        const pageCard = document.createElement('div');
        pageCard.className = 'pdf-page-card relative block w-full bg-white dark:bg-slate-800 shadow-xs border-b border-slate-200 dark:border-slate-800/80 shrink-0 select-none';

        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page-canvas block w-full h-auto pointer-events-none';
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        pageCard.appendChild(canvas);
        stage.appendChild(pageCard);
        await page.render(renderContext).promise;
      }

      // Capture unscaled base geometry for stable transform zoom calculations
      requestAnimationFrame(() => {
        unscaledStageWidth = stage.offsetWidth || (window.innerWidth - 32);
        unscaledStageHeight = stage.offsetHeight || 600;
        stage.style.width = `${unscaledStageWidth}px`;
        if (wrapper) {
          wrapper.style.width = `${unscaledStageWidth}px`;
          wrapper.style.height = `${unscaledStageHeight}px`;
        }
      });
    } else {
      useIframeFallback(pdfUrl, loader, iframe, fallback);
    }
  } catch (err) {
    console.warn('PDF.js render error, falling back:', err);
    useIframeFallback(pdfUrl, loader, iframe, fallback);
  }
}

function useIframeFallback(pdfUrl, loader, iframe, fallback) {
  if (loader) loader.classList.add('hidden');
  if (iframe) {
    iframe.classList.remove('hidden');
    iframe.src = `${pdfUrl}#toolbar=0&navpanes=0&view=FitH`;
  } else if (fallback) {
    fallback.classList.remove('hidden');
  }
}

export function closePdfViewerModal() {
  if (activeBlobUrl) {
    try { URL.revokeObjectURL(activeBlobUrl); } catch (e) {}
    activeBlobUrl = null;
  }
  const modal = document.getElementById('efb-pdf-viewer-modal');
  const stage = document.getElementById('pdf-modal-document-stage');
  const wrapper = document.getElementById('pdf-modal-stage-wrapper');
  const iframe = document.getElementById('pdf-modal-iframe');

  if (currentPdfTask) {
    try { currentPdfTask.destroy(); } catch (e) {}
    currentPdfTask = null;
  }

  resetPinchState();

  if (modal) {
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      if (stage) stage.innerHTML = '';
      if (wrapper) {
        wrapper.style.width = '100%';
        wrapper.style.height = 'auto';
      }
      if (iframe) iframe.src = 'about:blank';
      currentZoom = 1.0;
      unscaledStageWidth = 0;
      unscaledStageHeight = 0;
    }, 250);
  }
}

// Global window bindings
if (typeof window !== 'undefined') {
  window.initPdfViewerModal = initPdfViewerModal;
  window.openPdfViewerModal = openPdfViewerModal;
  window.closePdfViewerModal = closePdfViewerModal;
  window.resetPdfViewerZoom = resetPdfViewerZoom;
}
