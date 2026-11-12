// ./js/components/menu.js (1111_R438) - CertiFly Slide-over Menu Navigation & Sub-pane Drawer Engine

export const menuHTML = `
<!-- DIMMED BACKDROP OVERLAY -->
<div id="bottom-sheet-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 hidden opacity-0 transition-opacity duration-300"></div>

<!-- FLOATING MENU CONTAINER -->
<div id="bottom-sheet-menu" class="fixed bottom-3 left-2.5 right-2.5 z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-md transform translate-y-[120%] transition-transform duration-300 ease-out max-w-md mx-auto border border-slate-100 dark:border-slate-800 flex flex-col hidden h-[82vh] max-h-[85vh] touch-none overflow-hidden">
  
  <!-- Interactive Drag Handle / Grabber -->
  <div id="sheet-drag-handle" class="w-full py-3 cursor-grab active:cursor-grabbing flex items-center justify-center shrink-0 select-none">
    <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
  </div>

  <!-- CONTAINER CONTENT AREA -->
  <div id="sheet-content" class="relative w-full flex-1 overflow-y-auto overflow-x-hidden pb-6 px-3">

    <!-- PANE 1: MAIN CATEGORIES -->
    <div id="pane-main" class="w-full transition-opacity duration-300 ease-in-out opacity-100 pointer-events-auto">
      <div class="flex flex-col gap-2.5 px-1">
        <!-- Category 0: My Profile -->
        <button class="nav-item-btn w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 active:scale-[0.98] transition-all cursor-pointer" data-target="pane-profile">
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 bg-slate-200/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">My Credentials</div>
              <div class="text-[10px] text-slate-400">Manage licence, company docs &amp; passport</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <!-- Category 1: App Preferences -->
        <button class="nav-item-btn w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 active:scale-[0.98] transition-all cursor-pointer" data-target="pane-settings">
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 bg-slate-200/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.27 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">App Preferences</div>
              <div class="text-[10px] text-slate-400">App theme, font scaling &amp; alerts</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <!-- Category 2: Data & Storage -->
        <button class="nav-item-btn w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 active:scale-[0.98] transition-all cursor-pointer" data-target="pane-storage">
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 bg-slate-200/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"></path></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Data &amp; Storage</div>
              <div class="text-[10px] text-slate-400">Manage scan history limits &amp; app cache</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <!-- Category 3: About & Support -->
        <button class="nav-item-btn w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 active:scale-[0.98] transition-all cursor-pointer" data-target="pane-about">
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 bg-slate-200/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"></path></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">About &amp; Support</div>
              <div class="text-[10px] text-slate-400">App version, user manual </div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>

    <!-- SUB-PANE 0: MY PROFILE (COLLAPSIBLE ACCORDIONS) -->
    <div id="pane-profile" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out px-3 py-1 translate-x-full opacity-0 pointer-events-none hidden">
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>
      
      <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 mb-3.5 px-1 tracking-normal">My Credentials</h3>

      <div class="flex flex-col gap-2.5">
        <!-- ACCORDION 1: DIGITAL LICENCE SOURCE (DEFAULT EXPANDED) -->
        <div class="accordion-card bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden shadow-xs">
          <button type="button" class="accordion-header w-full p-2.5 flex items-center justify-between text-left cursor-pointer" onclick="if(typeof toggleProfileAccordionSection === 'function') toggleProfileAccordionSection('licence');">
            <div class="flex items-center gap-2.5">
              <div class="p-0.5 text-slate-300">
                <svg class="w-4 h-4" fill="currentColor" stroke="none" viewBox="0 0 24 24" stroke-width="1"><path d="M14 13h5v-2h-5zm0-3h5V8h-5zm-9 6h8v-.55q0-1.125-1.1-1.787T9 13t-2.9.663T5 15.45zm5.413-4.587Q11 10.825 11 10t-.587-1.412T9 8t-1.412.588T7 10t.588 1.413T9 12t1.413-.587M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20z"></path></svg>
              </div>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Digital Licence</span>
            </div>
            <svg id="arrow-licence" class="w-4 h-4 text-slate-400 transition-transform duration-300 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="transform: rotate(0deg);"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          <div id="section-content-licence" class="p-3.5 pt-0 border-t border-slate-200/60 dark:border-slate-700/50 hidden" style="height: 0px; opacity: 0;">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase block my-2.5">Digital Licence Source</label>

            <div class="grid grid-cols-2 gap-2 mb-3">
              <button id="profile-mode-qr-btn" type="button" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"></path></svg>
                Scan Licence QR
              </button>

              <button id="profile-mode-url-btn" type="button" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"></path></svg>
                Paste URL
              </button>
            </div>

            <div id="profile-source-container" class="w-full">
              <div id="profile-qr-box" class="flex flex-col gap-2 hidden">
                <div id="profile-qr-reader-container" class="w-full overflow-hidden rounded-2xl bg-slate-900 aspect-square flex items-center justify-center relative shadow-inner">
                  <video id="profile-qr-video" class="w-full h-full object-cover" playsinline="" webkit-playsinline="" muted="" disablepictureinpicture="" style="transform: none;"></video>
                  <div id="profile-qr-reticle" class="absolute w-44 h-44 border-2 border-dashed border-white/80 rounded-2xl pointer-events-none transition-all shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]"></div>
                  <div class="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none z-10">
                    <span id="profile-qr-guidance-pill" class="text-[10px] font-bold text-white bg-black/75 px-3.5 py-1.5 rounded-2xl backdrop-blur-md uppercase tracking-wider shadow-sm text-center border border-white/10 leading-tight flex flex-col items-center gap-0.5"><span>Place QR code within scan area</span><span class="text-[9px] text-slate-300 font-medium normal-case tracking-normal">Avoid glare &amp; shadows</span></span>
                  </div>
                </div>

                <div id="profile-scanner-controls" class="flex-col gap-2 mt-1 hidden">
                  <button id="profile-stop-qr-btn" type="button" class="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2.5 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer hidden">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"></path></svg>
                    Stop Scanner
                  </button>

                  <div class="grid grid-cols-2 gap-2">
                    <button id="profile-cycle-btn" type="button" class="py-2 px-3 bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"></path></svg>
                      Switch Lens
                    </button>

                    <button id="profile-upload-qr-btn" type="button" class="py-2 px-3 bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                      Scan Photo
                    </button>
                  </div>

                  <button id="profile-torch-btn" type="button" class="w-full py-2 px-3 bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"></path></svg>
                    Flashlight
                  </button>

                  <input type="file" id="profile-qr-file-input" accept="image/*" class="hidden">
                </div>
              </div>

              <div id="profile-url-box" class="flex flex-col gap-2">
                <div class="relative w-full">
                  <input type="url" id="profile-url-input" placeholder="https://eclipse.caam.gov.my/ELICENSING/..." class="w-full p-2.5 pr-8 rounded-xl border text-xs font-semibold focus:outline-none transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                  <button id="profile-url-clear-btn" type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer hidden" title="Clear URL">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <p class="text-[9px] text-slate-400">Scan or paste your official eCLIPSE QR or URL.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ACCORDION 2: COMPANY FLIGHT DOCUMENTS (PDF) (SIDE-BY-SIDE GRID) -->
        <div class="accordion-card bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden shadow-xs">
          <button type="button" class="accordion-header w-full p-2.5 flex items-center justify-between text-left cursor-pointer" onclick="if(typeof toggleProfileAccordionSection === 'function') toggleProfileAccordionSection('docs');">
            <div class="flex items-center gap-2.5">
              <div class="p-0.5 text-slate-300">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"></path></svg>
              </div>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Company Documents (PDF)</span>
            </div>
            <svg id="arrow-docs" class="w-4 h-4 text-slate-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="transform: rotate(0deg);"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          <div id="section-content-docs" class="p-3.5 pt-0 border-t border-slate-200/60 dark:border-slate-700/50 hidden" style="height: 0px; opacity: 0;">
            <div class="grid grid-cols-2 gap-2 my-2.5">
              <!-- Left Col: Attestation PDF -->
              <div class="flex flex-col gap-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <label class="text-[9px] font-extrabold text-slate-400 uppercase truncate">Company Attestation</label>
                <label for="profile-pdf-file" class="cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors">
                  <span id="profile-pdf-label" class="truncate">Select PDF...</span>
                  <svg class="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"></path></svg>
                </label>
                <input type="file" id="profile-pdf-file" accept=".pdf" class="hidden">
                <div id="profile-pdf-badge" class="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1 hidden">
                  <span id="profile-pdf-status-text">Stored Attestation PDF file</span>
                </div>
              </div>

              <!-- Right Col: Qualification Slip PDF -->
              <div class="flex flex-col gap-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <label class="text-[9px] font-extrabold text-slate-400 uppercase truncate">Qualification Slip</label>
                <label for="profile-qs-pdf-file" class="cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors">
                  <span id="profile-qs-pdf-label" class="truncate">Select PDF...</span>
                  <svg class="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"></path></svg>
                </label>
                <input type="file" id="profile-qs-pdf-file" accept=".pdf" class="hidden">
                <div id="profile-qs-pdf-badge" class="hidden text-[9px] text-emerald-600 font-extrabold flex items-center gap-1">
                  <span id="profile-qs-pdf-status-text">✓ Valid QS</span>
                </div>
              </div>
            </div>
            <p class="text-[9px] text-slate-400">Upload your MAB Attestation and Qualification Slip PDFs.</p>
          </div>
        </div>

        <!-- ACCORDION 3: PASSPORT CLEARANCE DETAILS -->
        <div class="accordion-card bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden shadow-xs">
          <button type="button" class="accordion-header w-full p-2.5 flex items-center justify-between text-left cursor-pointer" onclick="if(typeof toggleProfileAccordionSection === 'function') toggleProfileAccordionSection('passport');">
            <div class="flex items-center gap-2.5">
              <div class="p-0.5 text-slate-300">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linejoin="round" d="M4 6H17C18.6569 6 20 7.34315 20 9V19C20 20.6569 18.6569 22 17 22H7C5.34315 22 4 20.6569 4 19V6ZM4 6V5"></path><circle cx="12" cy="13" r="3"></circle><path stroke-linejoin="round" d="M18 6.00002H5.07107C4.47953 6.00002 4 5.52049 4 4.92895C4 4.39594 4.39193 3.94403 4.91959 3.86865L15.7172 2.32614C16.922 2.15402 18 3.08894 18 4.30604V6.00002Z"></path><path d="M10 19H14"></path></svg>
              </div>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Passport Details</span>
            </div>
            <svg id="arrow-passport" class="w-4 h-4 text-slate-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="transform: rotate(0deg);"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          <div id="section-content-passport" class="p-3.5 pt-0 border-t border-slate-200/60 dark:border-slate-700/50 hidden" style="height: 0px; opacity: 0;">
            <div class="grid grid-cols-2 gap-2.5 my-2.5">
              <div>
                <span class="text-[9px] text-slate-400 font-semibold block mb-1">Passport Number</span>
                <input type="text" id="profile-passport-no" maxlength="12" placeholder="e.g. A12345678" class="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none uppercase tracking-wider transition-all">
              </div>

              <div>
                <span class="text-[9px] text-slate-400 font-semibold block mb-1">Expiry Date</span>
                <button type="button" id="btn-passport-expiry-trigger" class="efb-date-trigger w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 text-left flex items-center justify-between cursor-pointer active:scale-[0.99]" onclick="openEfbDatePicker('profile-passport-expiry', 'PASSPORT EXPIRY DATE')">
                  <span id="profile-passport-expiry-display" class="font-sans text-slate-700 dark:text-slate-300">Select Expiry</span>
                  <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>
                <input type="hidden" id="profile-passport-expiry" value="">
              </div>
            </div>
            <p class="text-[9px] text-slate-400">Enter your passport number and expiry.</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons (Solid Colored) -->
      <div class="px-1 flex flex-col gap-2 pt-3 py-3">
        <button id="profile-save-btn" type="button" class="w-full p-3.5 bg-slate-600 hover:bg-slate-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">Save Credentials</button>

        <button id="profile-clear-btn" type="button" class="w-full p-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
          Clear Credentials
        </button>
      </div>
    </div>

    <!-- SUB-PANE 1: APP PREFERENCES -->
    <div id="pane-settings" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out px-3 py-1 translate-x-full opacity-0 pointer-events-none hidden">
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 mb-3.5 px-1 tracking-normal">App Display &amp; Preferences</h3>

      <div class="flex flex-col gap-3.5">
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Appearance Theme</label>
          <div class="grid grid-cols-3 gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            <button id="theme-pill-light" type="button" class="theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold">Light</button>
            <button id="theme-pill-dark" type="button" class="theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all bg-blue-600 text-white shadow-xs font-extrabold">Dark</button>
            <button id="theme-pill-system" type="button" class="theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold">System</button>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Text Font Scaling</label>
          <div class="grid grid-cols-3 gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            <button id="text-pill-std" type="button" class="text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center bg-blue-600 text-white shadow-xs font-extrabold"><span class="text-[10px] font-bold">A</span></button>
            <button id="text-pill-lg" type="button" class="text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold"><span class="text-xs font-bold">A</span></button>
            <button id="text-pill-xl" type="button" class="text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold"><span class="text-sm font-extrabold">A</span></button>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Expiry Warning Threshold</label>
          <div class="grid grid-cols-3 gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            <button id="threshold-pill-30" type="button" class="threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold">30 Days</button>
            <button id="threshold-pill-60" type="button" class="threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold">60 Days</button>
            <button id="threshold-pill-90" type="button" class="threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all bg-blue-600 text-white shadow-xs font-extrabold">90 Days</button>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Event Overlays</label>
          <div class="grid grid-cols-2 gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            <button id="festive-pill-enable" type="button" class="festive-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-xs cursor-pointer">Enabled</button>
            <button id="festive-pill-disable" type="button" class="festive-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">Disabled</button>
          </div>
        </div>
      </div>
    </div>

    <!-- SUB-PANE 2: DATA & STORAGE -->
    <div id="pane-storage" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out px-3 py-1 translate-x-full opacity-0 pointer-events-none hidden">
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 mb-3.5 px-1 tracking-normal">Data &amp; Storage Management</h3>

      <div class="flex flex-col gap-3.5">
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Scan History Storage Limit</label>
          <div class="grid grid-cols-3 gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            <button id="history-limit-10" type="button" class="history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all bg-blue-600 text-white shadow-xs font-extrabold">10 Items</button>
            <button id="history-limit-20" type="button" class="history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold">20 Items</button>
            <button id="history-limit-30" type="button" class="history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold">30 Items</button>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Attestation Freshness Limit (MAB PDF)</label>
          <div class="grid grid-cols-2 gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            <button id="freshness-limit-14" type="button" class="freshness-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold bg-transparent">14 Days</button>
            <button id="freshness-limit-30" type="button" class="freshness-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all bg-blue-600 text-white shadow-xs font-extrabold">30 Days (Default)</button>
          </div>
        </div>

        <!-- Data Action Buttons (Solid Colored) -->
        <div class="px-1 flex flex-col gap-2.5 pt-1 pb-3">
          <button id="storage-clear-history-btn" type="button" class="w-full p-3.5 text-xs font-bold text-white bg-slate-600 hover:bg-slate-700 active:scale-[0.98] rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer">Clear Recent Scan History</button>
          <button id="storage-reset-all-btn" type="button" class="w-full p-3.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer">Reset All Application Data</button>
        </div>
      </div>
    </div>

    <!-- SUB-PANE 3: ABOUT CERTIFLY -->
    <div id="pane-about" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out px-3 py-1 translate-x-full opacity-0 pointer-events-none hidden">
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 mb-3.5 px-1 tracking-normal">About &amp; Support</h3>

      <div class="flex flex-col gap-3.5 pb-3">
        <!-- Brand Card with 14-Tap Trigger & Centered Tagline -->
        <div id="brand-card-about" class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs text-center flex flex-col items-center select-none" onclick="if(typeof handleBrandCardTap === 'function') handleBrandCardTap();">
          <div class="h-24 w-24 bg-[url('/assets/icons/icon-192.png')] bg-cover bg-center bg-no-repeat"></div>
          <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100 italic tracking-tight pt-2">CertiFly<span class="font-normal text-[7px]">™</span></h4>
          <p class="text-[10px] italic font-medium text-slate-500 dark:text-slate-400 mt-0.5 text-center">by pilot for pilot...</p>
          <span class="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full mt-1.5">Version 2.0</span>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col gap-2">
          <a href="./assets/user_guide.pdf" target="_blank" class="w-full p-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.967 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25"></path></svg>
            <span>CertiFly User Guide</span>
          </a>

        <a href="./assets/eclipse_user_guide.pdf" target="_blank" class="w-full p-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.967 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25"></path></svg>
            <span>eClipse Licence Renewal Guide</span>
          </a>
    
          <a href="[suspicious link removed]" target="_blank" class="w-full p-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"></path></svg>
            <span>Send App Feedback</span>
          </a>
        </div>
      </div>
    </div>

  </div>
</div>
<!-- EASTER EGG MODAL DRAWER -->
<div id="easter-egg-modal" class="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 opacity-0 hidden">
  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center text-center relative animate-fade-in">
    <!-- Pirate Flag SVG Logo -->
    <div class="w-full text-white rounded-2xl flex items-center justify-center shadow-md mb-3 ">
      <svg xmlns="http://www.w3.org/2000/svg" width="5em" height="5em" viewBox="8 8 16 16" class=""><title>pirate-flag</title><g fill="none"><path fill="" d="M2 7a1 1 0 0 1 1-1h26a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"></path><path fill="#f3eef8" d="M11.707 10.707A1 1 0 1 0 10 10a1 1 0 1 0 .707 1.707l1.116 1.116a.25.25 0 0 0 .354 0l.646-.646a.25.25 0 0 0 0-.354zm0 10.482a1 1 0 1 1-1.707.707a1 1 0 1 1 .707-1.707l1.116-1.116a.25.25 0 0 1 .354 0l.646.647a.25.25 0 0 1 0 .353zM19.897 10c0 .276.111.526.292.707l-1.116 1.116a.25.25 0 0 0 0 .354l.647.646a.25.25 0 0 0 .353 0l1.116-1.116A1 1 0 1 0 21.896 10a1 1 0 1 0-2 0m.292 11.19a1 1 0 1 0 1.707.707a1 1 0 1 0-.707-1.708l-1.116-1.116a.25.25 0 0 0-.353 0l-.647.647a.25.25 0 0 0 0 .353zM19.75 15c0-1.933-1.679-3.5-3.75-3.5s-3.75 1.567-3.75 3.5c0 .442.088.864.248 1.253l-.274.41a1.5 1.5 0 0 0 .934 2.3l.342.073v.714a.75.75 0 0 0 1.5 0v-.5h.25v.5a.75.75 0 0 0 1.5 0v-.5H17v.5a.75.75 0 0 0 1.5 0v-.714l.342-.074a1.5 1.5 0 0 0 .934-2.298l-.274-.41c.16-.39.248-.812.248-1.254m-4.82 1.582c-.48.482-1.184.558-1.57.172c-.323-.323-.27-1.3.074-1.645c.343-.343 1.396-.369 1.668-.097c.386.386.31 1.09-.172 1.57m3.7.172c-.387.386-1.09.31-1.571-.172c-.481-.48-.558-1.184-.172-1.57c.272-.272 1.325-.246 1.668.097c.344.344.397 1.322.074 1.645m-2.847.126a.25.25 0 0 1 .434 0l.57.996a.25.25 0 0 1-.218.374H15.43a.25.25 0 0 1-.217-.374z"></path></g></svg>
    </div>
    
    <h3 class="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">Ahoy, Crew!</h3>
    <p class="text-xs font-normal text-slate-600 dark:text-slate-300 leading-relaxed">Crafted 'n coded with heart, matey!</p>      <p class="text-xs font-normal text-slate-600 dark:text-slate-300 leading-relaxed mb-4">- Captain MSZ</p>

    <button type="button" onclick="if(typeof closeEasterEggModal === 'function') closeEasterEggModal();" class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer animate-pulse">Now Be off with Ye!</button>
  </div>
</div>
`;

// ==================================================================
// EASTER EGG HANDLERS
// ==================================================================
let brandTapCount = 0;
let brandTapTimer = null;

export function handleBrandCardTap() {
  brandTapCount++;
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(20);
  }
  
  if (brandTapCount >= 14) {
    brandTapCount = 0;
    openEasterEggModal();
  } else {
    clearTimeout(brandTapTimer);
    brandTapTimer = setTimeout(() => {
      brandTapCount = 0;
    }, 2000);
  }
}

export function openEasterEggModal() {
  const modal = document.getElementById('easter-egg-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
  });
}

export function closeEasterEggModal() {
  const modal = document.getElementById('easter-egg-modal');
  if (!modal) return;
  modal.classList.add('opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
}

// Global window exposure for inline onclick handlers
if (typeof window !== 'undefined') {
  window.handleBrandCardTap = handleBrandCardTap;
  window.openEasterEggModal = openEasterEggModal;
  window.closeEasterEggModal = closeEasterEggModal;
}
