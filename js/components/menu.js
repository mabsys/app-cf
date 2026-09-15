// js/components/menu.js - Sliding Floating Menu Component

export const menuHTML = `
<!-- DIMMED BACKDROP OVERLAY -->
<div id="bottom-sheet-overlay"
     class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 hidden opacity-0 transition-opacity duration-300"></div>

<!-- FLOATING MENU CONTAINER -->
<div id="bottom-sheet-menu"
     class="fixed bottom-3 left-2.5 right-2.5 z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl transform translate-y-[120%] transition-transform duration-300 ease-out max-w-md mx-auto border border-slate-100 dark:border-slate-800 flex flex-col hidden h-[82vh] max-h-[85vh] touch-none overflow-hidden">
  
  <!-- Interactive Drag Handle / Grabber -->
  <div id="sheet-drag-handle" class="w-full py-3 cursor-grab active:cursor-grabbing flex items-center justify-center shrink-0 select-none">
    <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
  </div>

  <!-- CONTAINER CONTENT AREA -->
  <div id="sheet-content" class="relative w-full flex-1 overflow-y-auto overflow-x-hidden pb-6 px-3">

    <!-- PANE 1: MAIN CATEGORIES -->
    <div id="pane-main" class="w-full transition-opacity duration-200">
      <div class="flex flex-col gap-2 pt-1">
        
        <!-- ITEM 1: MY PROFILE -->
        <button type="button" 
                class="nav-item-btn w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between transition-all group shadow-xs cursor-pointer"
                data-target="pane-profile">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">My Profile</div>
              <div class="text-[10px] text-slate-400 font-medium">Quick licence URL & attestation setup</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </button>

        <!-- ITEM 2: APP PREFERENCES -->
        <button type="button" 
                class="nav-item-btn w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between transition-all group shadow-xs cursor-pointer"
                data-target="pane-settings">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h11.25"/></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">App Preferences</div>
              <div class="text-[10px] text-slate-400 font-medium">Text scale, themes & warning thresholds</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </button>

        <!-- ITEM 3: DATA & STORAGE -->
        <button type="button" 
                class="nav-item-btn w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between transition-all group shadow-xs cursor-pointer"
                data-target="pane-storage">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Data & Storage</div>
              <div class="text-[10px] text-slate-400 font-medium">History limits & local data cleanup</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </button>

        <!-- ITEM 4: ABOUT CERTIFLY -->
        <button type="button" 
                class="nav-item-btn w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between transition-all group shadow-xs cursor-pointer"
                data-target="pane-about">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">About & System Status</div>
              <div class="text-[10px] text-slate-400 font-medium">About the app</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </button>

      </div>
    </div>

    <!-- SUB-PANE 1: CREW PROFILE -->
    <div id="pane-profile" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out hidden translate-x-full opacity-0 pointer-events-none px-3 py-1">
      
      <!-- Back Button -->
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-xs font-black text-slate-800 dark:text-slate-100 mb-3.5 px-1 uppercase tracking-wider">Crew Profile Settings</h3>

      <div class="flex flex-col gap-3.5">
        
        <!-- ROW 1: NICKNAME -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Nickname (Short Name)</label>
          <input type="text" id="profile-nickname-input" placeholder="e.g. Salleh" class="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5">Short call sign or preferred name used for quick verifications.</p>
        </div>

        <!-- ROW 2: DIGITAL LICENCE SOURCE -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2.5">Digital Licence Source</label>
          
          <!-- Side-by-Side Mode Selector Buttons -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button id="profile-mode-qr-btn" type="button" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c0 .621.504 1.125 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"/></svg>
              Scan Licence QR
            </button>
            <button id="profile-mode-url-btn" type="button" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>
              Paste URL
            </button>
          </div>

          <!-- Shared Interchangeable Dynamic Area -->
          <div id="profile-source-container" class="w-full">
            
            <!-- Mode A: Live Inline Camera Scanner Container (STRICTLY HIDDEN BY DEFAULT) -->
            <div id="profile-qr-box" class="hidden flex flex-col gap-2.5">
              <div id="profile-qr-reader-container" class="w-full overflow-hidden rounded-2xl bg-slate-900 aspect-square flex items-center justify-center relative shadow-inner">
                <video id="profile-qr-video" class="w-full h-full object-cover" playsinline webkit-playsinline muted></video>
                <div class="absolute bottom-3 left-0 right-0 text-center pointer-events-none z-10">
                  <span class="text-white text-[9px] font-bold uppercase tracking-wider drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.85)]">Point camera at CAAM QR card</span>
                </div>
              </div>
              
              <!-- INVERTED STOP SCANNER BUTTON (DARK BG WITH WHITE TEXT & ICON) -->
              <button id="profile-stop-scan-btn" type="button" class="w-full py-2.5 px-3 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                Stop Scanner
              </button>
            </div>

            <!-- Mode B: URL Input Field Container -->
            <div id="profile-url-box" class="flex flex-col gap-1.5">
              <input type="url" id="profile-url-input" placeholder="https://eclipse.caam.gov.my/..." class="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <!-- Success Status Badge for Captured/Validated URL -->
              <div id="profile-url-status-badge" class="hidden p-2 mt-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                <svg class="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span id="profile-url-status-text">Valid CAAM Licence URL captured</span>
              </div>
            </div>

          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">Saved URL auto-verifies when you tap "Verify Crew Licence".</p>
        </div>

        <!-- ROW 3: COMPANY ATTESTATION PDF FILE UPLOAD -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Company Attestation Document (PDF)</label>
          <div class="flex flex-col gap-2 mt-1">
            <label for="profile-pdf-file" class="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors">
              <span id="profile-pdf-label" class="truncate">Select PDF attestation file...</span>
              <svg class="w-4 h-4 text-blue-600 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"/></svg>
            </label>
            <input type="file" id="profile-pdf-file" accept=".pdf" class="hidden">

            <!-- Success Status Indication Badge -->
            <div id="profile-pdf-status-badge" class="hidden p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              <svg class="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span id="profile-pdf-status-text">PDF loaded successfully</span>
            </div>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">Upload MAB company attestations PDF for compliance checks on Dashboard.</p>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="px-1 flex flex-col gap-2.5 pt-1 pb-3">
          
          <!-- In-App Toast Notification (Eliminates Browser Alert Popups) -->
          <div id="profile-toast" class="hidden p-3 rounded-xl bg-emerald-600 text-white text-xs font-extrabold text-center shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            <span id="profile-toast-msg">Crew profile saved successfully!</span>
          </div>

          <button id="profile-save-btn" type="button" class="w-full p-3 text-xs font-bold text-white bg-blue-600 rounded-xl shadow-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            Save Profile
          </button>

          <button id="profile-clear-btn" type="button" class="w-full p-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 transition-all cursor-pointer">
            Clear Saved Profile
          </button>
        </div>

      </div>
    </div>

    <!-- SUB-PANE 2: APP PREFERENCES -->
    <div id="pane-settings" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out hidden translate-x-full opacity-0 pointer-events-none px-3 py-1">
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-xs font-black text-slate-800 dark:text-slate-100 mb-3.5 px-1 uppercase tracking-wider">App Preferences</h3>

      <div class="flex flex-col gap-3.5">
        
        <!-- Appearance Theme Selector -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Display Theme</label>
          <div class="grid grid-cols-3 gap-1.5 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl">
            <button id="theme-pill-light" type="button" class="theme-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900">Light</button>
            <button id="theme-pill-dark" type="button" class="theme-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900">Dark</button>
            <button id="theme-pill-system" type="button" class="theme-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-xs">System</button>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">Adjust visual theme for day or night operations.</p>
        </div>

        <!-- Text Scale Selector -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Font Text Scale</label>
          <div class="grid grid-cols-3 gap-1.5 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl">
            <button id="text-pill-std" type="button" class="text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center bg-blue-600 text-white shadow-xs font-extrabold">
              <span class="text-xs">Standard</span>
            </button>
            <button id="text-pill-lg" type="button" class="text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold">
              <span class="text-xs">Large</span>
            </button>
            <button id="text-pill-xl" type="button" class="text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold">
              <span class="text-xs">Extra Large</span>
            </button>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">Scales text size across dashboard for easy cockpit viewing.</p>
        </div>

        <!-- Warning Threshold Selector -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Expiry Warning Window</label>
          <div class="grid grid-cols-3 gap-1.5 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl">
            <button id="threshold-pill-30" type="button" class="threshold-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-xs">30 Days</button>
            <button id="threshold-pill-60" type="button" class="threshold-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900">60 Days</button>
            <button id="threshold-pill-90" type="button" class="threshold-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900">90 Days</button>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">Sets the lead time for amber "Expiring Soon" alerts.</p>
        </div>

      </div>
    </div>

    <!-- SUB-PANE 3: DATA & STORAGE -->
    <div id="pane-storage" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out hidden translate-x-full opacity-0 pointer-events-none px-3 py-1">
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-xs font-black text-slate-800 dark:text-slate-100 mb-3.5 px-1 uppercase tracking-wider">Data & Storage Settings</h3>

      <div class="flex flex-col gap-3.5">
        
        <!-- Scan History Retention Limit Pills -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Scan History Limit</label>
          <div class="grid grid-cols-3 gap-1.5 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl">
            <button id="history-limit-10" type="button" class="history-limit-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-xs">10 Records</button>
            <button id="history-limit-20" type="button" class="history-limit-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900">20 Records</button>
            <button id="history-limit-30" type="button" class="history-limit-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900">30 Records</button>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">Maximum number of historical compliance checks saved locally.</p>
        </div>

        <!-- Attestation Freshness Limit Pills -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Attestation Freshness Limit (MAB PDF)</label>
          <div class="grid grid-cols-2 gap-1.5 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl">
            <button id="freshness-limit-14" type="button" class="freshness-limit-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900">14 Days</button>
            <button id="freshness-limit-30" type="button" class="freshness-limit-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-xs">30 Days (Default)</button>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">Company PDF older than this threshold will trigger a VOID stale warning.</p>
        </div>

        <!-- Local Cache Cleanup Actions -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col gap-2.5">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block">Local Device Cache</label>
          
          <button id="storage-clear-history-btn" type="button" class="w-full py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-xl transition-all flex items-center justify-between cursor-pointer">
            <span>Clear Scan History</span>
            <span id="storage-scans-count" class="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md font-semibold">0 Saved</span>
          </button>

          <button id="storage-reset-all-btn" type="button" class="w-full py-2.5 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 rounded-xl transition-all flex items-center justify-between cursor-pointer">
            <span>Reset All App Settings</span>
            <span id="storage-profile-status" class="text-[10px] text-rose-500 font-semibold">Wipe Local Data</span>
          </button>
        </div>

      </div>
    </div>

    <!-- SUB-PANE 4: ABOUT CERTIFLY -->
    <div id="pane-about" class="sub-pane absolute top-0 left-0 w-full transition-all duration-300 ease-in-out hidden translate-x-full opacity-0 pointer-events-none px-3 py-1">
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3 px-1 cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-xs font-black text-slate-800 dark:text-slate-100 mb-3.5 px-1 uppercase tracking-wider">About CertiFly</h3>

      <div class="flex flex-col gap-3.5">
        
        <!-- CARD 1: APP INFO -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <div class="text-sm font-bold text-slate-800 dark:text-slate-100">CertiFly</div>
            <span class="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/40">v2.0</span>
          </div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">CAAM eCLIPSE & MAB E-Attestation Verification Engine</div>
        </div>

        <!-- CARD 2: SYSTEM STATUS -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col gap-1.5">
          <div class="text-[10px] font-extrabold text-slate-400 uppercase">System Status</div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-600 dark:text-slate-300 font-semibold">CAAM eCLIPSE Backend Proxy:</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-bold">Connected</span>
          </div>
        </div>

        <!-- CARD 3: FLIGHT CREW COMPLIANCE NOTICE -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          <strong class="text-slate-700 dark:text-slate-200 block mb-1">Flight Crew Compliance Notice:</strong>
          CertiFly parses official CAAM eCLIPSE digital license QR structures for quick pre-flight verification. Always cross-check official physical or portal documents for mandatory regulatory audits.
        </div>

        <!-- CARD 4: USER GUIDE MANUAL PDF BUTTON -->
        <a href="./assets/user_guide.pdf" target="_blank" rel="noopener" class="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between transition-all group shadow-xs cursor-pointer">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.967 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">User Guide Manual (PDF)</div>
              <div class="text-[10px] text-slate-400 font-medium">Open operational user guide</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
        </a>

        <!-- CARD 5: SEND APP FEEDBACK BUTTON -->
        <a href="mailto:mabsys.dev@gmail.com?subject=CertiFly%20App%20Feedback" class="w-full p-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs">
          <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
          Send App Feedback
        </a>

      </div>
    </div>

  </div>
</div>
`;
