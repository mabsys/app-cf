// js/tools.js (2010_R190)

import { calculateMedicalValidity } from './engines/medical-validity-calculator.js';
import { calculatePpcWindows } from './engines/ppc-validity-calculator.js';
import { calculateRecurrentExpiry } from './engines/recurrent-training-calculator.js';
import { calculateStandbyDeduction } from './engines/standby-fdp-calculator.js';
import { calculateMaxFdp } from './engines/max-fdp-calculator.js';
import { calculatePreFlightRest } from './engines/pre-flight-rest-calculator.js';
import { calculateCumulativeHours } from './engines/cumulative-hours-calculator.js';
import { initCaamFtl1Form, generateCaamFtl1Pdf } from './engines/caam-ftl1-controller.js';

/**
 * CertiFly™ Tools Module - UI Orchestrator & Data Adapter (2010_R190)
 */

let toolsState = {
  activeTier: 'ftl', // 'ftl' | 'quals'
  activeSubTab: 'max-fdp', // FTL: 'standby'|'max-fdp'|'pre-flight-rest'|'cumulative'|'discretion'
                           // Quals: 'medical'|'ppc'|'recurrent'
  lastCalculationResults: {}
};

/**
 * Standardized 4-Slot Output Adapter
 * Normalizes raw calculation output from any of the 8 engines into a unified structure
 * @param {string} toolType - Engine identifier
 * @param {Object} rawResult - Raw output object from engine
 * @returns {Object} Normalized 4-slot output format
 */
export function normalizeOutput(toolType, rawResult) {
  if (!rawResult) {
    return {
      statusBadge: 'NO DATA',
      statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      headlineTitle: 'STATUS',
      headlineValue: '--:--',
      targetClockLabel: 'Target Clock',
      targetClockValue: '--:--',
      breakdownGrid: [],
      auditNotes: [],
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
        targetClockValue: rawResult.standbyEndClock || '--:--',
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
        headlineValue: rawResult.maxFdpFormatted || rawResult.maxFdp || '--:--',
        targetClockLabel: 'Latest On-Chocks Cutoff',
        targetClockValue: rawResult.latestOnChocksUtc || rawResult.onChocksClock || '--:-- UTC',
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
        headlineValue: rawResult.minRestFormatted || rawResult.requiredRest || '--:--',
        targetClockLabel: 'Earliest Next Report Clock',
        targetClockValue: rawResult.earliestReportClock || '--:--',
        breakdownGrid: [
          { label: 'Preceding Duty', value: rawResult.precedingDutyFormatted || '--' },
          { label: 'Home Base Floor', value: rawResult.homeBaseFloor || '12h 00m' },
          { label: 'Travel/Transit', value: rawResult.travelAllowance || 'Included' },
          { label: 'Local Night Guard', value: rawResult.localNightAchieved ? 'Achieved' : 'N/A' }
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
      const isOverLimit = rawResult.isExceeded || rawResult.isOverCap;
      return {
        statusBadge: isOverLimit ? 'CAP EXCEEDED' : 'ROSTER CLEARED',
        statusClass: isOverLimit ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        headlineTitle: '7-DAY DUTY BUDGET',
        headlineValue: rawResult.duty7dFormatted || `${rawResult.duty7d || 0} / 55h`,
        targetClockLabel: 'Next Sector Limit',
        targetClockValue: rawResult.nextSectorMaxHours || '--:--',
        breakdownGrid: [
          { label: '14-Day Duty', value: rawResult.duty14dFormatted || '0 / 95h' },
          { label: '28-Day Duty', value: rawResult.duty28dFormatted || '0 / 190h' },
          { label: '28-Day Flying', value: rawResult.fly28dFormatted || '0 / 100h' },
          { label: '12-Month Flying', value: rawResult.fly12mFormatted || '0 / 1000h' }
        ],
        auditNotes: [
          'CAAM CAD 1901 Cumulative Duty & Flying Caps',
          rawResult.standbyWeightingNote || 'Standby weighting applied where applicable'
        ],
        actions: []
      };
    }

    case 'caam-ftl1': {
      return {
        statusBadge: rawResult.isComplete ? 'REPORT READY' : 'DRAFT IN PROGRESS',
        statusClass: rawResult.isComplete ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
        headlineTitle: 'CAAM/BOP/FTL/1 REPORT',
        headlineValue: rawResult.flightNo ? `FLT ${rawResult.flightNo}` : 'DISCRETION FORM',
        targetClockLabel: 'FDP Extension Used',
        targetClockValue: rawResult.extensionUsedFormatted || '+00:00',
        breakdownGrid: [
          { label: 'Commander', value: rawResult.commanderName || '--' },
          { label: 'Sectors Flown', value: String(rawResult.sectorCount || 1) },
          { label: 'Delay Reason', value: rawResult.primaryDelayReason || 'Operational' },
          { label: 'Signature', value: rawResult.hasSignature ? 'Signed' : 'Pending' }
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
        statusBadge: rawResult.isAnniversaryPreserved ? 'ANNIVERSARY PRESERVED' : 'RESET (EOM)',
        statusClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
        headlineTitle: 'NEW MEDICAL EXPIRY',
        headlineValue: rawResult.newExpiryDateFormatted || rawResult.newExpiry || '--',
        targetClockLabel: 'Renewal Window Opens',
        targetClockValue: rawResult.windowOpenDateFormatted || rawResult.windowOpen || '--',
        breakdownGrid: [
          { label: 'Age Tier', value: rawResult.ageTierLabel || 'Under 40' },
          { label: 'Class', value: rawResult.medicalClass || 'Class 1' },
          { label: 'Validity Period', value: `${rawResult.validityMonths || 12} Months` },
          { label: '45-Day Window', value: rawResult.windowStatus || 'Active' }
        ],
        auditNotes: [
          rawResult.clause || 'CAAM CAD 1 Personnel Licensing (PEL)',
          rawResult.notes || 'Expiry date calculated per CAAM age-tiered validity rules'
        ],
        actions: []
      };
    }

    case 'ppc': {
      return {
        statusBadge: rawResult.isAnniversaryPreserved ? 'ANNIVERSARY PRESERVED' : 'RESET (EOM)',
        statusClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
        headlineTitle: 'NEW PPC / LPC EXPIRY',
        headlineValue: rawResult.newLpcExpiryFormatted || rawResult.newLpcExpiry || '--',
        targetClockLabel: 'PPC Window Opens',
        targetClockValue: rawResult.windowOpenFormatted || rawResult.windowOpen || '--',
        breakdownGrid: [
          { label: 'Base Month', value: rawResult.baseMonth || '--' },
          { label: 'Grace Period', value: rawResult.gracePeriod || '3 Months' },
          { label: 'OPC Window', value: rawResult.opcWindowSummary || 'Active' },
          { label: 'Status', value: rawResult.statusLabel || 'Valid' }
        ],
        auditNotes: [
          'CAAM CAD 1 & OM-D PPC/LPC Validity Rules',
          rawResult.notes || '3-month lookback window applied'
        ],
        actions: []
      };
    }

    case 'recurrent': {
      return {
        statusBadge: rawResult.isCompliant ? 'COMPLIANT' : 'RENEWAL DUE',
        statusClass: rawResult.isCompliant ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
        headlineTitle: 'RECURRENT EXPIRY',
        headlineValue: rawResult.expiryDateFormatted || rawResult.expiryDate || '--',
        targetClockLabel: 'Days Remaining',
        targetClockValue: rawResult.daysRemaining !== undefined ? `${rawResult.daysRemaining} Days` : '--',
        breakdownGrid: [
          { label: 'Course Name', value: rawResult.courseName || 'Ground School' },
          { label: 'Validity', value: `${rawResult.validityMonths || 12} Months` },
          { label: 'Recency Status', value: rawResult.recencyStatus || 'Valid' },
          { label: 'Next Due', value: rawResult.nextDueFormatted || '--' }
        ],
        auditNotes: [
          'CAAM & OM-D Recurrent Training Standards',
          rawResult.notes || 'Ground, Sim, SEP, and CRM validity tracking'
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
        auditNotes: [],
        actions: []
      };
  }
}

/**
 * Master Tool Calculation Dispatcher
 * Calls the appropriate engine and returns normalized output
 */
export function runToolCalculation(toolType, inputData = {}) {
  let rawResult = null;

  try {
    switch (toolType) {
      case 'standby':
        rawResult = typeof calculateStandbyDeduction === 'function' ? calculateStandbyDeduction(inputData) : null;
        break;
      case 'max-fdp':
        rawResult = typeof calculateMaxFdp === 'function' ? calculateMaxFdp(inputData) : null;
        break;
      case 'pre-flight-rest':
        rawResult = typeof calculatePreFlightRest === 'function' ? calculatePreFlightRest(inputData) : null;
        break;
      case 'cumulative':
        rawResult = typeof calculateCumulativeHours === 'function' ? calculateCumulativeHours(inputData) : null;
        break;
      case 'caam-ftl1':
        rawResult = typeof initCaamFtl1Form === 'function' ? initCaamFtl1Form(inputData) : null;
        break;
      case 'medical':
        rawResult = typeof calculateMedicalValidity === 'function' ? calculateMedicalValidity(inputData) : null;
        break;
      case 'ppc':
        rawResult = typeof calculatePpcWindows === 'function' ? calculatePpcWindows(inputData.conductDate, inputData.expiryDate) : null;
        break;
      case 'recurrent':
        rawResult = typeof calculateRecurrentExpiry === 'function' ? calculateRecurrentExpiry(inputData) : null;
        break;
      default:
        console.warn(`Unknown tool type: ${toolType}`);
    }
  } catch (err) {
    console.warn(`Error running calculation for ${toolType}:`, err);
  }

  const normalized = normalizeOutput(toolType, rawResult);
  toolsState.lastCalculationResults[toolType] = { raw: rawResult, normalized };
  return { raw: rawResult, normalized };
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
 * Legacy function compatibility exports to prevent breaking existing callers in main.js
 */
export function initToolsModule() {
  return true;
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
