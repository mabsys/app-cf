// ./js/components/modals/pdfViewerModal.js - Universal In-App PDF Viewer Component

export const pdfViewerModalHTML = `
<!-- FULLSCREEN PDF VIEWER MODAL OVERLAY -->
<div id="pdf-viewer-modal" class="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md hidden flex-col transition-opacity duration-300 opacity-0">
  
  <!-- STICKY TOP NAVIGATION BAR -->
  <header class="flex items-center justify-between px-4 py-3 bg-blue-950 dark:bg-slate-900 text-white border-b border-blue-900 dark:border-slate-800 shrink-0"
          style="padding-top: max(0.75rem, env(safe-area-inset-top, 0px));">
    <button id="pdf-viewer-close-btn" 
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold transition-all cursor-pointer">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back to CertiFly
    </button>
    <span id="pdf-viewer-title" class="text-xs font-extrabold truncate max-w-[200px] text-slate-200">Document Guide</span>
    <a id="pdf-viewer-external-link" href="#" target="_blank" rel="noopener"
       class="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-300" title="Open in Browser">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </a>
  </header>

  <!-- PDF CONTENT CONTAINER -->
  <div class="flex-1 w-full bg-slate-800 overflow-hidden relative">
    <iframe id="pdf-viewer-frame" class="w-full h-full border-0" src="about:blank"></iframe>
  </div>
</div>
`;

export function initPdfViewerModal() {
  if (!document.getElementById("pdf-viewer-modal")) {
    document.body.insertAdjacentHTML("beforeend", pdfViewerModalHTML);

    const closeBtn = document.getElementById("pdf-viewer-close-btn");
    closeBtn?.addEventListener("click", closePdfViewerModal);
  }
}

export function openPdfViewerModal(pdfUrl, title = "Document Guide") {
  initPdfViewerModal();

  const modal = document.getElementById("pdf-viewer-modal");
  const iframe = document.getElementById("pdf-viewer-frame");
  const titleEl = document.getElementById("pdf-viewer-title");
  const externalLink = document.getElementById("pdf-viewer-external-link");

  if (!modal || !iframe) return;

  if (titleEl) titleEl.innerText = title;
  if (externalLink) externalLink.href = pdfUrl;
  
  // Set iframe source to the PDF URL or Object URL
  iframe.src = pdfUrl;

  modal.classList.remove("hidden");
  requestAnimationFrame(() => {
    modal.classList.remove("opacity-0");
    modal.classList.add("opacity-100");
  });
}

export function closePdfViewerModal() {
  const modal = document.getElementById("pdf-viewer-modal");
  const iframe = document.getElementById("pdf-viewer-frame");

  if (!modal) return;

  modal.classList.remove("opacity-100");
  modal.classList.add("opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
    if (iframe) iframe.src = "about:blank"; // Unload PDF from memory
  }, 300);
}
