// js/tools.js (2410_R214) - Tools Orchestrator, EFB Date Picker & Date Formatter
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import * as StandbyEngineModule from './engines/standby-fdp-calculator.js';
import * as MaxFdpEngineModule from './engines/max-fdp-calculator.js';
import * as PreFlightRestEngineModule from './engines/pre-flight-rest-calculator.js';
import * as CumulativeEngineModule from './engines/cumulative-hours-calculator.js';
import * as CaamFtl1Module from './engines/caam-ftl1-controller.js';
import * as MedicalEngineModule from './engines/medical-validity-calculator.js';

/**
 * Helper: Formats ISO date string or Date object to DD MMM YYYY (e.g. "31 OCT 2027")
 */
export function formatDateDDMMMYYYY(dateInput) {
  if (!dateInput) return '--';
  let d;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed || trimmed === '--') return '--';
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split('-');
      d = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
    } else {
      d = new Date(trimmed);
    }
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    return '--';
  }

  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getUTCDate()).padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();

  return `${day} ${month} ${year}`;
}


// ==================================================================
// OPTION B: THEME-ADAPTIVE CUSTOM EFB MODAL DATE PICKER ENGINE
// ==================================================================
let efbPickerState = {
  targetInputId: null,
  activeDate: new Date(),
  title: 'SELECT DATE'
};

export function openEfbDatePicker(targetInputId, labelTitle = 'SELECT DATE') {
  efbPickerState.targetInputId = targetInputId;
  efbPickerState.title = labelTitle;

  const hiddenInput = document.getElementById(targetInputId);
  if (hiddenInput && hiddenInput.value) {
    const parts = hiddenInput.value.split('-');
    if (parts.length === 3) {
      efbPickerState.activeDate = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
    } else {
      efbPickerState.activeDate = new Date();
    }
  } else {
    efbPickerState.activeDate = new Date();
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
  const monthLabelEl = document.getElementById('efb-calendar-month-label');
  const gridEl = document.getElementById('efb-calendar-days-grid');
  if (!gridEl) return;

  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const curYear = efbPickerState.activeDate.getUTCFullYear();
  const curMonth = efbPickerState.activeDate.getUTCMonth();

  if (monthLabelEl) {
    monthLabelEl.innerText = `${months[curMonth]} ${curYear}`;
  }

  // Get first day of month and total days
  const firstDayIndex = (new Date(Date.UTC(curYear, curMonth, 1)).getUTCDay() + 6) % 7; // Monday=0
  const totalDays = new Date(Date.UTC(curYear, curMonth + 1, 0)).getUTCDate();

  const hiddenInput = document.getElementById(efbPickerState.targetInputId);
  let selectedIso = hiddenInput ? hiddenInput.value : '';

  let html = '';
  // Empty padding cells for preceding month
  for (let i = 0; i < firstDayIndex; i++) {
    html += '<div class="py-2 text-slate-300 dark:text-slate-800 pointer-events-none"></div>';
  }

  const today = new Date();
  const todayIso = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;

  for (let day = 1; day <= totalDays; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(curMonth + 1).padStart(2, '0');
    const isoVal = `${curYear}-${monthStr}-${dayStr}`;

    const isSelected = isoVal === selectedIso;
    const isToday = isoVal === todayIso;

    let btnClasses = 'py-2 rounded-xl transition-all cursor-pointer select-none text-xs font-bold ';
    if (isSelected) {
      btnClasses += 'bg-sky-600 text-white shadow-md font-extrabold scale-105';
    } else if (isToday) {
      btnClasses += 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40';
    } else {
      btnClasses += 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';
    }

    html += `<button type="button" class="${btnClasses}" onclick="selectEfbDate('${isoVal}')">${day}</button>`;
  }

  gridEl.innerHTML = html;
}

export function changeEfbMonth(delta) {
  efbPickerState.activeDate.setUTCMonth(efbPickerState.activeDate.getUTCMonth() + delta);
  renderEfbCalendarGrid();
}

export function setEfbDatePreset(presetKey) {
  const now = new Date();
  let d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (presetKey === 'today') {
    // Current date
  } else if (presetKey === 'eom') {
    d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  } else if (presetKey === '+1y') {
    d.setUTCFullYear(d.getUTCFullYear() + 1);
  } else if (presetKey === '-1y') {
    d.setUTCFullYear(d.getUTCFullYear() - 1);
  }

  const isoVal = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  selectEfbDate(isoVal);
}

export function selectEfbDate(isoVal) {
  if (!efbPickerState.targetInputId) return;

  const hiddenInput = document.getElementById(efbPickerState.targetInputId);
  if (hiddenInput) {
    hiddenInput.value = isoVal;
  }

  // Update display trigger text
  const displayId = efbPickerState.targetInputId.replace('input-', 'display-');
  const displayEl = document.getElementById(displayId);
  if (displayEl) {
    displayEl.innerText = formatDateDDMMMYYYY(isoVal);
  }

  renderEfbCalendarGrid();
  closeEfbDatePicker();

  // Dispatch calculation
  if (window.dispatchActiveToolCalculation) {
    window.dispatchActiveToolCalculation();
  }
}

import * as PpcEngineModule from './engines/ppc-validity-calculator.js';
import * as RecurrentEngineModule from './engines/recurrent-training-calculator.js';

let toolsState = {
  activeTier: 'qualifications',
  activeSubTab: 'medical',
  masterTimezone: 'UTC',
  standbyLocation: 'HOME',
  recurrentCourseKey: 'LINE_CHECK',
  recurrentCourseName: 'Line Check (LC)',
  recurrentCourseCat: 'Annual (12 Calendar Months)',
  lastCalculationResults: {}
};

let currentSectorCount = 2;

/**
 * Standardized 4-Slot Output Adapter
 */
export function normalizeOutput(toolType, rawResult) {
  if (!rawResult) {
    return {
      statusBadge: 'READY',
      statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      headlineTitle: 'CALCULATOR',
      headlineValue: '--:--',
      targetClockLabel: 'Target Clock',
      targetClockValue: '--:--',
      breakdownGrid: [
        { label: 'STATUS', value: 'Ready' },
        { label: 'MODE', value: toolsState.masterTimezone },
        { label: 'BASE', value: 'WMKK' },
        { label: 'CALC', value: 'Auto' }
      ],
      auditNotes: ['CAAM CAD 1901 / CAD 1 Standards'],
      actions: []
    };
  }

  switch (toolType) {
    case 'standby': {
      const isCaseB = rawResult.caseType === 'CASE_B' || rawResult.isCaseB;
      return {
        statusBadge: rawResult.isLapsed ? 'EXCEEDED' : (isCaseB ? 'CASE B (REDUCED)' : 'CASE A (STANDARD)'),
        statusClass: rawResult.isLapsed ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300' : (isCaseB ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'),
        headlineTitle: 'NET PERMISSIBLE FDP',
        headlineValue: rawResult.netFdpFormatted || rawResult.allowableFdpFormatted || rawResult.netFdp || '--:--',
        targetClockLabel: 'Standby End Cutoff',
        targetClockValue: rawResult.cutoffTimestampUtc || rawResult.standbyEndClock || '--:--',
        breakdownGrid: [
          { label: 'Standby Duration', value: rawResult.standbyDurationFormatted || '--' },
          { label: 'FDP Deduction', value: rawResult.deductionFormatted || '0h 00m' },
          { label: 'Case Type', value: isCaseB ? 'Case B (>=6h)' : 'Case A (<6h)' },
          { label: 'Base Max FDP', value: rawResult.baseMaxFdpFormatted || '--' }
        ],
        auditNotes: [
          rawResult.clause || 'CAAM CAD 1901 Standby Rules',
          rawResult.summaryNote || 'Standby call-out adjustment applied'
        ],
        actions: [
          { type: 'pipeline-fdp', label: 'Apply To Max FDP Calculator' }
        ]
      };
    }

    case 'max-fdp': {
      const isDiscretionNeeded = rawResult.isDiscretionTriggered || rawResult.exceedsMaxFdp || rawResult.isDiscretionRequired;
      const isProhibited = rawResult.isProhibited || rawResult.isLapsed;
      
      let badgeText = 'CLEARED';
      let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
      
      if (isProhibited) {
        badgeText = 'PROHIBITED';
        badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
      } else if (isDiscretionNeeded) {
        badgeText = `DISCRETION EXERCISED (+${rawResult.discretionMinutesUsed || 45}m)`;
        badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
      }

      return {
        statusBadge: badgeText,
        statusClass: badgeClass,
        headlineTitle: 'MAX ALLOWABLE FDP',
        headlineValue: rawResult.finalMaxPermissibleFDPFormatted || rawResult.maxFdpFormatted || rawResult.maxFdp || '--:--',
        targetClockLabel: 'Latest On-Chocks Cutoff',
        targetClockValue: rawResult.cutoffTimestampUTC || rawResult.latestOnChocksUtc || '--:-- UTC',
        breakdownGrid: [
          { label: 'Base FDP', value: rawResult.baseAllowableFDPFormatted || rawResult.baseFdpFormatted || '--' },
          { label: 'Relief Credit', value: rawResult.bunkCreditFormatted || 'None' },
          { label: 'Split Rest Credit', value: rawResult.splitCreditFormatted || 'None' },
          { label: 'Max Discretion', value: rawResult.maxDiscretionFormatted || '+2h 00m' }
        ],
        auditNotes: [
          rawResult.tableClause || 'CAAM CAD 1901 Table A/B',
          rawResult.acclimatisationStatus || 'Acclimatised'
        ],
        actions: [
          ...(isDiscretionNeeded ? [{ type: 'discretion', label: 'Complete CAAM/BOP/FTL/1 Report' }] : []),
          { type: 'pipeline-rest', label: 'Pass to Min Rest' }
        ]
      };
    }

    case 'pre-flight-rest': {
      return {
        statusBadge: rawResult.isRestReduced ? 'REDUCED REST (DISCRETION)' : 'STANDARD REST',
        statusClass: rawResult.isRestReduced ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'MANDATORY MINIMUM REST',
        headlineValue: rawResult.finalRequiredRestFormatted || rawResult.minRestFormatted || '--:--',
        targetClockLabel: 'Earliest Next Report Clock',
        targetClockValue: rawResult.earliestReportUTC || rawResult.earliestReportClock || '--:--',
        breakdownGrid: [
          { label: 'Preceding Duty', value: rawResult.precedingDutyFormatted || '--' },
          { label: 'Home Base Floor', value: rawResult.homeBaseFloor || '12h 00m' },
          { label: 'Travel/Transit', value: rawResult.travelAllowance || 'Included' },
          { label: 'Local Night Guard', value: rawResult.requiresLocalNight ? 'Required' : 'Achieved' }
        ],
        auditNotes: [
          rawResult.clause || 'CAAM CAD 1901 Rest Requirements',
          rawResult.notes || 'Minimum rest calculated based on preceding duty and location'
        ],
        actions: [
          { type: 'pipeline-cumulative', label: 'Update Cumulative Hours' }
        ]
      };
    }

    case 'cumulative': {
      const isOverLimit = rawResult.isExceeded || rawResult.isOverCap || (rawResult.duty7Days && rawResult.duty7Days.isExceeded);
      return {
        statusBadge: isOverLimit ? 'CAP EXCEEDED' : 'ROSTER CLEARED',
        statusClass: isOverLimit ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: '7-DAY DUTY BUDGET',
        headlineValue: rawResult.duty7Days ? `${rawResult.duty7Days.currentFormatted} / 55h` : '-- / 55h',
        targetClockLabel: '28-Day Duty Budget',
        targetClockValue: rawResult.duty28Days ? rawResult.duty28Days.currentFormatted : '--:--',
        breakdownGrid: [
          { label: '14-Day Duty', value: rawResult.duty14Days ? rawResult.duty14Days.currentFormatted : '0h' },
          { label: '28-Day Duty', value: rawResult.duty28Days ? rawResult.duty28Days.currentFormatted : '0h' },
          { label: '28-Day Flying', value: rawResult.flight28Days ? rawResult.flight28Days.currentFormatted : '0h' },
          { label: '12-Month Flying', value: rawResult.flight12Months ? rawResult.flight12Months.currentFormatted : '0h' }
        ],
        auditNotes: [
          'CAAM CAD 1901 Cumulative Duty & Flying Caps',
          rawResult.notes || 'Standby weighting applied where applicable'
        ],
        actions: []
      };
    }

    case 'medical': {
      return {
        statusBadge: rawResult.anniversaryPreserved ? 'ANNIVERSARY PRESERVED' : 'STANDARD RENEWAL',
        statusClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300',
        headlineTitle: 'NEW MEDICAL EXPIRY',
        headlineValue: formatDateDDMMMYYYY(rawResult.newExpiryDate),
        targetClockLabel: 'Earliest Re-Exam Window (45D)',
        targetClockValue: rawResult.dameEarliestDate ? `${formatDateDDMMMYYYY(rawResult.dameEarliestDate)} to ${formatDateDDMMMYYYY(rawResult.newExpiryDate)}` : '--',
        breakdownGrid: [
          { label: 'Age', value: rawResult.age !== undefined ? String(rawResult.age) : '40-59' },
          { label: 'Class', value: 'Class 1' },
          { label: 'Validity Period', value: `${rawResult.validityMonths || 12} Months` },
          { label: 'Re-Exam Window', value: '45 Days Prior' }
        ],
        auditNotes: [
          'CAAM CAD 1 Personnel Licensing (PEL)',
          rawResult.reason || 'Expiry date calculated per CAAM age-tiered validity rules'
        ],
        actions: [
          { type: 'reminder', label: 'Add Calendar Reminder' },
          { type: 'share', label: 'Share Verification' }
        ]
      };
    }

    case 'ppc': {
      return {
        statusBadge: rawResult.anniversaryPreserved ? 'ANNIVERSARY PRESERVED' : 'RESET (EOM)',
        statusClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300',
        headlineTitle: 'NEW PPC / LPC EXPIRY',
        headlineValue: formatDateDDMMMYYYY(rawResult.newLPCExpiryDate || rawResult.newLpcExpiry),
        targetClockLabel: 'OPC Revalidation Window (90D)',
        targetClockValue: rawResult.opcWindowStart ? `${formatDateDDMMMYYYY(rawResult.opcWindowStart)} to ${formatDateDDMMMYYYY(rawResult.opcWindowEnd)}` : '--',
        breakdownGrid: [
          { label: 'LPC Conducted', value: rawResult.lpcConductDate || '--' },
          { label: 'Previous Expiry', value: rawResult.previousLPCExpiry || 'None' },
          { label: 'New Expiry', value: rawResult.newLPCExpiryDate || '--' },
          { label: 'Revalidation', value: rawResult.anniversaryPreserved ? 'Preserved' : 'Reset' }
        ],
        auditNotes: [
          'CAAM CAD 1 & OM-D PPC/LPC Validity Rules',
          rawResult.calculationMethod || '3-month lookback window applied'
        ],
        actions: [
          { type: 'reminder', label: 'Add Calendar Reminder' },
          { type: 'share', label: 'Share Verification' }
        ]
      };
    }

    case 'recurrent': {
      return {
        statusBadge: rawResult.anniversaryPreserved ? 'ANNIVERSARY PRESERVED' : 'RESET (EOM)',
        statusClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300',
        headlineTitle: 'RECURRENT EXPIRY',
        headlineValue: formatDateDDMMMYYYY(rawResult.newExpiryDate),
        targetClockLabel: 'Module Name',
        targetClockValue: (rawResult.name || toolsState.recurrentCourseName).toUpperCase(),
        breakdownGrid: [
          { label: 'Category', value: rawResult.category || toolsState.recurrentCourseCat },
          { label: 'Completed', value: rawResult.completionDate || '--' },
          { label: 'New Expiry', value: rawResult.newExpiryDate || '--' },
          { label: 'Method', value: rawResult.anniversaryPreserved ? 'Preserved' : 'Reset' }
        ],
        auditNotes: [
          'CAAM & OM-D Recurrent Training Standards',
          rawResult.calculationMethod || 'Ground, Sim, SEP, and CRM validity tracking'
        ],
        actions: [
          { type: 'reminder', label: 'Add Calendar Reminder' },
          { type: 'share', label: 'Share Verification' }
        ]
      };
    }

    case 'recency': {
      const isCompliant = (rawResult.dayCount >= 3) && (rawResult.nightCount >= 1);
      return {
        statusBadge: isCompliant ? 'CURRENCY MET' : 'RECENCY LAPSED',
        statusClass: isCompliant ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
        headlineTitle: 'LANDING RECENCY (90D)',
        headlineValue: isCompliant ? 'CLEARED FOR FLIGHT' : 'CHECK REQUIRED',
        targetClockLabel: 'Minimum Required',
        targetClockValue: '3 Day / 1 Night Landings',
        breakdownGrid: [
          { label: 'Day Landings', value: `${rawResult.dayCount || 0} / 3` },
          { label: 'Night Landings', value: `${rawResult.nightCount || 0} / 1` },
          { label: 'Window', value: 'Preceding 90 Days' },
          { label: 'Status', value: isCompliant ? 'Valid' : 'Action Required' }
        ],
        auditNotes: [
          'CAAM CAD 1 / OM-A 7.1 Landing Currency Rules',
          isCompliant ? 'Compliant for passenger carrying operations' : 'Sim/Line check required before operating'
        ],
        actions: [
          { type: 'share', label: 'Share Verification' }
        ]
      };
    }

    default:
      return {
        statusBadge: 'READY',
        statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        headlineTitle: 'CALCULATOR',
        headlineValue: '--:--',
        targetClockLabel: 'Target Clock',
        targetClockValue: '--:--',
        breakdownGrid: [],
        auditNotes: ['CAAM CAD 1901 / CAD 1 Standards'],
        actions: []
      };
  }
}

/**
 * Master Tool Calculation Dispatcher
 */
export function runToolCalculation(toolType, inputData = {}) {
  let rawResult = null;

  try {
    switch (toolType) {
      case 'standby': {
        const ClassObj = StandbyEngineModule.StandbyFDPEngine || StandbyEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateStandbyFDP === 'function') {
          const startTime = inputData.standbyStartISO || inputData.startTime || inputData.start_time;
          const calloutTime = inputData.calloutTimestampISO || inputData.calloutTime || inputData.report_time;
          if (startTime && calloutTime && startTime.trim() !== '' && calloutTime.trim() !== '') {
            rawResult = ClassObj.calculateStandbyFDP({
              standbyStartISO: startTime,
              calloutTimestampISO: calloutTime,
              location: inputData.location || toolsState.standbyLocation || 'HOME'
            });
          }
        }
        break;
      }

      case 'max-fdp': {
        const ClassObj = MaxFdpEngineModule.MaxFDPEngine || MaxFdpEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateMaxFDP === 'function') {
          const reportTime = inputData.reportTimestampISO || inputData.reportTime;
          if (reportTime && reportTime.trim() !== '') {
            rawResult = ClassObj.calculateMaxFDP({
              reportTimestampISO: reportTime,
              sectorsPlanned: inputData.sectorsPlanned || inputData.sectors || getSectorCount() || 2,
              isAcclimatised: inputData.isAcclimatised ?? true
            });
          }
        }
        break;
      }

      case 'pre-flight-rest': {
        const ClassObj = PreFlightRestEngineModule.PreFlightRestEngine || PreFlightRestEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateMinRest === 'function') {
          const precedingDuty = inputData.precedingDutyHours || inputData.precedingDuty;
          if (precedingDuty && String(precedingDuty).trim() !== '') {
            rawResult = ClassObj.calculateMinRest(inputData);
          }
        }
        break;
      }

      case 'cumulative': {
        const ClassObj = CumulativeEngineModule.CumulativeHoursEngine || CumulativeEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateCumulativeBudget === 'function') {
          rawResult = ClassObj.calculateCumulativeBudget(inputData);
        }
        break;
      }

      case 'medical': {
        const ClassObj = MedicalEngineModule.MedicalValidityEngine || MedicalEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateValidity === 'function') {
          const examDate = inputData.examDate || inputData.lastDate || inputData.medExamDate || inputData.conductDate;
          if (examDate && examDate.trim() !== '') {
            let dob = inputData.dob;
            if (!dob) {
              const ageBracket = inputData.ageBracket || '40_TO_59';
              const nowYear = new Date().getUTCFullYear();
              let sampleAge = 45;
              if (ageBracket === 'UNDER_40') sampleAge = 30;
              else if (ageBracket === '60_PLUS') sampleAge = 62;
              dob = `${nowYear - sampleAge}-01-01`;
            }
            rawResult = ClassObj.calculateValidity({
              dob,
              examDate,
              currentExpiryDate: inputData.currentExpiryDate || null
            });
          }
        }
        break;
      }

      case 'ppc': {
        const ClassObj = PpcEngineModule.PPCValidityEngine || PpcEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateLPCExpiry === 'function') {
          const conductDate = inputData.lpcConductDateStr || inputData.conductDate;
          const expiryDate = inputData.currentLPCExpiryDateStr || inputData.expiryDate;
          if ((conductDate && conductDate.trim() !== '') || (expiryDate && expiryDate.trim() !== '')) {
            rawResult = ClassObj.calculateLPCExpiry(
              conductDate || expiryDate,
              expiryDate || null
            );
          }
        }
        break;
      }

      case 'recurrent': {
        const ClassObj = RecurrentEngineModule.RecurrentTrainingEngine || RecurrentEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateExpiry === 'function') {
          const courseType = inputData.courseType || toolsState.recurrentCourseKey || 'LINE_CHECK';
          const completionDate = inputData.completionDate || inputData.conductDate;
          if (completionDate && completionDate.trim() !== '') {
            rawResult = ClassObj.calculateExpiry(
              courseType,
              completionDate,
              inputData.currentExpiryDate || null
            );
          }
        }
        break;
      }

      case 'recency': {
        const dayCount = parseInt(inputData.dayCount || inputData.dayLandings || 0, 10);
        const nightCount = parseInt(inputData.nightCount || inputData.nightLandings || 0, 10);
        rawResult = {
          dayCount,
          nightCount,
          isCompliant: (dayCount >= 3 || nightCount >= 1),
          totalLandings: dayCount + nightCount
        };
        break;
      }

      case 'caam-ftl1': {
        rawResult = inputData;
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Error executing engine for ' + toolType, err);
  }

  toolsState.lastCalculationResults[toolType] = rawResult;
  const normalized = normalizeOutput(toolType, rawResult);
  renderNormalizedOutput(normalized);
  return { rawResult, normalized };
}

/**
 * Render Normalized Payload to the Fixed 4-Slot Output Card (#tools-output-card)
 */
export function renderNormalizedOutput(normalized) {
  if (!normalized) return;

  const heroEl = document.getElementById('output-slot-1-hero');
  const badgeEl = document.getElementById('output-hero-badge');
  const timestampEl = document.getElementById('output-hero-timestamp');
  const titleEl = document.getElementById('output-hero-title');
  const subtitleEl = document.getElementById('output-hero-subtitle');

  const clockLabelEl = document.getElementById('output-clock-label');
  const clockValEl = document.getElementById('output-clock-value');

  const auditTextEl = document.getElementById('output-audit-text');
  const ctaContainerEl = document.getElementById('output-cta-container');

  // Slot 1: Solid Hero Banner
  if (heroEl && normalized.statusClass) {
    heroEl.className = `p-4 text-white transition-colors duration-300 ${normalized.statusClass}`;
  }
  if (badgeEl) badgeEl.innerText = normalized.statusBadge || 'CLEARED';
  if (timestampEl) {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    timestampEl.innerText = `Computed ${timeStr} ${toolsState.masterTimezone}`;
  }
  if (titleEl) titleEl.innerText = normalized.headlineTitle || 'QUALIFICATION COMPLIANT';
  if (subtitleEl) subtitleEl.innerText = normalized.headlineValue || 'All regulatory parameters verified.';

  // Slot 2: Target Action Clock
  if (clockLabelEl) clockLabelEl.innerText = normalized.targetClockLabel || 'Next Expiry / Target Deadline:';
  if (clockValEl) clockValEl.innerText = normalized.targetClockValue || '--:--';

  // Slot 3: Stacked 2x2 Grid
  if (Array.isArray(normalized.breakdownGrid)) {
    normalized.breakdownGrid.forEach((item, idx) => {
      const labelEl = document.getElementById(`grid-label-${idx + 1}`);
      const valEl = document.getElementById(`grid-value-${idx + 1}`);
      if (labelEl) labelEl.innerText = item.label ? item.label.toUpperCase() : '--';
      if (valEl) valEl.innerText = item.value || '--';
    });
  }

  // Slot 4: Regulatory Audit & Action CTAs
  if (auditTextEl && Array.isArray(normalized.auditNotes)) {
    auditTextEl.innerText = normalized.auditNotes.join('. ');
  }

  if (ctaContainerEl) {
    if (Array.isArray(normalized.actions) && normalized.actions.length > 0) {
      ctaContainerEl.innerHTML = normalized.actions.map(act => {
        let btnClass = 'flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all text-center cursor-pointer';
        if (act.type === 'discretion') {
          btnClass = 'flex-1 py-2 px-3 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all text-center cursor-pointer';
        } else if (act.type === 'share') {
          btnClass = 'py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-center cursor-pointer';
        }
        return `<button type="button" data-action="${act.type}" class="${btnClass}">${act.label}</button>`;
      }).join('');
    } else {
      ctaContainerEl.innerHTML = '';
    }
  }
}

export function renderToolsOutputCard(normalized) {
  return renderNormalizedOutput(normalized);
}

/**
 * 2-Tier Navigation Handler: Primary Category Switcher
 */
export function switchToolCategory(category) {
  toolsState.activeTier = category;

  const btnQual = document.getElementById('cat-tab-qualifications');
  const btnDuty = document.getElementById('cat-tab-dutyrest');
  const paneQual = document.getElementById('cat-pane-qualifications');
  const paneDuty = document.getElementById('cat-pane-dutyrest');

  if (category === 'qualifications') {
    if (btnQual) {
      btnQual.className = 'cat-tab-btn active py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-md cursor-pointer';
      btnQual.setAttribute('aria-selected', 'true');
    }
    if (btnDuty) {
      btnDuty.className = 'cat-tab-btn py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';
      btnDuty.setAttribute('aria-selected', 'false');
    }
    if (paneQual) paneQual.classList.remove('hidden');
    if (paneDuty) paneDuty.classList.add('hidden');
    switchActiveTool('tool-medical');
  } else {
    if (btnDuty) {
      btnDuty.className = 'cat-tab-btn active py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-md cursor-pointer';
      btnDuty.setAttribute('aria-selected', 'true');
    }
    if (btnQual) {
      btnQual.className = 'cat-tab-btn py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';
      btnQual.setAttribute('aria-selected', 'false');
    }
    if (paneDuty) paneDuty.classList.remove('hidden');
    if (paneQual) paneQual.classList.add('hidden');
    switchActiveTool('tool-standby');
  }
}

/**
 * Tier 2 Sub-Tab Active Tool Switcher
 */
export function switchActiveTool(toolId) {
  toolsState.activeSubTab = toolId;

  // Deactivate all pills in both strips
  const pills = document.querySelectorAll('.subtab-pill');
  pills.forEach(p => {
    p.classList.remove('active', 'bg-sky-500/20', 'text-sky-400', 'dark:text-sky-300', 'border-sky-500/40');
    p.classList.add('border-slate-300', 'dark:border-slate-700', 'bg-slate-200/60', 'dark:bg-slate-800/60', 'text-slate-600', 'dark:text-slate-400');
  });

  // Activate selected pill
  const activePill = document.getElementById(`pill-${toolId}`);
  if (activePill) {
    activePill.classList.add('active', 'bg-sky-500/20', 'text-sky-400', 'dark:text-sky-300', 'border-sky-500/40');
    activePill.classList.remove('border-slate-300', 'dark:border-slate-700', 'bg-slate-200/60', 'dark:bg-slate-800/60', 'text-slate-600', 'dark:text-slate-400');
  }

  // Toggle active card visibility
  const cards = document.querySelectorAll('.tool-card');
  cards.forEach(c => c.classList.add('hidden'));

  const activeCard = document.getElementById(`tool-card-${toolId.replace('tool-', '')}`);
  if (activeCard) activeCard.classList.remove('hidden');
}

/**
 * Master Timezone Controller
 */
export function setMasterTimezone(tz) {
  toolsState.masterTimezone = tz;
  const btnUtc = document.getElementById('tz-btn-utc');
  const btnLocal = document.getElementById('tz-btn-local');

  if (tz === 'UTC') {
    if (btnUtc) btnUtc.className = 'px-2 py-1 rounded text-[10px] font-bold transition-colors bg-blue-600 text-white cursor-pointer';
    if (btnLocal) btnLocal.className = 'px-2 py-1 rounded text-[10px] font-bold transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer';
  } else {
    if (btnLocal) btnLocal.className = 'px-2 py-1 rounded text-[10px] font-bold transition-colors bg-blue-600 text-white cursor-pointer';
    if (btnUtc) btnUtc.className = 'px-2 py-1 rounded text-[10px] font-bold transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer';
  }
}

/**
 * Standby Location Controller
 */
export function setStandbyLocation(loc) {
  toolsState.standbyLocation = loc;
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

/**
 * Recurrent Course Modal Controllers
 */
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

  const hiddenInput = document.getElementById('input-recurrent-course');
  const labelEl = document.getElementById('recurrent-course-label');
  const sublabelEl = document.getElementById('recurrent-course-sublabel');

  if (hiddenInput) hiddenInput.value = key;
  if (labelEl) labelEl.innerText = name;
  if (sublabelEl) sublabelEl.innerText = category;

  closeRecurrentCourseModal();
}

export function filterRecurrentCourses(query) {
  const q = (query || '').toLowerCase();
  const items = document.querySelectorAll('.recurrent-course-item');
  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    if (text.includes(q)) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });
}

/**
 * Input Reset Handler
 */
export function resetToolInputs(toolId) {
  console.log(`Resetting inputs for ${toolId}`);
}

/**
 * Tool #9 Discretion Wizard Modal Handlers
 */
export function openFtl1WizardModal() {
  const modal = document.getElementById('ftl1-wizard-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeFtl1WizardModal() {
  const modal = document.getElementById('ftl1-wizard-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * State & Tab Utility Exports
 */
export function setToolsTab(tier, subTab) {
  if (tier) toolsState.activeTier = tier;
  if (subTab) toolsState.activeSubTab = subTab;
}

export function getToolsState() {
  return { ...toolsState };
}

export function getSectorCount() {
  return currentSectorCount;
}

export function setSectorCount(count) {
  currentSectorCount = Math.max(1, Math.min(8, count));
  return currentSectorCount;
}

export function initToolsModule() {
  return true;
}

/**
 * Legacy API Wrapper Exports for Backward Compatibility
 */
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

export function draftFtlEmail(opts = {}) {
  const flight = opts.flightNo || 'MH123';
  const subject = `FTL / Discretion Notification - FLT ${flight}`;
  const body = `Crew Control / Flight Ops,\n\nPlease be advised of the FTL / Discretion details for FLT ${flight}:\n- Report Time: ${opts.reportTime || '--:--'}\n- Max Allowable FDP: ${opts.maxFdp || '--:--'}\n- On-Chocks Cutoff: ${opts.cutoff || '--:-- UTC'}\n\nGenerated via CertiFly PWA.`;
  return { subject, body, mailtoUrl: `mailto:crewcontrol@malaysiaairlines.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}

export function renderSectorCardsUI() {}
export function clearSignatureCanvas() {}
export function populateCommanderSelect() {}

// Expose functions on window for inline HTML onclick handlers and cross-module access
if (typeof window !== 'undefined') {
  
  window.formatDateDDMMMYYYY = formatDateDDMMMYYYY;
  window.openEfbDatePicker = openEfbDatePicker;
  window.closeEfbDatePicker = closeEfbDatePicker;
  window.renderEfbCalendarGrid = renderEfbCalendarGrid;
  window.changeEfbMonth = changeEfbMonth;
  window.setEfbDatePreset = setEfbDatePreset;
  window.selectEfbDate = selectEfbDate;

  window.switchToolCategory = switchToolCategory;
  window.switchActiveTool = switchActiveTool;
  window.setMasterTimezone = setMasterTimezone;
  window.setStandbyLocation = setStandbyLocation;
  window.openRecurrentCourseModal = openRecurrentCourseModal;
  window.closeRecurrentCourseModal = closeRecurrentCourseModal;
  window.selectRecurrentCourse = selectRecurrentCourse;
  window.filterRecurrentCourses = filterRecurrentCourses;
  window.resetToolInputs = resetToolInputs;
  window.openFtl1WizardModal = openFtl1WizardModal;
  window.closeFtl1WizardModal = closeFtl1WizardModal;
  window.runToolCalculation = runToolCalculation;
  window.renderToolsOutputCard = renderToolsOutputCard;
  window.setSectorCount = setSectorCount;
  window.getSectorCount = getSectorCount;
  window.draftFtlEmail = draftFtlEmail;
  window.initToolsModule = initToolsModule;
  window.calculateMedicalWindow = calculateMedicalWindow;
  window.calculateCourseExpiry = calculateCourseExpiry;
  window.calculatePpcWindows = calculatePpcWindows;
  window.calculateFdpAndDiscretion = calculateFdpAndDiscretion;
  window.getMaxAllowableFdp = getMaxAllowableFdp;
}
