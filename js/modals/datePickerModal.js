// ./js/modals/datePickerModal.js (1811_R102) - CertiFly EFB Date Picker Modal Component
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import { showAlertModal, showToast } from '../notifications.js';
import { openEfbSelectModal, closeEfbSelectModal } from './selectOptionModal.js';

export const datePickerModalHTML = `
<!-- EFB DATE PICKER MODAL -->
<div id="efb-date-picker-modal" class="fixed inset-0 z-[90] hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 select-none" onclick="if(event.target === this) closeEfbDatePicker()">
  <div class="w-11/12 max-w-[320px] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl my-auto flex flex-col overflow-hidden">
    
    <!-- Header -->
    <div class="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
      <div>
        <span class="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">EFB DATE PICKER</span>
        <h3 id="efb-date-picker-title" class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">SELECT DATE</h3>
      </div>
      <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-xs font-bold cursor-pointer transition-colors" onclick="closeEfbDatePicker()">✕</button>
    </div>

    <!-- Quick Date Presets -->
    <div class="p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      <button type="button" class="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 active:scale-95 transition-all shrink-0 cursor-pointer" onclick="setEfbDatePreset('today')">Today</button>
      <button type="button" class="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition-all shrink-0 cursor-pointer" onclick="setEfbDatePreset('eom')">End of Month</button>
      <button type="button" class="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all shrink-0 cursor-pointer" onclick="setEfbDatePreset('+1y')">+1 Year</button>
      <button type="button" class="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all shrink-0 cursor-pointer" onclick="setEfbDatePreset('-1y')">-1 Year</button>
    </div>

    <!-- Month & Year Navigation Header -->
    <div class="p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
      <button type="button" class="py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-xs font-bold transition-all cursor-pointer" onclick="changeEfbMonth(-1)">◄ Prev</button>
      <button type="button" id="efb-calendar-month-label" class="py-1 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-xs font-bold transition-all cursor-pointer select-none text-center" onclick="openEfbYearSelectModal()">NOVEMBER 2026</button>
      <button type="button" class="py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-xs font-bold transition-all cursor-pointer" onclick="changeEfbMonth(1)">Next ►</button>
    </div>

    <!-- Calendar Grid -->
    <div class="p-3">
      <div class="grid grid-cols-7 gap-1 text-center text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-2">
        <span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span><span>SU</span>
      </div>
      <div id="efb-calendar-days-grid" class="grid grid-cols-7 gap-1 text-center text-xs font-bold"></div>
    </div>

    <!-- Footer -->
    <div class="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-end">
      <button type="button" class="py-1.5 px-4 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer" onclick="closeEfbDatePicker()">Cancel</button>
    </div>
  </div>
</div>
`;

let efbDatePickerState = {
  targetInputId: null,
  currentYear: 2026,
  currentMonth: 10, // 0-indexed (Nov = 10)
  selectedDate: null
};

export function initEfbDatePickerModal() {
  if (!document.getElementById("efb-date-picker-modal")) {
    document.body.insertAdjacentHTML("beforeend", datePickerModalHTML);
  }
}

export function openEfbYearSelectModal() {
  const years = [];
  const startYear = 1955;
  const endYear = 2035;
  for (let y = endYear; y >= startYear; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  openEfbSelectModal('efb-date-picker-year-jump', 'SELECT YEAR', years);
}

export function setEfbDatePickerYear(yearNum) {
  if (!isNaN(yearNum)) {
    efbDatePickerState.currentYear = yearNum;
    renderEfbCalendarGrid();
  }
}

export function openEfbDatePicker(targetInputId, labelTitle = 'SELECT DATE') {
  initEfbDatePickerModal();

  if (typeof navigator !== 'undefined' && !navigator.onLine && targetInputId === 'profile-passport-expiry') {
    if (typeof showToast === 'function') {
      showToast('Passport details require an active internet connection.', 'warning');
    }
    return;
  }

  efbDatePickerState.targetInputId = targetInputId;
  const inputEl = document.getElementById(targetInputId);
  const currentVal = inputEl ? inputEl.value : '';

  if (currentVal) {
    const d = new Date(currentVal);
    if (!isNaN(d.getTime())) {
      efbDatePickerState.currentYear = d.getFullYear();
      efbDatePickerState.currentMonth = d.getMonth();
      efbDatePickerState.selectedDate = d;
    }
  } else {
    const today = new Date();
    efbDatePickerState.currentYear = today.getFullYear();
    efbDatePickerState.currentMonth = today.getMonth();
    efbDatePickerState.selectedDate = today;
  }

  const titleEl = document.getElementById('efb-date-picker-title');
  if (titleEl) titleEl.innerText = labelTitle;

  renderEfbCalendarGrid();

  const modal = document.getElementById('efb-date-picker-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeEfbDatePicker() {
  const modal = document.getElementById('efb-date-picker-modal');
  if (modal) modal.classList.add('hidden');
}

export function renderEfbCalendarGrid() {
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const monthLabelEl = document.getElementById('efb-calendar-month-label');
  if (monthLabelEl) {
    monthLabelEl.innerText = `${months[efbDatePickerState.currentMonth]} ${efbDatePickerState.currentYear}`;
  }

  const daysGridEl = document.getElementById('efb-calendar-days-grid');
  if (!daysGridEl) return;
  daysGridEl.innerHTML = '';

  const firstDay = new Date(efbDatePickerState.currentYear, efbDatePickerState.currentMonth, 1);
  const startingDay = (firstDay.getDay() + 6) % 7; // Monday start
  const daysInMonth = new Date(efbDatePickerState.currentYear, efbDatePickerState.currentMonth + 1, 0).getDate();

  for (let i = 0; i < startingDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'py-2';
    daysGridEl.appendChild(emptyCell);
  }

  const today = new Date();

  for (let day = 1; day <= daysInMonth; day++) {
    const dayBtn = document.createElement('button');
    dayBtn.type = 'button';
    const isToday = today.getFullYear() === efbDatePickerState.currentYear && today.getMonth() === efbDatePickerState.currentMonth && today.getDate() === day;
    const isSelected = efbDatePickerState.selectedDate && efbDatePickerState.selectedDate.getFullYear() === efbDatePickerState.currentYear && efbDatePickerState.selectedDate.getMonth() === efbDatePickerState.currentMonth && efbDatePickerState.selectedDate.getDate() === day;

    let btnClass = 'py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ';
    if (isSelected) {
      btnClass += 'bg-blue-600 text-white shadow-md ';
    } else if (isToday) {
      btnClass += 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 ';
    } else {
      btnClass += 'bg-slate-100/80 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-blue-500/10 ';
    }

    dayBtn.className = btnClass;
    dayBtn.innerText = String(day);

    const mStr = String(efbDatePickerState.currentMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const isoVal = `${efbDatePickerState.currentYear}-${mStr}-${dStr}`;

    dayBtn.onclick = () => selectEfbDate(isoVal);
    daysGridEl.appendChild(dayBtn);
  }
}

export function changeEfbMonth(delta) {
  let newMonth = efbDatePickerState.currentMonth + delta;
  if (newMonth < 0) {
    efbDatePickerState.currentMonth = 11;
    efbDatePickerState.currentYear -= 1;
  } else if (newMonth > 11) {
    efbDatePickerState.currentMonth = 0;
    efbDatePickerState.currentYear += 1;
  } else {
    efbDatePickerState.currentMonth = newMonth;
  }
  renderEfbCalendarGrid();
}

export function setEfbDatePreset(presetKey) {
  const inputEl = efbDatePickerState.targetInputId ? document.getElementById(efbDatePickerState.targetInputId) : null;
  const currentVal = inputEl ? inputEl.value : '';
  let baseDate = new Date();

  if (currentVal) {
    const d = new Date(currentVal);
    if (!isNaN(d.getTime())) baseDate = d;
  }

  let targetDate = new Date(baseDate);
  if (presetKey === 'today') {
    targetDate = new Date();
  } else if (presetKey === 'eom') {
    targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  } else if (presetKey === '+1y') {
    targetDate = new Date(baseDate.getFullYear() + 1, baseDate.getMonth(), baseDate.getDate());
  } else if (presetKey === '-1y') {
    targetDate = new Date(baseDate.getFullYear() - 1, baseDate.getMonth(), baseDate.getDate());
  }

  efbDatePickerState.currentYear = targetDate.getFullYear();
  efbDatePickerState.currentMonth = targetDate.getMonth();
  efbDatePickerState.selectedDate = targetDate;

  const mStr = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dStr = String(targetDate.getDate()).padStart(2, '0');
  const isoVal = `${targetDate.getFullYear()}-${mStr}-${dStr}`;

  selectEfbDate(isoVal);
}

export function selectEfbDate(isoVal) {
  if (efbDatePickerState.targetInputId) {
    if (efbDatePickerState.targetInputId === 'profile-passport-expiry') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selDate = new Date(isoVal);
      if (selDate < today) {
        closeEfbDatePicker();
        if (typeof showAlertModal === 'function') {
          showAlertModal('Expired Passport', 'Passport expiry date cannot be in the past.', 'error');
        }
        return;
      }
    }

    const inputEl = document.getElementById(efbDatePickerState.targetInputId);
    if (inputEl) inputEl.value = isoVal;

    const displayIdMap = {
      'input-med-exam-date': 'input-med-exam-date-display',
      'input-ppc-conduct-date': 'input-ppc-conduct-date-display',
      'input-ppc-expiry-date': 'input-ppc-expiry-date-display',
      'input-recurrent-conduct-date': 'input-recurrent-conduct-date-display',
      'input-recency-flight-date': 'input-recency-flight-date-display',
      'input-recency-l1-date': 'input-recency-l1-date-display',
      'input-recency-l2-date': 'input-recency-l2-date-display',
      'input-recency-l3-date': 'input-recency-l3-date-display',
      'input-recency-variant-date': 'input-recency-variant-date-display',
      'profile-passport-expiry': 'profile-passport-expiry-display'
    };

    const displayId = displayIdMap[efbDatePickerState.targetInputId] || `${efbDatePickerState.targetInputId}-display`;
    const displayEl = document.getElementById(displayId);

    if (displayEl) {
      if (typeof window !== 'undefined' && typeof window.formatDateDDMMMYYYY === 'function') {
        displayEl.innerText = window.formatDateDDMMMYYYY(isoVal);
      } else {
        displayEl.innerText = isoVal;
      }
    }

    if (inputEl) {
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  closeEfbDatePicker();
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.openEfbYearSelectModal = openEfbYearSelectModal;
  window.setEfbDatePickerYear = setEfbDatePickerYear;
  window.openEfbDatePicker = openEfbDatePicker;
  window.closeEfbDatePicker = closeEfbDatePicker;
  window.renderEfbCalendarGrid = renderEfbCalendarGrid;
  window.changeEfbMonth = changeEfbMonth;
  window.setEfbDatePreset = setEfbDatePreset;
  window.selectEfbDate = selectEfbDate;
}
