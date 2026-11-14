// ./js/components/menu.js (1411_R444) - CertiFly Slide-over Menu Navigation & Sub-pane Drawer Engine

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
              <div class="text-[10px] text-slate-400">Licence, Attestation, Qualification Slip & Passport</div>
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
              <div class="text-[10px] text-slate-400">Manage scan history & attestation limits, app cache</div>
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
              <div class="text-[10px] text-slate-400">About, Licence Renewal Guide, Feedback</div>
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
              <div class="p-0.5 text-slate-600 dark:text-slate-300">
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
                <p class="text-[9px] text-slate-400">Scan or paste your official eCLIPSE QR or URL</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ACCORDION 2: COMPANY FLIGHT DOCUMENTS (PDF) (SIDE-BY-SIDE GRID) -->
        <div class="accordion-card bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden shadow-xs">
          <button type="button" class="accordion-header w-full p-2.5 flex items-center justify-between text-left cursor-pointer" onclick="if(typeof toggleProfileAccordionSection === 'function') toggleProfileAccordionSection('docs');">
            <div class="flex items-center gap-2.5">
              <div class="p-0.5 text-slate-600 dark:text-slate-300">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"></path></svg>
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
                  <span id="profile-pdf-status-text">Attestation PDF saved</span>
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
                  <span id="profile-qs-pdf-status-text">QS PDF saved</span>
                </div>
              </div>
            </div>
            <p class="text-[9px] text-slate-400">Upload your MAB Attestation and Qualification Slip PDFs</p>
          </div>
        </div>

        <!-- ACCORDION 3: PASSPORT CLEARANCE DETAILS -->
        <div class="accordion-card bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden shadow-xs">
          <button type="button" class="accordion-header w-full p-2.5 flex items-center justify-between text-left cursor-pointer" onclick="if(typeof toggleProfileAccordionSection === 'function') toggleProfileAccordionSection('passport');">
            <div class="flex items-center gap-2.5">
              <div class="p-0.5 text-slate-600 dark:text-slate-300">
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
            <p class="text-[9px] text-slate-400">Enter your passport number and expiry</p>
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
          <p class="text-[9px] text-slate-400 pt-1">Set minimum days before expiry threshold </p>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Event Overlays</label>
          <div class="grid grid-cols-2 gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            <button id="festive-pill-enable" type="button" class="festive-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-xs cursor-pointer">Enabled</button>
            <button id="festive-pill-disable" type="button" class="festive-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">Disabled</button>
          </div>
          <p class="text-[9px] text-slate-400 pt-1">Festive or event overlay in Dashboard (experimental)</p>
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
          <p class="text-[9px] text-slate-400 pt-1">Set the local scan history item limit</p>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Attestation Freshness Limit (MAB PDF)</label>
          <div class="grid grid-cols-2 gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            <button id="freshness-limit-14" type="button" class="freshness-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold bg-transparent">14 Days</button>
            <button id="freshness-limit-30" type="button" class="freshness-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all bg-blue-600 text-white shadow-xs font-extrabold">30 Days (Default)</button>
          </div>
          <p class="text-[9px] text-slate-400 pt-1">Set Attestation PDF recency limit for the Dashboard</p>
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
          <div class="h-24 w-24 bg-[url('/app-cf/assets/icons/icon-192.png')] bg-cover bg-center bg-no-repeat"></div>
          <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100 italic tracking-tight pt-2">CertiFly<span class="font-normal text-[7px]">™</span></h4>
          <p class="text-[10px] italic font-medium text-slate-500 dark:text-slate-400 mt-0.5 text-center">by pilot for pilot...</p>
          <span class="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full mt-1.5">Version 2.0</span>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col gap-2">
          <a href="./assets/user_guide.pdf" target="_blank" class="w-full p-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.967 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25"></path></svg>
            <span>CertiFly User Guide</span>
          </a>

        <a href="./assets/eclipse_guide.pdf" target="_blank" class="w-full p-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.967 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25"></path></svg>
            <span>Licence Renewal Guide</span>
          </a>
    
          <a href="https://forms.gle/oA2XSDomzGF7ioUT8" target="_blank" class="w-full p-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"></path></svg>
            <span>Send App Feedback</span>
          </a>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- EASTER EGG MODAL DRAWER -->
<div id="easter-egg-modal" class="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-between p-4 transition-all duration-300 opacity-0 hidden">
  
  <!-- Header Bar -->
  <div class="w-full max-w-md flex items-center justify-between pt-2 px-2 shrink-0">
    <div class="flex items-center gap-2">
      <span class="text-xs font-black tracking-widest text-blue-400 uppercase">CertiFly™ Break Deck</span>
      <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">3D Rubik's Cube</span>
    </div>
    <button id="close-cube-modal-btn" type="button" onclick="if(typeof closeEasterEggModal === 'function') closeEasterEggModal();" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition-all active:scale-95 cursor-pointer">
      ✕
    </button>
  </div>

  <!-- 3D WebGL Canvas Viewport Container -->
  <div class="w-full max-w-md aspect-square relative flex items-center justify-center my-auto p-2">
    <div id="cube-game-container" class="w-full h-full rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-900/50 relative flex items-center justify-center">
      <canvas id="cube-canvas" class="w-full h-full object-contain cursor-grab active:cursor-grabbing"></canvas>
      <!-- Action Controls Overlay -->
      <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
        <button id="cube-scramble-btn" type="button" class="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-[10px] font-bold border border-slate-700/60 backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-md">
          <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"></path></svg>
          Scramble
        </button>
        <button id="cube-reset-btn" type="button" class="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-[10px] font-bold border border-slate-700/60 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md">
          Reset Solved
        </button>
      </div>
    </div>
  </div>

  <!-- Bottom Info & Control Hint with Caption -->
  <div class="text-center pb-2 shrink-0 flex flex-col items-center gap-1.5 select-none">
    <p class="text-[11px] font-medium text-slate-400">Swipe to rotate layers • Drag background to orbit camera</p>
    <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">Made with <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="#f51348" class="inline-block align-middle mx-0.5"><title fill="#f51348">heart-fill</title><path fill="#f51348" d="M16.696 3C14.652 3 12.887 4.197 12 5.943C11.113 4.197 9.348 3 7.304 3C4.374 3 2 5.457 2 8.481s1.817 5.796 4.165 8.073S12 21 12 21s3.374-2.133 5.835-4.446C20.46 14.088 22 11.514 22 8.481S19.626 3 16.696 3"/></svg> by Captain MSZ</p>
  </div>
</div>
`;

// ==================================================================
// OFFICIAL 3D THREE.JS RUBIK'S CUBE ENGINE & EASTER EGG LIFECYCLE
// ==================================================================
let brandTapCount = 0;
let brandTapTimer = null;

let cubeAnimId = null;
let isCubeInitialized = false;
let scene = null;
let camera = null;
let renderer = null;
let rubiksGroup = null;
let cubelets = [];
let isAnimatingTurn = false;

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotation = { x: -0.45, y: 0.65 };
let currentRotation = { x: -0.45, y: 0.65 };

const CUBE_COLORS = {
  right:  0xDC2626, // Red (+X)
  left:   0xFF5800, // Orange (-X)
  top:    0xFFFFFF, // White (+Y)
  bottom: 0xFFD500, // Yellow (-Y)
  front:  0x16A34A, // Green (+Z)
  back:   0x2563EB, // Blue (-Z)
  inner:  0x0F172A  // Dark Slate core
};

function ensureThreeJS(callback) {
  if (typeof THREE !== 'undefined') {
    if (callback) callback();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = () => { if (callback) callback(); };
  script.onerror = () => { console.warn('Could not load Three.js CDN'); };
  document.head.appendChild(script);
}

function createCubeletMaterials(x, y, z) {
  return [
    new THREE.MeshLambertMaterial({ color: x === 1 ? CUBE_COLORS.right : CUBE_COLORS.inner }),
    new THREE.MeshLambertMaterial({ color: x === -1 ? CUBE_COLORS.left : CUBE_COLORS.inner }),
    new THREE.MeshLambertMaterial({ color: y === 1 ? CUBE_COLORS.top : CUBE_COLORS.inner }),
    new THREE.MeshLambertMaterial({ color: y === -1 ? CUBE_COLORS.bottom : CUBE_COLORS.inner }),
    new THREE.MeshLambertMaterial({ color: z === 1 ? CUBE_COLORS.front : CUBE_COLORS.inner }),
    new THREE.MeshLambertMaterial({ color: z === -1 ? CUBE_COLORS.back : CUBE_COLORS.inner })
  ];
}

function initThreeCubeScene() {
  const container = document.getElementById('cube-game-container');
  const canvas = document.getElementById('cube-canvas');
  if (!container || !canvas || typeof THREE === 'undefined') return false;

  const width = container.clientWidth || 300;
  const height = container.clientHeight || 300;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 9);

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Ambient & Directional Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight1.position.set(5, 10, 7);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.35);
  dirLight2.position.set(-5, -5, -5);
  scene.add(dirLight2);

  rubiksGroup = new THREE.Group();
  scene.add(rubiksGroup);

  buildRubiksCube();
  setupCubeControls(canvas);

  return true;
}

function buildRubiksCube() {
  if (!rubiksGroup) return;
  while (rubiksGroup.children.length > 0) {
    rubiksGroup.remove(rubiksGroup.children[0]);
  }
  cubelets = [];

  const geometry = new THREE.BoxGeometry(0.94, 0.94, 0.94);
  const edgesGeom = new THREE.EdgesGeometry(geometry);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x020617, linewidth: 2 });

  const spacing = 1.0;

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const materials = createCubeletMaterials(x, y, z);
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.position.set(x * spacing, y * spacing, z * spacing);

        const edges = new THREE.LineSegments(edgesGeom, lineMat);
        mesh.add(edges);

        mesh.userData = { initialPos: new THREE.Vector3(x * spacing, y * spacing, z * spacing), gridX: x, gridY: y, gridZ: z };
        rubiksGroup.add(mesh);
        cubelets.push(mesh);
      }
    }
  }

  rubiksGroup.rotation.x = currentRotation.x;
  rubiksGroup.rotation.y = currentRotation.y;
}

function rotateLayer(axis, layerIndex, angle, duration = 240, onComplete = null) {
  if (isAnimatingTurn || !rubiksGroup) return;
  isAnimatingTurn = true;

  const pivot = new THREE.Group();
  rubiksGroup.add(pivot);

  const matchingCubelets = [];
  cubelets.forEach(mesh => {
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    rubiksGroup.worldToLocal(worldPos);
    
    const posVal = Math.round(worldPos[axis]);
    if (posVal === layerIndex) {
      matchingCubelets.push(mesh);
    }
  });

  matchingCubelets.forEach(mesh => {
    pivot.attach(mesh);
  });

  const startTime = performance.now();

  function animateTurn(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    const easeProgress = progress * (2 - progress);

    pivot.rotation[axis] = angle * easeProgress;

    if (progress < 1.0) {
      requestAnimationFrame(animateTurn);
    } else {
      pivot.rotation[axis] = angle;
      pivot.updateMatrixWorld(true);

      matchingCubelets.forEach(mesh => {
        rubiksGroup.attach(mesh);
      });

      rubiksGroup.remove(pivot);
      isAnimatingTurn = false;
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(animateTurn);
}

function scrambleCube() {
  if (isAnimatingTurn) return;
  const axes = ['x', 'y', 'z'];
  const indices = [-1, 0, 1];
  const angles = [Math.PI / 2, -Math.PI / 2];
  let movesCount = 0;
  const totalMoves = 15;

  function doMove() {
    if (movesCount >= totalMoves) return;
    movesCount++;
    const ax = axes[Math.floor(Math.random() * axes.length)];
    const idx = indices[Math.floor(Math.random() * indices.length)];
    const ang = angles[Math.floor(Math.random() * angles.length)];
    rotateLayer(ax, idx, ang, 120, doMove);
  }

  doMove();
}

function setupCubeControls(canvas) {
  if (!canvas) return;
  let startX = 0, startY = 0;

  const onStart = (e) => {
    isDragging = true;
    const pt = e.touches ? e.touches[0] : e;
    previousMousePosition = { x: pt.clientX, y: pt.clientY };
    startX = pt.clientX;
    startY = pt.clientY;
  };

  const onMove = (e) => {
    if (!isDragging || !rubiksGroup) return;
    const pt = e.touches ? e.touches[0] : e;
    const deltaX = pt.clientX - previousMousePosition.x;
    const deltaY = pt.clientY - previousMousePosition.y;

    targetRotation.y += deltaX * 0.008;
    targetRotation.x += deltaY * 0.008;
    targetRotation.x = Math.max(-1.4, Math.min(1.4, targetRotation.x));

    previousMousePosition = { x: pt.clientX, y: pt.clientY };
  };

  const onEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;
    const pt = e.changedTouches ? e.changedTouches[0] : e;
    if (!pt) return;
    const totalDx = pt.clientX - startX;
    const totalDy = pt.clientY - startY;

    if (Math.abs(totalDx) > 30 || Math.abs(totalDy) > 30) {
      if (Math.abs(totalDx) > Math.abs(totalDy)) {
        const dir = totalDx > 0 ? Math.PI / 2 : -Math.PI / 2;
        const layerIdx = totalDy < -10 ? 1 : (totalDy > 10 ? -1 : 0);
        rotateLayer('y', layerIdx, dir);
      } else {
        const dir = totalDy > 0 ? Math.PI / 2 : -Math.PI / 2;
        const layerIdx = totalDx < -10 ? -1 : (totalDx > 10 ? 1 : 0);
        rotateLayer('x', layerIdx, dir);
      }
    }
  };

  canvas.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  canvas.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onEnd);

  document.getElementById('cube-scramble-btn')?.addEventListener('click', scrambleCube);
  document.getElementById('cube-reset-btn')?.addEventListener('click', () => {
    if (!isAnimatingTurn) buildRubiksCube();
  });
}

function renderCubeLoop() {
  if (!renderer || !scene || !camera) return;

  if (rubiksGroup) {
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;
    rubiksGroup.rotation.x = currentRotation.x;
    rubiksGroup.rotation.y = currentRotation.y;
  }

  renderer.render(scene, camera);
  cubeAnimId = requestAnimationFrame(renderCubeLoop);
}

export function launchCubeGame() {
  const container = document.getElementById('cube-game-container');
  const canvas = document.getElementById('cube-canvas');
  if (!container || !canvas) return;

  ensureThreeJS(() => {
    if (!isCubeInitialized) {
      if (initThreeCubeScene()) {
        isCubeInitialized = true;
      }
    }

    if (renderer && container) {
      const width = container.clientWidth || 300;
      const height = container.clientHeight || 300;
      renderer.setSize(width, height);
      if (camera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }

    if (!cubeAnimId) {
      renderCubeLoop();
    }
  });
}

export function dismissCubeGame() {
  if (cubeAnimId) {
    cancelAnimationFrame(cubeAnimId);
    cubeAnimId = null;
  }
}

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
  launchCubeGame();
}

export function closeEasterEggModal() {
  const modal = document.getElementById('easter-egg-modal');
  if (modal) {
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }
  dismissCubeGame();
}

if (typeof window !== 'undefined') {
  window.handleBrandCardTap = handleBrandCardTap;
  window.openEasterEggModal = openEasterEggModal;
  window.closeEasterEggModal = closeEasterEggModal;
  window.launchCubeGame = launchCubeGame;
  window.dismissCubeGame = dismissCubeGame;
}
