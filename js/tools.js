// tools_2310_R197.js.txt (2310_R197) - Tools Orchestrator & Data Adapter (Real-Time Reactive Dispatcher)

import * as StandbyEngineModule from './engines/standby-fdp-calculator.js';
import * as MaxFdpEngineModule from './engines/max-fdp-calculator.js';
import * as PreFlightRestEngineModule from './engines/pre-flight-rest-calculator.js';
import * as CumulativeEngineModule from './engines/cumulative-hours-calculator.js';
import * as CaamFtl1Module from './engines/caam-ftl1-controller.js';
import * as MedicalEngineModule from './engines/medical-validity-calculator.js';
import * as PpcEngineModule from './engines/ppc-validity-calculator.js';
import * as RecurrentEngineModule from './engines/recurrent-training-calculator.js';

let toolsState = {
  activeTier: 'validity',
  activeSubTab: 'medical',
  lastCalculationResults: {}
};

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
      breakdownGrid: [],
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
          { type: 'pipeline-fdp', label: 'Pass to Max FDP Calc' }
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
          { type: 'email', label: 'Draft FTL Email' },
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
        headlineValue: rawResult.duty7Days ? `${rawResult.duty7Days.currentFormatted || rawResult.duty7Days.current || '--'} / 55h` : '-- / 55h',
        targetClockLabel: '28-Day Duty Budget',
        targetClockValue: rawResult.duty28Days ? (rawResult.duty28Days.currentFormatted || `${rawResult.duty28Days.current || '--'} / 190h`) : '--:--',
        breakdownGrid: [
          { label: '14-Day Duty', value: rawResult.duty14Days ? (rawResult.duty14Days.currentFormatted || `${rawResult.duty14Days.current}h`) : '0h' },
          { label: '28-Day Duty', value: rawResult.duty28Days ? (rawResult.duty28Days.currentFormatted || `${rawResult.duty28Days.current}h`) : '0h' },
          { label: '28-Day Flying', value: rawResult.flight28Days ? (rawResult.flight28Days.currentFormatted || `${rawResult.flight28Days.current}h`) : '0h' },
          { label: '12-Month Flying', value: rawResult.flight12Months ? (rawResult.flight12Months.currentFormatted || `${rawResult.flight12Months.current}h`) : '0h' }
        ],
        auditNotes: [
          'CAAM CAD 1901 Cumulative Duty & Flying Caps',
          rawResult.notes || 'Standby weighting applied where applicable'
        ],
        actions: []
      };
    }

    case 'caam-ftl1': {
      return {
        statusBadge: rawResult.partC && rawResult.partC.signatureDataUrl ? 'REPORT READY' : 'DRAFT IN PROGRESS',
        statusClass: rawResult.partC && rawResult.partC.signatureDataUrl ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
        headlineTitle: 'CAAM/BOP/FTL/1 REPORT',
        headlineValue: rawResult.partA && rawResult.partA.flightNumber ? `FLT ${rawResult.partA.flightNumber}` : 'DISCRETION FORM',
        targetClockLabel: 'FDP Extension Used',
        targetClockValue: rawResult.voyage ? `+${Math.floor((rawResult.voyage.discretionExercisedMinutes || 0) / 60)}h ${(rawResult.voyage.discretionExercisedMinutes || 0) % 60}m` : '+00:00',
        breakdownGrid: [
          { label: 'Commander', value: rawResult.partA ? (rawResult.partA.picName || '--') : '--' },
          { label: 'Sectors Flown', value: rawResult.voyage && rawResult.voyage.sectors ? String(rawResult.voyage.sectors.length) : '1' },
          { label: 'Delay Reason', value: 'Operational' },
          { label: 'Signature', value: rawResult.partC && rawResult.partC.signatureDataUrl ? 'Signed' : 'Pending' }
        ],
        auditNotes: [
          'CAAM/BOP/FTL/1 Discretion Report',
          'Required to be submitted to CAAM/Company within 48 hours'
        ],
        actions: [
          { type: 'generate-pdf', label: 'Download Official CAAM PDF' },
          { type: 'email-pdf', label: 'Email Report to Ops' }
        ]
      };
    }

    case 'medical': {
      const windowStr = rawResult.renewalWindowSummary || (rawResult.earlyRenewalWindowStart ? `${rawResult.earlyRenewalWindowStart} to ${rawResult.currentExpiryDate}` : '--');
      return {
        statusBadge: rawResult.anniversaryPreserved ? 'ANNIVERSARY PRESERVED (45d)' : 'RESET (EOM)',
        statusClass: rawResult.anniversaryPreserved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
        headlineTitle: 'NEW MEDICAL EXPIRY',
        headlineValue: rawResult.newExpiryDate || '--',
        targetClockLabel: '45-Day Early Renewal Window',
        targetClockValue: windowStr,
        breakdownGrid: [
          { label: 'Pilot Age', value: rawResult.age !== undefined ? `Age ${rawResult.age}` : '--' },
          { label: 'Class', value: 'Class 1' },
          { label: 'Validity Period', value: `${rawResult.validityMonths || 12} Months` },
          { label: 'Preserved (45d)', value: rawResult.anniversaryPreserved ? 'Yes' : 'No' }
        ],
        auditNotes: [
          'CAAM CAD 1 Personnel Licensing (PEL) Standards',
          rawResult.reason || (rawResult.anniversaryPreserved ? 'Exam conducted within 45-day window: Anniversary preserved' : 'Expiry calculated per CAAM age-tiered validity rules')
        ],
        actions: []
      };
    }

    case 'ppc': {
      const windowStr = rawResult.opcWindowSummary || (rawResult.earliestOPCDate ? `${rawResult.earliestOPCDate} to ${rawResult.latestOPCDate}` : '--');
      return {
        statusBadge: rawResult.anniversaryPreserved ? 'ANNIVERSARY PRESERVED (3m)' : 'RESET (EOM)',
        statusClass: rawResult.anniversaryPreserved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
        headlineTitle: 'NEW PPC / LPC EXPIRY',
        headlineValue: rawResult.newLPCExpiryDate || rawResult.newLpcExpiry || '--',
        targetClockLabel: 'Mandatory OPC Window (4-8m)',
        targetClockValue: windowStr,
        breakdownGrid: [
          { label: 'LPC Conducted', value: rawResult.lpcConductDate || '--' },
          { label: 'Previous Expiry', value: rawResult.previousLPCExpiry || 'None' },
          { label: 'New Expiry', value: rawResult.newLPCExpiryDate || '--' },
          { label: 'Calculation', value: rawResult.anniversaryPreserved ? 'Preserved (+12m)' : 'Reset (EOM)' }
        ],
        auditNotes: [
          'CAAM CAD 1 & OM-D PPC/LPC Validity Standards',
          rawResult.calculationMethod || '3-month renewal lookback window applied'
        ],
        actions: []
      };
    }

    case 'recurrent': {
      return {
        statusBadge: rawResult.anniversaryPreserved ? 'ANNIVERSARY PRESERVED (3m)' : 'RESET (EOM)',
        statusClass: rawResult.anniversaryPreserved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
        headlineTitle: 'RECURRENT EXPIRY',
        headlineValue: rawResult.newExpiryDate || '--',
        targetClockLabel: 'Completion Date',
        targetClockValue: rawResult.completionDate || '--',
        breakdownGrid: [
          { label: 'Category', value: rawResult.category || 'Recurrent' },
          { label: 'Completed', value: rawResult.completionDate || '--' },
          { label: 'New Expiry', value: rawResult.newExpiryDate || '--' },
          { label: 'Method', value: rawResult.anniversaryPreserved ? 'Preserved' : 'Reset' }
        ],
        auditNotes: [
          'CAAM & OM-D Recurrent Training Standards',
          rawResult.calculationMethod || 'Ground, Sim, SEP, and CRM validity tracking'
        ],
        actions: []
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
          if (inputData.standbyStartISO || inputData.startTime) {
            rawResult = ClassObj.calculateStandbyFDP({
              standbyStartISO: inputData.standbyStartISO || inputData.startTime,
              calloutTimestampISO: inputData.calloutTimestampISO || inputData.calloutTime
            });
          }
        }
        break;
      }

      case 'max-fdp': {
        const ClassObj = MaxFdpEngineModule.MaxFDPEngine || MaxFdpEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateMaxFDP === 'function') {
          const reportTime = inputData.reportTimestampISO || inputData.reportTime;
          if (reportTime) {
            rawResult = ClassObj.calculateMaxFDP({
              reportTimestampISO: reportTime,
              sectorsPlanned: inputData.sectorsPlanned || inputData.sectors || 1,
              isAcclimatised: inputData.isAcclimatised ?? true
            });
          }
        }
        break;
      }

      case 'pre-flight-rest': {
        const ClassObj = PreFlightRestEngineModule.PreFlightRestEngine || PreFlightRestEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateMinRest === 'function') {
          if (inputData.precedingDutyHours) {
            rawResult = ClassObj.calculateMinRest({
              precedingDutyHours: inputData.precedingDutyHours,
              locationType: inputData.locationType || 'outstation'
            });
          }
        }
        break;
      }

      case 'cumulative': {
        const ClassObj = CumulativeEngineModule.CumulativeHoursEngine || CumulativeEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateCumulativeBudget === 'function') {
          rawResult = ClassObj.calculateCumulativeBudget({
            loggedDutyHours7Days: inputData.loggedDutyHours7Days || inputData.duty7d || 0,
            loggedDutyHours14Days: inputData.loggedDutyHours14Days || inputData.duty14d || 0,
            loggedDutyHours28Days: inputData.loggedDutyHours28Days || 0,
            loggedFlightHours28Days: inputData.loggedFlightHours28Days || 0,
            loggedFlightHours12Months: inputData.loggedFlightHours12Months || 0
          });
        }
        break;
      }

      case 'caam-ftl1': {
        if (typeof CaamFtl1Module.createDefaultFormState === 'function') {
          rawResult = CaamFtl1Module.createDefaultFormState(inputData);
        }
        break;
      }

      case 'medical': {
        const ClassObj = MedicalEngineModule.MedicalValidityEngine || MedicalEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateValidity === 'function') {
          const examDate = inputData.examDate || inputData.lastDate;
          const dob = inputData.dob || inputData.pilotAge;
          if (examDate && dob) {
            rawResult = ClassObj.calculateValidity({
              examDate,
              dob,
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
          if (conductDate) {
            rawResult = ClassObj.calculateLPCExpiry(
              conductDate,
              inputData.currentLPCExpiryDateStr || inputData.expiryDate || null
            );
          }
        }
        break;
      }

      case 'recurrent': {
        const ClassObj = RecurrentEngineModule.RecurrentTrainingEngine || RecurrentEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateExpiry === 'function') {
          const completionDate = inputData.completionDateStr || inputData.conductDate || inputData.completionDate;
          if (completionDate) {
            rawResult = ClassObj.calculateExpiry(
              inputData.qualKey || inputData.courseType || 'LINE_CHECK',
              completionDate,
              inputData.currentExpiryDateStr || null
            );
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    // Soft silent catch for non-fatal calculation state
  }

  const normalized = normalizeOutput(toolType, rawResult);
  toolsState.lastCalculationResults[toolType] = { raw: rawResult, normalized };
  renderToolsOutputCard(normalized);
  return { raw: rawResult, normalized };
}

/**
 * DOM Updater for the Fixed 4-Slot Summary Output Card (#tools-output-card)
 */
export function renderToolsOutputCard(normalized) {
  if (!normalized) return;

  const badgeEl = document.getElementById('out-status-badge');
  const titleEl = document.getElementById('out-headline-title');
  const valEl = document.getElementById('out-headline-val');
  const clockLabelEl = document.getElementById('out-clock-label');
  const clockValEl = document.getElementById('out-clock-val');
  const gridEl = document.getElementById('out-breakdown-grid');
  const auditEl = document.getElementById('out-audit-notes');
  const actionsEl = document.getElementById('out-actions-container');

  // Slot 1
  if (badgeEl) {
    badgeEl.innerText = normalized.statusBadge || 'READY';
    badgeEl.className = `px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xs ${normalized.statusClass || 'bg-slate-100 text-slate-700'}`;
  }
  if (titleEl) titleEl.innerText = normalized.headlineTitle || 'CALCULATOR';
  if (valEl) valEl.innerText = normalized.headlineValue || '--:--';

  // Slot 2
  if (clockLabelEl) clockLabelEl.innerText = normalized.targetClockLabel || 'Target Clock';
  if (clockValEl) clockValEl.innerText = normalized.targetClockValue || '--:--';

  // Slot 3 (2x2 Grid)
  if (gridEl && Array.isArray(normalized.breakdownGrid)) {
    gridEl.innerHTML = normalized.breakdownGrid.map(item => `
      <div class="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl flex justify-between items-center">
        <span class="text-slate-400 font-extrabold uppercase text-[8px] truncate">${item.label}</span>
        <span class="font-extrabold text-slate-800 dark:text-slate-200 text-xs">${item.value}</span>
      </div>
    `).join('');
  }

  // Slot 4 (Audit Notes & Action CTAs)
  if (auditEl && Array.isArray(normalized.auditNotes)) {
    auditEl.innerHTML = normalized.auditNotes.map(note => `<span>[INFO] ${note}</span>`).join('');
  }

  if (actionsEl) {
    if (Array.isArray(normalized.actions) && normalized.actions.length > 0) {
      actionsEl.innerHTML = normalized.actions.map(action => `
        <button type="button" data-action="${action.type}" class="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer text-center">
          ${action.label}
        </button>
      `).join('');
    } else {
      actionsEl.innerHTML = '';
    }
  }
}

/**
 * Real-Time Input Binder for Reactive UI Operations
 */
export function initToolsViewUI() {
  const toolPanes = {
    medical: ['medical-dob', 'medical-exam-date', 'medical-current-expiry'],
    ppc: ['ppc-conduct-date', 'ppc-current-expiry'],
    recurrent: ['recurrent-qual-key', 'recurrent-conduct-date', 'recurrent-current-expiry'],
    standby: ['standby-start-time', 'standby-callout-time'],
    'max-fdp': ['max-fdp-report-time', 'max-fdp-sectors', 'max-fdp-acclimatised'],
    'pre-flight-rest': ['pre-flight-duty-hours', 'pre-flight-location'],
    cumulative: ['cum-duty-7d', 'cum-duty-14d', 'cum-duty-28d', 'cum-flight-28d', 'cum-flight-12m']
  };

  const getPaneData = (type) => {
    const data = {};
    switch (type) {
      case 'medical':
        data.dob = document.getElementById('medical-dob')?.value || '';
        data.examDate = document.getElementById('medical-exam-date')?.value || '';
        data.currentExpiryDate = document.getElementById('medical-current-expiry')?.value || '';
        break;
      case 'ppc':
        data.lpcConductDateStr = document.getElementById('ppc-conduct-date')?.value || '';
        data.currentLPCExpiryDateStr = document.getElementById('ppc-current-expiry')?.value || '';
        break;
      case 'recurrent':
        data.qualKey = document.getElementById('recurrent-qual-key')?.value || 'LINE_CHECK';
        data.completionDateStr = document.getElementById('recurrent-conduct-date')?.value || '';
        data.currentExpiryDateStr = document.getElementById('recurrent-current-expiry')?.value || '';
        break;
      case 'standby':
        data.standbyStartISO = document.getElementById('standby-start-time')?.value || '';
        data.calloutTimestampISO = document.getElementById('standby-callout-time')?.value || '';
        break;
      case 'max-fdp':
        data.reportTimestampISO = document.getElementById('max-fdp-report-time')?.value || '';
        data.sectorsPlanned = parseInt(document.getElementById('max-fdp-sectors')?.value || '1', 10);
        data.isAcclimatised = document.getElementById('max-fdp-acclimatised')?.checked ?? true;
        break;
      case 'pre-flight-rest':
        data.precedingDutyHours = parseFloat(document.getElementById('pre-flight-duty-hours')?.value || '0');
        data.locationType = document.getElementById('pre-flight-location')?.value || 'outstation';
        break;
      case 'cumulative':
        data.loggedDutyHours7Days = parseFloat(document.getElementById('cum-duty-7d')?.value || '0');
        data.loggedDutyHours14Days = parseFloat(document.getElementById('cum-duty-14d')?.value || '0');
        data.loggedDutyHours28Days = parseFloat(document.getElementById('cum-duty-28d')?.value || '0');
        data.loggedFlightHours28Days = parseFloat(document.getElementById('cum-flight-28d')?.value || '0');
        data.loggedFlightHours12Months = parseFloat(document.getElementById('cum-flight-12m')?.value || '0');
        break;
      default:
        break;
    }
    return data;
  };

  Object.entries(toolPanes).forEach(([toolType, elIds]) => {
    elIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const handler = () => runToolCalculation(toolType, getPaneData(toolType));
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
      }
    });
  });
}

/**
 * Update state for active sub-tab / tier
 */
export function setToolsTab(tier, subTab) {
  if (tier) toolsState.activeTier = tier;
  if (subTab) toolsState.activeSubTab = subTab;
}

export function getToolsState() {
  return { ...toolsState };
}

/**
 * Legacy function compatibility exports
 */
export function initToolsModule() {
  initToolsViewUI();
  return true;
}

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

let currentSectorCount = 2;
export function setSectorCount(count) {
  currentSectorCount = Math.max(1, Math.min(8, count));
  return currentSectorCount;
}

export function getSectorCount() {
  return currentSectorCount;
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
