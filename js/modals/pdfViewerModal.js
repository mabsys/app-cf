// ./js/modals/pdfViewerModal.js (1911_R103) - CertiFly In-App PDF Document Viewer Modal Component
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

let currentPdfTask = null;
let currentZoom = 1;
let initialDistance = 0;
let initialScale = 1;
let lastTapTime = 0;

export const pdfViewerModalHTML = `
<!-- EFB IN-APP PDF VIEWER MODAL -->
<div id="efb-pdf-viewer-modal" class="fixed inset-0 z-[80] bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-md flex flex-col hidden select-none transition-opacity duration-300 opacity-0" onclick="if(event.target === this) closePdfViewerModal()">
  <div class="w-full max-w-full md:max-w-5xl lg:max-w-6xl mx-auto h-full flex flex-col p-2 sm:p-4 pointer-events-none">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl pointer-events-auto">
      
      <!-- MODAL HEADER (Theme-aware, crisp icon, no external link) -->
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

        <!-- HEADER CLOSE ACTION -->
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer flex items-center justify-center" aria-label="Close PDF Viewer" onclick="closePdfViewerModal()">✕</button>
        </div>
      </div>

      <!-- PDF CANVAS STACK CONTAINER (Supports vertical/horizontal scroll & pinch/double-tap zoom) -->
      <div class="relative flex-1 bg-slate-100 dark:bg-slate-950 w-full h-full overflow-hidden flex flex-col">
        
        <!-- LOADER SPINNER -->
        <div id="pdf-modal-loader" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/90 z-10 transition-opacity duration-200">
          <div class="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <span class="text-xs font-bold text-slate-600 dark:text-slate-400 animate-pulse">Loading Document...</span>
        </div>

        <!-- DYNAMIC CANVAS PAGES SCROLL CONTAINER -->
        <div id="pdf-modal-pages-container" class="flex-1 w-full h-full overflow-y-auto overflow-x-auto p-3 sm:p-5 flex flex-col items-center gap-4 no-scrollbar touch-pan-x touch-pan-y">
        </div>

        <!-- IFRAME FALLBACK CONTAINER (Used if PDF.js fails) -->
        <iframe id="pdf-modal-iframe" class="w-full h-full border-0 bg-white dark:bg-slate-900 hidden" title="PDF Document Viewer"></iframe>

        <!-- FALLBACK NOTICE CONTAINER -->
        <div id="pdf-modal-fallback" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hidden z-20">
          <svg class="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p class="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Unable to Load Document</p>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mb-4 max-w-xs">The PDF document could not be rendered inside the app viewer.</p>
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

function setupGestureListeners() {
  const container = document.getElementById('pdf-modal-pages-container');
  if (!container || container.dataset.gesturesInit) return;
  container.dataset.gesturesInit = 'true';

  // Pinch-to-zoom & Double-tap zoom handling
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      initialDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialScale = currentZoom;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime < 300) {
        currentZoom = currentZoom > 1.2 ? 1 : 1.8;
        applyZoom(container);
      }
      lastTapTime = now;
    }
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialDistance > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialDistance;
      currentZoom = Math.min(Math.max(0.8, initialScale * factor), 3.0);
      applyZoom(container);
    }
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      initialDistance = 0;
    }
  }, { passive: true });

  // Desktop trackpad / Ctrl + wheel zoom
  container.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      currentZoom = Math.min(Math.max(0.8, currentZoom + delta), 3.0);
      applyZoom(container);
    }
  }, { passive: false });
}

function applyZoom(container) {
  const wrappers = container.querySelectorAll('.pdf-page-wrapper');
  wrappers.forEach(w => {
    w.style.transform = `scale(${currentZoom})`;
    w.style.transformOrigin = 'top center';
    w.style.transition = 'transform 0.15s ease-out';
  });
}

export async function openPdfViewerModal(pdfUrl, title = 'Document Viewer') {
  initPdfViewerModal();

  const modal = document.getElementById('efb-pdf-viewer-modal');
  const titleEl = document.getElementById('pdf-modal-title');
  const container = document.getElementById('pdf-modal-pages-container');
  const loader = document.getElementById('pdf-modal-loader');
  const fallback = document.getElementById('pdf-modal-fallback');
  const iframe = document.getElementById('pdf-modal-iframe');

  if (!modal || !container) return;

  if (titleEl) titleEl.textContent = title;

  // Reset zoom & view state
  currentZoom = 1;
  container.innerHTML = '';
  if (loader) loader.classList.remove('hidden');
  if (fallback) fallback.classList.add('hidden');
  if (iframe) iframe.classList.add('hidden');

  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
  });

  // Cancel any previous PDF rendering
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

      currentPdfTask = pdfLib.getDocument(pdfUrl);
      const pdf = await currentPdfTask.promise;

      if (loader) loader.classList.add('hidden');

      const dpr = window.devicePixelRatio || 1;

      // Render each PDF page sequentially into vertical canvas stack
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        const containerWidth = container.clientWidth || (window.innerWidth - 32);
        const unscaledViewport = page.getViewport({ scale: 1 });

        // Calculate responsive scale to fit page width to container width
        const baseScale = Math.max(0.4, (containerWidth - 24) / unscaledViewport.width);
        const viewport = page.getViewport({ scale: baseScale * dpr });

        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'pdf-page-wrapper relative my-1 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-150 origin-top';

        const canvas = document.createElement('canvas');
        canvas.className = 'block max-w-full h-auto';
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const displayWidth = viewport.width / dpr;
        const displayHeight = viewport.height / dpr;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        const ctx = canvas.getContext('2d');
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        pageWrapper.appendChild(canvas);
        container.appendChild(pageWrapper);

        await page.render(renderContext).promise;
      }
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
  const modal = document.getElementById('efb-pdf-viewer-modal');
  const container = document.getElementById('pdf-modal-pages-container');
  const iframe = document.getElementById('pdf-modal-iframe');

  if (currentPdfTask) {
    try { currentPdfTask.destroy(); } catch (e) {}
    currentPdfTask = null;
  }

  if (modal) {
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      if (container) container.innerHTML = '';
      if (iframe) iframe.src = 'about:blank';
      currentZoom = 1;
    }, 250);
  }
}

// Global window bindings
if (typeof window !== 'undefined') {
  window.initPdfViewerModal = initPdfViewerModal;
  window.openPdfViewerModal = openPdfViewerModal;
  window.closePdfViewerModal = closePdfViewerModal;
}
