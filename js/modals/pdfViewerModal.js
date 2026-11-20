// ./js/modals/pdfViewerModal.js (1911_R112) - CertiFly In-App PDF Document Viewer Modal Component (Mozilla PDF.js Engine)
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

let activeBlobUrl = null;

export const pdfViewerModalHTML = `
<!-- EFB IN-APP PDF VIEWER MODAL (Mozilla PDF.js Integration) -->
<div id="efb-pdf-viewer-modal" class="fixed inset-0 z-[80] bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-md flex flex-col hidden select-none transition-opacity duration-300 opacity-0" onclick="if(event.target === this) closePdfViewerModal()">
  <div class="w-full max-w-full md:max-w-5xl lg:max-w-6xl mx-auto h-full flex flex-col p-2 sm:p-4 pointer-events-none">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl pointer-events-auto">
      
      <!-- MODAL HEADER (Theme-aware, crisp icon, clean EFB style) -->
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

      <!-- MOZILLA PDF.JS VIEWER IFRAME CONTAINER -->
      <div id="pdf-modal-viewport" class="relative flex-1 bg-slate-100 dark:bg-slate-950 w-full h-full overflow-hidden">
        
        <!-- LOADER SPINNER -->
        <div id="pdf-modal-loader" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/90 z-10 transition-opacity duration-200">
          <div class="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <span class="text-xs font-bold text-slate-600 dark:text-slate-400 animate-pulse">Loading Document...</span>
        </div>

        <!-- OFFICIAL MOZILLA PDF.JS EMBEDDED VIEWER -->
        <iframe id="pdf-modal-iframe" class="w-full h-full border-0 bg-white dark:bg-slate-900" title="PDF Document Viewer"></iframe>

        <!-- FALLBACK NOTICE CONTAINER -->
        <div id="pdf-modal-fallback" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hidden z-20">
          <svg class="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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
  }
}

/**
 * Injects strict EFB Read-Only, No-Toolbar & No-Text-Selection CSS into Mozilla viewer iframe
 */
function applyEfbViewerStyles(iframe) {
  try {
    const iframeDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
    if (!iframeDoc) return;

    if (!iframeDoc.getElementById('certifly-efb-pdf-overrides')) {
      const styleEl = iframeDoc.createElement('style');
      styleEl.id = 'certifly-efb-pdf-overrides';
      styleEl.textContent = `
        /* ==========================================================================
           CertiFly EFB Read-Only & Zero-Toolbar Overrides for Mozilla PDF.js
           ========================================================================== */

        /* 1. HIDE ENTIRE TOP TOOLBAR, FLOATING TOOLBARS & SEARCH BARS */
        #toolbarContainer,
        #toolbarViewer,
        .toolbar,
        #secondaryToolbar,
        #viewFind,
        #findbar,
        .findbar {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          min-height: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* 2. OFFSET VIEWER CONTAINER TO TOP OF IFRAME */
        #viewerContainer {
          top: 0 !important;
          inset: 0 !important;
        }

        /* 3. DISABLE TEXT SELECTION & TEXT COPYING */
        .textLayer,
        .annotationLayer {
          display: none !important;
          pointer-events: none !important;
        }
        #viewerContainer, 
        #viewer,
        body {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
      `;
      (iframeDoc.head || iframeDoc.documentElement).appendChild(styleEl);
    }

    // Disable Find/Search Keyboard Shortcut (Ctrl+F / Cmd+F) inside iframe
    if (iframe.contentWindow) {
      iframe.contentWindow.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    }
  } catch (err) {
    console.warn('Could not inject EFB overrides into PDF.js iframe:', err);
  }
}

/**
 * Safely loads PDF data into Mozilla PDF.js viewer via PDFViewerApplication API
 */
async function loadPdfIntoViewerApp(iframe, pdfData) {
  const win = iframe.contentWindow;
  if (!win) throw new Error('Iframe window unavailable');

  // Poll until PDFViewerApplication is initialized by viewer.js
  let attempts = 0;
  while ((!win.PDFViewerApplication || !win.PDFViewerApplication.initialized) && attempts < 60) {
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }

  const app = win.PDFViewerApplication;
  if (!app) throw new Error('PDFViewerApplication not initialized in iframe');

  if (app.initializedPromise) {
    await app.initializedPromise;
  }

  // Open PDF data via PDFViewerApplication (handles ArrayBuffer, Blobs, and URLs cleanly without CORS/origin errors)
  if (typeof pdfData === 'string') {
    await app.open(pdfData);
  } else if (pdfData instanceof ArrayBuffer) {
    await app.open({ data: pdfData });
  } else if (pdfData instanceof Blob || pdfData instanceof File) {
    const buf = await pdfData.arrayBuffer();
    await app.open({ data: buf });
  }
}

export async function openPdfViewerModal(pdfUrlOrBlob, title = 'Document Viewer') {
  initPdfViewerModal();

  const modal = document.getElementById('efb-pdf-viewer-modal');
  const titleEl = document.getElementById('pdf-modal-title');
  const iframe = document.getElementById('pdf-modal-iframe');
  const loader = document.getElementById('pdf-modal-loader');
  const fallback = document.getElementById('pdf-modal-fallback');

  if (!modal || !iframe) return;

  if (titleEl) titleEl.textContent = title;

  // Revoke previous Blob URL
  if (activeBlobUrl) {
    try { URL.revokeObjectURL(activeBlobUrl); } catch (e) {}
    activeBlobUrl = null;
  }

  if (loader) loader.classList.remove('hidden');
  if (fallback) fallback.classList.add('hidden');

  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
  });

  try {
    // Extract ArrayBuffer if File or Blob
    let pdfData = pdfUrlOrBlob;
    if (typeof Blob !== 'undefined' && (pdfUrlOrBlob instanceof Blob || pdfUrlOrBlob instanceof File)) {
      pdfData = await pdfUrlOrBlob.arrayBuffer();
    }

    const viewerBasePath = './js/vendor/pdfjs/web/viewer.html';

    // Set iframe src to viewer.html (clean base URL, no problematic file= parameter)
    const currentIframeSrc = iframe.getAttribute('data-loaded-src');
    if (currentIframeSrc !== viewerBasePath) {
      iframe.src = viewerBasePath;
      iframe.setAttribute('data-loaded-src', viewerBasePath);

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 4000);
        iframe.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        iframe.onerror = (e) => {
          clearTimeout(timeout);
          reject(e);
        };
      });
    }

    // Apply strict EFB CSS overrides (hides toolbar, text selection, find bar)
    applyEfbViewerStyles(iframe);

    // Load PDF into PDFViewerApplication
    await loadPdfIntoViewerApp(iframe, pdfData);

    // Re-apply EFB styles to ensure new elements created during render stay hidden
    applyEfbViewerStyles(iframe);

    if (loader) loader.classList.add('hidden');
  } catch (err) {
    console.warn('Mozilla PDF.js viewer load error, displaying fallback:', err);
    if (loader) loader.classList.add('hidden');
    if (fallback) fallback.classList.remove('hidden');
  }
}

export function closePdfViewerModal() {
  if (activeBlobUrl) {
    try { URL.revokeObjectURL(activeBlobUrl); } catch (e) {}
    activeBlobUrl = null;
  }

  const modal = document.getElementById('efb-pdf-viewer-modal');
  const iframe = document.getElementById('pdf-modal-iframe');

  if (modal) {
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      if (iframe) {
        iframe.removeAttribute('data-loaded-src');
        iframe.src = 'about:blank';
      }
    }, 250);
  }
}

// Global window bindings
if (typeof window !== 'undefined') {
  window.initPdfViewerModal = initPdfViewerModal;
  window.openPdfViewerModal = openPdfViewerModal;
  window.closePdfViewerModal = closePdfViewerModal;
}
