// js/tools.js (2410_R204) - Tools Orchestrator, Data Adapter & Modal State Controller
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import * as StandbyEngineModule from './engines/standby-fdp-calculator.js';
import * as MaxFdpEngineModule from './engines/max-fdp-calculator.js';
import * as PreFlightRestEngineModule from './engines/pre-flight-rest-calculator.js';
import * as CumulativeEngineModule from './engines/cumulative-hours-calculator.js';
import * as CaamFtl1Module from './engines/caam-ftl1-controller.js';
import * as MedicalEngineModule from './engines/medical-validity-calculator.js';
import * as PpcEngineModule from './engines/ppc-validity-calculator.js';
import * as RecurrentEngineModule from './engines/recurrent-training-calculator.js';

let toolsState = {
  activeCategory: 'qualifications', // 'qualifications' | 'dutyrest'
  activeToolId: 'tool-medical',      // 'tool-medical', 'tool-ppc', etc.
  masterTimezone: 'UTC',             // 'UTC' | 'LOCAL'
  standbyLocation: 'HOME',           // 'HOME' | 'AIRPORT'
  pipelinedStandbyDeduction: 0,
  recurrentCourseKey: 'LINE_CHECK',
  recurrentCourseName: 'Line Check (LC)',
  recurrentCourseCategory: 'Annual (12 Calendar Months)',
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
      breakdownGrid: [
        { label: 'STATUS', value: 'Awaiting Input' },
        { label: 'REGULATION', value: 'CAAM / OM-A' },
        { label: 'BASE', value: 'WMKK / KUL' },
        { label: 'TIMEZONE', value: toolsState.masterTimezone }
      ],
      auditNotes: ['CAAM CAD 1901 / CAD 1 Standards'],
      actions: []
    };
  }

  switch (toolType) {
    case 'medical': {
      const expDate = rawResult.newExpiryDate || rawResult.expiryDate || '--';
      const dameDate = rawResult.dameEarliestDate || rawResult.windowStartDate || '--';
      const ageStr = rawResult.age !== undefined ? `${rawResult.age} Years` : 'Standard';
      return {
        statusBadge: rawResult.isLapsed ? 'EXPIRED' : (rawResult.inWindow ? 'RENEWAL WINDOW OPEN' : 'CLASS 1 MEDICAL VALID'),
        statusClass: rawResult.isLapsed ? 'bg-rose-600 text-white' : (rawResult.inWindow ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'),
        headlineTitle: 'MEDICAL CERTIFICATE EXPIRY',
        headlineValue: expDate,
        targetClockLabel: 'Earliest Re-Exam Window (45D)',
        targetClockValue: dameDate,
        breakdownGrid: [
          { label: 'LICENSE CLASS', value: 'ATPL Class 1' },
          { label: 'PILOT AGE TIER', value: ageStr },
          { label: 'RENEWAL CYCLE', value: `${rawResult.validityMonths || 12} Months` },
          { label: 'AGE CEILING DATE', value: expDate }
        ],
        auditNotes: ['CAAM CAD 1 PEL Section 2.4 Standards', '45-Day DAME renewal window applied'],
        actions: [
          { type: 'calendar', label: 'Add Calendar Reminder' },
          { type: 'share', label: 'Share Verification' }
        ]
      };
    }

    case 'ppc': {
      const expDate = rawResult.newLPCExpiryDate || rawResult.newLpcExpiry || '--';
      const windowStr = (rawResult.opcWindowStart && rawResult.opcWindowEnd) ? `${rawResult.opcWindowStart} - ${rawResult.opcWindowEnd}` : '3 Months Prior';
      return {
        statusBadge: rawResult.isLapsed ? 'EXPIRED' : (rawResult.inWindow ? 'REVALIDATION WINDOW OPEN' : 'LPC / OPC VALID'),
        statusClass: rawResult.isLapsed ? 'bg-rose-600 text-white' : (rawResult.inWindow ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'),
        headlineTitle: 'PPC / LPC EXPIRY DATE',
        headlineValue: expDate,
        targetClockLabel: 'OPC Revalidation Window',
        targetClockValue: windowStr,
        breakdownGrid: [
          { label: 'LPC CONDUCTED', value: rawResult.lpcConductDate || '--' },
          { label: 'BASE MONTH', value: rawResult.baseMonth || 'OCTOBER' },
          { label: 'ANNIVERSARY', value: rawResult.anniversaryPreserved ? 'Preserved' : 'Reset' },
          { label: 'GRACE EXTENSION', value: '30 Days (EOM)' }
        ],
        auditNotes: ['CAAM CAD 6 & MAB OM-A Section 7.1', '3-Month OPC revalidation window active'],
        actions: [
          { type: 'calendar', label: 'Add Calendar Reminder' },
          { type: 'share', label: 'Share Verification' }
        ]
      };
    }

    case 'recurrent': {
      const expDate = rawResult.newExpiryDate || '--';
      return {
        statusBadge: rawResult.isLapsed ? 'EXPIRED' : (rawResult.inWindow ? 'RENEWAL WINDOW OPEN' : 'QUALIFICATION VALID'),
        statusClass: rawResult.isLapsed ? 'bg-rose-600 text-white' : (rawResult.inWindow ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'),
        headlineTitle: `${(rawResult.name || toolsState.recurrentCourseName).toUpperCase()} EXPIRY`,
        headlineValue: expDate,
        targetClockLabel: 'Renewal Window Start',
        targetClockValue: rawResult.windowStartDate || '3 Months Prior',
        breakdownGrid: [
          { label: 'MODULE NAME', value: rawResult.name || toolsState.recurrentCourseName },
          { label: 'CATEGORY', value: rawResult.category || toolsState.recurrentCourseCategory },
          { label: 'CONDUCTED DATE', value: rawResult.completionDate || '--' },
          { label: 'ANNIVERSARY', value: rawResult.anniversaryPreserved ? 'Preserved' : 'Reset' }
        ],
        auditNotes: ['CAAM & MAB OM-D Training Standards', 'Validity calculated per module schedule'],
        actions: [
          { type: 'calendar', label: 'Add Calendar Reminder' },
          { type: 'share', label: 'Share Verification' }
        ]
      };
    }

    case 'recency': {
      const dayCount = rawResult.dayLandings ?? 3;
      const nightCount = rawResult.nightLandings ?? 1;
      const isCleared = dayCount >= 3 || (dayCount + nightCount >= 3);
      return {
        statusBadge: isCleared ? '90-DAY RECENCY CLEARED' : 'RECENCY LAPSED',
        statusClass: isCleared ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white',
        headlineTitle: 'LANDING RECENCY CURRENCY',
        headlineValue: `${dayCount} Day / ${nightCount} Night`,
        targetClockLabel: '90-Day Currency Status',
        targetClockValue: isCleared ? 'Cleared for Line Duty' : 'Requires Simulator / Line Check',
        breakdownGrid: [
          { label: 'DAY LANDINGS', value: `${dayCount} Landings` },
          { label: 'NIGHT LANDINGS', value: `${nightCount} Landings` },
          { label: 'REQUIRED MINIMUM', value: '3 Landings (90D)' },
          { label: 'STATUS', value: isCleared ? 'Compliant' : 'Lapsed' }
        ],
        auditNotes: ['CAAM CAD 1 PEL & MAB OM-A Section 7.1', 'Minimum 3 landings in preceding 90 days required'],
        actions: [
          { type: 'calendar', label: 'Add Calendar Reminder' },
          { type: 'share', label: 'Share Verification' }
        ]
      };
    }

    case 'standby': {
      const isCaseB = rawResult.caseType === 'CASE_B' || rawResult.isCaseB;
      const dedStr = rawResult.deductionFormatted || '0h 00m';
      const netFdpStr = rawResult.netFdpFormatted || rawResult.allowableFdpFormatted || '--:--';
      return {
        statusBadge: rawResult.isLapsed ? 'EXCEEDED' : (isCaseB ? 'CASE B (REDUCED)' : 'CASE A (STANDARD)'),
        statusClass: rawResult.isLapsed ? 'bg-rose-600 text-white' : (isCaseB ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'),
        headlineTitle: 'NET PERMISSIBLE FDP',
        headlineValue: netFdpStr,
        targetClockLabel: 'Standby End Cutoff',
        targetClockValue: rawResult.cutoffTimestampUtc || rawResult.standbyEndClock || '--:--',
        breakdownGrid: [
          { label: 'STANDBY LOCATION', value: toolsState.standbyLocation === 'HOME' ? 'Home Standby' : 'Airport Standby' },
          { label: 'STANDBY DURATION', value: rawResult.standbyDurationFormatted || '07h 30m' },
          { label: 'FDP DEDUCTION', value: dedStr },
          { label: 'CASE CLASSIFICATION', value: isCaseB ? 'Case B (>=6h)' : 'Case A (<6h)' }
        ],
        auditNotes: ['CAAM CAD 1901 Section 2.9 Standby Rules', 'Standby deduction ready for Max FDP calculator'],
        actions: [
          { type: 'pipeline-fdp', label: 'Apply To Max FDP' },
          { type: 'share', label: 'Share Calculation' }
        ]
      };
    }

    case 'max-fdp': {
      const isDiscretionNeeded = rawResult.isDiscretionTriggered || rawResult.exceedsMaxFdp || rawResult.isDiscretionRequired;
      const isProhibited = rawResult.isProhibited || rawResult.isLapsed;
      
      let badgeText = 'CLEARED';
      let badgeClass = 'bg-emerald-600 text-white';
      
      if (isProhibited) {
        badgeText = 'PROHIBITED';
        badgeClass = 'bg-rose-600 text-white';
      } else if (isDiscretionNeeded) {
        badgeText = `DISCRETION EXERCISED (+${rawResult.discretionMinutesUsed || 45}m)`;
        badgeClass = 'bg-amber-600 text-white';
      }

      return {
        statusBadge: badgeText,
        statusClass: badgeClass,
        headlineTitle: 'MAX ALLOWABLE FDP',
        headlineValue: rawResult.finalMaxPermissibleFDPFormatted || rawResult.maxFdpFormatted || '--:--',
        targetClockLabel: 'Latest On-Chocks Cutoff',
        targetClockValue: rawResult.cutoffTimestampUTC || rawResult.latestOnChocksUtc || '--:-- UTC',
        breakdownGrid: [
          { label: 'BASE TABLE A FDP', value: rawResult.baseAllowableFDPFormatted || rawResult.baseFdpFormatted || '12h 30m' },
          { label: 'STANDBY DEDUCTION', value: rawResult.standbyDeductionFormatted || '-00h 00m' },
          { label: 'SPLIT DUTY CREDIT', value: rawResult.splitCreditFormatted || '+00h 00m' },
          { label: 'MAX PERMISSIBLE', value: rawResult.finalMaxPermissibleFDPFormatted || '--:--' }
        ],
        auditNotes: ['CAAM CAD 1901 Table A/B Standards', 'Grounded in CAAM CAD 1901 & MAB OM-A FTL rules'],
        actions: [
          { type: 'discretion', label: 'Complete CAAM/BOP/FTL/1 Discretion Report' },
          { type: 'pipeline-rest', label: 'Pass to Min Rest' },
          { type: 'share', label: 'Share Calculation' }
        ]
      };
    }

    case 'pre-flight-rest': {
      return {
        statusBadge: rawResult.isRestReduced ? 'REDUCED REST (DISCRETION)' : 'STANDARD REST CLEARED',
        statusClass: rawResult.isRestReduced ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white',
        headlineTitle: 'MANDATORY MINIMUM REST',
        headlineValue: rawResult.finalRequiredRestFormatted || rawResult.minRestFormatted || '12h 00m',
        targetClockLabel: 'Earliest Permissible Report',
        targetClockValue: rawResult.earliestReportUTC || rawResult.earliestReportClock || '--:--',
        breakdownGrid: [
          { label: 'PRECEDING DUTY', value: rawResult.precedingDutyFormatted || '11h 30m' },
          { label: 'EARNED REST', value: rawResult.earnedRestFormatted || '12h 00m' },
          { label: 'OUTSTATION ADDITION', value: rawResult.outstationAllowanceFormatted || '+00h 00m' },
          { label: 'HOME BASE FLOOR', value: '12h 00m Guard' }
        ],
        auditNotes: ['CAAM CAD 1901 Section 2.14 & OM-A 7.5.12', 'Minimum rest computed based on preceding duty'],
        actions: [
          { type: 'calendar', label: 'Add Calendar Reminder' },
          { type: 'share', label: 'Share Rest Notice' }
        ]
      };
    }

    case 'cumulative': {
      const isOverLimit = rawResult.isExceeded || rawResult.isOverCap || (rawResult.duty7Days && rawResult.duty7Days.isExceeded);
      return {
        statusBadge: isOverLimit ? 'CAP EXCEEDED' : 'ROSTER CLEARED',
        statusClass: isOverLimit ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white',
        headlineTitle: '7-DAY DUTY BUDGET',
        headlineValue: rawResult.duty7Days ? `${rawResult.duty7Days.currentFormatted} / 55h` : '42h 15m / 55h',
        targetClockLabel: 'Most Constrained Budget',
        targetClockValue: rawResult.duty7Days ? `${rawResult.duty7Days.remainingFormatted} Remaining` : '12h 45m Remaining (7D Duty)',
        breakdownGrid: [
          { label: '14-DAY DUTY', value: rawResult.duty14Days ? `${rawResult.duty14Days.currentFormatted} / 95h` : '84h 30m / 95h' },
          { label: '28-DAY DUTY', value: rawResult.duty28Days ? `${rawResult.duty28Days.currentFormatted} / 190h` : '162h 00m / 190h' },
          { label: '28-DAY FLYING', value: rawResult.flight28Days ? `${rawResult.flight28Days.currentFormatted} / 100h` : '82h 30m / 100h' },
          { label: '12-MONTH FLYING', value: rawResult.flight12Months ? `${rawResult.flight12Months.currentFormatted} / 1000h` : '780h / 1000h' }
        ],
        auditNotes: ['CAAM CAD 1901 Section 2.18 Cumulative Caps', 'Rolling duty and flight time limits monitored'],
        actions: [
          { type: 'calendar', label: 'Add Calendar Reminder' },
          { type: 'share', label: 'Share Budget' }
        ]
      };
    }

    case 'caam-ftl1': {
      return {
        statusBadge: rawResult.partC && rawResult.partC.signatureDataUrl ? 'REPORT READY' : 'DISCRETION FILED',
        statusClass: 'bg-emerald-600 text-white',
        headlineTitle: 'CAAM/BOP/FTL/1 DISCRETION REPORT',
        headlineValue: rawResult.partA && rawResult.partA.flightNumber ? `FLT ${rawResult.partA.flightNumber}` : 'MH1141 (9M-MXA)',
        targetClockLabel: 'Discretion Exercised',
        targetClockValue: '+00h 47m',
        breakdownGrid: [
          { label: 'COMMANDER', value: rawResult.partA ? rawResult.partA.picName : 'Capt. Reza' },
          { label: 'SECTORS FLOWN', value: '2 Sectors' },
          { label: 'PRIMARY DELAY', value: 'Technical' },
          { label: 'STATUS', value: 'Signed & Exported' }
        ],
        auditNotes: ['CAAM CAD 1901 Commander Discretion Report', 'Requires filing within 14 days of flight duty'],
        actions: [
          { type: 'export-pdf', label: 'Export & Overlay PDF' },
          { type: 'share', label: 'Share Report' }
        ]
      };
    }

    default:
      return normalizeOutput(null, null);
  }
}

/**
 * Master Tool Calculation Dispatcher
 */
export function runToolCalculation(toolType, inputData = {}) {
  let rawResult = null;

  try {
    switch (toolType) {
      case 'medical': {
        const ClassObj = MedicalEngineModule.MedicalValidityEngine || MedicalEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateValidity === 'function') {
          rawResult = ClassObj.calculateValidity({
            dob: inputData.dob,
            examDate: inputData.examDate,
            currentExpiryDate: inputData.currentExpiryDate || null
          });
        }
        break;
      }

      case 'ppc': {
        const ClassObj = PpcEngineModule.PPCValidityEngine || PpcEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateLPCExpiry === 'function') {
          rawResult = ClassObj.calculateLPCExpiry(
            inputData.lpcConductDateStr || inputData.conductDate,
            inputData.currentLPCExpiryDateStr || inputData.expiryDate || null
          );
        }
        break;
      }

      case 'recurrent': {
        const ClassObj = RecurrentEngineModule.RecurrentTrainingEngine || RecurrentEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateExpiry === 'function') {
          rawResult = ClassObj.calculateExpiry(
            inputData.courseKey || toolsState.recurrentCourseKey,
            inputData.conductDate || inputData.completionDate,
            inputData.currentExpiryDate || null
          );
        }
        break;
      }

      case 'recency': {
        rawResult = {
          dayLandings: inputData.dayLandings ?? 3,
          nightLandings: inputData.nightLandings ?? 1
        };
        break;
      }

      case 'standby': {
        const ClassObj = StandbyEngineModule.StandbyFDPEngine || StandbyEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateStandbyFDP === 'function') {
          rawResult = ClassObj.calculateStandbyFDP({
            standbyStartISO: inputData.startTime || '2026-10-25T06:00:00Z',
            calloutTimestampISO: inputData.reportTime || '2026-10-25T13:30:00Z',
            isHomeStandby: toolsState.standbyLocation === 'HOME'
          });
        }
        break;
      }

      case 'max-fdp': {
        const ClassObj = MaxFdpEngineModule.MaxFDPEngine || MaxFdpEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateMaxFDP === 'function') {
          rawResult = ClassObj.calculateMaxFDP({
            reportTimestampISO: inputData.reportTime || '2026-10-25T06:00:00Z',
            sectorsPlanned: inputData.sectors || 2,
            isAcclimatised: inputData.isAcclimatised ?? true,
            standbyDeductionHours: toolsState.pipelinedStandbyDeduction || 0
          });
        }
        break;
      }

      case 'pre-flight-rest': {
        const ClassObj = PreFlightRestEngineModule.PreFlightRestEngine || PreFlightRestEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateMinRest === 'function') {
          rawResult = ClassObj.calculateMinRest({
            precedingDutyHours: inputData.dutyHours || 11.5,
            isHomeBase: inputData.location === 'HOME',
            outstationTravelMinutes: inputData.travelMinutes || 0,
            isSequenceProtected: inputData.sequenceProtected || false
          });
        }
        break;
      }

      case 'cumulative': {
        const ClassObj = CumulativeEngineModule.CumulativeHoursEngine || CumulativeEngineModule.default;
        if (ClassObj && typeof ClassObj.calculateCumulativeBudget === 'function') {
          rawResult = ClassObj.calculateCumulativeBudget({
            duty7Days: inputData.duty7Days || 42.25,
            duty14Days: inputData.duty14Days || 84.5,
            duty28Days: inputData.duty28Days || 162.0,
            flight28Days: inputData.flight28Days || 82.5,
            flight12Months: inputData.flight12Months || 780.0
          });
        }
        break;
      }

      case 'caam-ftl1': {
        rawResult = CaamFtl1Module.createDefaultFormState();
        break;
      }
    }
  } catch (err) {
    console.warn(`[runToolCalculation] Error calculating ${toolType}:`, err);
  }

  toolsState.lastCalculationResults[toolType] = rawResult;
  return rawResult;
}

/**
 * Render Normalized Result onto the Fixed 4-Slot Output Card
 */
export function renderNormalizedOutput(normalized) {
  if (!normalized) return;

  const heroEl = document.getElementById('output-slot-1-hero');
  const badgeEl = document.getElementById('output-hero-badge');
  const titleEl = document.getElementById('output-hero-title');
  const subtitleEl = document.getElementById('output-hero-subtitle');
  const timestampEl = document.getElementById('output-hero-timestamp');

  const clockLabelEl = document.getElementById('output-clock-label');
  const clockValueEl = document.getElementById('output-clock-value');
  const clockPillEl = document.getElementById('output-clock-pill');

  const gridEl = document.getElementById('output-slot-3-grid');
  const auditTextEl = document.getElementById('output-audit-text');
  const ctaContainerEl = document.getElementById('output-cta-container');

  // Slot 1: Hero Banner
  if (heroEl && normalized.statusClass) {
    heroEl.className = `p-4 transition-colors duration-300 ${normalized.statusClass}`;
  }
  if (badgeEl) badgeEl.innerText = normalized.statusBadge || 'CLEARED';
  if (titleEl) titleEl.innerText = normalized.headlineTitle || 'CALCULATOR';
  if (subtitleEl) subtitleEl.innerText = normalized.headlineValue ? `Current Value: ${normalized.headlineValue}` : 'All limits compliant';
  
  if (timestampEl) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    timestampEl.innerText = `Computed ${hh}:${mm} ${toolsState.masterTimezone}`;
  }

  // Slot 2: Target Clock
  if (clockLabelEl) clockLabelEl.innerText = normalized.targetClockLabel || 'Next Expiry / Target Deadline:';
  if (clockValueEl) clockValueEl.innerText = normalized.targetClockValue || '--:--';

  // Slot 3: 2x2 Breakdown Grid
  if (gridEl && Array.isArray(normalized.breakdownGrid)) {
    const items = normalized.breakdownGrid.slice(0, 4);
    for (let i = 0; i < 4; i++) {
      const item = items[i] || { label: 'METRIC', value: '--' };
      const lblEl = document.getElementById(`grid-label-${i+1}`);
      const valEl = document.getElementById(`grid-value-${i+1}`);
      if (lblEl) lblEl.innerText = item.label;
      if (valEl) valEl.innerText = item.value;
    }
  }

  // Slot 4: Audit & Actions
  if (auditTextEl && Array.isArray(normalized.auditNotes)) {
    auditTextEl.innerText = normalized.auditNotes.join('. ');
  }

  if (ctaContainerEl) {
    if (Array.isArray(normalized.actions) && normalized.actions.length > 0) {
      ctaContainerEl.innerHTML = normalized.actions.map((act, idx) => {
        const isPrimary = idx === 0;
        const btnClass = isPrimary 
          ? 'flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all text-center cursor-pointer'
          : 'py-2 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-center cursor-pointer';
        return `<button type="button" data-action="${act.type}" class="${btnClass}">${act.label}</button>`;
      }).join('');
    } else {
      ctaContainerEl.innerHTML = '';
    }
  }
}

/**
 * UI State Controllers
 */

export function switchToolCategory(cat) {
  toolsState.activeCategory = cat;
  
  const paneQuals = document.getElementById('cat-pane-qualifications');
  const paneDuty = document.getElementById('cat-pane-dutyrest');
  const btnQuals = document.getElementById('cat-tab-qualifications');
  const btnDuty = document.getElementById('cat-tab-dutyrest');

  if (cat === 'qualifications') {
    if (paneQuals) paneQuals.classList.remove('hidden');
    if (paneDuty) paneDuty.classList.add('hidden');
    if (btnQuals) {
      btnQuals.className = 'cat-tab-btn active py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-md cursor-pointer';
    }
    if (btnDuty) {
      btnDuty.className = 'cat-tab-btn py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';
    }
    switchActiveTool('tool-medical');
  } else {
    if (paneQuals) paneQuals.classList.add('hidden');
    if (paneDuty) paneDuty.classList.remove('hidden');
    if (btnDuty) {
      btnDuty.className = 'cat-tab-btn active py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-md cursor-pointer';
    }
    if (btnQuals) {
      btnQuals.className = 'cat-tab-btn py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';
    }
    switchActiveTool('tool-standby');
  }
}

export function switchActiveTool(toolId) {
  toolsState.activeToolId = toolId;

  // Hide all tool cards inside wrappers
  const allCards = document.querySelectorAll('.tool-card');
  allCards.forEach(card => card.classList.add('hidden'));

  // Show target card
  const targetCard = document.getElementById(toolId);
  if (targetCard) targetCard.classList.remove('hidden');

  // Update pills styling
  const allPills = document.querySelectorAll('.subtab-pill');
  allPills.forEach(pill => {
    pill.className = 'subtab-pill flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';
  });

  // Highlight active pill
  let pillId = '';
  let toolType = '';
  switch (toolId) {
    case 'tool-medical': pillId = 'pill-tool-medical'; toolType = 'medical'; break;
    case 'tool-ppc': pillId = 'pill-tool-ppc'; toolType = 'ppc'; break;
    case 'tool-recurrent': pillId = 'pill-tool-recurrent'; toolType = 'recurrent'; break;
    case 'tool-recency': pillId = 'pill-tool-recency'; toolType = 'recency'; break;
    case 'tool-standby': pillId = 'pill-tool-standby'; toolType = 'standby'; break;
    case 'tool-maxfdp': pillId = 'pill-tool-maxfdp'; toolType = 'max-fdp'; break;
    case 'tool-preflight': pillId = 'pill-tool-preflight'; toolType = 'pre-flight-rest'; break;
    case 'tool-cumulative': pillId = 'pill-tool-cumulative'; toolType = 'cumulative'; break;
  }

  const activePill = document.getElementById(pillId);
  if (activePill) {
    activePill.className = 'subtab-pill active flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-sky-500/40 bg-sky-500/20 text-sky-400 dark:text-sky-300 cursor-pointer';
  }

  // Run calculation & render output
  if (toolType) {
    const raw = runToolCalculation(toolType, {});
    const norm = normalizeOutput(toolType, raw);
    renderNormalizedOutput(norm);
  }
}

export function setMasterTimezone(tz) {
  toolsState.masterTimezone = tz;
  
  const btnUtc = document.getElementById('tz-btn-utc');
  const btnLocal = document.getElementById('tz-btn-local');

  if (tz === 'UTC') {
    if (btnUtc) btnUtc.className = 'px-2 py-1 rounded-lg text-[10px] font-bold transition-colors bg-blue-600 text-white cursor-pointer';
    if (btnLocal) btnLocal.className = 'px-2 py-1 rounded-lg text-[10px] font-bold transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer';
  } else {
    if (btnLocal) btnLocal.className = 'px-2 py-1 rounded-lg text-[10px] font-bold transition-colors bg-blue-600 text-white cursor-pointer';
    if (btnUtc) btnUtc.className = 'px-2 py-1 rounded-lg text-[10px] font-bold transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer';
  }

  // Re-render active tool output with updated timezone label
  switchActiveTool(toolsState.activeToolId);
}

export function setStandbyLocation(loc) {
  toolsState.standbyLocation = loc;
  
  const btnHome = document.getElementById('btn-stby-loc-home');
  const btnAirport = document.getElementById('btn-stby-loc-airport');

  if (loc === 'HOME') {
    if (btnHome) btnHome.className = 'py-2 px-3 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-xs cursor-pointer';
    if (btnAirport) btnAirport.className = 'py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer';
  } else {
    if (btnAirport) btnAirport.className = 'py-2 px-3 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-xs cursor-pointer';
    if (btnHome) btnHome.className = 'py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer';
  }

  switchActiveTool('tool-standby');
}

/**
 * Recurrent Course Modal Overlay Handlers
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
  toolsState.recurrentCourseCategory = category;

  const inputEl = document.getElementById('input-recurrent-course');
  if (inputEl) inputEl.value = key;

  const lblEl = document.getElementById('recurrent-course-label');
  if (lblEl) lblEl.innerText = name;

  const sublblEl = document.getElementById('recurrent-course-sublabel');
  if (sublblEl) sublblEl.innerText = category;

  closeRecurrentCourseModal();
  switchActiveTool('tool-recurrent');
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

export function resetToolInputs(toolId) {
  switch (toolId) {
    case 'tool-medical': {
      const examDate = document.getElementById('input-med-exam-date');
      if (examDate) examDate.value = '';
      break;
    }
    case 'tool-ppc': {
      const cDate = document.getElementById('input-ppc-conduct-date');
      const eDate = document.getElementById('input-ppc-expiry-date');
      if (cDate) cDate.value = '';
      if (eDate) eDate.value = '';
      break;
    }
    case 'tool-recurrent': {
      selectRecurrentCourse('LINE_CHECK', 'Line Check (LC)', 'Annual (12 Calendar Months)');
      const rDate = document.getElementById('input-recurrent-conduct-date');
      if (rDate) rDate.value = '';
      break;
    }
    case 'tool-recency': {
      const dayEl = document.getElementById('input-recency-day');
      const nightEl = document.getElementById('input-recency-night');
      if (dayEl) dayEl.value = '3';
      if (nightEl) nightEl.value = '1';
      break;
    }
    case 'tool-standby': {
      setStandbyLocation('HOME');
      break;
    }
  }
  switchActiveTool(toolId);
}

export function openFtl1WizardModal() {
  const modal = document.getElementById('ftl1-wizard-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeFtl1WizardModal() {
  const modal = document.getElementById('ftl1-wizard-modal');
  if (modal) modal.classList.add('hidden');
}

export function initToolsModule() {
  return true;
}

// Window global bindings for inline onclick attributes in HTML
if (typeof window !== 'undefined') {
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
}
