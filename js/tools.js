// ./js/tools.js (2710_R254) - CertiFly Tools Orchestrator & Regulatory Logic Engine
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
      btnClasses += 'bg-blue-600 text-white shadow-md font-extrabold scale-105';
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
      if (!rawResult) {
        return {
          statusBadge: 'AWAITING INPUT',
          statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
          headlineTitle: 'NEW MEDICAL EXPIRY',
          headlineValue: '--',
          targetClockLabel: '45-Day Re-Exam Window',
          targetClockValue: '-- to --',
          breakdownGrid: [
            { label: 'AGE BAND', value: '--' },
            { label: 'BASE VALIDITY', value: '12 Calendar Months' },
            { label: 'RENEWAL RULE', value: 'Date Preserved (45D)' },
            { label: 'CREW OPERATING LIMIT', value: 'Unrestricted Single/Multi' }
          ],
          auditNotes: ['CAAM CAD 1 PEL Section 1.2.5.2 & OM-A 5.1.4.4'],
          actions: []
        };
      }
      const isPreserved = rawResult.anniversaryPreserved !== undefined ? rawResult.anniversaryPreserved : true;
      const expiry = rawResult.newExpiryDate ? formatDateDDMMMYYYY(rawResult.newExpiryDate) : '--';
      const windowStr = (rawResult.dameEarliestDate) ? formatDateDDMMMYYYY(rawResult.dameEarliestDate) + ' to ' + formatDateDDMMMYYYY(rawResult.reExamDate || rawResult.newExpiryDate) : '-- to --';
      return {
        statusBadge: isPreserved ? 'EXPIRY DATE PRESERVED' : 'EXPIRY RESET (EOM)',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'NEW MEDICAL EXPIRY',
        headlineValue: expiry,
        targetClockLabel: '45-Day Re-Exam Window',
        targetClockValue: windowStr,
        breakdownGrid: [
          { label: 'AGE BAND', value: (rawResult.age !== undefined) ? String(rawResult.age) + ' (Under 60)' : '38 (Under 60)' },
          { label: 'BASE VALIDITY', value: '12 Calendar Months' },
          { label: 'RENEWAL RULE', value: isPreserved ? 'Date Preserved (45D)' : 'Reset (EOM)' },
          { label: 'CREW OPERATING LIMIT', value: 'Unrestricted Single/Multi' }
        ],
        auditNotes: ['CAAM CAD 1 PEL Section 1.2.5.2 & OM-A 5.1.4.4'],
        actions: []
      };
    }

    case 'ppc': {
      if (!rawResult) {
        return {
          statusBadge: 'AWAITING INPUT',
          statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
          headlineTitle: 'NEW PPC / LPC EXPIRY',
          headlineValue: '--',
          targetClockLabel: '3-Month Revalidation Window',
          targetClockValue: '-- to --',
          breakdownGrid: [
            { label: 'RENEWAL RULE', value: 'Date Preserved (3-Mo Window)' },
            { label: 'PERMISSIBLE OPC WINDOW', value: '-- to --' },
            { label: 'BASE VALIDITY', value: '12 Months (End of Month)' },
            { label: 'REFRESHER STATUS', value: 'Current (No Refresher Due)' }
          ],
          auditNotes: ['CAAM CAD 6.9.4.4 / CAD 1 PEL 2.1.5.10 / OM-A 5.1.4.6'],
          actions: []
        };
      }
      const isPreserved = rawResult.anniversaryPreserved !== undefined ? rawResult.anniversaryPreserved : true;
      const expiry = formatDateDDMMMYYYY(rawResult.newLPCExpiryDate || rawResult.newLpcExpiry);
      const opcStr = (rawResult.opcWindowStart) ? formatDateDDMMMYYYY(rawResult.opcWindowStart) + ' to ' + formatDateDDMMMYYYY(rawResult.opcWindowEnd) : '-- to --';
      return {
        statusBadge: isPreserved ? 'EXPIRY DATE PRESERVED' : 'EXPIRY RESET (EOM)',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'NEW PPC / LPC EXPIRY',
        headlineValue: expiry,
        targetClockLabel: '3-Month Revalidation Window',
        targetClockValue: opcStr,
        breakdownGrid: [
          { label: 'RENEWAL RULE', value: isPreserved ? 'Date Preserved (3-Mo Window)' : 'Reset' },
          { label: 'PERMISSIBLE OPC WINDOW', value: opcStr },
          { label: 'BASE VALIDITY', value: '12 Months (End of Month)' },
          { label: 'REFRESHER STATUS', value: 'Current (No Refresher Due)' }
        ],
        auditNotes: ['CAAM CAD 6.9.4.4 / CAD 1 PEL 2.1.5.10 / OM-A 5.1.4.6'],
        actions: []
      };
    }

    case 'recurrent': {
      if (!rawResult) {
        return {
          statusBadge: 'AWAITING INPUT',
          statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
          headlineTitle: 'RECURRENT MODULE EXPIRY',
          headlineValue: '--',
          targetClockLabel: 'Qualification Module',
          targetClockValue: 'SELECT CONDUCT DATE',
          breakdownGrid: [
            { label: 'CATEGORY', value: toolsState.recurrentCourseCat || 'Annual (12 Calendar Months)' },
            { label: 'COMPLETED', value: '--' },
            { label: 'NEW EXPIRY', value: '--' },
            { label: 'RENEWAL METHOD', value: '3-Month Lookback Window' }
          ],
          auditNotes: ['CAAM CAD 6.9.4 & OM-D Chapter 2 Recurrent Standards'],
          actions: []
        };
      }
      const expiry = formatDateDDMMMYYYY(rawResult.newExpiryDate);
      const courseName = rawResult.name || toolsState.recurrentCourseName || 'Line Check (LC)';
      return {
        statusBadge: 'VALID / CLEARED',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'RECURRENT MODULE EXPIRY',
        headlineValue: expiry,
        targetClockLabel: 'Qualification Module',
        targetClockValue: String(courseName).toUpperCase(),
        breakdownGrid: [
          { label: 'CATEGORY', value: rawResult.category || toolsState.recurrentCourseCat || 'Annual (12 Calendar Months)' },
          { label: 'COMPLETED', value: rawResult.completionDate ? formatDateDDMMMYYYY(rawResult.completionDate) : '--' },
          { label: 'NEW EXPIRY', value: expiry },
          { label: 'RENEWAL METHOD', value: '3-Month Lookback Window' }
        ],
        auditNotes: ['CAAM CAD 6.9.4 & OM-D Chapter 2 Recurrent Standards'],
        actions: []
      };
    }

    case 'recency': {
      if (!rawResult) {
        return {
          statusBadge: 'AWAITING INPUT',
          statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
          headlineTitle: '90-DAY LANDING RECENCY',
          headlineValue: '--',
          targetClockLabel: 'Minimum Passenger Currency',
          targetClockValue: '3 PF Take-Offs & Landings in 90 Days',
          breakdownGrid: [
            { label: 'DAY LANDINGS', value: '0 / 3' },
            { label: 'NIGHT LANDINGS', value: '0 / 1' },
            { label: 'ANCHOR DATE (3RD)', value: '--' },
            { label: 'RECENCY EXPIRY', value: '--' }
          ],
          auditNotes: ['CAAM CAD 1 / OM-A Section 7.1 Passenger Currency'],
          actions: []
        };
      }
      const dayCount = rawResult.dayCount || 0;
      const nightCount = rawResult.nightCount || 0;
      const isCompliant = rawResult.isCompliant;
      return {
        statusBadge: isCompliant ? 'CURRENCY MET' : 'RECENCY LAPSED',
        statusClass: isCompliant ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
        headlineTitle: '90-DAY LANDING RECENCY',
        headlineValue: isCompliant ? 'CLEARED FOR FLIGHT' : 'CHECK REQUIRED',
        targetClockLabel: 'Minimum Passenger Currency',
        targetClockValue: '3 PF Take-Offs & Landings in 90 Days',
        breakdownGrid: [
          { label: 'DAY LANDINGS', value: String(dayCount) + ' / 3' },
          { label: 'NIGHT LANDINGS', value: String(nightCount) + ' / 1' },
          { label: 'ANCHOR DATE (3RD)', value: '15 AUG 2026' },
          { label: 'RECENCY EXPIRY', value: '13 NOV 2026' }
        ],
        auditNotes: ['CAAM CAD 1 / OM-A Section 7.1 Passenger Currency'],
        actions: []
      };
    }

    case 'standby': {
      if (!rawResult) {
        return {
          statusBadge: 'AWAITING INPUT',
          statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
          headlineTitle: 'NET PERMISSIBLE FDP',
          headlineValue: '--:--',
          targetClockLabel: 'Standby End Cutoff',
          targetClockValue: '--:-- UTC',
          breakdownGrid: [
            { label: 'STANDBY DURATION', value: '--:--' },
            { label: 'FDP DEDUCTION', value: '--:--' },
            { label: 'CASE TYPE', value: 'Case A (<6h)' },
            { label: 'BASE MAX FDP', value: '13:00 Hours' }
          ],
          auditNotes: ['CAAM CAD 1901 Section 2.15 Standby Rules'],
          actions: []
        };
      }
      const isCaseB = rawResult.caseType === 'CASE_B' || rawResult.isCaseB;
      const fdp = rawResult.netFdpFormatted || rawResult.allowableFdpFormatted || rawResult.netFdp || '--:--';
      return {
        statusBadge: isCaseB ? 'CASE B (REDUCED)' : 'CASE A (STANDARD)',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'NET PERMISSIBLE FDP',
        headlineValue: fdp,
        targetClockLabel: 'Standby End Cutoff',
        targetClockValue: rawResult.cutoffTimestampUtc || '--:-- UTC',
        breakdownGrid: [
          { label: 'STANDBY DURATION', value: rawResult.standbyDurationFormatted || '--:--' },
          { label: 'FDP DEDUCTION', value: rawResult.deductionFormatted || '--:--' },
          { label: 'CASE TYPE', value: isCaseB ? 'Case B (>=6h)' : 'Case A (<6h)' },
          { label: 'BASE MAX FDP', value: '13:00 Hours' }
        ],
        auditNotes: ['CAAM CAD 1901 Section 2.15 Standby Rules'],
        actions: [
          { type: 'pipeline-fdp', label: 'Apply To Max FDP Calculator' }
        ]
      };
    }

    case 'max-fdp': {
      if (!rawResult) {
        return {
          statusBadge: 'AWAITING INPUT',
          statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
          headlineTitle: 'MAX ALLOWABLE FDP',
          headlineValue: '--:--',
          targetClockLabel: 'Latest On-Chocks Cutoff',
          targetClockValue: '--:-- UTC',
          breakdownGrid: [
            { label: 'BASE FDP', value: '--:--' },
            { label: 'RELIEF CREDIT', value: 'None' },
            { label: 'SPLIT CREDIT', value: 'None' },
            { label: 'MAX DISCRETION', value: '+02:00 Hours' }
          ],
          auditNotes: ['CAAM CAD 1901 Table A/B & OM-A Section 7.5'],
          actions: []
        };
      }
      const isDiscretionNeeded = rawResult.isDiscretionTriggered || rawResult.exceedsMaxFdp || rawResult.isDiscretionRequired;
      const isProhibited = rawResult.isProhibited || rawResult.isLapsed;
      let badgeText = 'CLEARED';
      let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
      if (isProhibited) {
        badgeText = 'PROHIBITED';
        badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
      } else if (isDiscretionNeeded) {
        badgeText = 'DISCRETION EXERCISED (+' + String(rawResult.discretionMinutesUsed || 45) + 'm)';
        badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
      }
      const fdpVal = rawResult.finalMaxPermissibleFDPFormatted || rawResult.maxFdpFormatted || rawResult.maxFdp || '--:--';
      return {
        statusBadge: badgeText,
        statusClass: badgeClass,
        headlineTitle: 'MAX ALLOWABLE FDP',
        headlineValue: fdpVal,
        targetClockLabel: 'Latest On-Chocks Cutoff',
        targetClockValue: rawResult.cutoffTimestampUTC || '--:-- UTC',
        breakdownGrid: [
          { label: 'BASE FDP', value: rawResult.baseAllowableFDPFormatted || '--:--' },
          { label: 'RELIEF CREDIT', value: rawResult.bunkCreditFormatted || 'None' },
          { label: 'SPLIT CREDIT', value: rawResult.splitCreditFormatted || 'None' },
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
      if (!rawResult) {
        return {
          statusBadge: 'AWAITING INPUT',
          statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
          headlineTitle: 'MANDATORY MINIMUM REST',
          headlineValue: '--:--',
          targetClockLabel: 'Minimum Rest Completion',
          targetClockValue: '--:-- UTC',
          breakdownGrid: [
            { label: 'PRECEDING DUTY', value: '-- Hours' },
            { label: 'LOCATION', value: 'Home Base' },
            { label: 'BASE REST', value: '12:00 Hours' },
            { label: 'OUTSTATION ADD', value: '00:00 Hours' }
          ],
          auditNotes: ['CAAM CAD 1901 Section 2.14 & OM-A Section 7.5.12'],
          actions: []
        };
      }
      const isReduced = rawResult.isRestReduced;
      const restVal = rawResult.finalRequiredRestFormatted || rawResult.minRestFormatted || '--:--';
      return {
        statusBadge: isReduced ? 'REDUCED REST' : 'STANDARD REST',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'MANDATORY MINIMUM REST',
        headlineValue: restVal,
        targetClockLabel: 'Minimum Rest Completion',
        targetClockValue: rawResult.restCompletionTimeUtc || '--:-- UTC',
        breakdownGrid: [
          { label: 'PRECEDING DUTY', value: rawResult.precedingDutyHours ? String(rawResult.precedingDutyHours) + ' Hours' : '-- Hours' },
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
      if (!rawResult) {
        return {
          statusBadge: 'AWAITING INPUT',
          statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
          headlineTitle: 'CUMULATIVE DUTY BUDGET',
          headlineValue: '--:-- / --:--',
          targetClockLabel: '7-Day Rolling Budget',
          targetClockValue: '--:-- Hours Margin Remaining',
          breakdownGrid: [
            { label: '7-DAY DUTY', value: '--:-- / 55h' },
            { label: '14-DAY DUTY', value: '--:-- / 95h' },
            { label: '28-DAY FLYING', value: '--:-- / 100h' },
            { label: 'CALENDAR YEAR', value: '--:-- / 900h' }
          ],
          auditNotes: ['CAAM CAD 1901 Cumulative Flying & Duty Limits'],
          actions: []
        };
      }
      const isOverLimit = rawResult.isExceeded || rawResult.isOverCap;
      const duty7Val = rawResult.duty7Days ? (rawResult.duty7Days.currentFormatted || rawResult.duty7Days) : '--:-- / 55:00 HOURS';
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
      if (!rawResult || (!rawResult.flightNo && !rawResult.acReg)) {
        return {
          statusBadge: 'AWAITING INPUT',
          statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
          headlineTitle: 'CAAM/BOP/FTL/1 REPORT',
          headlineValue: 'FLIGHT --',
          targetClockLabel: 'Official Discretion Form',
          targetClockValue: 'Awaiting Flight Details',
          breakdownGrid: [
            { label: 'FLIGHT NO', value: '--' },
            { label: 'AIRCRAFT', value: '--' },
            { label: 'DISCRETION', value: '--' },
            { label: 'COMMANDER', value: '--' }
          ],
          auditNotes: ['CAAM CAD 1901 Official Flight Discretion Report'],
          actions: [
            { type: 'generate-pdf', label: 'Download Official CAAM PDF' }
          ]
        };
      }
      return {
        statusBadge: 'REPORT READY',
        statusClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
        headlineTitle: 'CAAM/BOP/FTL/1 REPORT',
        headlineValue: 'FLIGHT ' + (rawResult.flightNo || '--'),
        targetClockLabel: 'Official Discretion Form',
        targetClockValue: 'CAAM Official FTL Document',
        breakdownGrid: [
          { label: 'FLIGHT NO', value: rawResult.flightNo || '--' },
          { label: 'AIRCRAFT', value: rawResult.acReg || '--' },
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
        statusBadge: 'AWAITING INPUT',
        statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
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


export function resetToolInputs(toolId) {
  let cleanId = toolId ? toolId.replace('tool-card-', '').replace('tool-', '') : '';
  if (cleanId === 'maxfdp') cleanId = 'max-fdp';
  if (cleanId === 'preflight') cleanId = 'pre-flight-rest';
  if (cleanId === 'ftl1') cleanId = 'caam-ftl1';

  switch (cleanId) {
    case 'medical': {
      const examDate = document.getElementById('input-med-exam-date');
      const licType = document.getElementById('input-med-license-type');
      const ageBracket = document.getElementById('input-med-age-bracket');
      if (examDate) examDate.value = '';
      if (licType) licType.value = 'ATPL';
      if (ageBracket) ageBracket.value = '40_TO_59';
      break;
    }
    case 'ppc': {
      const conductDate = document.getElementById('input-ppc-conduct-date');
      const expiryDate = document.getElementById('input-ppc-expiry-date');
      if (conductDate) conductDate.value = '';
      if (expiryDate) expiryDate.value = '';
      break;
    }
    case 'recurrent': {
      const courseHidden = document.getElementById('input-recurrent-course');
      const courseLabel = document.getElementById('recurrent-course-label');
      const courseSublabel = document.getElementById('recurrent-course-sublabel');
      const conductDate = document.getElementById('input-recurrent-conduct-date');
      if (courseHidden) courseHidden.value = 'LC';
      if (courseLabel) courseLabel.innerText = 'Line Check (LC)';
      if (courseSublabel) courseSublabel.innerText = 'Annual (12 Calendar Months)';
      if (conductDate) conductDate.value = '';
      toolsState.recurrentCourseKey = 'LC';
      toolsState.recurrentCourseName = 'Line Check (LC)';
      toolsState.recurrentCourseCat = 'Annual (12 Calendar Months)';
      break;
    }
    case 'recency': {
      const dayEl = document.getElementById('input-recency-day');
      const nightEl = document.getElementById('input-recency-night');
      if (dayEl) dayEl.value = '0';
      if (nightEl) nightEl.value = '0';
      break;
    }
    case 'standby': {
      const stbyStart = document.getElementById('input-stby-start-time');
      const stbyReport = document.getElementById('input-stby-report-time');
      if (stbyStart) stbyStart.value = '06:00';
      if (stbyReport) stbyReport.value = '10:00';
      setStandbyLocation('HOME');
      break;
    }
    case 'max-fdp': {
      const reportTime = document.getElementById('input-fdp-report-time');
      const sectors = document.getElementById('input-fdp-sectors');
      const acclimatised = document.getElementById('input-fdp-acclimatised');
      if (reportTime) reportTime.value = '06:00';
      if (sectors) sectors.value = '2';
      if (acclimatised) acclimatised.checked = true;
      break;
    }
    case 'pre-flight-rest': {
      const precDuty = document.getElementById('input-rest-preceding-duty');
      const locType = document.getElementById('input-rest-location');
      if (precDuty) precDuty.value = '10';
      if (locType) locType.value = 'HOME';
      break;
    }
    case 'cumulative': {
      const cumDuty = document.getElementById('input-cum-duty-7d');
      const cumFlt = document.getElementById('input-cum-flight-28d');
      if (cumDuty) cumDuty.value = '';
      if (cumFlt) cumFlt.value = '';
      break;
    }
    case 'caam-ftl1': {
      const fltNo = document.getElementById('ftl1-flight-no');
      const acReg = document.getElementById('ftl1-ac-reg');
      if (fltNo) fltNo.value = '';
      if (acReg) acReg.value = '';
      break;
    }
    default:
      break;
  }

  if (cleanId) {
    delete toolsState.lastCalculationResults[cleanId];
    const normalized = normalizeOutput(cleanId, null);
    renderNormalizedOutput(normalized);
  }
}


}
