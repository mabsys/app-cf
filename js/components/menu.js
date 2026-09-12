// js/components/menu.js - Sliding Menu Sheet Component

export const menuHTML = `
<!-- DIMMED BACKDROP OVERLAY -->
<div id="bottom-sheet-overlay"
     class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 hidden opacity-0 transition-opacity duration-300"></div>

<!-- BOTTOM SHEET CONTAINER -->
<div id="bottom-sheet-menu"
     class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-[32px] shadow-2xl transform translate-y-full transition-transform duration-300 ease-out max-w-md mx-auto border-t border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col hidden min-h-[380px] max-h-[85vh]">
  
  <!-- Drag Handle -->
  <div class="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-3 shrink-0"></div>

  <!-- CONTAINER CONTENT AREA -->
  <div id="sheet-content" class="relative w-full flex-1 overflow-x-hidden overflow-y-auto pb-6 px-6">

    <!-- PANE 1: MAIN CATEGORIES -->
    <div id="pane-main" class="w-full transition-transform duration-300 ease-in-out">
      <div class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
        CertiFly Menu
      </div>

      <div class="flex flex-col gap-2.5">

        <!-- Category 0: My Profile -->
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
              <div class="text-[10px] text-slate-400">Save call sign & licence URL</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
        </button>

      </div>
    </div>

    <!-- SUB-PANE 0: MY PROFILE -->
    <div id="pane-profile" class="sub-pane absolute top-0 left-0 w-full transform translate-x-full transition-transform duration-300 ease-in-out hidden">
      <button class="back-btn flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-4">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg> Back
      </button>

      <h3 class="text-xs font-black text-slate-800 dark:text-slate-100 mb-3">My Pilot Profile</h3>

      <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col gap-3 mb-4">
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Call Sign / Pilot Name</label>
          <input type="text" id="profile-name-input" placeholder="Capt. Salleh" class="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">CAAM Licence Number</label>
          <input type="text" id="profile-licence-input" placeholder="ATPL/1234" class="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">eCLIPSE Licence URL</label>
          <input type="url" id="profile-url-input" placeholder="https://eclipse.caam.gov.my/ELICENSING..." class="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <button id="profile-save-btn" class="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm mt-1">
          Save Profile Data
        </button>
      </div>

      <button id="profile-clear-btn" class="w-full p-3 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/50">
        Clear Profile
      </button>
    </div>

  </div>
</div>
`;
