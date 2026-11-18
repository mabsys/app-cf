// ./js/modals/timePickerModal.js (1811_R101) - CertiFly EFB Time Picker Modal Component
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

export const timePickerModalHTML = `
<!-- CUSTOM EFB TIME PICKER MODAL -->
<div id="efb-time-picker-modal" class="fixed inset-0 z-[90] hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 select-none" onclick="if(event.target === this) closeEfbTimePicker()">
  <div class="w-11/12 max-w-[320px] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
    
    <!-- Header -->
    <div class="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
      <div>
        <span class="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">EFB TIME PICKER</span>
        <h3 id="efb-time-picker-title" class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">SELECT TIME</h3>
      </div>
      <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-xs font-bold cursor-pointer transition-colors" onclick="closeEfbTimePicker()">✕</button>
    </div>

    <!-- Stepper Controls -->
    <div class="p-4 space-y-4">
      <div class="flex items-center justify-center gap-3">
        
        <!-- Hours -->
        <div class="flex flex-col items-center">
          <span class="text-[9px] font-bold text-slate-400 mb-1">HOURS</span>
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button type="button" class="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-xs active:scale-95 transition-all cursor-pointer" onclick="stepEfbTimeHour(-1)">-</button>
            <span id="efb-time-val-hh" class="w-10 text-center font-bold text-base text-blue-600 dark:text-blue-400">08</span>
            <button type="button" class="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-xs active:scale-95 transition-all cursor-pointer" onclick="stepEfbTimeHour(1)">+</button>
          </div>
        </div>

        <span class="text-xl font-bold text-slate-400 pt-3">:</span>

        <!-- Minutes -->
        <div class="flex flex-col items-center">
          <span class="text-[9px] font-bold text-slate-400 mb-1">MINUTES</span>
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button type="button" class="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-xs active:scale-95 transition-all cursor-pointer" onclick="stepEfbTimeMin(-5)">-</button>
            <span id="efb-time-val-mm" class="w-10 text-center font-bold text-base text-blue-600 dark:text-blue-400">00</span>
            <button type="button" class="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-xs active:scale-95 transition-all cursor-pointer" onclick="stepEfbTimeMin(5)">+</button>
          </div>
        </div>

      </div>

      <!-- Presets Grid -->
      <div id="efb-time-presets-grid" class="grid grid-cols-4 gap-1.5 pt-1"></div>
    </div>

    <!-- Footer -->
    <div class="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
      <button type="button" class="py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors" onclick="closeEfbTimePicker()">Cancel</button>
      <button type="button" class="py-1.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs active:scale-95 transition-all cursor-pointer" onclick="confirmEfbTimePicker()">Confirm Time</button>
    </div>

  </div>
</div>
`;

let efbTimePickerState = {
  targetInputId: null,
  hh: 8,
  mm: 0
};

export function initEfbTimePickerModal() {
  if (!document.getElementById("efb-time-picker-modal")) {
    document.body.insertAdjacentHTML("beforeend", timePickerModalHTML);
  }
}

export function openEfbTimePicker(targetInputId, labelTitle = 'SELECT TIME') {
  initEfbTimePickerModal();

  efbTimePickerState.targetInputId = targetInputId;
  const inputEl = document.getElementById(targetInputId);
  let val = inputEl ? inputEl.value : '08:00';
  if (!val || !val.includes(':')) val = '08:00';

  const parts = val.split(':');
  efbTimePickerState.hh = parseInt(parts[0], 10) || 8;
  efbTimePickerState.mm = parseInt(parts[1], 10) || 0;

  const titleEl = document.getElementById('efb-time-picker-title');
  if (titleEl) titleEl.innerText = labelTitle;

  // Dynamic preset shortcuts based on target calculator card
  const presetsMap = {
    'input-cum-duty-7d': ['15:00', '25:00', '35:00', '45:00'],
    'input-cum-duty-14d': ['55:00', '65:00', '75:00', '85:00'],
    'input-cum-duty-28d': ['95:00', '120:00', '145:00', '170:00'],
    'input-cum-flight-28d': ['25:00', '50:00', '75:00', '100:00']
  };

  const presets = presetsMap[targetInputId] || ['03:00', '06:00', '12:00', '16:00'];
  const presetsGrid = document.getElementById('efb-time-presets-grid');
  if (presetsGrid) {
    presetsGrid.innerHTML = presets.map(p =>
      `<button type="button" class="py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer" onclick="setEfbTimePreset('${p}')">${p}</button>`
    ).join('');
  }

  updateEfbTimeDisplay();

  const modal = document.getElementById('efb-time-picker-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeEfbTimePicker() {
  const modal = document.getElementById('efb-time-picker-modal');
  if (modal) modal.classList.add('hidden');
}

function updateEfbTimeDisplay() {
  const hhEl = document.getElementById('efb-time-val-hh');
  const mmEl = document.getElementById('efb-time-val-mm');
  if (hhEl) hhEl.innerText = String(efbTimePickerState.hh).padStart(2, '0');
  if (mmEl) mmEl.innerText = String(efbTimePickerState.mm).padStart(2, '0');
}

export function stepEfbTimeHour(delta) {
  const isCumulative = efbTimePickerState.targetInputId && efbTimePickerState.targetInputId.startsWith('input-cum-');
  if (isCumulative) {
    efbTimePickerState.hh = Math.max(0, Math.min(250, efbTimePickerState.hh + delta));
  } else {
    efbTimePickerState.hh = (efbTimePickerState.hh + delta + 24) % 24;
  }
  updateEfbTimeDisplay();
}

export function stepEfbTimeMin(delta) {
  efbTimePickerState.mm = (efbTimePickerState.mm + delta + 60) % 60;
  updateEfbTimeDisplay();
}

export function setEfbTimePreset(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return;
  const parts = timeStr.split(':');
  efbTimePickerState.hh = parseInt(parts[0], 10) || 0;
  efbTimePickerState.mm = parseInt(parts[1], 10) || 0;
  updateEfbTimeDisplay();
}

export function confirmEfbTimePicker() {
  const timeStr = String(efbTimePickerState.hh).padStart(2, '0') + ':' + String(efbTimePickerState.mm).padStart(2, '0');
  
  if (efbTimePickerState.targetInputId) {
    const inputEl = document.getElementById(efbTimePickerState.targetInputId);
    if (inputEl) inputEl.value = timeStr;

    const displayIdMap = {
      'input-maxfdp-report-time': 'btn-maxfdp-report-display',
      'input-preflight-duty-end-time': 'btn-preflight-duty-end-display',
      'input-standby-start-time': 'btn-standby-start-display',
      'input-standby-report-time': 'btn-standby-report-display',
      'input-cum-duty-7d': 'btn-cum-7d-display',
      'input-cum-duty-14d': 'btn-cum-14d-display',
      'input-cum-duty-28d': 'btn-cum-28d-display',
      'input-cum-flight-28d': 'btn-cum-flt28d-display'
    };

    const displayId = displayIdMap[efbTimePickerState.targetInputId] || `${efbTimePickerState.targetInputId}-display`;
    const displayEl = document.getElementById(displayId);
    if (displayEl) displayEl.innerText = timeStr;

    if (inputEl) {
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  closeEfbTimePicker();
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.openEfbTimePicker = openEfbTimePicker;
  window.closeEfbTimePicker = closeEfbTimePicker;
  window.stepEfbTimeHour = stepEfbTimeHour;
  window.stepEfbTimeMin = stepEfbTimeMin;
  window.setEfbTimePreset = setEfbTimePreset;
  window.confirmEfbTimePicker = confirmEfbTimePicker;
}
