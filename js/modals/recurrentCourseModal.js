// ./js/modals/recurrentCourseModal.js (1811_R101) - CertiFly Recurrent Qualification Selector Component
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

export const recurrentCourseModalHTML = `
<!-- QUALIFICATION SELECTOR MODAL -->
<div id="recurrent-course-modal" class="fixed inset-0 z-[70] hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 select-none" onclick="if(event.target === this) closeRecurrentCourseModal()">
  <div class="w-11/12 max-w-[340px] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[75vh] my-auto flex flex-col overflow-hidden shadow-md">
    <div class="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90">
      <div>
        <span class="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">QUALIFICATION SELECTOR</span>
        <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">Select Qualification Module</h3>
      </div>
      <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-xs font-bold cursor-pointer" onclick="closeRecurrentCourseModal()">✕</button>
    </div>

    <div class="p-3.5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700 dark:text-slate-300 no-scrollbar">

      <!-- GROUP 1: ANNUAL (12 CALENDAR MONTHS) -->
      <div class="recurrent-group-block space-y-2">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
          <span class="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">ANNUAL (12 CALENDAR MONTHS)</span>
          <span class="text-[9px] font-bold text-blue-600 dark:text-blue-400">6 Modules</span>
        </div>
        <div class="grid grid-cols-1 gap-1.5">
          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('LINE_CHECK', 'Line Check (LC)', 'Annual (12 Calendar Months)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">Line Check (LC)</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">12m</span>
          </button>

          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('SEP_AIRCRAFT_TYPE', 'SEP Type', 'Annual (12 Calendar Months)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">SEP Type</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">12m</span>
          </button>

          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('DOOR_DRILL', 'Door Drill', 'Annual (12 Calendar Months)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">Door Drill</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">12m</span>
          </button>

          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('CRM', 'CRM', 'Annual (12 Calendar Months)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">CRM</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">12m</span>
          </button>

          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('AVSEC', 'AVSEC', 'Annual (12 Calendar Months)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">AVSEC</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">12m</span>
          </button>

          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('ROUTE_AERODROME_COMPETENCE', 'Route & Aerodrome', 'Annual (12 Calendar Months)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">Route &amp; Aerodrome</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">12m</span>
          </button>
        </div>
      </div>

      <!-- GROUP 2: BI-ANNUAL (24 CALENDAR MONTHS) -->
      <div class="recurrent-group-block space-y-2">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
          <span class="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">BI-ANNUAL (24 CALENDAR MONTHS)</span>
          <span class="text-[9px] font-bold text-purple-600 dark:text-purple-400">1 Module</span>
        </div>
        <div class="grid grid-cols-1 gap-1.5">
          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('DGR_FUNCTION_7', 'DGR (Function 7)', 'Bi-Annual (24 Calendar Months)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">DGR (Function 7)</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">24m</span>
          </button>
        </div>
      </div>

      <!-- GROUP 3: TRIENNIAL (36 CALENDAR MONTHS) -->
      <div class="recurrent-group-block space-y-2">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
          <span class="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">TRIENNIAL (36 CALENDAR MONTHS)</span>
          <span class="text-[9px] font-bold text-amber-600 dark:text-amber-400">3 Modules</span>
        </div>
        <div class="grid grid-cols-1 gap-1.5">
          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('FIRE_SMOKE_DRILL', 'Fire Drill', 'Triennial (36 Calendar Months)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">Fire Drill</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">36m</span>
          </button>

          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('SMS', 'SMS', 'Triennial (36 Calendar Months)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">SMS</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">36m</span>
          </button>

          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('WET_DITCHING_DRILL', 'Dinghy / Wet Drill', 'Triennial (36 Calendar Months)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">Dinghy / Wet Drill</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">36m</span>
          </button>
        </div>
      </div>

      <!-- GROUP 4: SEMI-ANNUAL (180-DAY ROLLING) -->
      <div class="recurrent-group-block space-y-2">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
          <span class="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">SEMI-ANNUAL (180-DAY ROLLING)</span>
          <span class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">1 Module</span>
        </div>
        <div class="grid grid-cols-1 gap-1.5">
          <button type="button" class="recurrent-item-card w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-500/10 text-left transition-all flex items-center justify-between cursor-pointer" onclick="selectRecurrentCourse('LVO_AUTOLAND', 'LVO / Autoland', 'Semi-Annual (180-Day Rolling)')">
            <span class="font-bold text-slate-800 dark:text-slate-100">LVO / Autoland</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">180d</span>
          </button>
        </div>
      </div>

    </div>

    <div class="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-end">
      <button type="button" class="py-1.5 px-4 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-all cursor-pointer" onclick="closeRecurrentCourseModal()">Cancel</button>
    </div>
  </div>
</div>
`;

export function initRecurrentCourseModal() {
  if (!document.getElementById("recurrent-course-modal")) {
    document.body.insertAdjacentHTML("beforeend", recurrentCourseModalHTML);
  }
}

export function openRecurrentCourseModal() {
  initRecurrentCourseModal();
  const modal = document.getElementById('recurrent-course-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeRecurrentCourseModal() {
  const modal = document.getElementById('recurrent-course-modal');
  if (modal) modal.classList.add('hidden');
}

export function selectRecurrentCourse(code, label, interval) {
  const hiddenInput = document.getElementById('input-recurrent-course-id');
  if (hiddenInput) hiddenInput.value = code;

  const displayEl = document.getElementById('btn-recurrent-course-display');
  if (displayEl) displayEl.innerText = label;

  closeRecurrentCourseModal();

  if (typeof window.dispatchActiveToolCalculation === 'function') {
    window.dispatchActiveToolCalculation('recurrent');
  }
}

if (typeof window !== 'undefined') {
  window.openRecurrentCourseModal = openRecurrentCourseModal;
  window.closeRecurrentCourseModal = closeRecurrentCourseModal;
  window.selectRecurrentCourse = selectRecurrentCourse;
}
