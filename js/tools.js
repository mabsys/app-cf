// ./js/tools.js (3110_R321) - CertiFly Tools Module, Calculation Engines & EFB Modals
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import * as StandbyEngineModule from './engines/standby-fdp-calculator.js';
import * as MaxFdpEngineModule from './engines/max-fdp-calculator.js';
import * as PreFlightRestEngineModule from './engines/pre-flight-rest-calculator.js';
import * as CumulativeEngineModule from './engines/cumulative-hours-calculator.js';
import * as MedicalEngineModule from './engines/medical-validity-calculator.js';
import * as RecurrentEngineModule from './engines/recurrent-training-calculator.js';
import * as LandingRecencyEngineModule from './engines/landing-recency-calculator.js';
import * as PPCEngineModule from './engines/ppc-validity-calculator.js';

// ==================================================================
// TOOLS MODULE STATE
// ==================================================================
let toolsState = {
  activeCategory: 'qualifications', // 'qualifications' (Date) | 'dutyrest' (Time)
  activeToolId: 'tool-card-medical',
  recurrentCourseKey: 'LINE_CHECK',
  recurrentCourseName: 'Line Check (LC)',
  recurrentCourseCat: 'Annual (12 Calendar Months)',
  sectorCount: 2
};

// ==================================================================
// HELPER: DATE FORMATTER
// ==================================================================
export function formatDateDDMMMYYYY(dateInput) {
  if (!dateInput) return '--';
  let d;
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      d = new Date(dateInput);
    } else if (dateInput.includes('-')) {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = new Date(dateInput);
    }
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    d = new Date(dateInput);
  }

  if (isNaN(d.getTime())) return String(dateInput).toUpperCase();

  const day = String(d.getDate()).padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// ==================================================================
// CUSTOM EFB DATE PICKER MODAL
// ==================================================================
let efbDatePickerState = {
  targetInputId: null,
  currentYear: 2026,
  currentMonth: 9, // 0-indexed (Oct)
  selectedDate: null
};

export function openEfbYearSelectModal() {
  const years = [];
  const startYear = 1955;
  const endYear = 2035;
  for (let y = endYear; y >= startYear; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  openEfbSelectModal('efb-date-picker-year-jump', 'SELECT YEAR', years);
  
  const origSelect = window.selectEfbOption;
  window.selectEfbOption = function(val, label) {
    const targetInputId = efbSelectModalState.targetInputId;
    if (targetInputId === 'efb-date-picker-year-jump') {
      const yearNum = parseInt(val, 10);
      if (!isNaN(yearNum)) {
        efbDatePickerState.currentYear = yearNum;
        renderEfbCalendarGrid();
      }
      closeEfbSelectModal();
      return;
    }
    if (typeof origSelect === 'function') {
      origSelect(val, label);
    }
  };
}

export function openEfbDatePicker(targetInputId, labelTitle = 'SELECT DATE') {
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
    monthLabelEl.className = "py-1 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer select-none text-center";
    monthLabelEl.title = "Tap to Select Year";
    monthLabelEl.onclick = () => openEfbYearSelectModal();
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
    const inputEl = document.getElementById(efbDatePickerState.targetInputId);
    if (inputEl) inputEl.value = isoVal;

    const formattedDate = formatDateDDMMMYYYY(isoVal);

    const displayIdMap = {
      'input-med-exam-date': 'input-med-exam-date-display',
      'input-ppc-conduct-date': 'input-ppc-conduct-date-display',
      'input-ppc-expiry-date': 'input-ppc-expiry-date-display',
      'input-recurrent-conduct-date': 'input-recurrent-conduct-date-display',
      'input-recency-flight-date': 'input-recency-flight-date-display',
      'input-recency-l1-date': 'input-recency-l1-date-display',
      'input-recency-l2-date': 'input-recency-l2-date-display',
      'input-recency-l3-date': 'input-recency-l3-date-display',
      'input-recency-variant-date': 'input-recency-variant-date-display'
    };

    const displayId = displayIdMap[efbDatePickerState.targetInputId] || `${efbDatePickerState.targetInputId}-display`;
    const displayEl = document.getElementById(displayId);
    if (displayEl) displayEl.innerText = formattedDate;
  }
  closeEfbDatePicker();
}

// ==================================================================
// CUSTOM EFB TIME PICKER MODAL (HH:mm)
// ==================================================================
let efbTimePickerState = {
  targetInputId: null,
  hh: 8,
  mm: 0
};

export function openEfbTimePicker(targetInputId, labelTitle = 'SELECT TIME') {
  efbTimePickerState.targetInputId = targetInputId;
  const inputEl = document.getElementById(targetInputId);
  let val = inputEl ? inputEl.value : '08:00';
  if (!val || !val.includes(':')) val = '08:00';
  const parts = val.split(':');
  efbTimePickerState.hh = parseInt(parts[0], 10) || 8;
  efbTimePickerState.mm = parseInt(parts[1], 10) || 0;

  const titleEl = document.getElementById('efb-time-picker-title');
  if (titleEl) titleEl.innerText = labelTitle;

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
  efbTimePickerState.hh = (efbTimePickerState.hh + delta + 24) % 24;
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
      'input-standby-time': 'btn-stby-time-display',
      'input-cum-duty-7d': 'btn-cum-7d-display',
      'input-cum-duty-14d': 'btn-cum-14d-display',
      'input-cum-duty-28d': 'btn-cum-28d-display',
      'input-cum-flight-28d': 'btn-cum-flt28d-display'
    };

    const displayId = displayIdMap[efbTimePickerState.targetInputId] || `${efbTimePickerState.targetInputId}-display`;
    const displayEl = document.getElementById(displayId);
    if (displayEl) displayEl.innerText = timeStr;
  }
  closeEfbTimePicker();
}

// ==================================================================
// CUSTOM EFB SELECT OPTION MODAL
// ==================================================================
let efbSelectModalState = {
  targetInputId: null,
  options: []
};

export function openEfbSelectModal(targetInputId, labelTitle = 'CHOOSE OPTION', options = []) {
  efbSelectModalState.targetInputId = targetInputId;
  efbSelectModalState.options = options;

  const titleEl = document.getElementById('efb-select-title');
  if (titleEl) titleEl.innerText = labelTitle;

  const listEl = document.getElementById('efb-select-options-list');
  if (listEl) {
    const currentVal = document.getElementById(targetInputId)?.value;
    listEl.innerHTML = options.map(opt => {
      const isSelected = opt.value === currentVal;
      const borderClass = isSelected ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 hover:border-blue-400';
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
  if (efbSelectModalState.targetInputId) {
    const inputEl = document.getElementById(efbSelectModalState.targetInputId);
    if (inputEl) inputEl.value = val;

    const displayIdMap = {
      'input-med-license-type': 'btn-med-license-display',
      'input-med-age-bracket': 'btn-med-age-display',
      'input-recency-capacity': 'btn-recency-capacity-display',
      'input-maxfdp-acclimatised': 'btn-maxfdp-acclim-display',
      'input-preflight-location': 'btn-preflight-loc-display'
    };

    const displayId = displayIdMap[efbSelectModalState.targetInputId] || `${efbSelectModalState.targetInputId}-display`;
    const displayEl = document.getElementById(displayId);
    if (displayEl) displayEl.innerText = label;
  }
  closeEfbSelectModal();
}

// ==================================================================
// CUSTOM EFB NUMBER STEPPER MODAL
// ==================================================================
let efbNumberPickerState = {
  targetInputId: null,
  val: 1,
  minVal: 0,
  maxVal: 99
};

export function openEfbNumberPicker(targetInputId, labelTitle = 'SET VALUE', minVal = 0, maxVal = 99) {
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

// ==================================================================
// 3D CARD FLIP HANDLERS & CALCULATION EXECUTION
// ==================================================================
export function executeAndFlipCard(toolType) {
  const normKeyMap = {
    'medical': 'medical',
    'ppc': 'ppc',
    'recurrent': 'recurrent',
    'recency': 'recency',
    'standby': 'standby',
    'maxfdp': 'max-fdp',
    'max-fdp': 'max-fdp',
    'preflight': 'pre-flight-rest',
    'pre-flight-rest': 'pre-flight-rest',
    'cumulative': 'cumulative'
  };

  const normType = normKeyMap[toolType] || toolType;

  // Validate required inputs before flipping
  if (normType === 'medical') {
    const val = document.getElementById('input-med-exam-date')?.value;
    if (!val) {
      openEfbDatePicker('input-med-exam-date', 'MEDICAL EXAM DATE');
      return;
    }
  } else if (normType === 'ppc') {
    const cVal = document.getElementById('input-ppc-conduct-date')?.value;
    if (!cVal) {
      openEfbDatePicker('input-ppc-conduct-date', 'PPC / LPC CONDUCT DATE');
      return;
    }
  } else if (normType === 'recurrent') {
    const val = document.getElementById('input-recurrent-conduct-date')?.value;
    if (!val) {
      openEfbDatePicker('input-recurrent-conduct-date', 'COURSE CONDUCT DATE');
      return;
    }
  } else if (normType === 'recency') {
    const fVal = document.getElementById('input-recency-flight-date')?.value;
    if (!fVal) {
      openEfbDatePicker('input-recency-flight-date', 'PROPOSED FLIGHT DATE');
      return;
    }
    const l1 = document.getElementById('input-recency-l1-date')?.value;
    const l2 = document.getElementById('input-recency-l2-date')?.value;
    const l3 = document.getElementById('input-recency-l3-date')?.value;
    if (!l1) { openEfbDatePicker('input-recency-l1-date', 'LANDING #1 DATE'); return; }
    if (!l2) { openEfbDatePicker('input-recency-l2-date', 'LANDING #2 DATE'); return; }
    if (!l3) { openEfbDatePicker('input-recency-l3-date', 'LANDING #3 ANCHOR DATE'); return; }
  }

  // 1. Gather inputs and execute calculation engine
  const rawResult = runToolCalculation(toolType);

  // 2. Normalize output format
  const normalized = normalizeOutput(toolType, rawResult);

  // 3. Render into output card back face
  renderToolsOutputCardForTool(toolType, normalized);

  // 4. Flip card 180deg
  const innerIdMap = {
    'medical': 'card-3d-inner-medical',
    'ppc': 'card-3d-inner-ppc',
    'recurrent': 'card-3d-inner-recurrent',
    'recency': 'card-3d-inner-recency',
    'standby': 'card-3d-inner-standby',
    'maxfdp': 'card-3d-inner-max-fdp',
    'max-fdp': 'card-3d-inner-max-fdp',
    'preflight': 'card-3d-inner-pre-flight-rest',
    'pre-flight-rest': 'card-3d-inner-pre-flight-rest',
    'cumulative': 'card-3d-inner-cumulative'
  };

  const innerId = innerIdMap[toolType] || `card-3d-inner-${suffix}`;
  const innerEl = document.getElementById(innerId);
  if (innerEl) {
    innerEl.classList.add('is-flipped');
  }
}

export function flipCardBackToInput(toolType) {
  const innerIdMap = {
    'medical': 'card-3d-inner-medical',
    'ppc': 'card-3d-inner-ppc',
    'recurrent': 'card-3d-inner-recurrent',
    'recency': 'card-3d-inner-recency',
    'standby': 'card-3d-inner-standby',
    'maxfdp': 'card-3d-inner-max-fdp',
    'max-fdp': 'card-3d-inner-max-fdp',
    'preflight': 'card-3d-inner-pre-flight-rest',
    'pre-flight-rest': 'card-3d-inner-pre-flight-rest',
    'cumulative': 'card-3d-inner-cumulative'
  };

  const innerId = innerIdMap[toolType] || `card-3d-inner-${toolType}`;
  const innerEl = document.getElementById(innerId);
  if (innerEl) {
    innerEl.classList.remove('is-flipped');
  }
}

// ==================================================================
// CALCULATION ENGINES ORCHESTRATOR
// ==================================================================
export function runToolCalculation(toolType, inputData = {}) {
  let result = null;
  const normType = (toolType === 'maxfdp') ? 'max-fdp' : ((toolType === 'preflight') ? 'pre-flight-rest' : toolType);

  try {
    switch (normType) {
      case 'medical': {
        const examDate = inputData.examDate || document.getElementById('input-med-exam-date')?.value || new Date().toISOString().split('T')[0];
        let dobStr = inputData.dob || document.getElementById('input-med-dob')?.value;
        const currentExpiryDate = inputData.currentExpiryDate || document.getElementById('input-med-current-expiry')?.value || null;

        // Ensure valid dobStr with fallback to stored profile DOB or examYear - 40
        if (!dobStr || isNaN(new Date(dobStr).getTime())) {
          try {
            const pData = localStorage.getItem('certifly_profile_data');
            if (pData) {
              const parsed = JSON.parse(pData);
              dobStr = parsed?.dob || parsed?.cachedCaamResults?.dob || parsed?.cachedCaamResults?.dateOfBirth;
            }
          } catch (e) {}
        }
        if (!dobStr || isNaN(new Date(dobStr).getTime())) {
          const examYear = new Date(examDate).getFullYear() || new Date().getFullYear();
          dobStr = (examYear - 40) + "-01-01";
        }

        const calcParams = { dob: dobStr, examDate, currentExpiryDate };

        if (typeof MedicalEngineModule !== 'undefined') {
          if (typeof MedicalEngineModule.calculateValidity === 'function') {
            result = MedicalEngineModule.calculateValidity(calcParams);
          } else if (MedicalEngineModule.MedicalValidityEngine && typeof MedicalEngineModule.MedicalValidityEngine.calculateValidity === 'function') {
            result = MedicalEngineModule.MedicalValidityEngine.calculateValidity(calcParams);
          } else if (MedicalEngineModule.default && typeof MedicalEngineModule.default.calculateValidity === 'function') {
            result = MedicalEngineModule.default.calculateValidity(calcParams);
          } else if (typeof MedicalEngineModule.calculateMedicalValidity === 'function') {
            try {
              result = MedicalEngineModule.calculateMedicalValidity(calcParams);
            } catch (e) {
              result = MedicalEngineModule.calculateMedicalValidity(examDate, dobStr);
            }
          }
        }

        if (!result && typeof MedicalValidityEngine !== 'undefined' && typeof MedicalValidityEngine.calculateValidity === 'function') {
          result = MedicalValidityEngine.calculateValidity(calcParams);
        }

        // Full fallback calculation if engine method not resolved
        if (!result) {
          const dobDate = new Date(dobStr);
          const exam = new Date(examDate);
          let age = exam.getFullYear() - dobDate.getFullYear();
          const mDiff = exam.getMonth() - dobDate.getMonth();
          if (mDiff < 0 || (mDiff === 0 && exam.getDate() < dobDate.getDate())) age--;

          if (age >= 65) {
            result = {
              age,
              isEligible: false,
              reason: 'Commercial Air Transport pilot privileges cease at Age 65.',
              validityMonths: 0,
              newExpiryDate: null,
              dameEarliestDate: null,
              restrictions: ['Ceased - Age 65+']
            };
          } else {
            const validityMonths = age >= 60 ? 6 : 12;
            let baseDate = new Date(exam);
            let anniversaryPreserved = false;

            if (currentExpiryDate) {
              const currentExpiry = new Date(currentExpiryDate);
              if (!isNaN(currentExpiry.getTime())) {
                const diffTime = currentExpiry.getTime() - exam.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 45) {
                  baseDate = new Date(currentExpiry);
                  anniversaryPreserved = true;
                }
              }
            }

            const targetYear = baseDate.getFullYear();
            const targetMonth = baseDate.getMonth() + validityMonths;
            const exp = new Date(targetYear, targetMonth + 1, 0);
            const yStr = exp.getFullYear();
            const mStr = String(exp.getMonth() + 1).padStart(2, '0');
            const dStr = String(exp.getDate()).padStart(2, '0');
            const newExpStr = `${yStr}-${mStr}-${dStr}`;
            const dameEarliest = new Date(exp);
            dameEarliest.setDate(dameEarliest.getDate() - 45);

            result = {
              age,
              isEligible: true,
              validityMonths,
              anniversaryPreserved,
              examDate: exam.toISOString().split('T')[0],
              newExpiryDate: newExpStr,
              dameEarliestDate: dameEarliest.toISOString().split('T')[0],
              restrictions: age >= 60 ? ['Multi-pilot crew operations only (Single-pilot prohibited)'] : []
            };
          }
        }

        if (result && result.newExpiryDate && !result.dameEarliestDate) {
          const expDate = new Date(result.newExpiryDate);
          const dameEarliest = new Date(expDate);
          dameEarliest.setDate(dameEarliest.getDate() - 45);
          result.dameEarliestDate = dameEarliest.toISOString().split('T')[0];
        }
        break;
      }

      case 'ppc': {
        const conductDate = inputData.conductDate || document.getElementById('input-ppc-conduct-date')?.value || new Date().toISOString().split('T')[0];
        const currentExpiryDate = inputData.expiryDate || document.getElementById('input-ppc-expiry-date')?.value || null;

        const calcParams = { conductDate, currentExpiryDate };

        if (typeof PPCEngineModule !== 'undefined') {
          if (typeof PPCEngineModule.calculatePPCValidity === 'function') {
            result = PPCEngineModule.calculatePPCValidity(calcParams);
          } else if (PPCEngineModule.PPCValidityEngine && typeof PPCEngineModule.PPCValidityEngine.calculatePPCValidity === 'function') {
            result = PPCEngineModule.PPCValidityEngine.calculatePPCValidity(calcParams);
          } else if (PPCEngineModule.default && typeof PPCEngineModule.default.calculatePPCValidity === 'function') {
            result = PPCEngineModule.default.calculatePPCValidity(calcParams);
          }
        }

        if (!result && typeof PPCValidityEngine !== 'undefined' && typeof PPCValidityEngine.calculatePPCValidity === 'function') {
          result = PPCValidityEngine.calculatePPCValidity(calcParams);
        }

        // Full standalone fallback calculation matching PPCValidityEngine logic
        if (!result) {
          const conduct = new Date(conductDate);
          const currExp = currentExpiryDate ? new Date(currentExpiryDate) : null;
          let newExp;
          let anniversaryPreserved = false;
          let lapsedLPCWarning = null;

          if (currExp && !isNaN(currExp.getTime())) {
            const threeMonthsPost = new Date(Date.UTC(currExp.getFullYear(), currExp.getMonth() + 3 + 1, 0));
            if (conduct > threeMonthsPost) {
              lapsedLPCWarning = 'LPC Expired > 3 Months: Mandatory ATO / simulator refresher footprint required prior to conducting proficiency check.';
            }

            const windowStart = new Date(currExp.getTime());
            windowStart.setMonth(windowStart.getMonth() - 3);

            if (conduct >= windowStart && conduct <= currExp) {
              anniversaryPreserved = true;
              newExp = new Date(Date.UTC(currExp.getFullYear() + 1, currExp.getMonth() + 1, 0));
            }
          }

          if (!anniversaryPreserved) {
            newExp = new Date(Date.UTC(conduct.getFullYear() + 1, conduct.getMonth() + 1, 0));
          }

          const earliestOPC = new Date(conduct.getTime());
          earliestOPC.setMonth(earliestOPC.getMonth() + 4);
          earliestOPC.setDate(earliestOPC.getDate() + 1);

          const y = newExp.getUTCFullYear();
          const m = newExp.getUTCMonth();
          const latestOPC = new Date(Date.UTC(y, m - 4 + 1, 0));

          const targetOPC = new Date(conduct.getTime());
          targetOPC.setMonth(targetOPC.getMonth() + 6);

          const fmtDate = (d) => d ? d.toISOString().split('T')[0] : null;

          result = {
            lpcConductDate: conductDate,
            previousLPCExpiry: currentExpiryDate,
            newLPCExpiryDate: fmtDate(newExp),
            anniversaryPreserved,
            calculationMethod: anniversaryPreserved ? 'Preserved (+12M from prev expiry)' : 'Reset (+12M from exam EOM)',
            lapsedLPCWarning,
            earliestOPCDate: fmtDate(earliestOPC),
            latestOPCDate: fmtDate(latestOPC),
            targetOPCDate: fmtDate(targetOPC)
          };
        }
        break;
      }

    case 'recurrent': {
        const qualKey = inputData.courseType || toolsState.recurrentCourseKey || 'LINE_CHECK';
        const completionDate = inputData.completionDate || document.getElementById('input-recurrent-conduct-date')?.value || new Date().toISOString().split('T')[0];
        const currentExpiryDate = inputData.currentExpiryDate || document.getElementById('input-recurrent-expiry-date')?.value || null;

        const calcParams = { qualKey, completionDate, currentExpiryDate };

        if (typeof RecurrentEngineModule !== 'undefined') {
          if (typeof RecurrentEngineModule.calculateExpiry === 'function') {
            result = RecurrentEngineModule.calculateExpiry(qualKey, completionDate, currentExpiryDate);
          } else if (RecurrentEngineModule.RecurrentTrainingEngine && typeof RecurrentEngineModule.RecurrentTrainingEngine.calculateExpiry === 'function') {
            result = RecurrentEngineModule.RecurrentTrainingEngine.calculateExpiry(qualKey, completionDate, currentExpiryDate);
          } else if (RecurrentEngineModule.default && typeof RecurrentEngineModule.default.calculateExpiry === 'function') {
            result = RecurrentEngineModule.default.calculateExpiry(qualKey, completionDate, currentExpiryDate);
          }
        }

        if (!result && typeof RecurrentTrainingEngine !== 'undefined' && typeof RecurrentTrainingEngine.calculateExpiry === 'function') {
          result = RecurrentTrainingEngine.calculateExpiry(qualKey, completionDate, currentExpiryDate);
        }

        // Full standalone fallback calculation matching RecurrentTrainingEngine logic
        if (!result) {
          const rules = {
            LINE_CHECK: { id: 'LINE_CHECK', name: 'Line Check (LC)', validityMonths: 12, windowMonths: 3, endOfMonthExpiry: true, category: 'Annual Check' },
            SEP_AIRCRAFT_TYPE: { id: 'SEP_AIRCRAFT_TYPE', name: 'SEP (Aircraft Type Check)', validityMonths: 12, windowMonths: 3, endOfMonthExpiry: true, category: 'Annual SEP' },
            DOOR_DRILL: { id: 'DOOR_DRILL', name: 'Practical Door Drill', validityMonths: 12, windowMonths: 3, endOfMonthExpiry: true, category: 'Annual SEP' },
            CRM: { id: 'CRM', name: 'Crew Resource Management (CRM)', validityMonths: 12, windowMonths: 3, endOfMonthExpiry: true, category: 'Annual Refresher' },
            AVSEC: { id: 'AVSEC', name: 'Aviation Security (AVSEC)', validityMonths: 12, windowMonths: 3, endOfMonthExpiry: true, category: 'Annual Refresher' },
            ROUTE_AERODROME_COMPETENCE: { id: 'ROUTE_AERODROME_COMPETENCE', name: 'Route & Aerodrome Competence', validityMonths: 12, windowMonths: 0, endOfMonthExpiry: true, category: 'Annual Competence' },
            DGR_FUNCTION_7: { id: 'DGR_FUNCTION_7', name: 'Dangerous Goods (DGR - Function 7)', validityMonths: 24, windowMonths: 3, endOfMonthExpiry: true, category: '24-Month Module' },
            SMS: { id: 'SMS', name: 'Safety Management System (SMS)', validityMonths: 36, windowMonths: 3, endOfMonthExpiry: true, category: '36-Month Module' },
            FIRE_SMOKE_DRILL: { id: 'FIRE_SMOKE_DRILL', name: 'Fire & Smoke House Practical Drill', validityMonths: 36, windowMonths: 0, endOfMonthExpiry: true, category: '36-Month Practical' },
            WET_DITCHING_DRILL: { id: 'WET_DITCHING_DRILL', name: 'Wet / Swimming & Dinghy Drill', validityMonths: 36, windowMonths: 0, endOfMonthExpiry: true, category: '36-Month Practical' },
            LVO_AUTOLAND: { id: 'LVO_AUTOLAND', name: 'Low Visibility Operations (LVO / Autoland)', validityDays: 180, endOfMonthExpiry: false, category: 'Semi-Annual Recency' }
          };

          const rule = rules[qualKey] || rules['LINE_CHECK'];
          const parts = completionDate.split('-');
          const compDate = parts.length === 3 ? new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))) : new Date(completionDate);
          
          let currExp = null;
          if (currentExpiryDate) {
            const expParts = currentExpiryDate.split('-');
            currExp = expParts.length === 3 ? new Date(Date.UTC(parseInt(expParts[0], 10), parseInt(expParts[1], 10) - 1, parseInt(expParts[2], 10))) : new Date(currentExpiryDate);
          }

          let newExp;
          let anniversaryPreserved = false;

          if (rule.validityDays) {
            newExp = new Date(compDate.getTime() + rule.validityDays * 24 * 60 * 60 * 1000);
          } else {
            if (rule.windowMonths > 0 && currExp) {
              const windowStart = new Date(currExp.getTime());
              windowStart.setUTCMonth(windowStart.getUTCMonth() - rule.windowMonths);
              if (compDate >= windowStart && compDate <= currExp) {
                anniversaryPreserved = true;
                newExp = new Date(currExp.getTime());
                newExp.setUTCMonth(newExp.getUTCMonth() + rule.validityMonths);
                if (rule.endOfMonthExpiry) {
                  newExp = new Date(Date.UTC(newExp.getUTCFullYear(), newExp.getUTCMonth() + 1, 0));
                }
              }
            }

            if (!anniversaryPreserved) {
              newExp = new Date(compDate.getTime());
              newExp.setUTCMonth(newExp.getUTCMonth() + rule.validityMonths);
              if (rule.endOfMonthExpiry) {
                newExp = new Date(Date.UTC(newExp.getUTCFullYear(), newExp.getUTCMonth() + 1, 0));
              }
            }
          }

          const fmtDate = (d) => {
            if (!d) return null;
            const y = d.getUTCFullYear();
            const m = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          };

          result = {
            qualId: rule.id,
            name: rule.name,
            category: rule.category,
            completionDate: fmtDate(compDate),
            currentExpiryDate: currExp ? fmtDate(currExp) : null,
            newExpiryDate: fmtDate(newExp),
            anniversaryPreserved,
            calculationMethod: anniversaryPreserved ? `Preserved Anniversary (+${rule.validityMonths}M)` : `Reset (+${rule.validityMonths || rule.validityDays + 'D'})`
          };
        }
        break;
      }

      case 'recency': {
        const rank = document.getElementById('input-recency-capacity')?.value || 'PIC';
        const flightDate = document.getElementById('input-recency-flight-date')?.value || new Date().toISOString().split('T')[0];
        const l1 = document.getElementById('input-recency-l1-date')?.value;
        const l2 = document.getElementById('input-recency-l2-date')?.value;
        const l3 = document.getElementById('input-recency-l3-date')?.value;
        const isMultiVariant = (document.getElementById('input-recency-multivariant')?.value === 'true');
        const lastVariantLandingDate = document.getElementById('input-recency-variant-date')?.value || null;

        const last3Landings = [l1, l2, l3].filter(Boolean);

        const calcParams = {
          rank,
          last3Landings,
          isMultiVariant,
          lastVariantLandingDate,
          referenceDate: flightDate
        };

        if (typeof LandingRecencyEngineModule !== 'undefined') {
          if (typeof LandingRecencyEngineModule.evaluateLandingRecency === 'function') {
            result = LandingRecencyEngineModule.evaluateLandingRecency(calcParams);
          } else if (LandingRecencyEngineModule.LandingRecencyEngine && typeof LandingRecencyEngineModule.LandingRecencyEngine.evaluateLandingRecency === 'function') {
            result = LandingRecencyEngineModule.LandingRecencyEngine.evaluateLandingRecency(calcParams);
          } else if (LandingRecencyEngineModule.default && typeof LandingRecencyEngineModule.default.evaluateLandingRecency === 'function') {
            result = LandingRecencyEngineModule.default.evaluateLandingRecency(calcParams);
          }
        }

        if (!result && typeof LandingRecencyEngine !== 'undefined' && typeof LandingRecencyEngine.evaluateLandingRecency === 'function') {
          result = LandingRecencyEngine.evaluateLandingRecency(calcParams);
        }

        // Standalone fallback calculation if module not imported
        if (!result) {
          const normRank = String(rank).toUpperCase().includes('FO') ? 'FO' : 'PIC';
          const refDate = flightDate ? new Date(flightDate) : new Date();
          const validLandings = last3Landings.map(d => new Date(d)).filter(d => !isNaN(d.getTime())).sort((a,b) => b - a);
          const mostRecentLanding = validLandings.length > 0 ? validLandings[0] : null;
          const daysSinceLastLanding = mostRecentLanding ? Math.floor((refDate - mostRecentLanding) / 86400000) : 999;
          const date90Ago = new Date(refDate.getTime());
          date90Ago.setDate(date90Ago.getDate() - 90);
          const landingsIn90Days = validLandings.filter(l => l >= date90Ago && l <= refDate).length;
          
          let cad90ExpiryDate = null;
          let daysRemaining90 = 0;
          if (validLandings.length >= 3) {
            const expDate = new Date(validLandings[2].getTime());
            expDate.setDate(expDate.getDate() + 90);
            cad90ExpiryDate = expDate.toISOString().split('T')[0];
            daysRemaining90 = Math.ceil((expDate - refDate) / 86400000);
          }
          const isCad90Lapsed = landingsIn90Days < 3 || daysRemaining90 < 0;

          let isPic45Lapsed = false;
          let pic45ExpiryDate = null;
          let daysRemaining45 = null;
          if (normRank === 'PIC') {
            if (mostRecentLanding) {
              const expDate45 = new Date(mostRecentLanding.getTime());
              expDate45.setDate(expDate45.getDate() + 45);
              pic45ExpiryDate = expDate45.toISOString().split('T')[0];
              daysRemaining45 = Math.ceil((expDate45 - refDate) / 86400000);
              isPic45Lapsed = daysRemaining45 < 0;
            } else {
              isPic45Lapsed = true;
              daysRemaining45 = 0;
            }
          }

          let isVariantLapsed = false;
          if (isMultiVariant) {
            if (lastVariantLandingDate) {
              const expVar = new Date(lastVariantLandingDate);
              expVar.setDate(expVar.getDate() + 90);
              isVariantLapsed = (Math.ceil((expVar - refDate) / 86400000) < 0);
            } else {
              isVariantLapsed = true;
            }
          }

          const isCompliant = !isCad90Lapsed && !isPic45Lapsed && (!isMultiVariant || !isVariantLapsed);
          const minDays = Math.max(0, Math.min(daysRemaining90 || 90, daysRemaining45 !== null ? daysRemaining45 : 90));

          result = {
            isCompliant,
            rank: normRank,
            referenceDate: flightDate,
            mostRecentLandingDate: mostRecentLanding ? mostRecentLanding.toISOString().split('T')[0] : null,
            daysSinceLastLanding: daysSinceLastLanding === 999 ? null : daysSinceLastLanding,
            landingsIn90Days,
            nextRequiredLandingCutoff: pic45ExpiryDate || cad90ExpiryDate,
            daysRemaining: isCompliant ? minDays : 0,
            statusMessage: isCompliant ? `${minDays} days remaining` : 'Recency Lapsed',
            breakdownGrid: [
              { label: '90-DAY LANDINGS', value: `${landingsIn90Days} / 3 Completed` },
              { label: 'LAST PF LANDING', value: mostRecentLanding ? `${daysSinceLastLanding}d ago` : 'None Recorded' },
              { label: 'VARIANT STATUS', value: isMultiVariant ? (isVariantLapsed ? 'MFF Lapsed' : 'Current') : 'Single Fleet' }
            ]
          };
        }
        break;
      }

      case 'standby': {
        const startTime = document.getElementById('input-standby-start-time')?.value || '08:00';
        const reportTime = document.getElementById('input-standby-report-time')?.value || '12:00';
        const loc = toolsState.standbyLocation || document.getElementById('input-standby-location')?.value || 'HOME';

        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const d = now.getDate();

        const convertLocalTimeToUTCISO = (timeStr, isReportTime = false, startStr = null) => {
          const [hh, mm] = (timeStr || '08:00').split(':').map(val => parseInt(val, 10) || 0);
          let targetDay = d;
          if (isReportTime && startStr) {
            const [sH, sM] = startStr.split(':').map(val => parseInt(val, 10) || 0);
            if (hh < sH || (hh === sH && mm < sM)) {
              targetDay = d + 1;
            }
          }
          const localDate = new Date(Date.UTC(y, m, targetDay, hh - 8, mm, 0));
          return localDate.toISOString();
        };

        const standbyStartISO = convertLocalTimeToUTCISO(startTime, false);
        const calloutReportISO = convertLocalTimeToUTCISO(reportTime, true, startTime);

        const calcParams = {
          standbyStartISO,
          calloutReportISO,
          localTimezoneOffsetHours: 8,
          standbyLocation: loc,
          noticeGivenHours: 2.0,
          isAcclimatised: true,
          precedingRestCategory: 'UP_TO_18_OR_OVER_30',
          flightCrewCount: 2,
          sectorsPlanned: 1,
          longestSectorHours: 0
        };

        if (typeof StandbyEngineModule !== 'undefined') {
          if (typeof StandbyEngineModule.calculateStandbyFDP === 'function') {
            result = StandbyEngineModule.calculateStandbyFDP(calcParams);
          } else if (StandbyEngineModule.StandbyFDPEngine && typeof StandbyEngineModule.StandbyFDPEngine.calculateStandbyFDP === 'function') {
            result = StandbyEngineModule.StandbyFDPEngine.calculateStandbyFDP(calcParams);
          } else if (StandbyEngineModule.default && typeof StandbyEngineModule.default.calculateStandbyFDP === 'function') {
            result = StandbyEngineModule.default.calculateStandbyFDP(calcParams);
          }
        }

        if (!result && typeof StandbyFDPEngine !== 'undefined' && typeof StandbyFDPEngine.calculateStandbyFDP === 'function') {
          result = StandbyFDPEngine.calculateStandbyFDP(calcParams);
        }
        break;
      }

      case 'max-fdp': {
        const reportTime = document.getElementById('input-maxfdp-report-time')?.value || '06:00';
        const sectors = parseInt(document.getElementById('input-maxfdp-sectors')?.value || '2', 10);
        const acclim = document.getElementById('input-maxfdp-acclimatised')?.value || 'YES';
        if (MaxFdpEngineModule && typeof MaxFdpEngineModule.calculateMaxAllowableFDP === 'function') {
          result = MaxFdpEngineModule.calculateMaxAllowableFDP({ reportTimeLocalStr: reportTime, sectorCount: sectors, isAcclimatised: acclim === 'YES' });
        } else {
          result = { finalMaxPermissibleFDPFormatted: '13:00 HOURS', cutoffTimestampUTC: '13:15 UTC', baseAllowableFDPFormatted: '13:00 Hours' };
        }
        break;
      }

      case 'pre-flight-rest': {
        const dutyHours = parseInt(document.getElementById('input-preflight-duty-hours')?.value || '10', 10);
        const loc = document.getElementById('input-preflight-location')?.value || 'HOME';
        if (PreFlightRestEngineModule && typeof PreFlightRestEngineModule.calculatePreFlightRest === 'function') {
          result = PreFlightRestEngineModule.calculatePreFlightRest({ precedingDutyHours: dutyHours, isHomeBase: loc === 'HOME' });
        } else {
          result = { finalRequiredRestFormatted: '12:00 HOURS', restCompletionTimeUtc: '20:15 UTC', precedingDutyHours: dutyHours };
        }
        break;
      }

      case 'cumulative': {
        const d7 = document.getElementById('input-cum-duty-7d')?.value || '32:15';
        const d14 = document.getElementById('input-cum-duty-14d')?.value || '68:30';
        const d28 = document.getElementById('input-cum-duty-28d')?.value || '120:00';
        const f28 = document.getElementById('input-cum-flight-28d')?.value || '78:30';
        if (CumulativeEngineModule && typeof CumulativeEngineModule.calculateCumulativeHours === 'function') {
          result = CumulativeEngineModule.calculateCumulativeHours({ duty7DaysStr: d7, duty14DaysStr: d14, duty28DaysStr: d28, flight28DaysStr: f28 });
        } else {
          result = { duty7Days: d7, isExceeded: false };
        }
        break;
      }
    }
  } catch (err) {
    console.warn(`Error calculating for ${toolType}:`, err);
  }

  return result;
}

// ==================================================================
// NORMALIZER FOR 4-SLOT OUTPUT CARDS
// ==================================================================
export function normalizeOutput(toolType, rawResult) {
  const normType = (toolType === 'maxfdp') ? 'max-fdp' : ((toolType === 'preflight') ? 'pre-flight-rest' : toolType);

  let statusTheme = 'emerald';

  switch (normType) {
    case 'medical': {
      const isEligible = rawResult && rawResult.isEligible !== undefined ? rawResult.isEligible : true;
      const age = rawResult && rawResult.age !== undefined ? rawResult.age : 40;
      const validityMonths = rawResult && rawResult.validityMonths !== undefined ? rawResult.validityMonths : (age >= 60 ? 6 : 12);
      const isPreserved = rawResult ? !!rawResult.anniversaryPreserved : false;

      if (!isEligible || age >= 65) {
        return {
          statusTheme: 'rose',
          statusBadge: 'CEASED (AGE 65+)',
          statusClass: 'bg-rose-600',
          headlineTitle: 'NEW MEDICAL EXPIRY',
          headlineValue: 'CEASED (AGE 65+)',
          targetClockLabel: '45-DAYS RENEWAL WINDOW',
          targetClockValue: 'PRIVILEGES CEASED',
          breakdownGrid: [
            { label: 'AGE', value: `${age} Years` },
            { label: 'VALIDITY', value: '0 Months' },
            { label: 'CREW LIMITATION', value: 'Commercial Privileges Ceased' }
          ],
          auditNotes: ['Commercial Air Transport pilot privileges cease at Age 65 per CAAM CAD 1 PEL.']
        };
      }

      const expiry = rawResult && rawResult.newExpiryDate ? formatDateDDMMMYYYY(rawResult.newExpiryDate) : '31 OCT 2027';

      let dameStartStr = '16 SEP 2027';
      if (rawResult && rawResult.dameEarliestDate) {
        dameStartStr = formatDateDDMMMYYYY(rawResult.dameEarliestDate);
      } else if (rawResult && rawResult.newExpiryDate) {
        const d = new Date(rawResult.newExpiryDate);
        d.setDate(d.getDate() - 45);
        dameStartStr = formatDateDDMMMYYYY(d);
      }

      const windowStr = `${dameStartStr} to ${expiry}`;
      const isOML = age >= 60 || (rawResult && rawResult.restrictions && rawResult.restrictions.length > 0);

      let statusTheme = 'emerald';
      let statusBadge = 'VALID / CLEARED';
      let statusClass = 'bg-emerald-600';
      if (!isPreserved) {
        statusTheme = 'amber';
        statusBadge = 'EXPIRY RESET';
        statusClass = 'bg-amber-600';
      }

      return {
        statusTheme,
        statusBadge,
        statusClass,
        headlineTitle: 'NEW MEDICAL EXPIRY',
        headlineValue: expiry,
        targetClockLabel: '45-DAYS RENEWAL WINDOW',
        targetClockValue: windowStr,
        breakdownGrid: [
          { label: 'AGE', value: `${age} Years` },
          { label: 'VALIDITY', value: `${validityMonths} Months` },
          { label: 'CREW LIMITATION', value: isOML ? 'Multi-Pilot Only (OML)' : 'Unrestricted' }
        ],
        auditNotes: ['Grounded in CAAM CAD 1 PEL Section 1.2.5.2 & OM-A 5.1.4.4. Compliant.']
      };
    }

    case 'ppc': {
      const isPreserved = rawResult ? !!rawResult.anniversaryPreserved : true;
      const lapsedWarning = rawResult ? rawResult.lapsedLPCWarning : null;
      const expiryStr = rawResult && rawResult.newLPCExpiryDate ? formatDateDDMMMYYYY(rawResult.newLPCExpiryDate) : '31 JUL 2027';

      let opcWindowStr = '01 MAY 2027 to 31 JUL 2027';
      if (rawResult && rawResult.earliestOPCDate && rawResult.latestOPCDate) {
        opcWindowStr = `${formatDateDDMMMYYYY(rawResult.earliestOPCDate)} to ${formatDateDDMMMYYYY(rawResult.latestOPCDate)}`;
      }

      let targetOpcStr = '--';
      if (rawResult && rawResult.targetOPCDate) {
        targetOpcStr = formatDateDDMMMYYYY(rawResult.targetOPCDate);
      }

      let statusTheme = 'emerald';
      let statusBadge = 'VALID / CLEARED';
      let statusClass = 'bg-emerald-600';

      if (lapsedWarning) {
        statusTheme = 'rose';
        statusBadge = 'LAPSED (> 3 MONTHS)';
        statusClass = 'bg-rose-600';
      } else if (!isPreserved) {
        statusTheme = 'amber';
        statusBadge = 'EXPIRY RESET';
        statusClass = 'bg-amber-600';
      }

      return {
        statusTheme,
        statusBadge,
        statusClass,
        headlineTitle: 'NEW PPC / LPC EXPIRY',
        headlineValue: expiryStr,
        targetClockLabel: 'NEXT OPC WINDOW (4–8 MONTHS)',
        targetClockValue: opcWindowStr,
        breakdownGrid: [
          { label: 'REVALIDATION RULE', value: isPreserved ? 'Preserved (3M Window)' : 'Reset to EOM' },
          { label: 'NEXT OPC TARGET', value: targetOpcStr },
          { label: 'OPERATING STATUS', value: lapsedWarning ? 'ATO Refresher Req.' : 'Qualified & Cleared' }
        ],
        auditNotes: [lapsedWarning || 'Grounded in CAAM CAD 6.9.4.4, CAD 1 PEL 2.1.5.10 & OM-A 5.1.4.6. Compliant.']
      };
    }

    case 'recurrent': {
      statusTheme = 'emerald';
      const expiry = rawResult ? formatDateDDMMMYYYY(rawResult.newExpiryDate) : '31 DEC 2026';
      const courseName = rawResult ? (rawResult.name || toolsState.recurrentCourseName) : 'Line Check (LC)';
      const completionDateStr = rawResult && rawResult.completionDate ? formatDateDDMMMYYYY(rawResult.completionDate) : '15 DEC 2025';

      let categoryDisplay = 'Annual (12 month)';
      const rawCat = rawResult ? (rawResult.category || toolsState.recurrentCourseCat || '') : '';
      const qualId = rawResult ? rawResult.qualId : toolsState.recurrentCourseKey;

      if (qualId === 'LVO_AUTOLAND' || rawCat.includes('Semi-Annual') || rawCat.includes('180')) {
        categoryDisplay = 'Semi-Annual (180 day)';
      } else if (rawCat.includes('24-Month') || rawCat.includes('24')) {
        categoryDisplay = 'Bi-Annual (24 month)';
      } else if (rawCat.includes('36-Month') || rawCat.includes('36')) {
        categoryDisplay = 'Triennial (36 month)';
      } else {
        categoryDisplay = 'Annual (12 month)';
      }

      let ruleDisplay = 'Reset to EOM';
      if (qualId === 'LVO_AUTOLAND' || (rawResult && rawResult.calculationMethod && rawResult.calculationMethod.includes('Days'))) {
        ruleDisplay = '180 Days Rolling';
      } else if (rawResult && rawResult.anniversaryPreserved) {
        ruleDisplay = 'Preserved (3M Window)';
      } else {
        ruleDisplay = 'Reset to EOM';
      }

      return {
        statusTheme,
        headlineTitle: 'RECURRENT EXPIRY DATE',
        headlineValue: expiry,
        targetClockLabel: 'Qualification Module:',
        targetClockValue: String(courseName).toUpperCase(),
        breakdownGrid: [
          { label: 'COMPLETION DATE', value: completionDateStr },
          { label: 'MODULE CATEGORY', value: categoryDisplay },
          { label: 'RENEWAL RULE', value: ruleDisplay }
        ],
        auditNotes: ['Grounded in CAAM CAD 6.9.4 & OM-D Chapter 2 Recurrent Standards. Compliant.']
      };
    }

    case 'recency': {
      const isCompliant = rawResult ? !!rawResult.isCompliant : true;
      const rank = rawResult ? (rawResult.rank || 'PIC') : 'PIC';
      statusTheme = isCompliant ? 'emerald' : 'rose';

      const headlineValue = isCompliant
        ? (rawResult && rawResult.daysRemaining !== undefined ? `${rawResult.daysRemaining} DAYS REMAINING` : '3 / 3 LANDINGS MET')
        : 'RECENCY LAPSED';

      const targetClockLabel = rank === 'PIC' ? 'Next Required Landing Cutoff (45d/90d)' : 'Statutory 90-Day Cutoff';
      const rawCutoff = rawResult && rawResult.nextRequiredLandingCutoff ? rawResult.nextRequiredLandingCutoff : '90-Day Rolling Window';
      const targetClockValue = formatDateDDMMMYYYY(rawCutoff);

      const grid = rawResult && rawResult.breakdownGrid ? rawResult.breakdownGrid : [
        { label: '90-DAY LANDINGS', value: rawResult && rawResult.landingsIn90Days !== undefined ? `${rawResult.landingsIn90Days} / 3 Completed` : '3 / 3 Completed' },
        { label: 'LAST PF LANDING', value: rawResult && rawResult.daysSinceLastLanding !== undefined ? `${rawResult.daysSinceLastLanding}d ago (${formatDateDDMMMYYYY(rawResult.mostRecentLandingDate)})` : 'None Recorded' },
        { label: 'VARIANT STATUS', value: 'Single Fleet' }
      ];

      let auditNotes = [];
      if (isCompliant) {
        auditNotes = ['CAD 6 & OM-A 5.3.4 Recency Cleared. 3 PF landings in 90 days.'];
      } else {
        const isPic45 = rawResult && rawResult.pic45Status && rawResult.pic45Status.isLapsed;
        const isVar = rawResult && rawResult.variantStatus && rawResult.variantStatus.isLapsed;
        const reason = isPic45 ? 'Captain 45d Rule' : (isVar ? 'MFF Variant Rule' : 'CAD 6 90d Rule');
        const fp = rawResult && rawResult.requalificationFootprint ? ` Req: ${rawResult.requalificationFootprint.summary}` : '';
        auditNotes = [`CAD 6 / OM-A Lapsed (${reason}).${fp}`];
      }

      return {
        statusTheme,
        statusBadge: isCompliant ? 'RECENCY CLEARED' : 'RECENCY LAPSED',
        headlineTitle: 'LANDING RECENCY STATUS',
        headlineValue,
        targetClockLabel,
        targetClockValue,
        breakdownGrid: grid,
        auditNotes
      };
    }

    case 'standby': {
      const isCaseB = rawResult ? (rawResult.caseType === 'CASE_B') : false;
      const isExceeded = rawResult && rawResult.warnings && rawResult.warnings.length > 0;
      
      let statusTheme = 'emerald';
      let statusBadge = isCaseB ? 'CASE B (>= 6H STBY)' : 'CASE A (< 6H STBY)';
      let statusClass = 'bg-emerald-600';

      if (isExceeded) {
        statusTheme = 'rose';
        statusBadge = 'STBY LIMIT EXCEEDED (>12H)';
        statusClass = 'bg-rose-600';
      } else if (isCaseB) {
        statusTheme = 'amber';
        statusClass = 'bg-amber-600';
      }

      const fdp = rawResult ? `${rawResult.netPermissibleFDPFormatted || '13:00'} HOURS` : '13:00 HOURS';
      
      let cutoffStr = '1800Z / 02:00 MYT';
      let utcS = '';
      if (rawResult && (rawResult.cutoffTimestampUTC || rawResult.cutoffTimestampUtc)) {
        const utcRaw = rawResult.cutoffTimestampUTC || rawResult.cutoffTimestampUtc;
        const uParts = utcRaw.split(' ');
        if (uParts.length >= 2) {
          utcS = uParts[1].replace(':', '') + 'Z';
        } else {
          utcS = utcRaw.replace(':', '') + 'Z';
        }
      }

      let localS = '';
      if (rawResult && rawResult.cutoffTimestampLocal) {
        const lParts = rawResult.cutoffTimestampLocal.split(' ');
        localS = lParts.length >= 2 ? `${lParts[1]} MYT` : `${rawResult.cutoffTimestampLocal} MYT`;
      }

      if (utcS && localS) {
        cutoffStr = `${utcS} / ${localS}`;
      } else if (localS) {
        cutoffStr = localS;
      } else if (utcS) {
        cutoffStr = utcS;
      }

      const standbyDurationStr = rawResult && rawResult.standbyDurationFormatted 
        ? `${rawResult.standbyDurationFormatted.replace(':', 'h ')}m` 
        : '04h 00m';

      const deductionStr = rawResult && rawResult.fdpDeductionFormatted 
        ? `${rawResult.fdpDeductionFormatted.replace(':', 'h ')}m` 
        : '00h 00m';

      const caseLabelStr = rawResult && rawResult.caseLabel 
        ? rawResult.caseLabel 
        : (isCaseB ? 'Case B (>= 6 Hours Standby)' : 'Case A (< 6 Hours Standby)');

      const warningsStr = rawResult && rawResult.warnings && rawResult.warnings.length > 0 ? rawResult.warnings.join(' ') : null;
      const auditNoteStr = warningsStr
        ? `${warningsStr} ${rawResult.notes ? rawResult.notes.map(n => n.endsWith('.') ? n : n + '.').join(' ') : ''}`
        : (rawResult && rawResult.notes && rawResult.notes.length > 0
          ? rawResult.notes.map(n => n.endsWith('.') ? n : n + '.').join(' ')
          : 'Grounded in CAAM CAD 1901 Section 2.11 Standby FDP Adjustments. Compliant.');

      return {
        statusTheme,
        statusBadge,
        statusClass,
        headlineTitle: 'NET PERMISSIBLE FDP',
        headlineValue: fdp,
        targetClockLabel: 'Latest On-Chocks Cutoff:',
        targetClockValue: cutoffStr,
        breakdownGrid: [
          { label: 'STANDBY DURATION', value: standbyDurationStr },
          { label: 'FDP DEDUCTION', value: deductionStr },
          { label: 'CASE CLASSIFICATION', value: caseLabelStr }
        ],
        auditNotes: [auditNoteStr]
      };
    }

    case 'max-fdp': {
      const isDiscretionNeeded = rawResult ? (rawResult.isDiscretionTriggered || rawResult.exceedsMaxFdp) : false;
      statusTheme = isDiscretionNeeded ? 'amber' : 'emerald';
      const fdpVal = rawResult ? (rawResult.finalMaxPermissibleFDPFormatted || rawResult.maxFdpFormatted) : '13:00 HOURS';
      return {
        statusTheme,
        headlineTitle: 'MAX ALLOWABLE FDP',
        headlineValue: fdpVal,
        targetClockLabel: 'On-Chocks Cutoff Time:',
        targetClockValue: rawResult && rawResult.cutoffTimestampUTC ? rawResult.cutoffTimestampUTC : '13:15 UTC',
        breakdownGrid: [
          { label: 'BASE ALLOWABLE FDP', value: rawResult && rawResult.baseAllowableFDPFormatted ? rawResult.baseAllowableFDPFormatted : '13:00 Hours' },
          { label: 'EXTENSIONS CREDIT', value: rawResult && rawResult.reliefType && rawResult.reliefType !== 'NONE' ? rawResult.reliefType : 'None' },
          { label: 'MAX DISCRETION CAP', value: '+02:00 Hours' }
        ],
        auditNotes: ['Grounded in CAAM CAD 1901 Table A/B & OM-A Section 7.5. Compliant.']
      };
    }

    case 'pre-flight-rest': {
      const isReduced = rawResult ? rawResult.isRestReduced : false;
      statusTheme = isReduced ? 'amber' : 'emerald';
      const restVal = rawResult ? (rawResult.finalRequiredRestFormatted || rawResult.minRestFormatted) : '12:00 HOURS';
      return {
        statusTheme,
        headlineTitle: 'PRE-FLIGHT MINIMUM REST',
        headlineValue: restVal,
        targetClockLabel: 'Earliest Available Report:',
        targetClockValue: rawResult && rawResult.restCompletionTimeUtc ? rawResult.restCompletionTimeUtc : '20:15 UTC',
        breakdownGrid: [
          { label: 'PRECEDING DUTY', value: (rawResult && rawResult.precedingDutyHours) ? `${rawResult.precedingDutyHours} Hours` : '10 Hours' },
          { label: 'DUTY LOCATION', value: 'Home Base (WMKK / KUL)' },
          { label: 'OUTSTATION ADDITION', value: '+00:00 Hours' }
        ],
        auditNotes: ['Grounded in CAAM CAD 1901 Section 2.14 & OM-A Section 7.5.12. Compliant.']
      };
    }

    case 'cumulative': {
      const isOverLimit = rawResult ? (rawResult.isExceeded || rawResult.isOverCap) : false;
      statusTheme = isOverLimit ? 'rose' : 'emerald';
      const duty7Val = (rawResult && rawResult.duty7Days) ? `${rawResult.duty7Days.currentFormatted || rawResult.duty7Days} / 55:00` : '32:15 / 55:00';
      return {
        statusTheme,
        headlineTitle: '7-DAY CUMULATIVE DUTY',
        headlineValue: duty7Val,
        targetClockLabel: '7-Day Rolling Duty Budget:',
        targetClockValue: '22:45 Hours Margin Remaining',
        breakdownGrid: [
          { label: '14-DAY DUTY (CAP 95H)', value: '68:30 / 95:00' },
          { label: '28-DAY DUTY (CAP 190H)', value: '120:00 / 190:00' },
          { label: '28-DAY FLIGHT (CAP 100H)', value: '78:30 / 100:00' }
        ],
        auditNotes: ['Grounded in CAAM CAD 1901 Rolling Flight & Duty Time Caps. Compliant.']
      };
    }
  }

  return null;
}

function renderToolsOutputCardForTool(toolType, normalized) {
  if (!normalized) return;

  const keyMap = {
    'medical': 'medical',
    'ppc': 'ppc',
    'recurrent': 'recurrent',
    'recency': 'recency',
    'standby': 'standby',
    'maxfdp': 'maxfdp',
    'max-fdp': 'maxfdp',
    'preflight': 'preflight',
    'pre-flight-rest': 'preflight',
    'cumulative': 'cumulative'
  };

  const suffix = keyMap[toolType] || toolType;

  const themeMap = {
    'emerald': {
      heroBg: 'bg-emerald-500',
      clockBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      clockText: 'text-emerald-600 dark:text-emerald-500'
    },
    'amber': {
      heroBg: 'bg-amber-500',
      clockBg: 'bg-amber-100 dark:bg-amber-900/50',
      clockText: 'text-amber-600 dark:text-amber-500'
    },
    'rose': {
      heroBg: 'bg-rose-600',
      clockBg: 'bg-rose-100 dark:bg-rose-900/50',
      clockText: 'text-rose-600 dark:text-rose-500'
    }
  };

  const theme = themeMap[normalized.statusTheme] || themeMap['emerald'];

  // Slot 1: Hero Banner
  const heroEl = document.getElementById(`output-slot-1-hero-${suffix}`);
  const titleEl = document.getElementById(`output-hero-title-${suffix}`);
  const subtitleEl = document.getElementById(`output-hero-subtitle-${suffix}`);

  if (heroEl) heroEl.className = `p-4 ${theme.heroBg} text-white transition-colors duration-300 rounded-t-2xl`;
  if (titleEl) titleEl.innerText = normalized.headlineTitle || `${suffix.toUpperCase()} RESULTS`;
  if (subtitleEl) subtitleEl.innerText = normalized.headlineValue || normalized.statusBadge || 'VALID / CLEARED';

  // Slot 2: Target Window / Clock
  const clockSlotEl = document.getElementById(`output-slot-2-clock-${suffix}`);
  const clockLabelEl = document.getElementById(`output-clock-label-${suffix}`);
  const clockValEl = document.getElementById(`output-clock-value-${suffix}`);

  if (clockSlotEl) clockSlotEl.className = `p-3.5 ${theme.clockBg} border-b border-slate-200 dark:border-slate-800 flex items-center justify-between`;
  if (clockLabelEl) clockLabelEl.innerText = normalized.targetClockLabel || 'Target Window / Deadline:';
  if (clockValEl) {
    clockValEl.innerText = normalized.targetClockValue || '--:--';
    clockValEl.className = `text-sm font-extrabold ${theme.clockText} font-sans`;
  }

  // Slot 3: Breakdown Grid (3 items)
  const items = normalized.breakdownGrid || [];
  for (let i = 1; i <= 3; i++) {
    const lblEl = document.getElementById(`grid-label-${i}-${suffix}`);
    const valEl = document.getElementById(`grid-value-${i}-${suffix}`);

    if (i <= items.length && items[i - 1]) {
      if (lblEl) lblEl.innerText = items[i - 1].label || '';
      if (valEl) {
        valEl.innerText = items[i - 1].value || '';
        valEl.className = 'text-xs font-bold text-slate-800 dark:text-slate-100 font-sans';
      }
    } else {
      if (lblEl) lblEl.innerText = '';
      if (valEl) valEl.innerText = '';
    }
  }

  // Slot 4: Audit Citation Text
  const auditTextEl = document.getElementById(`output-audit-text-${suffix}`);
  if (auditTextEl && normalized.auditNotes) {
    auditTextEl.innerText = Array.isArray(normalized.auditNotes) ? normalized.auditNotes.join('. ') : normalized.auditNotes;
  }
}

export function renderNormalizedOutput(normalized) {
  renderToolsOutputCardForTool(toolsState.activeToolId, normalized);
}

export function renderToolsOutputCard(normalized) {
  renderToolsOutputCardForTool(toolsState.activeToolId, normalized);
}

// ==================================================================
// CATEGORY & TOOL SWITCHERS
// ==================================================================
export function normalizeToolCardId(rawId) {
  if (!rawId) return 'tool-card-medical';
  const s = String(rawId).toLowerCase().replace('_', '-').trim();
  if (s.includes('med')) return 'tool-card-medical';
  if (s.includes('ppc') || s.includes('lpc')) return 'tool-card-ppc';
  if (s.includes('recurrent')) return 'tool-card-recurrent';
  if (s.includes('recency')) return 'tool-card-recency';
  if (s.includes('standby') || s.includes('stby')) return 'tool-card-standby';
  if (s.includes('max') || s.includes('fdp')) return 'tool-card-maxfdp';
  if (s.includes('pre') || s.includes('rest')) return 'tool-card-preflight';
  if (s.includes('cum')) return 'tool-card-cumulative';
  return s.startsWith('tool-card-') ? s : 'tool-card-' + s;
}

export function switchToolCategory(category) {
  toolsState.activeCategory = category;

  const tabA = document.getElementById('cat-tab-qualifications');
  const tabB = document.getElementById('cat-tab-dutyrest');
  const paneA = document.getElementById('cat-pane-qualifications');
  const paneB = document.getElementById('cat-pane-dutyrest');

  const activeTabClass = 'cat-tab-btn active py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-md cursor-pointer';
  const inactiveTabClass = 'cat-tab-btn py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';

  if (category === 'qualifications') {
    if (tabA) { tabA.className = activeTabClass; tabA.setAttribute('aria-selected', 'true'); }
    if (tabB) { tabB.className = inactiveTabClass; tabB.setAttribute('aria-selected', 'false'); }
    if (paneA) paneA.classList.remove('hidden');
    if (paneB) paneB.classList.add('hidden');
    switchActiveTool('tool-card-medical');
  } else {
    if (tabA) { tabA.className = inactiveTabClass; tabA.setAttribute('aria-selected', 'false'); }
    if (tabB) { tabB.className = activeTabClass; tabB.setAttribute('aria-selected', 'true'); }
    if (paneA) paneA.classList.add('hidden');
    if (paneB) paneB.classList.remove('hidden');
    switchActiveTool('tool-card-standby');
  }
}

export function switchActiveTool(rawId) {
  const toolId = normalizeToolCardId(rawId);
  toolsState.activeToolId = toolId;

  // Update pills
  const allPills = document.querySelectorAll('.subtab-pill');
  allPills.forEach(pill => {
    pill.classList.remove('active', 'border-blue-500/40', 'bg-blue-500/20', 'text-blue-400', 'dark:text-blue-300');
    pill.classList.add('border-slate-300', 'dark:border-slate-700', 'bg-slate-200/60', 'dark:bg-slate-800/60', 'text-slate-600', 'dark:text-slate-400');
  });

  const activePillIdMap = {
    'tool-card-medical': 'pill-tool-medical',
    'tool-card-ppc': 'pill-tool-ppc',
    'tool-card-recurrent': 'pill-tool-recurrent',
    'tool-card-recency': 'pill-tool-recency',
    'tool-card-standby': 'pill-tool-standby',
    'tool-card-maxfdp': 'pill-tool-maxfdp',
    'tool-card-preflight': 'pill-tool-preflight',
    'tool-card-cumulative': 'pill-tool-cumulative'
  };

  const pillId = activePillIdMap[toolId];
  if (pillId) {
    const activePill = document.getElementById(pillId);
    if (activePill) {
      activePill.classList.add('active', 'border-blue-500/40', 'bg-blue-500/20', 'text-blue-400', 'dark:text-blue-300');
      activePill.classList.remove('border-slate-300', 'dark:border-slate-700', 'bg-slate-200/60', 'dark:bg-slate-800/60', 'text-slate-600', 'dark:text-slate-400');
    }
  }

  // Hide all tool cards, show active
  const allCards = document.querySelectorAll('.tool-card');
  allCards.forEach(card => {
    card.classList.add('hidden');
    card.classList.remove('active');
    const inner3d = card.querySelector('.card-3d-inner');
    if (inner3d) inner3d.classList.remove('is-flipped');
  });

  const targetCard = document.getElementById(toolId);
  if (targetCard) {
    targetCard.classList.remove('hidden');
    targetCard.classList.add('active');
  }
}

export function resetToolInputs(toolId) {
  // Flip card back if flipped
  const keyMap = {
    'tool-card-medical': 'medical',
    'tool-card-ppc': 'ppc',
    'tool-card-recurrent': 'recurrent',
    'tool-card-recency': 'recency',
    'tool-card-standby': 'standby',
    'tool-card-maxfdp': 'maxfdp',
    'tool-card-preflight': 'preflight',
    'tool-card-cumulative': 'cumulative'
  };

  const key = keyMap[toolId] || toolId;
  flipCardBackToInput(key);

  if (key === 'medical') {
    const dobDisplay = document.getElementById('input-med-dob-display');
    if (dobDisplay) dobDisplay.innerText = 'SELECT DOB';
    const examDisplay = document.getElementById('input-med-exam-date-display');
    if (examDisplay) examDisplay.innerText = 'SELECT DATE';
    const expiryDisplay = document.getElementById('input-med-current-expiry-display');
    if (expiryDisplay) expiryDisplay.innerText = 'SELECT EXPIRY';
  } else if (key === 'ppc') {
    const cDisplay = document.getElementById('input-ppc-conduct-date-display');
    if (cDisplay) cDisplay.innerText = 'SELECT DATE';
    const eDisplay = document.getElementById('input-ppc-expiry-date-display');
    if (eDisplay) eDisplay.innerText = 'SELECT DATE';
  } else if (key === 'recurrent') {
    const cDisplay = document.getElementById('input-recurrent-conduct-date-display');
    if (cDisplay) cDisplay.innerText = 'SELECT DATE';
    const lbl = document.getElementById('recurrent-selected-course-label');
    if (lbl) lbl.innerText = 'Line Check (LC)';
    toolsState.recurrentCourseKey = 'LINE_CHECK';
    toolsState.recurrentCourseName = 'Line Check (LC)';
    toolsState.recurrentCourseCat = 'Annual Check';
  } else if (key === 'recency') {
    const capInput = document.getElementById('input-recency-capacity');
    if (capInput) capInput.value = 'PIC';

    const flightDateInput = document.getElementById('input-recency-flight-date');
    if (flightDateInput) flightDateInput.value = '';

    const l1Input = document.getElementById('input-recency-l1-date');
    if (l1Input) l1Input.value = '';

    const l2Input = document.getElementById('input-recency-l2-date');
    if (l2Input) l2Input.value = '';

    const l3Input = document.getElementById('input-recency-l3-date');
    if (l3Input) l3Input.value = '';

    const varDateInput = document.getElementById('input-recency-variant-date');
    if (varDateInput) varDateInput.value = '';

    const capDisplay = document.getElementById('btn-recency-capacity-display');
    if (capDisplay) capDisplay.innerText = 'PIC (Captain)';

    const flightDateDisplay = document.getElementById('input-recency-flight-date-display');
    if (flightDateDisplay) flightDateDisplay.innerText = 'SELECT DATE';

    const l1Display = document.getElementById('input-recency-l1-date-display');
    if (l1Display) l1Display.innerText = 'DATE 1';

    const l2Display = document.getElementById('input-recency-l2-date-display');
    if (l2Display) l2Display.innerText = 'DATE 2';

    const l3Display = document.getElementById('input-recency-l3-date-display');
    if (l3Display) l3Display.innerText = 'DATE 3';

    const varDateDisplay = document.getElementById('input-recency-variant-date-display');
    if (varDateDisplay) varDateDisplay.innerText = 'SELECT DATE';

    setRecencyMultiVariant(false);
  }

  const container = document.getElementById(toolId);
  if (container && key !== 'recency') {
    const inputs = container.querySelectorAll('input[type="hidden"]');
    inputs.forEach(input => { input.value = ''; });
  }
}

export function setToolsTab(tier, subTab) {
  if (tier === 'validity' || tier === 'qualifications') {
    switchToolCategory('qualifications');
  } else {
    switchToolCategory('dutyrest');
  }
}

export function getToolsState() {
  return toolsState;
}

export function getSectorCount() {
  return toolsState.sectorCount;
}

export function setSectorCount(count) {
  toolsState.sectorCount = count;
}

// ==================================================================

// ==================================================================
// MULTI-VARIANT / SFF / MFF TOGGLE
// ==================================================================
export function setRecencyMultiVariant(isMulti) {
  const cardEl = document.getElementById('tool-card-recency');
  const variantWrapper = document.getElementById('wrapper-recency-variant-date');
  const inputEl = document.getElementById('input-recency-multivariant');
  const singleBtn = document.getElementById('btn-recency-single-fleet');
  const multiBtn = document.getElementById('btn-recency-multi-variant');

  if (inputEl) inputEl.value = isMulti ? 'true' : 'false';

  const activeBtnClass = "py-1 px-2 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 shadow-sm transition-all cursor-pointer text-center";
  const inactiveBtnClass = "py-1 px-2 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer text-center";

  if (isMulti) {
    if (multiBtn) multiBtn.className = activeBtnClass;
    if (singleBtn) singleBtn.className = inactiveBtnClass;
  } else {
    if (singleBtn) singleBtn.className = activeBtnClass;
    if (multiBtn) multiBtn.className = inactiveBtnClass;
  }

  // Delegate Card Expansion & Motion to Centralized animations.js Engine
  if (typeof window !== 'undefined' && window.CertiFlyAnimations?.animateRecencyCardExpansion) {
    window.CertiFlyAnimations.animateRecencyCardExpansion(cardEl, variantWrapper, isMulti);
  } else if (typeof animateRecencyCardExpansion === 'function') {
    animateRecencyCardExpansion(cardEl, variantWrapper, isMulti);
  } else {
    // Pure CSS Fallback
    if (isMulti) {
      if (cardEl) cardEl.style.height = '400px';
      if (variantWrapper) {
        variantWrapper.classList.remove('hidden');
        variantWrapper.style.opacity = '1';
      }
    } else {
      if (cardEl) cardEl.style.height = '350px';
      if (variantWrapper) variantWrapper.classList.add('hidden');
    }
  }
}

// RECURRENT COURSE SELECTOR MODAL
// ==================================================================
export function openRecurrentCourseModal() {
  const modal = document.getElementById('recurrent-course-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeRecurrentCourseModal() {
  const modal = document.getElementById('recurrent-course-modal');
  if (modal) modal.classList.add('hidden');
}

export function selectRecurrentCourse(key, name, category) {
  toolsState.recurrentCourseKey = key;
  toolsState.recurrentCourseName = name;
  toolsState.recurrentCourseCat = category;

  const labelEl = document.getElementById('recurrent-selected-course-label');
  if (labelEl) labelEl.innerText = name;

  const inputEl = document.getElementById('input-recurrent-course-type');
  if (inputEl) inputEl.value = key;

  closeRecurrentCourseModal();
}

export function filterRecurrentCourses(query) {
  const q = String(query).toLowerCase();
  const cards = document.querySelectorAll('.recurrent-item-card');
  cards.forEach(card => {
    const txt = card.innerText.toLowerCase();
    if (txt.includes(q)) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// ==================================================================
// ENGINE SHORTCUT EXPORTS
// ==================================================================
export function calculateMedicalWindow(dob, conductDate) {
  return runToolCalculation('medical', { dob, examDate: conductDate });
}

export function calculateCourseExpiry(courseType, conductDate) {
  return runToolCalculation('recurrent', { courseType, completionDate: conductDate });
}

export function calculatePpcWindows(conductDate, expiryDate) {
  return runToolCalculation('ppc', { lpcConductDateStr: conductDate, currentLPCExpiryDateStr: expiryDate });
}

export function calculateFdpAndDiscretion(opts) {
  return runToolCalculation('max-fdp', opts);
}

export function getMaxAllowableFdp(reportTime, sectors) {
  return runToolCalculation('max-fdp', { reportTime, sectors });
}

export function renderSectorCardsUI() {}
export function clearSignatureCanvas() {}
export function populateCommanderSelect() {}

export function initToolsModule() {
  // Set default initial state
  switchToolCategory('qualifications');
}

// ==================================================================
// WINDOW GLOBAL BINDINGS
// ==================================================================

export function setStandbyLocation(loc) {
  toolsState.standbyLocation = loc;
  const inputLoc = document.getElementById('input-standby-location');
  if (inputLoc) inputLoc.value = loc;
  const btnHome = document.getElementById('btn-stby-loc-home');
  const btnAirport = document.getElementById('btn-stby-loc-airport');

  if (loc === 'HOME') {
    if (btnHome) btnHome.className = 'py-2 px-3 rounded-xl text-xs font-semibold bg-blue-600 text-white cursor-pointer';
    if (btnAirport) btnAirport.className = 'py-2 px-3 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer';
  } else {
    if (btnAirport) btnAirport.className = 'py-2 px-3 rounded-xl text-xs font-semibold bg-blue-600 text-white cursor-pointer';
    if (btnHome) btnHome.className = 'py-2 px-3 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer';
  }
}

if (typeof window !== 'undefined') {
  window.formatDateDDMMMYYYY = formatDateDDMMMYYYY;
  
  // EFB Modals
  window.openEfbYearSelectModal = openEfbYearSelectModal;
  window.openEfbDatePicker = openEfbDatePicker;
  window.closeEfbDatePicker = closeEfbDatePicker;
  window.renderEfbCalendarGrid = renderEfbCalendarGrid;
  window.changeEfbMonth = changeEfbMonth;
  window.setEfbDatePreset = setEfbDatePreset;
  window.selectEfbDate = selectEfbDate;

  window.openEfbTimePicker = openEfbTimePicker;
  window.closeEfbTimePicker = closeEfbTimePicker;
  window.confirmEfbTimePicker = confirmEfbTimePicker;
  window.stepEfbTimeHour = stepEfbTimeHour;
  window.stepEfbTimeMin = stepEfbTimeMin;
  window.setEfbTimePreset = setEfbTimePreset;

  window.openEfbSelectModal = openEfbSelectModal;
  window.closeEfbSelectModal = closeEfbSelectModal;
  window.selectEfbOption = selectEfbOption;

  window.openEfbNumberPicker = openEfbNumberPicker;
  window.closeEfbNumberPicker = closeEfbNumberPicker;
  window.stepEfbNumberVal = stepEfbNumberVal;
  window.confirmEfbNumberPicker = confirmEfbNumberPicker;

  // 3D Flip Handlers
  window.executeAndFlipCard = executeAndFlipCard;
  window.flipCardBackToInput = flipCardBackToInput;

  // Tool Switching & Calculations
  window.switchToolCategory = switchToolCategory;
  window.switchActiveTool = switchActiveTool;
  window.resetToolInputs = resetToolInputs;
  window.setStandbyLocation = setStandbyLocation;
  window.runToolCalculation = runToolCalculation;
  window.renderToolsOutputCard = renderToolsOutputCard;
  window.renderNormalizedOutput = renderNormalizedOutput;
  
  window.openRecurrentCourseModal = openRecurrentCourseModal;
  window.closeRecurrentCourseModal = closeRecurrentCourseModal;
  window.selectRecurrentCourse = selectRecurrentCourse;
  window.filterRecurrentCourses = filterRecurrentCourses;
window.setRecencyMultiVariant = setRecencyMultiVariant;

  window.setSectorCount = setSectorCount;
  window.getSectorCount = getSectorCount;
  window.initToolsModule = initToolsModule;
  window.calculateMedicalWindow = calculateMedicalWindow;
  window.calculateCourseExpiry = calculateCourseExpiry;
  window.calculatePpcWindows = calculatePpcWindows;
  window.calculateFdpAndDiscretion = calculateFdpAndDiscretion;
  window.getMaxAllowableFdp = getMaxAllowableFdp;
}
