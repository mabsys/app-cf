// js/components/menu.js - Sliding Floating Menu Component

export const menuHTML = `
<!-- DIMMED BACKDROP OVERLAY -->
<div id="bottom-sheet-overlay"
     class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 hidden opacity-0 transition-opacity duration-300"></div>

<!-- FLOATING MENU CONTAINER (Inset width, rounded corners, stretched height) -->
<div id="bottom-sheet-menu"
     class="fixed bottom-3 left-2.5 right-2.5 z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl transform translate-y-[120%] transition-transform duration-300 ease-out max-w-md mx-auto border border-slate-100 dark:border-slate-800 flex flex-col hidden h-[82vh] max-h-[85vh] touch-none overflow-hidden">
  
  <!-- Interactive Drag Handle / Grabber -->
  <div id="sheet-drag-handle" class="w-full py-3 cursor-grab active:cursor-grabbing flex items-center justify-center shrink-0 select-none">
    <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
  </div>

  <!-- CONTAINER CONTENT AREA -->
  <div id="sheet-content" class="relative w-full flex-1 overflow-y-auto overflow-x-hidden pb-6 px-3">

    <!-- PANE 1: MAIN CATEGORIES -->
    <div id="pane-main" class="w-full transition-all duration-300 ease-in-out">
      <div class="flex flex-col gap-2.5 px-1">

        <!-- Category 1: My Profile -->
        <button class="nav-item-btn w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 active:scale-[0.98] transition-all"
                data-target="pane-profile">
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
              </svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">My Profile</div>
              <div class="text-[10px] text-slate-400">Manage nickname, licence QR / URL & attestations</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <!-- Category 2: App Settings -->
        <button class="nav-item-btn w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 active:scale-[0.98] transition-all"
                data-target="pane-settings">
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h2.25m-2.25 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h11.25"></path>
              </svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">App Settings</div>
              <div class="text-[10px] text-slate-400">Appearance, text size & warning thresholds</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <!-- Category 3: Data & Storage -->
        <button class="nav-item-btn w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 active:scale-[0.98] transition-all"
                data-target="pane-storage">
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"></path>
              </svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Data & Storage</div>
              <div class="text-[10px] text-slate-400">Scan history limits, usage metrics & reset</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <!-- Category 4: About CertiFly -->
        <button class="nav-item-btn w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 active:scale-[0.98] transition-all"
                data-target="pane-about">
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"></path>
              </svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">About CertiFly</div>
              <div class="text-[10px] text-slate-400">App details, version & proxy connection</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
        </button>

      </div>
    </div>

    <!-- SUB-PANE 1: MY PROFILE -->
    <div id="pane-profile" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out hidden translate-x-full opacity-0 pointer-events-none px-3 py-1">
      
      <!-- Back Button -->
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-xs font-black text-slate-800 dark:text-slate-100 mb-3.5 px-1 uppercase tracking-wider">Pilot Profile Settings</h3>

      <div class="flex flex-col gap-3.5">
        
        <!-- ROW 1: NICKNAME -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Nickname (Short Name)</label>
          <input type="text" id="profile-nickname-input" placeholder="e.g. Salleh" class="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <p class="text-[9px] text-slate-400 mt-1">Short call sign or preferred name used for quick verifications.</p>
        </div>

        <!-- ROW 2: DIGITAL LICENCE SOURCE -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2.5">Digital Licence Source</label>
          
          <!-- Side-by-Side Mode Selector Buttons -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button id="profile-mode-qr-btn" type="button" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c0 .621.504 1.125 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c0 .621.504 1.125 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"/></svg>
              Scan Licence QR
            </button>
            <button id="profile-mode-url-btn" type="button" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>
              Paste URL
            </button>
          </div>

          <!-- Shared Dynamic Container -->
          <div id="profile-source-container" class="w-full">
            
            <!-- Mode A: Live Inline Camera Scanner Container (STRICTLY HIDDEN BY DEFAULT) -->
            <div id="profile-qr-box" class="hidden flex flex-col gap-2">
              <div id="profile-qr-reader-container" class="w-full overflow-hidden rounded-2xl bg-slate-900 aspect-square flex items-center justify-center relative shadow-inner">
                <video id="profile-qr-video" class="w-full h-full object-cover" playsinline webkit-playsinline muted></video>
                <div class="absolute bottom-3 left-0 right-0 text-center pointer-events-none z-10">
                  <span class="text-white text-[9px] font-bold uppercase tracking-wider drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.85)]">Point camera at CAAM QR card</span>
                </div>
              </div>
              <p class="text-[9px] text-slate-400 text-center">Camera active — scanning automatically extracts & updates licence validities.</p>
            </div>

            <!-- Mode B: Manual Paste URL Input Container -->
            <div id="profile-url-box" class="hidden flex flex-col gap-2">
              <input type="url" id="profile-url-input" placeholder="https://eclipse.caam.gov.my/ELICENSING/..." class="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <p class="text-[9px] text-slate-400">Paste your official eCLIPSE URL directly if QR camera scanning is unavailable.</p>
            </div>

          </div>
        </div>

        <!-- ROW 3: COMPANY ATTESTATION PDF FILE UPLOAD -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Company Attestation Document (PDF)</label>
          <div class="flex items-center gap-2 mt-1">
            <label for="profile-pdf-file" class="flex-1 cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors">
              <span id="profile-pdf-label" class="truncate">Select PDF attestation file...</span>
              <svg class="w-4 h-4 text-blue-600 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"/></svg>
            </label>
            <input type="file" id="profile-pdf-file" accept=".pdf" class="hidden">
          </div>
          <p class="text-[9px] text-slate-400 mt-1">Upload MAB company attestations PDF for compliance checks on Dashboard.</p>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="px-1 flex flex-col gap-2.5 pt-1 pb-3">
          <button id="profile-save-btn" type="button" class="w-full p-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5">
            Save Pilot Profile
          </button>
          <button id="profile-clear-btn" type="button" class="w-full p-3 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 transition-all">
            Clear Profile
          </button>
        </div>

      </div>
    </div>

    <!-- SUB-PANE 2: APP SETTINGS -->
    <div id="pane-settings" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out hidden translate-x-full opacity-0 pointer-events-none px-3 py-1">
      
      <!-- Back Button -->
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-xs font-black text-slate-800 dark:text-slate-100 mb-3.5 px-1 uppercase tracking-wider">App Settings & Appearance</h3>

      <div class="flex flex-col gap-3.5">
        
        <!-- CARD 1: THEME MODE -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Theme Mode</label>
          <p class="text-[9px] text-slate-400 mb-2.5">Choose your preferred visual theme.</p>
          
          <!-- 3 Connected-Pill Selector -->
          <div class="grid grid-cols-3 gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl">
            <button id="theme-pill-light" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">Light</button>
            <button id="theme-pill-dark" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">Dark</button>
            <button id="theme-pill-system" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">System</button>
          </div>
        </div>

        <!-- CARD 2: TEXT SCALE -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Text Scale</label>
          <p class="text-[9px] text-slate-400 mb-2.5">Adjust content font size for readability.</p>
          
          <!-- 3 Connected-Pill Selector -->
          <div class="grid grid-cols-3 gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl">
            <button id="text-pill-std" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">A (Std)</button>
            <button id="text-pill-lg" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">A (Large)</button>
            <button id="text-pill-xl" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">A (XL)</button>
          </div>
        </div>

        <!-- CARD 3: CHECKER WARNING THRESHOLD -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Warning Threshold</label>
          <p class="text-[9px] text-slate-400 mb-2.5">Flag items expiring within selected days.</p>
          
          <!-- 3 Connected-Pill Selector -->
          <div class="grid grid-cols-3 gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl">
            <button id="threshold-pill-30" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">30 Days</button>
            <button id="threshold-pill-60" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">60 Days</button>
            <button id="threshold-pill-90" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">90 Days</button>
          </div>
        </div>

      </div>
    </div>

    <!-- SUB-PANE 3: DATA & STORAGE -->
    <div id="pane-storage" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out hidden translate-x-full opacity-0 pointer-events-none px-3 py-1">
      
      <!-- Back Button -->
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-xs font-black text-slate-800 dark:text-slate-100 mb-3.5 px-1 uppercase tracking-wider">Data & Storage Management</h3>

      <div class="flex flex-col gap-3.5">
        
        <!-- CARD 1: HISTORY STORAGE LIMIT -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Scan History Limit</label>
          <p class="text-[9px] text-slate-400 mb-2.5">Maximum number of historical scans kept on device.</p>
          
          <!-- 3 Connected-Pill Selector -->
          <div class="grid grid-cols-3 gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl">
            <button id="history-limit-10" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">10 Items</button>
            <button id="history-limit-20" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">20 Items</button>
            <button id="history-limit-30" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300">30 Items</button>
          </div>
        </div>

        <!-- CARD 2: STORAGE USAGE METRICS -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col gap-2">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block">Storage Usage Metrics</label>
          
          <div class="flex justify-between items-center text-xs py-1 border-b border-slate-200/60 dark:border-slate-700/60">
            <span class="font-medium text-slate-600 dark:text-slate-300">Saved History Records</span>
            <span id="storage-scans-count" class="font-extrabold text-blue-600 dark:text-blue-400">0 / 10</span>
          </div>

          <div class="flex justify-between items-center text-xs py-1">
            <span class="font-medium text-slate-600 dark:text-slate-300">Saved Pilot Profile</span>
            <span id="storage-profile-status" class="font-bold text-slate-400">No Profile Saved</span>
          </div>
        </div>

        <!-- CARD 3: STORAGE ACTIONS -->
        <div class="px-1 flex flex-col gap-2.5 pt-1 pb-3">
          <button id="storage-clear-history-btn" type="button" class="w-full p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 font-bold text-xs rounded-xl transition-all hover:bg-amber-100">
            Clear Scan History
          </button>

          <button id="storage-reset-all-btn" type="button" class="w-full p-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm">
            Reset All Application Data
          </button>
        </div>

      </div>
    </div>

    <!-- SUB-PANE 4: ABOUT CERTIFLY -->
    <div id="pane-about" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out hidden translate-x-full opacity-0 pointer-events-none px-3 py-1">
      
      <!-- Back Button -->
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-xs font-black text-slate-800 dark:text-slate-100 mb-3.5 px-1 uppercase tracking-wider">About CertiFly</h3>

      <div class="flex flex-col gap-3.5">
        
        <!-- CARD 1: APP INFO -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col gap-2">
          <div class="flex items-center gap-2.5">
            <div class="p-2 bg-blue-600 text-white rounded-xl font-black italic text-xs">CF</div>
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">CertiFly™ Digital Licence Checker</div>
              <div class="text-[10px] text-slate-400">Version 3.0 (PWA)</div>
            </div>
          </div>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
            Built for flight crew and flight operations to rapidly verify Civil Aviation Authority of Malaysia (CAAM) digital pilot credentials and validities.
          </p>
        </div>

        <!-- CARD 2: BACKEND PROXY -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col gap-1.5">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block">CAAM eCLIPSE Connection Proxy</label>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">app-cf-sigma.vercel.app</span>
          </div>
          <p class="text-[9px] text-slate-400">Secure CORS bridge fetching live eCLIPSE licence validities.</p>
        </div>

        <!-- CARD 3: COMPLIANCE NOTICE -->
        <div class="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-300">
          <div class="text-[10px] font-extrabold uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
            Crew Verification Notice
          </div>
          <p class="text-[9px] leading-relaxed opacity-90">
            Always perform mandatory cross-checks against official CAAM eCLIPSE portal documents before flight duty.
          </p>
        </div>

      </div>
    </div>

  </div>
</div>
`;
