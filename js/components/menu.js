// js/components/menu.js - Sliding Floating Menu Component

export const menuHTML = `
<!-- DIMMED BACKDROP OVERLAY -->
<div id="bottom-sheet-overlay" class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 hidden opacity-0 transition-opacity duration-300"></div>

<!-- BOTTOM SHEET CONTAINER -->
<div id="bottom-sheet-menu" class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200/80 dark:border-slate-800 hidden max-h-[92vh] flex flex-col overflow-hidden transition-transform duration-300 ease-out">
  
  <!-- DRAG HANDLE GRABBER BAR -->
  <div id="sheet-drag-handle" class="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0 select-none touch-none">
    <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
  </div>

  <!-- SCROLLABLE MENU CONTENT BODY -->
  <div class="flex-1 overflow-y-auto px-5 pb-8 space-y-6">

    <!-- SUB-PANE 1: MAIN MENU NAVIGATION -->
    <div id="pane-main" class="sub-pane space-y-5">
      
      <!-- MENU HEADER -->
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 class="text-base font-extrabold text-slate-900 dark:text-white">CertiFly Utility Menu</h2>
          <p class="text-[11px] font-bold text-slate-400">Settings, Profile & Data Management</p>
        </div>
        <button id="close-menu-btn" type="button" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- MAIN NAVIGATION LIST -->
      <div class="space-y-2">
        
        <!-- ITEM 1: MY PROFILE -->
        <button id="menu-item-profile" type="button" class="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all flex items-center justify-between group cursor-pointer">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">My Profile</div>
              <div class="text-[10px] text-slate-400 font-bold">Crew Name, CAAM URL & PDF Attestation</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </button>

        <!-- ITEM 2: PREFERENCES -->
        <button id="menu-item-preferences" type="button" class="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all flex items-center justify-between group cursor-pointer">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5M3.75 12h16.5"/></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">Preferences</div>
              <div class="text-[10px] text-slate-400 font-bold">Theme Mode, Font Scale & Thresholds</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </button>

        <!-- ITEM 3: DATA & STORAGE -->
        <button id="menu-item-storage" type="button" class="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all flex items-center justify-between group cursor-pointer">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">Data & Storage</div>
              <div class="text-[10px] text-slate-400 font-bold">Scan Records History & Clear Cache</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </button>

        <!-- ITEM 4: ABOUT -->
        <button id="menu-item-about" type="button" class="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all flex items-center justify-between group cursor-pointer">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
            </div>
            <div class="text-left">
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">About CertiFly</div>
              <div class="text-[10px] text-slate-400 font-bold">Version, User Guide & Feedback</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </button>

      </div>
    </div>

    <!-- SUB-PANE 2: MY PROFILE SETTINGS -->
    <div id="pane-profile" class="sub-pane hidden space-y-5">
      
      <!-- SUB-PANE HEADER -->
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <button id="back-from-profile-btn" type="button" class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <div>
            <h2 class="text-sm font-extrabold text-slate-900 dark:text-white">My Crew Profile</h2>
            <p class="text-[10px] font-bold text-slate-400">Configure Profile Name, Licence & PDF</p>
          </div>
        </div>
      </div>

      <!-- IN-APP SAVE TOAST BANNER -->
      <div id="profile-toast" class="hidden p-3 rounded-2xl bg-emerald-500 text-white shadow-md flex items-center justify-between transition-all">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
          <span id="profile-toast-msg" class="text-xs font-bold">Crew profile saved successfully!</span>
        </div>
      </div>

      <!-- FORM FIELDS -->
      <div class="space-y-4">
        
        <!-- NICKNAME / CALLSIGN INPUT -->
        <div>
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1.5">Crew Nickname / Callsign</label>
          <input id="profile-nickname-input" type="text" placeholder="e.g. Capt Salleh" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" />
        </div>

        <!-- DIGITAL LICENCE SOURCE -->
        <div id="profile-source-container" class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2.5">Digital Licence Source</label>
          
          <!-- MODE SELECTOR BUTTONS -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button id="profile-mode-qr-btn" type="button" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c0 .621.504 1.125 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"/></svg>
              Scan Licence QR
            </button>
            <button id="profile-mode-url-btn" type="button" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-xs cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>
              Paste URL
            </button>
          </div>

          <!-- MODE A: QR CAMERA BOX -->
          <div id="profile-qr-box" class="hidden mb-3">
            <div id="profile-qr-reader-container" class="w-full overflow-hidden rounded-2xl bg-slate-900 aspect-square relative border border-slate-700/60 shadow-inner flex flex-col items-center justify-center">
              <video id="profile-qr-video" class="w-full h-full object-cover"></video>
              <div class="absolute inset-0 pointer-events-none border-2 border-dashed border-emerald-400/60 rounded-2xl m-6 flex items-center justify-center">
                <span class="text-white text-[9px] font-bold uppercase tracking-wider drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)] bg-slate-900/60 px-2 py-1 rounded-md">Align Licence QR Code</span>
              </div>
            </div>
            <!-- STOP SCANNER BUTTON INSIDE CAMERA CONTAINER -->
            <button id="profile-stop-scan-btn" type="button" class="w-full mt-2 py-2.5 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              Stop Scanner
            </button>
          </div>

          <!-- MODE B: URL INPUT BOX -->
          <div id="profile-url-box">
            <input id="profile-url-input" type="url" placeholder="https://eclipse.caam.gov.my/..." class="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>

          <!-- LICENCE URL BADGE -->
          <div id="profile-url-badge" class="hidden mt-2.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2">
            <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            <span id="profile-url-badge-text" class="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Stored licence URL</span>
          </div>

        </div>

        <!-- MAB ATTESTATION PDF FILE SECTION -->
        <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">MAB E-Attestation PDF</label>
          <div class="relative">
            <input id="profile-pdf-file" type="file" accept=".pdf" class="hidden" />
            <label for="profile-pdf-file" id="profile-pdf-label" class="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <span id="profile-pdf-label-text" class="truncate">Select PDF attestation file...</span>
              <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
            </label>
          </div>

          <!-- ATTESTATION PDF BADGE -->
          <div id="profile-pdf-badge" class="hidden mt-2.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2">
            <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            <span id="profile-pdf-badge-text" class="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Stored attestation PDF file</span>
          </div>
        </div>

        <!-- SAVE & CLEAR BUTTONS -->
        <div class="pt-2 grid grid-cols-2 gap-2">
          <button id="profile-save-btn" type="button" class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer">
            Save Profile
          </button>
          <button id="profile-clear-btn" type="button" class="w-full py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-extrabold transition-all cursor-pointer">
            Clear Profile
          </button>
        </div>

      </div>
    </div>

    <!-- SUB-PANE 3: PREFERENCES -->
    <div id="pane-preferences" class="sub-pane hidden space-y-5">
      
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <button id="back-from-pref-btn" type="button" class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <div>
            <h2 class="text-sm font-extrabold text-slate-900 dark:text-white">App Preferences</h2>
            <p class="text-[10px] font-bold text-slate-400">Display, Theme & Compliance Thresholds</p>
          </div>
        </div>
      </div>

      <!-- APPEARANCE THEME MODE -->
      <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
        <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Appearance Theme</label>
        <div class="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-700/60">
          <button id="theme-pill-light" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">Light</button>
          <button id="theme-pill-dark" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">Dark</button>
          <button id="theme-pill-system" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">System</button>
        </div>
      </div>

      <!-- TEXT SCALING -->
      <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
        <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">Interface Text Scale</label>
        <div class="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-700/60">
          <button id="text-pill-std" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">Standard</button>
          <button id="text-pill-lg" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">Large</button>
          <button id="text-pill-xl" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">Extra Large</button>
        </div>
      </div>

      <!-- EXPIRY WARNING THRESHOLD DAYS -->
      <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
        <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Expiry Warning Threshold</label>
        <p class="text-[9px] text-slate-400 mb-2">Highlight qualifications expiring within selected days.</p>
        <div class="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-700/60">
          <button id="threshold-pill-30" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">30 Days</button>
          <button id="threshold-pill-60" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">60 Days</button>
          <button id="threshold-pill-90" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">90 Days</button>
        </div>
      </div>

      <!-- MAB ATTESTATION FRESHNESS LIMIT -->
      <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
        <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">MAB Attestation Freshness Limit</label>
        <p class="text-[9px] text-slate-400 mb-2">Maximum allowed age of attestation PDF document before flagged void.</p>
        <div class="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-700/60">
          <button id="freshness-limit-14" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">14 Days</button>
          <button id="freshness-limit-30" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">30 Days</button>
        </div>
      </div>

    </div>

    <!-- SUB-PANE 4: DATA & STORAGE -->
    <div id="pane-storage" class="sub-pane hidden space-y-5">
      
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <button id="back-from-storage-btn" type="button" class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <div>
            <h2 class="text-sm font-extrabold text-slate-900 dark:text-white">Data & Local Storage</h2>
            <p class="text-[10px] font-bold text-slate-400">Manage Local Device History & Retention</p>
          </div>
        </div>
      </div>

      <!-- SCAN HISTORY LIMIT -->
      <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
        <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Scan History Storage Limit</label>
        <p class="text-[9px] text-slate-400 mb-2">Maximum scan records retained on this local device storage.</p>
        <div class="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-700/60">
          <button id="history-limit-10" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">10 Scans</button>
          <button id="history-limit-20" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">20 Scans</button>
          <button id="history-limit-30" type="button" class="py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">30 Scans</button>
        </div>
      </div>

      <!-- HISTORY RECORDS CONTAINER -->
      <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold text-slate-800 dark:text-slate-100">Saved History Scans</span>
          <span id="storage-scans-count" class="text-xs font-extrabold text-blue-600 dark:text-blue-400">0 / 10</span>
        </div>
        
        <div id="history-list-container" class="max-h-48 overflow-y-auto pr-1">
          <div class="text-[10px] text-slate-400 italic py-4 text-center">No recent scans on this device.</div>
        </div>

        <button id="clear-history-btn" type="button" class="w-full py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition-all cursor-pointer">
          Clear Recent Scan History
        </button>
      </div>

    </div>

    <!-- SUB-PANE 5: ABOUT -->
    <div id="pane-about" class="sub-pane hidden space-y-5">
      
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <button id="back-from-about-btn" type="button" class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <div>
            <h2 class="text-sm font-extrabold text-slate-900 dark:text-white">About CertiFly</h2>
            <p class="text-[10px] font-bold text-slate-400">Digital Flight Crew Credential Verification</p>
          </div>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-center space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/></svg>
        </div>
        <div>
          <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">CertiFly Web App</h3>
          <p class="text-[10px] font-bold text-slate-400">Flight Crew Qualification Manager</p>
        </div>
        <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
          <span>App Version</span>
          <span class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-extrabold">v1.2.0</span>
        </div>
      </div>

      <div class="space-y-2">
        <a id="user-guide-btn" href="./assets/user_guide.pdf" target="_blank" class="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
            Open User Guide PDF
          </span>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
        </a>

        <a id="feedback-btn" href="mailto:mabsys.dev@gmail.com?subject=CertiFly%20App%20Feedback" class="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
            Send App Feedback
          </span>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </a>
      </div>

    </div>

  </div>

</div>
`;
