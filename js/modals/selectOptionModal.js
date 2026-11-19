// ./js/modals/selectOptionModal.js (1811_R102) - CertiFly EFB Select Option Modal Component
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

export const selectOptionModalHTML = `
<!-- CUSTOM EFB SELECT OPTION MODAL -->
<div id="efb-select-option-modal" class="fixed inset-0 z-[70] hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 select-none" onclick="if(event.target === this) closeEfbSelectModal()">
  <div class="w-11/12 max-w-[340px] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[75vh] flex flex-col overflow-hidden shadow-md">
    <div class="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
      <div>
        <span class="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">EFB OPTION SELECTOR</span>
        <h3 id="efb-select-title" class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">CHOOSE OPTION</h3>
      </div>
      <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-xs font-bold cursor-pointer" onclick="closeEfbSelectModal()">✕</button>
    </div>

    <div id="efb-select-options-list" class="p-3 overflow-y-auto space-y-2 flex-1">
      <!-- Dynamic Option Cards Injected Here -->
    </div>
  </div>
</div>
`;

let efbSelectModalState = {
  targetInputId: null,
  options: []
};

export function initEfbSelectOptionModal() {
  if (!document.getElementById("efb-select-option-modal")) {
    document.body.insertAdjacentHTML("beforeend", selectOptionModalHTML);
  }
}

export function openEfbSelectModal(targetInputId, labelTitle = 'CHOOSE OPTION', options = []) {
  initEfbSelectOptionModal();

  efbSelectModalState.targetInputId = targetInputId;
  efbSelectModalState.options = options;

  const titleEl = document.getElementById('efb-select-title');
  if (titleEl) titleEl.innerText = labelTitle;

  const listEl = document.getElementById('efb-select-options-list');
  if (listEl) {
    const currentVal = document.getElementById(targetInputId)?.value;
    listEl.innerHTML = options.map(opt => {
      const isSelected = opt.value === currentVal;
      const borderClass = isSelected
        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 hover:border-blue-400';
      return `<button type="button" class="w-full p-3 rounded-xl border ${borderClass} font-bold text-xs text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]" onclick="selectEfbOption('${opt.value}', '${opt.label.replace(/'/g, "\'")}')">
        <span>${opt.label}</span>
        ${isSelected ? '<span class="text-blue-600 dark:text-blue-400 font-extrabold text-xs">SELECTED</span>' : ''}
      </button>`;
    }).join('');
  }

  const modal = document.getElementById('efb-select-option-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeEfbSelectModal() {
  const modal = document.getElementById('efb-select-option-modal');
  if (modal) modal.classList.add('hidden');
}

export function selectEfbOption(val, label) {
  if (efbSelectModalState.targetInputId === 'efb-date-picker-year-jump') {
    const yearNum = parseInt(val, 10);
    if (!isNaN(yearNum)) {
      if (typeof window !== 'undefined' && typeof window.setEfbDatePickerYear === 'function') {
        window.setEfbDatePickerYear(yearNum);
      }
    }
    closeEfbSelectModal();
    return;
  }

  if (efbSelectModalState.targetInputId) {
    const inputEl = document.getElementById(efbSelectModalState.targetInputId);
    if (inputEl) inputEl.value = val;

    const displayIdMap = {
      'input-med-license-type': 'btn-med-license-display',
      'input-med-age-bracket': 'btn-med-age-display',
      'input-recency-capacity': 'btn-recency-capacity-display',
      'input-maxfdp-acclimatised': 'btn-maxfdp-acclim-display',
      'input-maxfdp-relief': 'btn-maxfdp-relief-display',
      'input-preflight-location': 'btn-preflight-loc-display',
      'input-preflight-travel-time': 'btn-preflight-travel-display',
      'input-preflight-discretion-reduction': 'btn-preflight-discretion-display',
      'modal-maxfdp-longest-sector': 'btn-modal-maxfdp-longest-display',
      'modal-maxfdp-split-rest': 'btn-modal-maxfdp-split-display',
      'modal-maxfdp-inflight-rest': 'btn-modal-maxfdp-inflight-display',
      'modal-maxfdp-crew-count': 'btn-modal-maxfdp-crew-display',
      'modal-maxfdp-preceding-rest': 'btn-modal-maxfdp-preceding-display'
    };

    const targetId = efbSelectModalState.targetInputId;
    let displayId = displayIdMap[targetId];
    if (!displayId) {
      if (document.getElementById(targetId + '-display')) {
        displayId = targetId + '-display';
      } else {
        displayId = targetId.replace('input-', 'btn-') + '-display';
      }
    }

    const displayEl = document.getElementById(displayId);
    if (displayEl) displayEl.innerText = label;
  }
  closeEfbSelectModal();
}

if (typeof window !== 'undefined') {
  window.openEfbSelectModal = openEfbSelectModal;
  window.closeEfbSelectModal = closeEfbSelectModal;
  window.selectEfbOption = selectEfbOption;
}
