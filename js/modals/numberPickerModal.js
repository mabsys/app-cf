// ./js/modals/numberPickerModal.js (1811_R101) - CertiFly EFB Number Stepper Modal Component
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

export const numberPickerModalHTML = `
<!-- CUSTOM EFB NUMBER STEPPER MODAL -->
<div id="efb-number-picker-modal" class="fixed inset-0 z-[70] hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 select-none" onclick="if(event.target === this) closeEfbNumberPicker()">
  <div class="w-11/12 max-w-[300px] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md flex flex-col overflow-hidden">
    <div class="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
      <div>
        <span class="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">EFB NUMBER STEPPER</span>
        <h3 id="efb-number-title" class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">SET VALUE</h3>
      </div>
      <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-xs font-bold cursor-pointer" onclick="closeEfbNumberPicker()">✕</button>
    </div>

    <div class="p-4 flex flex-col items-center justify-center space-y-3">
      <div class="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button type="button" class="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-lg shadow-xs active:scale-95 cursor-pointer" onclick="stepEfbNumberVal(-1)">-</button>
        <span id="efb-number-display-val" class="w-14 text-center font-bold text-xl text-blue-600 dark:text-blue-400">2</span>
        <button type="button" class="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-lg shadow-xs active:scale-95 cursor-pointer" onclick="stepEfbNumberVal(1)">+</button>
      </div>
    </div>

    <div class="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
      <button type="button" class="py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-500 cursor-pointer" onclick="closeEfbNumberPicker()">Cancel</button>
      <button type="button" class="py-1.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer" onclick="confirmEfbNumberPicker()">Set Value</button>
    </div>
  </div>
</div>
`;

let efbNumberPickerState = {
  targetInputId: null,
  val: 1,
  minVal: 0,
  maxVal: 99
};

export function initEfbNumberPickerModal() {
  if (!document.getElementById("efb-number-picker-modal")) {
    document.body.insertAdjacentHTML("beforeend", numberPickerModalHTML);
  }
}

export function openEfbNumberPicker(targetInputId, labelTitle = 'SET VALUE', minVal = 0, maxVal = 99) {
  initEfbNumberPickerModal();

  efbNumberPickerState.targetInputId = targetInputId;
  efbNumberPickerState.minVal = minVal;
  efbNumberPickerState.maxVal = maxVal;

  const inputEl = document.getElementById(targetInputId);
  efbNumberPickerState.val = parseInt(inputEl ? inputEl.value : '1', 10) || minVal;

  const titleEl = document.getElementById('efb-number-title');
  if (titleEl) titleEl.innerText = labelTitle;

  const displayValEl = document.getElementById('efb-number-display-val');
  if (displayValEl) displayValEl.innerText = String(efbNumberPickerState.val);

  const modal = document.getElementById('efb-number-picker-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeEfbNumberPicker() {
  const modal = document.getElementById('efb-number-picker-modal');
  if (modal) modal.classList.add('hidden');
}

export function stepEfbNumberVal(delta) {
  let nextVal = efbNumberPickerState.val + delta;
  if (nextVal < efbNumberPickerState.minVal) nextVal = efbNumberPickerState.minVal;
  if (nextVal > efbNumberPickerState.maxVal) nextVal = efbNumberPickerState.maxVal;
  efbNumberPickerState.val = nextVal;

  const displayValEl = document.getElementById('efb-number-display-val');
  if (displayValEl) displayValEl.innerText = String(efbNumberPickerState.val);
}

export function confirmEfbNumberPicker() {
  if (efbNumberPickerState.targetInputId) {
    const inputEl = document.getElementById(efbNumberPickerState.targetInputId);
    if (inputEl) inputEl.value = String(efbNumberPickerState.val);

    const displayIdMap = {
      'input-maxfdp-sectors': 'btn-maxfdp-sectors-display',
      'input-preflight-duty-hours': 'btn-preflight-duty-display'
    };

    const displayId = displayIdMap[efbNumberPickerState.targetInputId] || `${efbNumberPickerState.targetInputId}-display`;
    const displayEl = document.getElementById(displayId);
    if (displayEl) {
      if (efbNumberPickerState.targetInputId === 'input-maxfdp-sectors') {
        displayEl.innerText = efbNumberPickerState.val === 1 ? '1 Sector' : `${efbNumberPickerState.val} Sectors`;
      } else if (efbNumberPickerState.targetInputId === 'input-preflight-duty-hours') {
        displayEl.innerText = `${efbNumberPickerState.val} Hours`;
      } else {
        displayEl.innerText = String(efbNumberPickerState.val);
      }
    }
  }
  closeEfbNumberPicker();
}

if (typeof window !== 'undefined') {
  window.openEfbNumberPicker = openEfbNumberPicker;
  window.closeEfbNumberPicker = closeEfbNumberPicker;
  window.stepEfbNumberVal = stepEfbNumberVal;
  window.confirmEfbNumberPicker = confirmEfbNumberPicker;
}
