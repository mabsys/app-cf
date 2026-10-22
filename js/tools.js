// js/tools.js (2010_R195) - Tools Orchestrator & Output Card Adapter

import * as MedicalEngineModule from './engines/medical-validity-calculator.js';
import * as PpcEngineModule from './engines/ppc-validity-calculator.js';
import * as RecurrentEngineModule from './engines/recurrent-training-calculator.js';
import * as StandbyEngineModule from './engines/standby-fdp-calculator.js';
import * as MaxFdpEngineModule from './engines/max-fdp-calculator.js';
import * as PreFlightRestEngineModule from './engines/pre-flight-rest-calculator.js';
import * as CumulativeEngineModule from './engines/cumulative-hours-calculator.js';
import * as CaamFtl1Module from './engines/caam-ftl1-controller.js';

/**
 * CertiFly™ Tools Module - UI Orchestrator & Data Adapter (2010_R195)
 */

let toolsState = {
  activeTier: 'validity', // 'validity' | 'fdp'
  activeSubTab: 'medical', // Validity: 'medical'|'ppc'|'recurrent'
                            // Duty & Rest: 'standby'|'max-fdp'|'pre-flight-rest'|'cumulative'|'caam-ftl1'
  lastCalculationResults: {}
};

/**
 * Standardized 4-Slot Output Adapter
 * Normalizes raw calculation output from any of the 8 engines into a unified structure
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
      auditNotes: ['ℹ CAAM CAD 1901 / CAD 1 Standards'],
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
        headlineValue: rawResult.netFdpFormatted || rawResult.netFdp || '--:--',
        targetClockLabel: 'Standby End Cutoff',
        targetClockValue: rawResult.standbyEndClock || rawResult.cutoffTimestampUTC || '--:--',
        breakdownGrid: [
          { label: 'Standby Duration', value: rawResult.standbyDurationFormatted || '--' },
          { label: 'FDP Deduction', value: rawResult.deductionFormatted || '0h 00m' },
          { label: 'Case Type', value: isCaseB ? 'Case B (≥6h)' : 'Case A (<6h)' },
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
        targetClockValue: rawResult.cutoffTimestampUTC || rawResult.latestOnChocksUtc || rawResult.onChocksClock || '--:-- UTC',
        breakdownGrid: [
          { label: 'Base FDP', value: rawResult.baseFdpFormatted || '--' },
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
        headlineValue: rawResult.finalRequiredRestFormatted || rawResult.minRestFormatted || rawResult.requiredRest || '--:--',
        targetClockLabel: 'Earliest Next Report Clock',
        targetClockValue: rawResult.earliestReportUTC || rawResult.earliestReportClock || '--:--',
        breakdownGrid: [
          { label: 'Preceding Duty', value: rawResult.precedingDutyFormatted || '--' },
          { label: 'Home Base Floor', value: rawResult.homeBaseFloor || '12h 00m' },
          { label: 'Travel/Transit', value: rawResult.travelAllowance || 'Included' },
          { label: 'Local Night Guard', value: rawResult.requiresLocalNight ? 'Required' : 'N/A' }
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
      const isOverLimit = rawResult.isExceeded || rawResult.isOverCap || (rawResult.duty7D && rawResult.duty7D.isExceeded);
      const d7 = rawResult.duty7D ? rawResult.duty7D.currentFormatted : (rawResult.duty7dFormatted || '00:00');
      return {
        statusBadge: isOverLimit ? 'CAP EXCEEDED' : 'ROSTER CLEARED',
        statusClass: isOverLimit ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: '7-DAY DUTY BUDGET',
        headlineValue: `${d7} / 55h`,
        targetClockLabel: 'Next Sector Limit',
        targetClockValue: rawResult.nextSectorMaxHours || '--:--',
        breakdownGrid: [
          { label: '14-Day Duty', value: rawResult.duty14D ? rawResult.duty14D.currentFormatted : '00:00' },
          { label: '28-Day Duty', value: rawResult.duty28D ? rawResult.duty28D.currentFormatted : '00:00' },
          { label: '28-Day Flying', value: rawResult.flight28D ? rawResult.flight28D.currentFormatted : '00:00' },
          { label: '12-Month Flying', value: rawResult.flight12M ? rawResult.flight12M.currentFormatted : '00:00' }
        ],
        auditNotes: [
          'CAAM CAD 1901 Cumulative Duty & Flying Caps',
          'Standby weighting applied where applicable'
        ],
        actions: []
      };
    }

    case 'caam-ftl1': {
      const partA = rawResult.partA || {};
      const voyage = rawResult.voyage || {};
      return {
        statusBadge: voyage.isDiscretionTriggered ? 'DISCRETION REPORT' : 'DRAFT IN PROGRESS',
        statusClass: voyage.isDiscretionTriggered ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
        headlineTitle: 'CAAM/BOP/FTL/1 REPORT',
        headlineValue: partA.flightNumber ? `FLT ${partA.flightNumber}` : 'DISCRETION FORM',
        targetClockLabel: 'FDP Extension Used',
        targetClockValue: `+${Math.floor((voyage.discretionExercisedMinutes || 0) / 60)}h ${String((voyage.discretionExercisedMinutes || 0) % 60).padStart(2, '0')}m`,
        breakdownGrid: [
          { label: 'Commander', value: partA.picName || '--' },
          { label: 'Sectors Flown', value: String((voyage.sectors || []).length || 1) },
          { label: 'Duty Start', value: voyage.dutyStartUTC || '--:--' },
          { label: 'Duty End', value: voyage.dutyEndUTC || '--:--' }
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
      return {
        statusBadge: rawResult.anniversaryPreserved ? 'ANNIVERSARY PRESERVED' : 'RESET (EOM)',
        statusClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
        headlineTitle: 'NEW MEDICAL EXPIRY',
        headlineValue: rawResult.newExpiryDate || rawResult.newExpiryDateFormatted || '--',
        targetClockLabel: 'Age At Exam',
        targetClockValue: rawResult.age !== undefined ? `${rawResult.age} Years` : '--',
        breakdownGrid: [
          { label: 'Age Tier', value: (rawResult.age >= 60) ? '60 & Over' : 'Under 60' },
          { label: 'Class', value: 'Class 1' },
          { label: 'Validity Period', value: `${rawResult.validityMonths || 12} Months` },
          { label: '45-Day Window', value: rawResult.anniversaryPreserved ? 'Preserved' : 'Standard' }
        ],
        auditNotes: [
          'CAAM CAD 1 Personnel Licensing (PEL)',
          'Expiry date calculated per CAAM age-tiered validity rules'
        ],
        actions: []
      };
    }

    case 'ppc': {
      return {
        statusBadge: rawResult.anniversaryPreserved ? 'ANNIVERSARY PRESERVED' : 'RESET (EOM)',
        statusClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
        headlineTitle: 'NEW PPC / LPC EXPIRY',
        headlineValue: rawResult.newLPCExpiryDate || rawResult.newLpcExpiry || '--',
        targetClockLabel: 'OPC Target Window',
        targetClockValue: rawResult.targetOPCDate || '--',
        breakdownGrid: [
          { label: 'Conduct Date', value: rawResult.lpcConductDate || '--' },
          { label: 'Previous Expiry', value: rawResult.previousLPCExpiry || 'None' },
          { label: 'OPC Window Start', value: rawResult.earliestOPCDate || '--' },
          { label: 'OPC Window End', value: rawResult.latestOPCDate || '--' }
        ],
        auditNotes: [
          'CAAM CAD 1 & OM-D PPC/LPC Validity Rules',
          rawResult.lapsedLPCWarning || '3-month lookback window applied'
        ],
        actions: []
      };
    }

    case 'recurrent': {
      return {
        statusBadge: rawResult.anniversaryPreserved ? 'ANNIVERSARY PRESERVED' : 'COMPLIANT',
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: 'RECURRENT EXPIRY',
        headlineValue: rawResult.newExpiryDate || rawResult.expiryDate || '--',
        targetClockLabel: 'Validity',
        targetClockValue: `${rawResult.validityMonths || 12} Months`,
        breakdownGrid: [
          { label: 'Course Code', value: rawResult.courseCode || rawResult.courseType || 'Ground' },
          { label: 'Completion Date', value: rawResult.completionDate || '--' },
          { label: 'Previous Expiry', value: rawResult.currentExpiryDate || 'None' },
          { label: 'Calculation', value: rawResult.anniversaryPreserved ? 'Anniversary' : 'Reset' }
        ],
        auditNotes: [
          'CAAM & OM-D Recurrent Training Standards',
          'Ground, Sim, SEP, and CRM validity tracking'
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
        auditNotes: ['ℹ CAAM CAD 1901 / CAD 1 Standards'],
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
      case 'standby':
        if (typeof StandbyEngineModule.calculateStandbyDeduction === 'function') {
          rawResult = StandbyEngineModule.calculateStandbyDeduction(inputData);
        } else if (StandbyEngineModule.StandbyFDPEngine && typeof StandbyEngineModule.StandbyFDPEngine.calculateDeduction === 'function') {
          rawResult = StandbyEngineModule.StandbyFDPEngine.calculateDeduction(inputData);
        }
        break;

      case 'max-fdp':
        if (typeof MaxFdpEngineModule.calculateMaxFdp === 'function') {
          rawResult = MaxFdpEngineModule.calculateMaxFdp(inputData);
        } else if (MaxFdpEngineModule.MaxFDPEngine && typeof MaxFdpEngineModule.MaxFDPEngine.calculateMaxFDP === 'function') {
          rawResult = MaxFdpEngineModule.MaxFDPEngine.calculateMaxFDP(inputData);
        }
        break;

      case 'pre-flight-rest':
        if (typeof PreFlightRestEngineModule.calculatePreFlightRest === 'function') {
          rawResult = PreFlightRestEngineModule.calculatePreFlightRest(inputData);
        } else if (PreFlightRestEngineModule.PreFlightRestEngine && typeof PreFlightRestEngineModule.PreFlightRestEngine.calculateMinimumRest === 'function') {
          rawResult = PreFlightRestEngineModule.PreFlightRestEngine.calculateMinimumRest(inputData);
        }
        break;

      case 'cumulative':
        if (typeof CumulativeEngineModule.calculateCumulativeHours === 'function') {
          rawResult = CumulativeEngineModule.calculateCumulativeHours(inputData);
        } else if (CumulativeEngineModule.CumulativeHoursEngine && typeof CumulativeEngineModule.CumulativeHoursEngine.calculateCumulativeBudget === 'function') {
          rawResult = CumulativeEngineModule.CumulativeHoursEngine.calculateCumulativeBudget(inputData);
        }
        break;

      case 'caam-ftl1':
        if (typeof CaamFtl1Module.initCaamFtl1Form === 'function') {
          rawResult = CaamFtl1Module.initCaamFtl1Form(inputData);
        } else if (typeof CaamFtl1Module.createDefaultFormState === 'function') {
          rawResult = CaamFtl1Module.createDefaultFormState(inputData);
        }
        break;

      case 'medical':
        if (typeof MedicalEngineModule.calculateMedicalValidity === 'function') {
          rawResult = MedicalEngineModule.calculateMedicalValidity(inputData);
        } else if (MedicalEngineModule.MedicalValidityEngine && typeof MedicalEngineModule.MedicalValidityEngine.calculateValidity === 'function') {
          rawResult = MedicalEngineModule.MedicalValidityEngine.calculateValidity(inputData);
        }
        break;

      case 'ppc':
        if (typeof PpcEngineModule.calculatePpcWindows === 'function') {
          rawResult = PpcEngineModule.calculatePpcWindows(inputData.conductDate, inputData.expiryDate);
        } else if (PpcEngineModule.PPCValidityEngine && typeof PpcEngineModule.PPCValidityEngine.calculateLPCExpiry === 'function') {
          rawResult = PpcEngineModule.PPCValidityEngine.calculateLPCExpiry(inputData.conductDate, inputData.expiryDate);
        }
        break;

      case 'recurrent':
        if (typeof RecurrentEngineModule.calculateRecurrentExpiry === 'function') {
          rawResult = RecurrentEngineModule.calculateRecurrentExpiry(inputData);
        } else if (RecurrentEngineModule.RecurrentTrainingEngine && typeof RecurrentEngineModule.RecurrentTrainingEngine.calculateRecurrentValidity === 'function') {
          rawResult = RecurrentEngineModule.RecurrentTrainingEngine.calculateRecurrentValidity(inputData);
        }
        break;

      default:
        console.warn(`Unknown tool type: ${toolType}`);
    }
  } catch (err) {
    console.warn(`Error running calculation for ${toolType}:`, err);
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
        <span class="font-extrabold text-slate-800 dark:text-slate-200">${item.value}</span>
      </div>
    `).join('');
  }

  // Slot 4 (Audit Notes & Action CTAs)
  if (auditEl && Array.isArray(normalized.auditNotes)) {
    auditEl.innerHTML = normalized.auditNotes.map(note => `<span>ℹ ${note}</span>`).join('');
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
 * Legacy function compatibility exports to prevent breaking existing callers in main.js and elsewhere
 */
export function initToolsModule() {
  return true;
}

export function calculatePpcWindows(conductDate, expiryDate) {
  return runToolCalculation('ppc', { conductDate, expiryDate });
}

export function calculateMedicalWindow(dob, conductDate) {
  return runToolCalculation('medical', { dob, conductDate });
}

export function calculateCourseExpiry(courseType, conductDate) {
  return runToolCalculation('recurrent', { courseType, conductDate });
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

export function renderSectorCardsUI() {
  return true;
}

export function clearSignatureCanvas() {
  const canvas = document.getElementById('ftl-signature-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export function populateCommanderSelect() {
  return true;
}
