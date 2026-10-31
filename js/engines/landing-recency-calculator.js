// ./engines/landing-recency-calculator.js (3110_R317) - Landing Recency & Requalification Engine
/**
 * Landing Recency & Requalification Engine (2310_R197)
 * Grounded in CAD 6 Part 1, OM-A Section 5.3.4, and OM-D Section 8.3
 * 
 * Evaluates:
 * - CAD 6 Part 1 Statutory 90-Day / 3-Landing Rule (PF)
 * - OM-A Section 5.3.4 Captain 45-Day / 1-Landing Rule (PF)
 * - OM-A Section 5.3.4(6) Single / Mixed Fleet Flying (SFF/MFF) Variant Recency
 * - OM-D Section 8.3 Simulator FSTD & LIFUS Requalification Footprint Matrix
 */

class LandingRecencyEngine {
  /**
   * Helper: Format Date object to YYYY-MM-DD (UTC)
   */
  static formatDate(date) {
    if (!date || isNaN(date.getTime())) return null;
    const day = String(date.getUTCDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  }

  /**
   * Helper: Parse Date string safely (treats YYYY-MM-DD as UTC)
   */
  static parseDate(dateInput) {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    const str = String(dateInput).trim();
    const parts = str.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(Date.UTC(year, month, day));
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Evaluates landing recency requirements, 45d/90d cutoffs, variant recency, and OM-D requalification footprint.
   * 
   * @param {Object} params
   * @param {string} [params.rank='PIC'] - 'PIC' (Captain) or 'FO' (First Officer)
   * @param {Array<string|Date>} [params.last3Landings=[]] - Array of 1 to 3 recent PF landing dates (YYYY-MM-DD)
   * @param {boolean} [params.isMultiVariant=false] - True for Single Fleet / Mixed Fleet Flying (SFF/MFF)
   * @param {string|Date} [params.lastVariantLandingDate=null] - Date of last PF landing on secondary fleet variant
   * @param {string|Date} [params.referenceDate=null] - Calculation anchor date (defaults to current UTC date)
   * @returns {Object} Full recency compliance evaluation and requalification requirements.
   */
  static evaluateLandingRecency({
    rank = 'PIC',
    last3Landings = [],
    isMultiVariant = false,
    lastVariantLandingDate = null,
    referenceDate = null
  }) {
    const normRank = String(rank).toUpperCase().includes('FO') ? 'FO' : 'PIC';
    const refDate = referenceDate ? this.parseDate(referenceDate) : new Date();
    if (!refDate || isNaN(refDate.getTime())) {
      throw new Error("Invalid reference date provided.");
    }

    // Parse and sort landing dates descending (most recent first)
    const validLandings = (Array.isArray(last3Landings) ? last3Landings : [])
      .map(d => this.parseDate(d))
      .filter(d => d !== null)
      .sort((a, b) => b.getTime() - a.getTime());

    const mostRecentLanding = validLandings.length > 0 ? validLandings[0] : null;

    // Days since last landing
    const daysSinceLastLanding = mostRecentLanding
      ? Math.floor((refDate.getTime() - mostRecentLanding.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // 1. Evaluate Statutory 90-Day Rule (CAD 6 Part 1 & OM-A 5.3.4)
    const date90Ago = new Date(refDate.getTime());
    date90Ago.setUTCDate(date90Ago.getUTCDate() - 90);

    const landingsIn90Days = validLandings.filter(l => l >= date90Ago && l <= refDate).length;
    
    // Statutory expiry: 90 days after the 3rd most recent landing (if available)
    let cad90ExpiryDate = null;
    let daysRemaining90 = 0;
    if (validLandings.length >= 3) {
      const thirdLanding = validLandings[2];
      const expDate = new Date(thirdLanding.getTime());
      expDate.setUTCDate(expDate.getUTCDate() + 90);
      cad90ExpiryDate = expDate;
      daysRemaining90 = Math.ceil((cad90ExpiryDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const isCad90Lapsed = landingsIn90Days < 3 || daysRemaining90 < 0;

    // 2. Evaluate OM-A Captain 45-Day Rule (OM-A 5.3.4)
    let isPic45Lapsed = false;
    let pic45ExpiryDate = null;
    let daysRemaining45 = null;

    if (normRank === 'PIC') {
      if (mostRecentLanding) {
        const expDate45 = new Date(mostRecentLanding.getTime());
        expDate45.setUTCDate(expDate45.getUTCDate() + 45);
        pic45ExpiryDate = expDate45;
        daysRemaining45 = Math.ceil((pic45ExpiryDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
        isPic45Lapsed = daysRemaining45 < 0;
      } else {
        isPic45Lapsed = true;
        daysRemaining45 = 0;
      }
    }

    // 3. Evaluate Variant Recency (SFF / MFF - OM-A 5.3.4(6))
    let isVariantLapsed = false;
    let variantExpiryDate = null;
    let daysRemainingVariant = null;
    const parsedVariantDate = this.parseDate(lastVariantLandingDate);

    if (isMultiVariant) {
      if (parsedVariantDate) {
        const expVar = new Date(parsedVariantDate.getTime());
        expVar.setUTCDate(expVar.getUTCDate() + 90);
        variantExpiryDate = expVar;
        daysRemainingVariant = Math.ceil((variantExpiryDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
        isVariantLapsed = daysRemainingVariant < 0;
      } else {
        isVariantLapsed = true;
        daysRemainingVariant = 0;
      }
    }

    // 4. Determine Overall Compliance Status
    const isCompliant = !isCad90Lapsed && !isPic45Lapsed && (!isMultiVariant || !isVariantLapsed);

    // 5. Determine Primary Target Action Cutoff Date
    const activeExpiries = [];
    if (cad90ExpiryDate) activeExpiries.push(cad90ExpiryDate.getTime());
    if (normRank === 'PIC' && pic45ExpiryDate) activeExpiries.push(pic45ExpiryDate.getTime());
    if (isMultiVariant && variantExpiryDate) activeExpiries.push(variantExpiryDate.getTime());

    let nextRequiredLandingCutoff = null;
    let minDaysRemaining = 0;

    if (activeExpiries.length > 0) {
      const minExpiryTime = Math.min(...activeExpiries);
      nextRequiredLandingCutoff = this.formatDate(new Date(minExpiryTime));
      minDaysRemaining = Math.max(0, Math.ceil((minExpiryTime - refDate.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // 6. OM-D 8.3 Requalification Footprint Matrix (If Lapsed)
    let requalificationFootprint = null;
    if (!isCompliant) {
      if (daysSinceLastLanding <= 45 && normRank === 'PIC' && isPic45Lapsed && !isCad90Lapsed) {
        requalificationFootprint = {
          lapsedCategory: 'CAPTAIN_45D',
          summary: 'FFS: 1 PF landing | LIFUS: 2 sectors',
          fstdRequirement: '1 take-off and 1 landing as PF in Level D FFS',
          lifusRequirement: '2 sectors LIFUS under DFE/FI supervision (1 PF / 1 PM)',
          clauseRef: 'OM-A 5.3.4 & OM-D 8.3.1 (Captains ≤ 45 Days Lapsed)'
        };
      } else if (daysSinceLastLanding <= 90) {
        requalificationFootprint = {
          lapsedCategory: 'RECOVERY_LE_90D',
          summary: 'FFS: 3 PF landings (15kt X-wind) | LIFUS: 4 sectors',
          fstdRequirement: '3 take-offs and 3 landings as PF in Level D FFS (including 15kt crosswind & circuits)',
          lifusRequirement: '4 sectors LIFUS under DFE/FI supervision (3 PF / 1 PM)',
          clauseRef: 'OM-D 8.3.2 (46 to 90 Days Lapsed Footprint)'
        };
      } else if (daysSinceLastLanding <= 120) {
        requalificationFootprint = {
          lapsedCategory: 'RECOVERY_91_120D',
          summary: 'FFS: 3 PF landings | LIFUS: 4 sectors',
          fstdRequirement: '3 take-offs and 3 landings as PF in Level D FFS',
          lifusRequirement: '4 sectors LIFUS under DFE/FI supervision (3 PF / 1 PM)',
          clauseRef: 'OM-D 8.3.3 (91 to 120 Days Lapsed Footprint)'
        };
      } else {
        requalificationFootprint = {
          lapsedCategory: 'RECOVERY_GT_120D',
          summary: 'Full OPC/LPC FFS Check + OM-D LIFUS Syllabus',
          fstdRequirement: 'Full OPC / LPC Simulator Check Session',
          lifusRequirement: 'Re-assessment & LIFUS per OM-D Chapter 8 syllabus',
          clauseRef: 'OM-D 8.3.4 (Exceeded > 120 Days Footprint)'
        };
      }
    }

    // 7. Format Streamlined 3-Cell Breakdown Grid Items (Slot 3)
    const breakdownGrid = [
      {
        label: '90-Day Landings',
        value: `${landingsIn90Days} / 3 Completed`
      },
      {
        label: 'Last PF Landing',
        value: mostRecentLanding ? `${daysSinceLastLanding}d ago (${this.formatDate(mostRecentLanding)})` : 'None Recorded'
      },
      {
        label: 'Variant Status',
        value: isMultiVariant ? (isVariantLapsed ? 'MFF Lapsed' : 'Current') : 'Single Fleet'
      }
    ];

    return {
      isCompliant,
      rank: normRank,
      referenceDate: this.formatDate(refDate),
      mostRecentLandingDate: mostRecentLanding ? this.formatDate(mostRecentLanding) : null,
      daysSinceLastLanding: daysSinceLastLanding === 999 ? null : daysSinceLastLanding,
      landingsIn90Days,
      nextRequiredLandingCutoff,
      daysRemaining: isCompliant ? minDaysRemaining : 0,
      statusMessage: isCompliant 
        ? `Recency Cleared (${minDaysRemaining} days remaining)`
        : (isPic45Lapsed ? 'Lapsed: Captain 45-day 1-landing rule' : 'Lapsed: Statutory CAD 6 90-day 3-landing rule'),
      cad90Status: {
        isLapsed: isCad90Lapsed,
        expiryDate: cad90ExpiryDate ? this.formatDate(cad90ExpiryDate) : null,
        daysRemaining: daysRemaining90
      },
      pic45Status: normRank === 'PIC' ? {
        isLapsed: isPic45Lapsed,
        expiryDate: pic45ExpiryDate ? this.formatDate(pic45ExpiryDate) : null,
        daysRemaining: daysRemaining45
      } : null,
      variantStatus: isMultiVariant ? {
        isLapsed: isVariantLapsed,
        expiryDate: variantExpiryDate ? this.formatDate(variantExpiryDate) : null,
        daysRemaining: daysRemainingVariant
      } : null,
      breakdownGrid,
      requalificationFootprint
    };
  }

  /**
   * Adapter: Normalizes raw engine calculation output into standard 4-Slot UI Card structure
   * 
   * @param {Object} rawResult - Output object from evaluateLandingRecency()
   * @returns {Object} Standard 4-Slot UI representation
   */
  static normalizeOutput(rawResult) {
    if (!rawResult) {
      return {
        statusBadge: 'READY',
        statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        headlineTitle: 'LANDING RECENCY STATUS',
        headlineValue: '--:--',
        targetClockLabel: 'Next Required Landing Cutoff',
        targetClockValue: '--:--',
        breakdownGrid: [],
        auditNotes: ['CAD 6 Part 1 & OM-A 5.3.4 Standards'],
        actions: []
      };
    }

    const isCompliant = rawResult.isCompliant;
    const statusBadge = isCompliant ? 'RECENCY CLEARED' : 'RECENCY LAPSED';
    const statusClass = isCompliant
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
    
    const headlineValue = isCompliant 
      ? `${rawResult.daysRemaining} DAYS REMAINING` 
      : 'LAPSED';
    
    const targetClockLabel = rawResult.rank === 'PIC' ? 'Next Required Landing Cutoff (45d/90d)' : 'Statutory 90-Day Cutoff';
    const targetClockValue = rawResult.nextRequiredLandingCutoff || '--';

    let auditNotes = [];
    if (isCompliant) {
      auditNotes = ['CAD 6 & OM-A 5.3.4 Recency Cleared. 3 PF landings in 90 days.'];
    } else {
      const isPic45 = rawResult.pic45Status && rawResult.pic45Status.isLapsed;
      const isVar = rawResult.variantStatus && rawResult.variantStatus.isLapsed;
      const reason = isPic45 ? 'Captain 45d Rule' : (isVar ? 'MFF Variant Rule' : 'CAD 6 90d Rule');
      const fp = rawResult.requalificationFootprint ? ` Req: ${rawResult.requalificationFootprint.summary}` : '';
      auditNotes = [`CAD 6 / OM-A Lapsed (${reason}).${fp}`];
    }

    const actions = rawResult.requalificationFootprint ? [
      { type: 'view-footprint', label: 'View OM-D Requalification Footprint' }
    ] : [];

    return {
      statusBadge,
      statusClass,
      headlineTitle: 'LANDING RECENCY STATUS',
      headlineValue,
      targetClockLabel,
      targetClockValue,
      breakdownGrid: rawResult.breakdownGrid || [],
      auditNotes,
      actions
    };
  }
}

// Node.js module export compatibility

// ES Module exports
export { LandingRecencyEngine };

export function evaluateLandingRecency(params) {
  return LandingRecencyEngine.evaluateLandingRecency(params);
}

export function normalizeOutput(rawResult) {
  return LandingRecencyEngine.normalizeOutput(rawResult);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LandingRecencyEngine;
}
