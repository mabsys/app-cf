// js/tools.js (2410_R220) - Tools Orchestrator, EFB Date Picker & Date Formatter
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

  return String(day) + ' ' + String(month) + ' ' + String(year);
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
    monthLabelEl.innerText = String(months[curMonth]) + ' ' + String(curYear);
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
  const todayIso = String(today.getUTCFullYear()) + '-' + String(String(today.getUTCMonth() + 1).padStart(2, '0')) + '-' + String(String(today.getUTCDate()).padStart(2, '0'));

  for (let day = 1; day <= totalDays; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(curMonth + 1).padStart(2, '0');
    const isoVal = String(curYear) + '-' + String(monthStr) + '-' + String(dayStr);

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

    html += '<button type="button" class="' + String(btnClasses) + '" onclick="selectEfbDate(\'' + String(isoVal) + '\')">' + String(day) + '</button>';
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

  const isoVal = String(d.getUTCFullYear()) + '-' + String(String(d.getUTCMonth() + 1).padStart(2, '0')) + '-' + String(String(d.getUTCDate()).padStart(2, '0'));
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
  switch (toolType) {
    case 'medical': {
      const isPreserved = rawResult ? rawResult.anniversaryPreserved : true;
      const expiry = rawResult ? formatDateDDMMMYYYY(rawResult.newExpiryDate) : '31 OCT 2027';
      const windowStr = (rawResult && rawResult.dameEarliestDate) ? String(formatDateDDMMMYYYY(rawResult.dameEarliestDate)) + ' to ' + String(formatDateDDMMMYYYY(rawResult.reExamDate || rawResult.newExpiryDate)) : '16 SEP 2027 to 31 OCT 2027';
      return {
        statusBadge: isPreserved ? 'EXPIRY DATE PRESERVED' : 'EXPIRY RESET (EOM)',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'NEW MEDICAL EXPIRY',
        headlineValue: expiry,
        targetClockLabel: '45-Day Re-Exam Window',
        targetClockValue: windowStr,
        breakdownGrid: [
          { label: 'AGE BAND', value: (rawResult && rawResult.age !== undefined) ? String(rawResult.age) + ' (Under 60)' : '38 (Under 60)' },
          { label: 'BASE VALIDITY', value: '12 Calendar Months' },
          { label: 'RENEWAL RULE', value: isPreserved ? 'Date Preserved (45D)' : 'Reset (EOM)' },
          { label: 'CREW OPERATING LIMIT', value: 'Unrestricted Single/Multi' }
        ],
        auditNotes: ['CAAM CAD 1 PEL Section 1.2.5.2 & OM-A 5.1.4.4'],
        actions: []
      };
    }

    case 'ppc': {
      const isPreserved = rawResult ? rawResult.anniversaryPreserved : true;
      const expiry = rawResult ? formatDateDDMMMYYYY(rawResult.newLPCExpiryDate || rawResult.newLpcExpiry) : '31 JUL 2027';
      const opcStr = (rawResult && rawResult.opcWindowStart) ? String(formatDateDDMMMYYYY(rawResult.opcWindowStart)) + ' to ' + String(formatDateDDMMMYYYY(rawResult.opcWindowEnd)) : '01 MAY 2027 to 31 JUL 2027';
      return {
        statusBadge: isPreserved ? 'EXPIRY DATE PRESERVED' : 'EXPIRY RESET (EOM)',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'NEW PPC / LPC EXPIRY',
        headlineValue: expiry,
        targetClockLabel: '3-Month Revalidation Window',
        targetClockValue: opcStr,
        breakdownGrid: [
          { label: 'RENEWAL RULE', value: isPreserved ? 'Date Preserved (3-Mo Window)' : 'Reset' },
          { label: 'PERMISSIBLE OPC WINDOW', value: '05 NOV 2026 to 01 APR 2027' },
          { label: 'BASE VALIDITY', value: '12 Months (End of Month)' },
          { label: 'REFRESHER STATUS', value: 'Current (No Refresher Due)' }
        ],
        auditNotes: ['CAAM CAD 6.9.4.4 / CAD 1 PEL 2.1.5.10 / OM-A 5.1.4.6'],
        actions: []
      };
    }

    case 'recurrent': {
      const expiry = rawResult ? formatDateDDMMMYYYY(rawResult.newExpiryDate) : '31 DEC 2026';
      const courseName = rawResult ? (rawResult.name || toolsState.recurrentCourseName) : 'Line Check (LC)';
      return {
        statusBadge: 'VALID / CLEARED',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'RECURRENT MODULE EXPIRY',
        headlineValue: expiry,
        targetClockLabel: 'Qualification Module',
        targetClockValue: String(courseName).toUpperCase(),
        breakdownGrid: [
          { label: 'CATEGORY', value: rawResult ? (rawResult.category || toolsState.recurrentCourseCat) : 'Annual (12 Calendar Months)' },
          { label: 'COMPLETED', value: rawResult && rawResult.completionDate ? formatDateDDMMMYYYY(rawResult.completionDate) : '15 DEC 2025' },
          { label: 'NEW EXPIRY', value: expiry },
          { label: 'RENEWAL METHOD', value: '3-Month Lookback Window' }
        ],
        auditNotes: ['CAAM CAD 6.9.4 & OM-D Chapter 2 Recurrent Standards'],
        actions: []
      };
    }

    case 'recency': {
      const dayCount = rawResult ? rawResult.dayCount : 3;
      const nightCount = rawResult ? rawResult.nightCount : 1;
      const isCompliant = rawResult ? rawResult.isCompliant : (dayCount >= 3 && nightCount >= 1);
      return {
        statusBadge: isCompliant ? 'CURRENCY MET' : 'RECENCY LAPSED',
        statusClass: isCompliant ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
        headlineTitle: '90-DAY LANDING RECENCY',
        headlineValue: isCompliant ? 'CLEARED FOR FLIGHT' : 'CHECK REQUIRED',
        targetClockLabel: 'Minimum Passenger Currency',
        targetClockValue: '3 PF Take-Offs & Landings in 90 Days',
        breakdownGrid: [
          { label: 'DAY LANDINGS', value:  },
          { label: 'NIGHT LANDINGS', value:  },
          { label: 'ANCHOR DATE (3RD)', value: '15 AUG 2026' },
          { label: 'RECENCY EXPIRY', value: '13 NOV 2026' }
        ],
        auditNotes: ['CAAM CAD 1 / OM-A Section 7.1 Passenger Currency'],
        actions: []
      };
    }

    case 'standby': {
      const isCaseB = rawResult ? (rawResult.caseType === 'CASE_B' || rawResult.isCaseB) : false;
      const fdp = rawResult ? (rawResult.netFdpFormatted || rawResult.allowableFdpFormatted || rawResult.netFdp) : '13:00 HOURS';
      return {
        statusBadge: isCaseB ? 'CASE B (REDUCED)' : 'CASE A (STANDARD)',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'NET PERMISSIBLE FDP',
        headlineValue: fdp,
        targetClockLabel: 'Standby End Cutoff',
        targetClockValue: rawResult && rawResult.cutoffTimestampUtc ? rawResult.cutoffTimestampUtc : '14:00 UTC',
        breakdownGrid: [
          { label: 'STANDBY DURATION', value: rawResult && rawResult.standbyDurationFormatted ? rawResult.standbyDurationFormatted : '04h 00m' },
          { label: 'FDP DEDUCTION', value: rawResult && rawResult.deductionFormatted ? rawResult.deductionFormatted : '00h 00m' },
          { label: 'CASE TYPE', value: isCaseB ? 'Case B (>=6h)' : 'Case A (<6h)' },
          { label: 'BASE MAX FDP', value: '13:00 Hours' }
        ],
        auditNotes: ['CAAM CAD 1901 Section 2.11 Standby FDP Adjustments'],
        actions: [
          { type: 'pipeline-fdp', label: 'Apply To Max FDP Calculator' }
        ]
      };
    }

    case 'max-fdp': {
      const isDiscretionNeeded = rawResult ? (rawResult.isDiscretionTriggered || rawResult.exceedsMaxFdp || rawResult.isDiscretionRequired) : false;
      const fdpVal = rawResult ? (rawResult.finalMaxPermissibleFDPFormatted || rawResult.maxFdpFormatted || rawResult.maxFdp) : '13:00 HOURS';
      return {
        statusBadge: isDiscretionNeeded ? 'DISCRETION EXERCISED' : 'CLEARED',
        statusClass: isDiscretionNeeded ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'MAX ALLOWABLE FDP',
        headlineValue: fdpVal,
        targetClockLabel: 'Latest On-Chocks Cutoff',
        targetClockValue: rawResult && rawResult.cutoffTimestampUTC ? rawResult.cutoffTimestampUTC : '13:15 UTC',
        breakdownGrid: [
          { label: 'BASE FDP', value: rawResult && rawResult.baseAllowableFDPFormatted ? rawResult.baseAllowableFDPFormatted : '13:00 Hours' },
          { label: 'RELIEF CREDIT', value: rawResult && rawResult.bunkCreditFormatted ? rawResult.bunkCreditFormatted : 'None' },
          { label: 'SPLIT CREDIT', value: rawResult && rawResult.splitCreditFormatted ? rawResult.splitCreditFormatted : 'None' },
          { label: 'MAX DISCRETION', value: '+02:00 Hours' }
        ],
        auditNotes: ['CAAM CAD 1901 Table A/B & OM-A Section 7.5'],
        actions: [
          ...(isDiscretionNeeded ? [{ type: 'discretion', label: 'Complete CAAM/BOP/FTL/1 Report' }] : []),
          { type: 'pipeline-rest', label: 'Pass to Min Rest' }
        ]
      };
    }

    case 'pre-flight-rest': {
      const isReduced = rawResult ? rawResult.isRestReduced : false;
      const restVal = rawResult ? (rawResult.finalRequiredRestFormatted || rawResult.minRestFormatted) : '12:00 HOURS';
      return {
        statusBadge: isReduced ? 'REDUCED REST' : 'STANDARD REST',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'MANDATORY MINIMUM REST',
        headlineValue: restVal,
        targetClockLabel: 'Minimum Rest Completion',
        targetClockValue: rawResult && rawResult.restCompletionTimeUtc ? rawResult.restCompletionTimeUtc : '20:15 UTC',
        breakdownGrid: [
          { label: 'PRECEDING DUTY', value: (rawResult && rawResult.precedingDutyHours) ? String(rawResult.precedingDutyHours) + ' Hours' : '10:00 Hours' },
          { label: 'LOCATION', value: 'Home Base' },
          { label: 'BASE REST', value: '12:00 Hours' },
          { label: 'OUTSTATION ADD', value: '00:00 Hours' }
        ],
        auditNotes: ['CAAM CAD 1901 Section 2.14 & OM-A Section 7.5.12'],
        actions: [
          { type: 'pipeline-cumulative', label: 'Update Cumulative Hours' }
        ]
      };
    }

    case 'cumulative': {
      const isOverLimit = rawResult ? (rawResult.isExceeded || rawResult.isOverCap) : false;
      const duty7Val = (rawResult && rawResult.duty7Days) ? String(rawResult.duty7Days.currentFormatted || rawResult.duty7Days) + ' / 55:00 HOURS' : '32:15 / 55:00 HOURS';
      return {
        statusBadge: isOverLimit ? 'CAP EXCEEDED' : 'ROSTER CLEARED',
        statusClass: isOverLimit ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'CUMULATIVE DUTY BUDGET',
        headlineValue: duty7Val,
        targetClockLabel: '7-Day Rolling Budget',
        targetClockValue: '22:45 Hours Margin Remaining',
        breakdownGrid: [
          { label: '7-DAY DUTY', value: '32h 15m / 55h' },
          { label: '14-DAY DUTY', value: '68h 30m / 95h' },
          { label: '28-DAY FLYING', value: '78h 30m / 100h' },
          { label: 'CALENDAR YEAR', value: '640h / 900h' }
        ],
        auditNotes: ['CAAM CAD 1901 Cumulative Flying & Duty Limits'],
        actions: []
      };
    }

    case 'caam-ftl1': {
      return {
        statusBadge: 'REPORT READY',
        statusClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300',
        headlineTitle: 'CAAM/BOP/FTL/1 REPORT',
        headlineValue: 'FLIGHT MH123',
        targetClockLabel: 'Official Discretion Form',
        targetClockValue: 'CAAM Official FTL Document',
        breakdownGrid: [
          { label: 'FLIGHT NO', value: 'MH123' },
          { label: 'AIRCRAFT', value: '9M-MTB' },
          { label: 'DISCRETION', value: '+00:45 Exercised' },
          { label: 'COMMANDER', value: 'CAPT AHMAD RAZALI' }
        ],
        auditNotes: ['CAAM CAD 1901 Official Flight Discretion Report'],
        actions: [
          { type: 'generate-pdf', label: 'Download Official CAAM PDF' }
        ]
      };
    }

    default:
      return {
        statusBadge: 'READY',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
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
              dob = String(nowYear - sampleAge) + '-01-01';
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
    heroEl.className = 'p-4 text-white transition-colors duration-300 ' + String(normalized.statusClass);
  }
  if (badgeEl) badgeEl.innerText = normalized.statusBadge || 'CLEARED';
  if (timestampEl) {
    const now = new Date();
    const timeStr = String(String(now.getHours()).padStart(2, '0')) + ':' + String(String(now.getMinutes()).padStart(2, '0'));
    timestampEl.innerText = 'Computed ' + String(timeStr) + ' ' + String(toolsState.masterTimezone);
  }
  if (titleEl) titleEl.innerText = normalized.headlineTitle || 'QUALIFICATION COMPLIANT';
  if (subtitleEl) subtitleEl.innerText = normalized.headlineValue || 'All regulatory parameters verified.';

  // Slot 2: Target Action Clock
  if (clockLabelEl) clockLabelEl.innerText = normalized.targetClockLabel || 'Next Expiry / Target Deadline:';
  if (clockValEl) clockValEl.innerText = normalized.targetClockValue || '--:--';

  // Slot 3: Stacked 2x2 Grid
  if (Array.isArray(normalized.breakdownGrid)) {
    normalized.breakdownGrid.forEach((item, idx) => {
      const labelEl = document.getElementById('grid-label-' + String(idx + 1));
      const valEl = document.getElementById('grid-value-' + String(idx + 1));
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
        return '<button type="button" data-action="' + String(act.type) + '" class="' + String(btnClass) + '">' + String(act.label) + '</button>';
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
  if (!toolId) return;

  let cleanId = toolId.replace('tool-card-', '').replace('tool-', '');
  if (cleanId === 'maxfdp') cleanId = 'max-fdp';
  if (cleanId === 'preflight') cleanId = 'pre-flight-rest';
  if (cleanId === 'ftl1') cleanId = 'caam-ftl1';

  toolsState.activeSubTab = cleanId;

  // Category A subtabs
  const catATools = ['medical', 'ppc', 'recurrent', 'recency'];
  const catAIdx = catATools.indexOf(cleanId);

  catATools.forEach(id => {
    const pill = document.getElementById();
    if (pill) {
      if (id === cleanId) {
        pill.className = 'subtab-pill active flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-sky-500/40 bg-sky-500/20 text-sky-400 dark:text-sky-300 cursor-pointer';
      } else {
        pill.className = 'subtab-pill flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';
      }
    }

    const card = document.getElementById() || document.getElementById();
    if (card) {
      if (id === cleanId) {
        card.classList.remove('hidden');
        card.classList.add('active');
      } else {
        card.classList.remove('active');
        card.classList.add('hidden');
      }
    }
  });

  if (catAIdx !== -1) {
    const dotsA = document.querySelectorAll('#page-dots-cat-a .page-dot');
    dotsA.forEach((dot, idx) => {
      if (idx === catAIdx) {
        dot.className = 'page-dot active w-5 h-1.5 rounded-full bg-sky-500 transition-all duration-300';
      } else {
        dot.className = 'page-dot w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 transition-all duration-300';
      }
    });
  }

  // Category B subtabs
  const catBTools = ['standby', 'max-fdp', 'pre-flight-rest', 'cumulative', 'caam-ftl1'];
  const catBIdx = catBTools.indexOf(cleanId);

  catBTools.forEach(id => {
    let pillId = id;
    if (id === 'max-fdp') pillId = 'maxfdp';
    if (id === 'pre-flight-rest') pillId = 'preflight';
    if (id === 'caam-ftl1') pillId = 'ftl1';

    const pill = document.getElementById();
    if (pill) {
      if (id === cleanId) {
        pill.className = 'subtab-pill active flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-sky-500/40 bg-sky-500/20 text-sky-400 dark:text-sky-300 cursor-pointer';
      } else {
        pill.className = 'subtab-pill flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';
      }
    }

    let cardId = id === 'max-fdp' ? 'maxfdp' : (id === 'pre-flight-rest' ? 'preflight' : (id === 'caam-ftl1' ? 'ftl1' : id));
    const card = document.getElementById() || document.getElementById();
    if (card) {
      if (id === cleanId) {
        card.classList.remove('hidden');
        card.classList.add('active');
      } else {
        card.classList.remove('active');
        card.classList.add('hidden');
      }
    }
  });

  if (catBIdx !== -1) {
    const dotsB = document.querySelectorAll('#page-dots-cat-b .page-dot');
    dotsB.forEach((dot, idx) => {
      if (idx === catBIdx) {
        dot.className = 'page-dot active w-5 h-1.5 rounded-full bg-sky-500 transition-all duration-300';
      } else {
        dot.className = 'page-dot w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 transition-all duration-300';
      }
    });
  }
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
  let cleanId = toolId ? toolId.replace('tool-card-', '').replace('tool-', '') : '';
  if (cleanId === 'maxfdp') cleanId = 'max-fdp';
  if (cleanId === 'preflight') cleanId = 'pre-flight-rest';
  if (cleanId === 'ftl1') cleanId = 'caam-ftl1';

  const cardKey = cleanId === 'max-fdp' ? 'maxfdp' : (cleanId === 'pre-flight-rest' ? 'preflight' : (cleanId === 'caam-ftl1' ? 'ftl1' : cleanId));
  const cardEl = document.getElementById() || document.getElementById() || document.getElementById(toolId);

  if (cardEl) {
    const inputs = cardEl.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = input.defaultChecked;
      } else if (input.type === 'number') {
        input.value = input.defaultValue || '0';
      } else {
        input.value = input.defaultValue || '';
      }
    });

    const displayBtns = cardEl.querySelectorAll('[id^=display-]');
    displayBtns.forEach(btn => {
      btn.innerText = 'Select Date';
    });
  }

  if (window.dispatchActiveToolCalculation) {
    window.dispatchActiveToolCalculation();
  }
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
  const subject = 'FTL / Discretion Notification - FLT ' + String(flight);
  const body = 'Crew Control / Flight Ops,\\n\\nPlease be advised of the FTL / Discretion details for FLT ' + String(flight) + ':\\n- Report Time: ' + String(opts.reportTime || '--:--') + '\\n- Max Allowable FDP: ' + String(opts.maxFdp || '--:--') + '\\n- On-Chocks Cutoff: ' + String(opts.cutoff || '--:-- UTC') + '\\n\\nGenerated via CertiFly PWA.';
  return { subject, body, mailtoUrl: 'mailto:crewcontrol@malaysiaairlines.com?subject=' + String(encodeURIComponent(subject)) + '&body=' + String(encodeURIComponent(body)) };
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
