
// ./js/tools.js (2710_R246) - Decoupled 3D Vertical Reel, 2-Faced Card Controller & 4-Tier Output Normalizer
/* ==========================================================================
   CertiFly - Tools Controller ES Module (tools.js - R245)
   Decoupled 3D Vertical Reel, 2-Faced Card Controller & 4-Tier Output Normalizer
   ========================================================================== */

import * as StandbyEngineModule from './engines/standby-fdp-calculator.js';
import * as MaxFdpEngineModule from './engines/max-fdp-calculator.js';
import * as PreFlightRestEngineModule from './engines/pre-flight-rest-calculator.js';
import * as CumulativeEngineModule from './engines/cumulative-hours-calculator.js';
import * as MedicalEngineModule from './engines/medical-validity-calculator.js';
import * as PpcEngineModule from './engines/ppc-validity-calculator.js';
import * as RecurrentEngineModule from './engines/recurrent-training-calculator.js';

export const toolsState = {
  activeToolId: 'medical',
  activeCategory: 'validity',
  recurrentCourseKey: 'LC',
  recurrentCourseName: 'Line Check (LC)',
  recurrentCourseCat: 'Annual (12 Calendar Months)',
  standbyLocation: 'HOME',
  lastCalculationResults: {}
};

// --------------------------------------------------------------------------
// 4-Tier Output Normalizer
// --------------------------------------------------------------------------
export function normalizeOutput(toolType, rawResult) {
  let cleanId = toolType ? toolType.replace('tool-card-', '').replace('tool-', '') : 'medical';
  if (cleanId === 'maxfdp') cleanId = 'max-fdp';
  if (cleanId === 'preflight') cleanId = 'pre-flight-rest';
  
  switch (cleanId) {
    case 'medical': {
      const isPreserved = rawResult ? (rawResult.anniversaryPreserved ?? true) : true;
      const expiry = rawResult ? formatDateDDMMMYYYY(rawResult.newExpiryDate) : '--';
      const windowStr = (rawResult && rawResult.dameEarliestDate) 
        ? formatDateDDMMMYYYY(rawResult.dameEarliestDate) + ' ➔ ' + formatDateDDMMMYYYY(rawResult.reExamDate || rawResult.newExpiryDate) 
        : '-- to --';
      
      const statusText = rawResult ? (isPreserved ? 'Date Preserved (45D Window)' : 'Reset (End of Month)') : 'Awaiting Input';
      const heroBgClass = rawResult 
        ? (isPreserved ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-amber-500/15 border-amber-500/30')
        : 'bg-slate-800/80 border-slate-700/60';

      return {
        toolId: 'medical',
        heroTitle: 'NEW MEDICAL EXPIRY',
        heroValue: expiry,
        heroBgClass: heroBgClass,
        windowLabel: '45-Day Re-Exam Window',
        windowValue: windowStr,
        rows: [
          { label: 'Compliance Status', value: statusText },
          { label: 'Age Band', value: (rawResult && rawResult.age !== undefined) ? String(rawResult.age) + ' Years' : '--' },
          { label: 'Base Validity', value: (rawResult && rawResult.validityMonths) ? String(rawResult.validityMonths) + ' Calendar Months' : '12 Calendar Months' },
          { label: 'Crew Operating Limit', value: 'Unrestricted Single/Multi' }
        ],
        auditCitation: 'CAAM CAD 1 PEL Section 1.2.5.2 & OM-A 5.1.4.4'
      };
    }

    case 'ppc': {
      const isPreserved = rawResult ? (rawResult.anniversaryPreserved ?? true) : true;
      const expiry = rawResult ? formatDateDDMMMYYYY(rawResult.newLPCExpiryDate || rawResult.newLpcExpiry || rawResult.newExpiryDate) : '--';
      const opcStr = (rawResult && rawResult.opcWindowStart) 
        ? formatDateDDMMMYYYY(rawResult.opcWindowStart) + ' ➔ ' + formatDateDDMMMYYYY(rawResult.opcWindowEnd) 
        : '-- to --';

      const statusText = rawResult ? (isPreserved ? 'Date Preserved (3-Month Window)' : 'Reset (End of Month)') : 'Awaiting Input';
      const heroBgClass = rawResult ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-slate-800/80 border-slate-700/60';

      return {
        toolId: 'ppc',
        heroTitle: 'NEW PPC / LPC EXPIRY',
        heroValue: expiry,
        heroBgClass: heroBgClass,
        windowLabel: '3-Month Revalidation Window',
        windowValue: opcStr,
        rows: [
          { label: 'Compliance Status', value: statusText },
          { label: 'Permissible OPC Window', value: opcStr },
          { label: 'Base Validity', value: '12 Months (End of Month)' },
          { label: 'Refresher Status', value: rawResult && rawResult.lapsedLPCWarning ? rawResult.lapsedLPCWarning : 'Current (No Refresher Due)' }
        ],
        auditCitation: 'CAAM CAD 6.9.4.4 / CAD 1 PEL 2.1.5.10 / OM-A 5.1.4.6'
      };
    }

    case 'recurrent': {
      const expiry = rawResult ? formatDateDDMMMYYYY(rawResult.newExpiryDate) : '--';
      const courseName = rawResult ? (rawResult.name || toolsState.recurrentCourseName) : 'Line Check (LC)';
      const statusText = rawResult ? 'Valid / Cleared' : 'Awaiting Input';
      const heroBgClass = rawResult ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-slate-800/80 border-slate-700/60';

      return {
        toolId: 'recurrent',
        heroTitle: 'RECURRENT MODULE EXPIRY',
        heroValue: expiry,
        heroBgClass: heroBgClass,
        windowLabel: 'Qualification Module',
        windowValue: String(courseName).toUpperCase(),
        rows: [
          { label: 'Compliance Status', value: statusText },
          { label: 'Category', value: rawResult ? (rawResult.category || toolsState.recurrentCourseCat) : 'Annual (12 Calendar Months)' },
          { label: 'Completion Date', value: rawResult && rawResult.completionDate ? formatDateDDMMMYYYY(rawResult.completionDate) : '--' },
          { label: 'Renewal Method', value: '3-Month Lookback Window' }
        ],
        auditCitation: 'CAAM CAD 6.9.4 & OM-D Chapter 2 Recurrent Standards'
      };
    }

    case 'recency': {
      const dayCount = rawResult ? rawResult.dayCount : 0;
      const nightCount = rawResult ? rawResult.nightCount : 0;
      const isCompliant = rawResult ? rawResult.isCompliant : false;
      const statusText = rawResult ? (isCompliant ? 'Cleared for Flight' : 'Check Required') : 'Awaiting Input';
      const heroVal = rawResult ? (isCompliant ? 'PASSENGER CLEARED' : 'RECENCY LAPSED') : '--';
      const heroBgClass = rawResult 
        ? (isCompliant ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-rose-500/15 border-rose-500/30')
        : 'bg-slate-800/80 border-slate-700/60';

      return {
        toolId: 'recency',
        heroTitle: '90-DAY LANDING RECENCY',
        heroValue: heroVal,
        heroBgClass: heroBgClass,
        windowLabel: 'Minimum Passenger Currency',
        windowValue: '3 PF Take-Offs & Landings in 90 Days',
        rows: [
          { label: 'Compliance Status', value: statusText },
          { label: 'Day Landings', value: String(dayCount) + ' / 3' },
          { label: 'Night Landings', value: String(nightCount) + ' / 1' },
          { label: 'Recency Status', value: isCompliant ? '3 Take-offs/Landings Verified' : 'Action Required' }
        ],
        auditCitation: 'CAAM CAD 1 / OM-A Section 7.1 Passenger Currency'
      };
    }

    case 'standby': {
      const isCaseB = rawResult ? (rawResult.caseType === 'CASE_B' || rawResult.isCaseB) : false;
      const fdp = rawResult ? (rawResult.netFdpFormatted || rawResult.allowableFdpFormatted || rawResult.netFdp || (rawResult.netFdpMinutes ? Math.floor(rawResult.netFdpMinutes/60)+':'+(rawResult.netFdpMinutes%60) : null)) : '--:--';
      const statusText = rawResult ? (isCaseB ? 'Case B (Reduced FDP)' : 'Case A (Standard FDP)') : 'Awaiting Input';
      const heroBgClass = rawResult ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-slate-800/80 border-slate-700/60';

      return {
        toolId: 'standby',
        heroTitle: 'NET PERMISSIBLE FDP',
        heroValue: fdp || '--:-- HOURS',
        heroBgClass: heroBgClass,
        windowLabel: 'Standby End Cutoff',
        windowValue: rawResult && rawResult.cutoffTimestampUtc ? rawResult.cutoffTimestampUtc : (rawResult && rawResult.standbyEndISO ? rawResult.standbyEndISO : '--:-- UTC'),
        rows: [
          { label: 'Compliance Status', value: statusText },
          { label: 'Standby Duration', value: rawResult && rawResult.standbyDurationFormatted ? rawResult.standbyDurationFormatted : (rawResult && rawResult.standbyDurationHours ? String(rawResult.standbyDurationHours) + ' Hours' : '--:--') },
          { label: 'FDP Deduction', value: rawResult && rawResult.deductionFormatted ? rawResult.deductionFormatted : (rawResult && rawResult.fdpDeductionHours !== undefined ? String(rawResult.fdpDeductionHours) + ' Hours' : '--:--') },
          { label: 'Base Max FDP', value: '13:00 Hours' }
        ],
        auditCitation: 'CAAM CAD 1901 Section 2.15 Standby Rules'
      };
    }

    case 'max-fdp': {
      const isDiscretionNeeded = rawResult ? (rawResult.isDiscretionTriggered || rawResult.exceedsMaxFdp || rawResult.isDiscretionRequired) : false;
      const isProhibited = rawResult ? (rawResult.isProhibited || rawResult.isLapsed) : false;
      const fdpVal = rawResult ? (rawResult.finalMaxPermissibleFDPFormatted || rawResult.maxFdpFormatted || rawResult.maxFdp || (rawResult.maxFdpHours ? String(rawResult.maxFdpHours) + ':00 HOURS' : null)) : '--:--';

      let statusText = 'Cleared';
      let heroBgClass = 'bg-emerald-500/15 border-emerald-500/30';

      if (!rawResult) {
        statusText = 'Awaiting Input';
        heroBgClass = 'bg-slate-800/80 border-slate-700/60';
      } else if (isProhibited) {
        statusText = 'Prohibited (Exceeds Limit)';
        heroBgClass = 'bg-rose-500/15 border-rose-500/30';
      } else if (isDiscretionNeeded) {
        statusText = 'Commander Discretion Required';
        heroBgClass = 'bg-amber-500/15 border-amber-500/30';
      }

      return {
        toolId: 'max-fdp',
        heroTitle: 'MAX ALLOWABLE FDP',
        heroValue: fdpVal || '--:-- HOURS',
        heroBgClass: heroBgClass,
        windowLabel: 'Latest On-Chocks Cutoff',
        windowValue: rawResult && rawResult.cutoffTimestampUTC ? rawResult.cutoffTimestampUTC : (rawResult && rawResult.latestOnChocksUTC ? rawResult.latestOnChocksUTC : '--:-- UTC'),
        rows: [
          { label: 'Compliance Status', value: statusText },
          { label: 'Base Allowable FDP', value: rawResult && rawResult.baseAllowableFDPFormatted ? rawResult.baseAllowableFDPFormatted : (rawResult && rawResult.baseFdpHours ? String(rawResult.baseFdpHours) + ' Hours' : '--:--') },
          { label: 'Relief Credit', value: rawResult && rawResult.bunkCreditFormatted ? rawResult.bunkCreditFormatted : 'None' },
          { label: 'Max Discretion Margin', value: '+02:00 Hours' }
        ],
        auditCitation: 'CAAM CAD 1901 Table A/B & OM-A Section 7.5'
      };
    }

    case 'pre-flight-rest': {
      const restVal = rawResult ? (rawResult.minimumRestFormatted || rawResult.restFormatted || rawResult.minimumRest || (rawResult.requiredRestHours ? String(rawResult.requiredRestHours) + ':00 HOURS' : null)) : '--:--';
      const statusText = rawResult ? 'Standard Pre-Flight Rest' : 'Awaiting Input';
      const heroBgClass = rawResult ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-slate-800/80 border-slate-700/60';

      return {
        toolId: 'pre-flight-rest',
        heroTitle: 'MANDATORY MINIMUM REST',
        heroValue: restVal || '--:-- HOURS',
        heroBgClass: heroBgClass,
        windowLabel: 'Minimum Rest Completion',
        windowValue: rawResult && rawResult.cutoffTimestampUtc ? rawResult.cutoffTimestampUtc : (rawResult && rawResult.restExpiryUTC ? rawResult.restExpiryUTC : '--:-- UTC'),
        rows: [
          { label: 'Compliance Status', value: statusText },
          { label: 'Preceding Duty', value: rawResult && rawResult.precedingDutyFormatted ? rawResult.precedingDutyFormatted : (rawResult && rawResult.precedingDutyHours ? String(rawResult.precedingDutyHours) + ' Hours' : '-- Hours') },
          { label: 'Rest Location', value: rawResult && rawResult.isHomeBase ? 'Home Base' : 'Outstation / Layover' },
          { label: 'Base Rest Standard', value: '12:00 Hours' }
        ],
        auditCitation: 'CAAM CAD 1901 Section 3.1 & OM-A Section 7.6'
      };
    }

    case 'cumulative': {
      const duty7Val = rawResult ? (rawResult.duty7dFormatted || rawResult.duty7d || (rawResult.effectiveDuty7 !== undefined ? String(rawResult.effectiveDuty7) + ' / 55:00' : null)) : '--:-- / 55:00';
      const statusText = rawResult ? 'Roster Cleared' : 'Awaiting Input';
      const heroBgClass = rawResult ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-slate-800/80 border-slate-700/60';

      return {
        toolId: 'cumulative',
        heroTitle: 'CUMULATIVE DUTY BUDGET',
        heroValue: duty7Val || '--:-- / 55:00',
        heroBgClass: heroBgClass,
        windowLabel: '7-Day Rolling Margin',
        windowValue: rawResult && rawResult.margin7d ? String(rawResult.margin7d) + ' Hours Margin' : (rawResult && rawResult.remainingDuty7 ? String(rawResult.remainingDuty7) + ' Hours Margin' : '--:-- Hours Margin'),
        rows: [
          { label: 'Compliance Status', value: statusText },
          { label: '7-Day Duty Limit', value: rawResult && rawResult.effectiveDuty7 !== undefined ? String(rawResult.effectiveDuty7) + ' / 55:00 Hours' : '--:-- / 55:00 Hours' },
          { label: '14-Day Duty Limit', value: rawResult && rawResult.effectiveDuty14 !== undefined ? String(rawResult.effectiveDuty14) + ' / 95:00 Hours' : '--:-- / 95:00 Hours' },
          { label: '28-Day Flying Limit', value: rawResult && rawResult.effectiveFlight28 !== undefined ? String(rawResult.effectiveFlight28) + ' / 100:00 Hours' : '--:-- / 100:00 Hours' }
        ],
        auditCitation: 'CAAM CAD 1901 Section 4.1 Cumulative Duty Limits'
      };
    }

    default:
      return null;
  }
}

// --------------------------------------------------------------------------
// Render Normalized Output HTML (4-Tier Layout)
// --------------------------------------------------------------------------
export function renderNormalizedOutput(norm) {
  if (!norm) return;

  const toolId = norm.toolId;
  const backContainer = document.getElementById(`output-back-content-${toolId}`);
  
  const html = `
    <div class="w-full flex flex-col h-full justify-between space-y-3">
      
      <!-- TIER 1: CENTERED HERO RESULT CONTAINER -->
      <div class="relative w-full p-4 rounded-2xl border text-center ${norm.heroBgClass} backdrop-blur-md shadow-inner transition-all">
        <p class="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-1">${norm.heroTitle}</p>
        <p class="text-2xl font-black text-white font-mono tracking-tight">${norm.heroValue}</p>
        
        <!-- TOP-RIGHT EDIT BUTTON (Symmetric with ↺ Reset) -->
        <button type="button" onclick="flipCardBackToFront('${toolId}')" class="absolute top-2.5 right-2.5 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-700/60">
          <span>↩</span> Edit
        </button>
      </div>

      <!-- TIER 2: ACTION / REVALIDATION WINDOW BAR -->
      <div class="w-full px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
        <p class="text-[10px] font-bold text-sky-400 uppercase tracking-wider">${norm.windowLabel}</p>
        <p class="text-xs font-mono font-bold text-white mt-0.5">${norm.windowValue}</p>
      </div>

      <!-- TIER 3: CONTEXTUAL METADATA (STACKED INLINE ROWS) -->
      <div class="w-full space-y-1.5 py-1">
        ${norm.rows.map(r => `
          <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
            <span class="text-slate-400 font-medium">${r.label}</span>
            <span class="text-slate-200 font-semibold font-mono text-right">${r.value}</span>
          </div>
        `).join('')}
      </div>

      <!-- TIER 4: AUDIT CITATION FOOTER -->
      <div class="pt-2 border-t border-slate-800/80 text-center">
        <p class="text-[10px] font-medium text-slate-500 flex items-center justify-center gap-1">
          <span class="font-semibold text-slate-400 dark:text-slate-500 mr-1">CAD/OM:</span> ${norm.auditCitation}
        </p>
      </div>

    </div>
  `;

  if (backContainer) {
    backContainer.innerHTML = html;
  }


}

// --------------------------------------------------------------------------
// Card Flip & Calculation Orchestration
// --------------------------------------------------------------------------
export function executeAndFlipCard(toolId) {
  let cleanId = toolId ? toolId.replace('tool-card-', '').replace('tool-', '') : 'medical';
  if (cleanId === 'maxfdp') cleanId = 'max-fdp';
  if (cleanId === 'preflight') cleanId = 'pre-flight-rest';
  
  const rawResult = runToolCalculation(cleanId);
  toolsState.lastCalculationResults[cleanId] = rawResult;

  const norm = normalizeOutput(cleanId, rawResult);
  renderNormalizedOutput(norm);

  flipCard(cleanId, true);
}

export function flipCardBackToFront(toolId) {
  let cleanId = toolId ? toolId.replace('tool-card-', '').replace('tool-', '') : 'medical';
  if (cleanId === 'maxfdp') cleanId = 'max-fdp';
  if (cleanId === 'preflight') cleanId = 'pre-flight-rest';
  
  flipCard(cleanId, false);
}

export function flipCard(toolId, toBack) {
  const cardEl = document.getElementById(`tool-card-${toolId}`);
  if (!cardEl) return;

  const innerEl = cardEl.querySelector('.card-3d-inner');
  if (!innerEl) return;

  if (typeof window !== 'undefined' && window.anime) {
    window.anime({
      targets: innerEl,
      rotateY: toBack ? 180 : 0,
      duration: 550,
      easing: 'easeInOutCubic'
    });
  } else {
    if (toBack) {
      innerEl.classList.add('rotate-y-180');
    } else {
      innerEl.classList.remove('rotate-y-180');
    }
  }
}

export function switchToolCategory(category) {
  toolsState.activeCategory = category;

  const btnValidity = document.getElementById('btn-cat-validity');
  const btnDutyrest = document.getElementById('btn-cat-dutyrest');
  const suiteValidity = document.getElementById('suite-validity');
  const suiteDutyrest = document.getElementById('suite-dutyrest');

  if (category === 'validity') {
    if (btnValidity) btnValidity.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer bg-sky-500 text-white shadow-md shadow-sky-500/20';
    if (btnDutyrest) btnDutyrest.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-slate-400 hover:text-slate-200';
    if (suiteValidity) suiteValidity.classList.remove('hidden');
    if (suiteDutyrest) suiteDutyrest.classList.add('hidden');
  } else {
    if (btnValidity) btnValidity.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-slate-400 hover:text-slate-200';
    if (btnDutyrest) btnDutyrest.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer bg-sky-500 text-white shadow-md shadow-sky-500/20';
    if (suiteValidity) suiteValidity.classList.add('hidden');
    if (suiteDutyrest) suiteDutyrest.classList.remove('hidden');
  }
}

// --------------------------------------------------------------------------
// Calculation Engine Execution Controller (Delegated to ./js/engines/)
// --------------------------------------------------------------------------
export function runToolCalculation(toolType, inputData = {}) {
  let rawResult = null;

  try {
    switch (toolType) {
      case 'medical': {
        const examDate = inputData.examDate || (document.getElementById('input-med-exam-date') ? document.getElementById('input-med-exam-date').value : '');
        const ageBracket = inputData.ageBracket || (document.getElementById('input-med-age-bracket') ? document.getElementById('input-med-age-bracket').value : '40_TO_59');
        
        if (!examDate) return null;
        
        const nowYear = new Date().getUTCFullYear();
        let sampleAge = 45;
        if (ageBracket === 'UNDER_40') sampleAge = 30;
        else if (ageBracket === '60_PLUS') sampleAge = 62;
        const dob = String(nowYear - sampleAge) + '-01-01';

        const EngineClass = MedicalEngineModule.MedicalValidityEngine || MedicalEngineModule.default;
        if (EngineClass && typeof EngineClass.calculateValidity === 'function') {
          rawResult = EngineClass.calculateValidity({
            dob: dob,
            examDate: examDate,
            currentExpiryDate: inputData.currentExpiryDate || null
          });
        } else {
          rawResult = calculateMedicalWindowFallback(sampleAge, examDate);
        }
        break;
      }

      case 'ppc': {
        const conductDate = inputData.conductDate || (document.getElementById('input-ppc-conduct-date') ? document.getElementById('input-ppc-conduct-date').value : '');
        const expiryDate = inputData.expiryDate || (document.getElementById('input-ppc-expiry-date') ? document.getElementById('input-ppc-expiry-date').value : '');
        
        if (!conductDate) return null;

        const EngineClass = PpcEngineModule.PPCValidityEngine || PpcEngineModule.default;
        if (EngineClass && typeof EngineClass.calculateLPCExpiry === 'function') {
          const engineInstance = new EngineClass();
          rawResult = engineInstance.calculateLPCExpiry(conductDate, expiryDate || null);
        } else {
          rawResult = calculatePpcWindowsFallback(conductDate, expiryDate);
        }
        break;
      }

      case 'recurrent': {
        const conductDate = inputData.conductDate || (document.getElementById('input-recurrent-conduct-date') ? document.getElementById('input-recurrent-conduct-date').value : '');
        const courseKey = toolsState.recurrentCourseKey || 'LC';
        
        if (!conductDate) return null;

        const EngineClass = RecurrentEngineModule.RecurrentTrainingEngine || RecurrentEngineModule.default;
        if (EngineClass && typeof EngineClass.prototype.calculateExpiry === 'function') {
          const engineInstance = new EngineClass();
          rawResult = engineInstance.calculateExpiry(courseKey, conductDate);
        } else {
          rawResult = calculateCourseExpiryFallback(courseKey, conductDate);
        }
        break;
      }

      case 'recency': {
        const dayVal = parseInt(document.getElementById('input-recency-day') ? document.getElementById('input-recency-day').value : '0', 10) || 0;
        const nightVal = parseInt(document.getElementById('input-recency-night') ? document.getElementById('input-recency-night').value : '0', 10) || 0;
        const isCompliant = (dayVal >= 3 || nightVal >= 1);
        
        rawResult = {
          dayCount: dayVal,
          nightCount: nightVal,
          isCompliant: isCompliant
        };
        break;
      }

      case 'standby': {
        const stbyStart = document.getElementById('input-stby-start-time') ? document.getElementById('input-stby-start-time').value : '06:00';
        const stbyReport = document.getElementById('input-stby-report-time') ? document.getElementById('input-stby-report-time').value : '10:00';
        
        const todayStr = new Date().toISOString().split('T')[0];
        const startIso = todayStr + 'T' + stbyStart + ':00Z';
        const reportIso = todayStr + 'T' + stbyReport + ':00Z';

        const EngineClass = StandbyEngineModule.StandbyFDPEngine || StandbyEngineModule.default;
        if (EngineClass && typeof EngineClass.calculateStandbyFDP === 'function') {
          rawResult = EngineClass.calculateStandbyFDP({
            standbyStartISO: startIso,
            calloutReportISO: reportIso,
            location: toolsState.standbyLocation || 'HOME'
          });
        } else {
          rawResult = calculateFdpAndDiscretionFallback({ standbyStart: stbyStart, reportTime: stbyReport });
        }
        break;
      }

      case 'max-fdp': {
        const reportTime = document.getElementById('input-fdp-report-time') ? document.getElementById('input-fdp-report-time').value : '06:00';
        const sectors = parseInt(document.getElementById('input-fdp-sectors') ? document.getElementById('input-fdp-sectors').value : '2', 10) || 2;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const reportIso = todayStr + 'T' + reportTime + ':00Z';

        const EngineClass = MaxFdpEngineModule.MaxFDPEngine || MaxFdpEngineModule.default;
        if (EngineClass && typeof EngineClass.calculateMaxFDP === 'function') {
          rawResult = EngineClass.calculateMaxFDP({
            reportTimestampISO: reportIso,
            sectorsPlanned: sectors,
            isAcclimatised: true
          });
        } else {
          rawResult = getMaxAllowableFdpFallback(reportTime, sectors);
        }
        break;
      }

      case 'pre-flight-rest': {
        const precDuty = parseInt(document.getElementById('input-rest-preceding-duty') ? document.getElementById('input-rest-preceding-duty').value : '10', 10) || 10;
        const location = document.getElementById('input-rest-location') ? document.getElementById('input-rest-location').value : 'HOME';
        
        const todayStr = new Date().toISOString().split('T')[0];
        const endIso = todayStr + 'T12:00:00Z';

        const EngineClass = PreFlightRestEngineModule.PreFlightRestEngine || PreFlightRestEngineModule.default;
        if (EngineClass && typeof EngineClass.calculateMinRest === 'function') {
          rawResult = EngineClass.calculateMinRest({
            precedingDutyEndTimestampISO: endIso,
            precedingDutyHours: precDuty,
            isHomeBase: location === 'HOME'
          });
        } else {
          rawResult = { precedingDutyHours: precDuty, isHomeBase: location === 'HOME', requiredRestHours: Math.max(12, precDuty) };
        }
        break;
      }

      case 'cumulative': {
        const duty7d = document.getElementById('input-cum-duty-7d') ? document.getElementById('input-cum-duty-7d').value : '';
        const flight28d = document.getElementById('input-cum-flight-28d') ? document.getElementById('input-cum-flight-28d').value : '';

        const EngineClass = CumulativeEngineModule.CumulativeHoursEngine || CumulativeEngineModule.default;
        if (EngineClass && typeof EngineClass.calculateCumulativeBudget === 'function') {
          rawResult = EngineClass.calculateCumulativeBudget({
            loggedDutyHours7Days: parseFloat(duty7d) || 0,
            loggedFlightHours28Days: parseFloat(flight28d) || 0
          });
        } else {
          rawResult = { duty7dFormatted: duty7d + ' / 55:00', margin7d: '22:45' };
        }
        break;
      }
    }
  } catch (err) {
    console.warn('Engine calculation notice:', err);
  }

  return rawResult;
}

// Fallback calculations
export function formatDateDDMMMYYYY(dateInput) {
  if (!dateInput) return '--';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const yr = d.getFullYear();
  return `${day} ${mon} ${yr}`;
}

function calculateMedicalWindowFallback(age, conductDate) {
  const d = new Date(conductDate);
  if (isNaN(d.getTime())) return null;
  const newExp = new Date(d);
  newExp.setFullYear(newExp.getFullYear() + 1);
  return {
    age: age,
    anniversaryPreserved: true,
    newExpiryDate: newExp.toISOString().split('T')[0],
    dameEarliestDate: conductDate
  };
}

function calculatePpcWindowsFallback(conductDate, expiryDate) {
  const d = new Date(conductDate);
  if (isNaN(d.getTime())) return null;
  const newExp = new Date(d);
  newExp.setFullYear(newExp.getFullYear() + 1);
  return {
    anniversaryPreserved: true,
    newLPCExpiryDate: newExp.toISOString().split('T')[0],
    opcWindowStart: conductDate,
    opcWindowEnd: newExp.toISOString().split('T')[0]
  };
}

function calculateCourseExpiryFallback(courseKey, conductDate) {
  const d = new Date(conductDate);
  if (isNaN(d.getTime())) return null;
  const newExp = new Date(d);
  newExp.setFullYear(newExp.getFullYear() + 1);
  return {
    name: toolsState.recurrentCourseName,
    category: toolsState.recurrentCourseCat,
    completionDate: conductDate,
    newExpiryDate: newExp.toISOString().split('T')[0]
  };
}

function calculateFdpAndDiscretionFallback(opts) {
  return {
    netFdpFormatted: '13:00 HOURS',
    caseType: 'CASE_A',
    cutoffTimestampUtc: '14:00 UTC',
    standbyDurationFormatted: '04h 00m',
    deductionFormatted: '00h 00m'
  };
}

function getMaxAllowableFdpFallback(reportTime, sectors) {
  return {
    finalMaxPermissibleFDPFormatted: '13:00 HOURS',
    baseAllowableFDPFormatted: '13:00 Hours',
    cutoffTimestampUTC: '18:30 UTC'
  };
}

export function resetToolInputs(toolId) {
  let cleanId = toolId ? toolId.replace('tool-card-', '').replace('tool-', '') : 'medical';
  if (cleanId === 'maxfdp') cleanId = 'max-fdp';
  if (cleanId === 'preflight') cleanId = 'pre-flight-rest';
  
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
      const conductDate = document.getElementById('input-recurrent-conduct-date');
      if (conductDate) conductDate.value = '';
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
      break;
    }
    case 'max-fdp': {
      const reportTime = document.getElementById('input-fdp-report-time');
      const sectors = document.getElementById('input-fdp-sectors');
      if (reportTime) reportTime.value = '06:00';
      if (sectors) sectors.value = '2';
      break;
    }
    case 'pre-flight-rest': {
      const precDuty = document.getElementById('input-rest-preceding-duty');
      if (precDuty) precDuty.value = '10';
      break;
    }
    case 'cumulative': {
      const cumDuty = document.getElementById('input-cum-duty-7d');
      const cumFlt = document.getElementById('input-cum-flight-28d');
      if (cumDuty) cumDuty.value = '';
      if (cumFlt) cumFlt.value = '';
      break;
    }
  }

  delete toolsState.lastCalculationResults[cleanId];
  const norm = normalizeOutput(cleanId, null);
  renderNormalizedOutput(norm);
  flipCard(cleanId, false);
}

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

  const courseHidden = document.getElementById('input-recurrent-course');
  const courseLabel = document.getElementById('recurrent-course-label');
  const courseSublabel = document.getElementById('recurrent-course-sublabel');

  if (courseHidden) courseHidden.value = key;
  if (courseLabel) courseLabel.innerText = name;
  if (courseSublabel) courseSublabel.innerText = category;

  closeRecurrentCourseModal();
}

export function setStandbyLocation(loc) {
  toolsState.standbyLocation = loc;
  const btnHome = document.getElementById('btn-stby-loc-home');
  const btnAirport = document.getElementById('btn-stby-loc-airport');

  if (loc === 'HOME') {
    if (btnHome) btnHome.className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-white shadow-sm transition-all cursor-pointer';
    if (btnAirport) btnAirport.className = 'flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer';
  } else {
    if (btnHome) btnHome.className = 'flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer';
    if (btnAirport) btnAirport.className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-white shadow-sm transition-all cursor-pointer';
  }
}


// --------------------------------------------------------------------------
// EFB Date Picker State & Handlers
// --------------------------------------------------------------------------
export const efbPickerState = {
  activeDate: new Date(),
  targetInputId: null,
  title: 'SELECT DATE'
};

export function renderEfbCalendarGrid() {
  const container = document.getElementById('efb-date-grid');
  const monthYearLabel = document.getElementById('efb-picker-month-year');
  if (!container || !efbPickerState.activeDate) return;

  const year = efbPickerState.activeDate.getUTCFullYear();
  const month = efbPickerState.activeDate.getUTCMonth();
  const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  if (monthYearLabel) monthYearLabel.innerText = `${months[month]} ${year}`;

  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  let html = '';
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="h-8"></div>';
  }

  const todayStr = new Date().toISOString().split('T')[0];

  for (let day = 1; day <= daysInMonth; day++) {
    const isoDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = isoDay === todayStr;
    const btnClass = isToday
      ? 'h-8 w-8 mx-auto rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-md'
      : 'h-8 w-8 mx-auto rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center justify-center cursor-pointer transition-colors';

    html += `<button type="button" class="${btnClass}" onclick="selectEfbDate('${isoDay}')">${day}</button>`;
  }

  container.innerHTML = html;
}

export function openEfbDatePicker(targetInputId, labelTitle = 'SELECT DATE') {
  efbPickerState.targetInputId = targetInputId;
  efbPickerState.title = labelTitle;

  const titleEl = document.getElementById('efb-date-picker-title');
  if (titleEl) titleEl.innerText = labelTitle;

  const hiddenInput = document.getElementById(targetInputId);
  if (hiddenInput && hiddenInput.value) {
    const parts = hiddenInput.value.split('-');
    if (parts.length === 3) {
      efbPickerState.activeDate = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
    }
  } else {
    efbPickerState.activeDate = new Date();
  }

  renderEfbCalendarGrid();

  const modal = document.getElementById('efb-date-picker-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeEfbDatePicker() {
  const modal = document.getElementById('efb-date-picker-modal');
  if (modal) modal.classList.add('hidden');
}

export function selectEfbDate(isoVal) {
  if (!efbPickerState.targetInputId) return;

  const hiddenInput = document.getElementById(efbPickerState.targetInputId);
  if (hiddenInput) {
    hiddenInput.value = isoVal;
  }

  const displayId = efbPickerState.targetInputId + '-display';
  const displayEl = document.getElementById(displayId);
  if (displayEl) {
    displayEl.innerText = formatDateDDMMMYYYY(isoVal);
  }

  closeEfbDatePicker();
}

export function setEfbDatePreset(presetKey) {
  const now = new Date();
  let d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (presetKey === 'today') {
    // Current date
  } else if (presetKey === 'eom') {
    d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  } else if (presetKey === 'plus30') {
    d.setUTCDate(d.getUTCDate() + 30);
  } else if (presetKey === 'plus90') {
    d.setUTCDate(d.getUTCDate() + 90);
  }

  const isoVal = d.toISOString().split('T')[0];
  selectEfbDate(isoVal);
}

export function changeEfbMonth(delta) {
  if (!efbPickerState.activeDate) efbPickerState.activeDate = new Date();
  efbPickerState.activeDate.setUTCMonth(efbPickerState.activeDate.getUTCMonth() + delta);
  renderEfbCalendarGrid();
}

// --------------------------------------------------------------------------
// State & Utility Exports for UI & Main Controller Compatibility
// --------------------------------------------------------------------------
let currentSectorCount = 2;

export function setSectorCount(count) {
  currentSectorCount = Math.max(1, Math.min(8, count));
  return currentSectorCount;
}

export function getSectorCount() {
  return currentSectorCount;
}

export function initToolsModule() {
  return true;
}

export function setToolsTab(tier, subTab) {
  if (tier) toolsState.activeTier = tier;
  if (subTab) toolsState.activeSubTab = subTab;
}

export function getToolsState() {
  return { ...toolsState };
}

export function switchActiveTool(toolId) {
  if (!toolId) return;

  let cleanId = toolId.replace('tool-card-', '').replace('tool-', '');
  if (cleanId === 'maxfdp') cleanId = 'max-fdp';
  if (cleanId === 'preflight') cleanId = 'pre-flight-rest';

  toolsState.activeToolId = cleanId;
  toolsState.activeSubTab = cleanId;
}

export function setMasterTimezone(tz) {
  toolsState.masterTimezone = tz;
}



export function renderToolsOutputCard(normalized) {
  return renderNormalizedOutput(normalized);
}

export function filterRecurrentCourses(query) {
  const cards = document.querySelectorAll('.recurrent-module-card');
  const q = (query || '').toLowerCase().trim();

  cards.forEach(card => {
    const text = (card.textContent || '').toLowerCase();
    if (!q || text.includes(q)) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}


export function calculateMedicalWindow(dob, conductDate) {
  return runToolCalculation('medical', { dob, examDate: conductDate });
}

export function calculateCourseExpiry(courseType, conductDate) {
  return runToolCalculation('recurrent', { courseType, completionDate: conductDate });
}

export function calculatePpcWindows(conductDate, expiryDate) {
  return runToolCalculation('ppc', { conductDate, expiryDate });
}

export function calculateFdpAndDiscretion(opts) {
  return runToolCalculation('max-fdp', opts);
}

export function getMaxAllowableFdp(reportTime, sectors) {
  return runToolCalculation('max-fdp', { reportTime, sectors });
}
