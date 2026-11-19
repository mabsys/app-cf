// ./js/modals/pdfViewerModal.js (1911_R101) - CertiFly In-App PDF Document Viewer Modal Component
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

export const pdfViewerModalHTML = `
<!-- EFB IN-APP PDF VIEWER MODAL -->
<div id="efb-pdf-viewer-modal" class="fixed inset-0 z-[80] bg-slate-950/90 backdrop-blur-md flex flex-col hidden select-none transition-opacity duration-300 opacity-0" onclick="if(event.target === this) closePdfViewerModal()">
  <div class="w-full max-w-4xl mx-auto h-full flex flex-col p-2 sm:p-4 pointer-events-none">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl pointer-events-auto">
      
      <!-- MODAL HEADER -->
      <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
        <div class="flex items-center gap-2.5 truncate pr-2">
          <div class="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.967 0 016-2.292c1.052 0 2.062.18-3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div class="truncate">
            <span class="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">DOCUMENT VIEWER</span>
            <h3 id="pdf-modal-title" class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase truncate">Document Title</h3>
          </div>
        </div>

        <!-- HEADER ACTIONS -->
        <div class="flex items-center gap-2 shrink-0">
          <a id="pdf-modal-external-link" href="#" target="_blank" rel="noopener noreferrer" class="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[10px] font-bold" title="Open in External Tab">
            <span class="hidden sm:inline">External</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
          <button type="button" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer" onclick="closePdfViewerModal()">✕</button>
        </div>
      </div>

      <!-- PDF CANVAS CONTAINER -->
      <div class="relative flex-1 bg-slate-900 w-full h-full overflow-hidden flex items-center justify-center">
        <!-- IFRAME FOR IN-APP RENDERING -->
        <iframe id="pdf-modal-iframe" class="w-full h-full border-0 bg-white dark:bg-slate-900" title="PDF Document Viewer"></iframe>

        <!-- FALLBACK CONTAINER -->
        <div id="pdf-modal-fallback" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-300 hidden">
          <svg class="w-12 h-12 text-slate-500 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p class="text-xs font-bold text-slate-200 mb-1">Inline PDF Viewing Not Supported</p>
          <p class="text-[10px] text-slate-400 mb-4 max-w-xs">Your browser or device does not support embedded PDF rendering.</p>
          <a id="pdf-modal-fallback-btn" href="#" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors">
            Open Document Externally
          </a>
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

export function openPdfViewerModal(pdfUrl, title = 'Document Viewer') {
  initPdfViewerModal();

  const modal = document.getElementById('efb-pdf-viewer-modal');
  const titleEl = document.getElementById('pdf-modal-title');
  const externalLink = document.getElementById('pdf-modal-external-link');
  const fallbackBtn = document.getElementById('pdf-modal-fallback-btn');
  const iframe = document.getElementById('pdf-modal-iframe');

  if (!modal || !iframe) return;

  if (titleEl) titleEl.textContent = title;
  if (externalLink) externalLink.href = pdfUrl;
  if (fallbackBtn) fallbackBtn.href = pdfUrl;

  // Append toolbar disabled parameters for clean EFB viewing
  iframe.src = `${pdfUrl}#toolbar=0&navpanes=0&view=FitH`;

  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
  });
}

export function closePdfViewerModal() {
  const modal = document.getElementById('efb-pdf-viewer-modal');
  const iframe = document.getElementById('pdf-modal-iframe');

  if (modal) {
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      if (iframe) iframe.src = 'about:blank';
    }, 250);
  }
}

// Global window bindings
if (typeof window !== 'undefined') {
  window.initPdfViewerModal = initPdfViewerModal;
  window.openPdfViewerModal = openPdfViewerModal;
  window.closePdfViewerModal = closePdfViewerModal;
}
