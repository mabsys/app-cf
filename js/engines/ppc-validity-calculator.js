// ./engines/ppc-validity-calculator.js (3010_R302) - PPC (OPC / LPC) Validity & Expiry Calculator Engine

/**
 * PPC (OPC / LPC) Validity & Expiry Calculator Engine for Flight Crew (v2)
 * Grounded in CAD 6 Part 1, FOTM020, and OM-A Regulations
 * 
 * Excludes:
 * - Pre-flight base return compliance engine calculation
 * - Operational Status Output Badges (Green / Purple / Amber / Red / Roster Block)
 * - DFE Form Permissions & DFE Card Instructions logic
 */

class PPCValidityEngine {
  /**
   * Helper: Get the last day of a given month for a Date object (in UTC)
   */
  static getEndOfMonth(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  }

  /**
   * Helper: Parse Date string safely (treats YYYY-MM-DD as UTC)
   */
  static parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(Date.UTC(year, month, day));
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Helper: Format Date object as YYYY-MM-DD
   */
  static formatDate(date) {
    if (!date) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 1. Calculate LPC Expiry Date
   * Implements the 12-Month Validity, End-of-Month Rule, 3-Month Renewal Window (Anniversary Preservation),
   * and Lapsed LPC > 3 Months Warning.
   */
  static calculateLPCExpiry(lpcConductDateStr, currentLPCExpiryDateStr = null) {
    const conductDate = this.parseDate(lpcConductDateStr);
    if (!conductDate) throw new Error('Invalid LPC conduct date provided');

    const currentExpiry = this.parseDate(currentLPCExpiryDateStr);

    let newExpiry;
    let anniversaryPreserved = false;
    let lapsedLPCWarning = null;

    // Check for Lapsed LPC > 3 Months
    if (currentExpiry) {
      let threeMonthsPostExpiry = new Date(currentExpiry.getTime());
      threeMonthsPostExpiry.setUTCMonth(threeMonthsPostExpiry.getUTCMonth() + 3);
      threeMonthsPostExpiry = this.getEndOfMonth(threeMonthsPostExpiry);

      if (conductDate > threeMonthsPostExpiry) {
        lapsedLPCWarning = 'LPC Expired > 3 Months: Mandatory ATO / simulator refresher footprint required prior to conducting proficiency check.';
      }
    }

    // Check 3-Month Renewal Window (Anniversary Preservation)
    if (currentExpiry) {
      const windowStart = new Date(currentExpiry.getTime());
      windowStart.setUTCMonth(windowStart.getUTCMonth() - 3);

      if (conductDate >= windowStart && conductDate <= currentExpiry) {
        anniversaryPreserved = true;
        // Extend 12 months from current expiry
        newExpiry = new Date(currentExpiry.getTime());
        newExpiry.setUTCMonth(newExpiry.getUTCMonth() + 12);
        newExpiry = this.getEndOfMonth(newExpiry);
      }
    }

    if (!anniversaryPreserved) {
      // Calculate 12 months from conduct date (End of Month)
      newExpiry = new Date(conductDate.getTime());
      newExpiry.setUTCMonth(newExpiry.getUTCMonth() + 12);
      newExpiry = this.getEndOfMonth(newExpiry);
    }

    return {
      lpcConductDate: this.formatDate(conductDate),
      previousLPCExpiry: currentExpiry ? this.formatDate(currentExpiry) : null,
      newLPCExpiryDate: this.formatDate(newExpiry),
      anniversaryPreserved,
      calculationMethod: anniversaryPreserved
        ? `Preserved Anniversary: +12 months added to previous expiry (${this.formatDate(currentExpiry)})`
        : `Reset: 12 months from completion date (End of Month: ${this.formatDate(newExpiry)})`,
      lapsedLPCWarning
    };
  }

  /**
   * 2. Calculate OPC Conduct Window (4-to-8 Month Rule)
   * Earliest OPC = LPC Conduct Date + 4 Months
   * Latest OPC   = LPC Expiry Date - 4 Months
   * Target OPC   = ~6 Months mid-point
   */
  static calculateOPCWindow(lpcConductDateStr, lpcExpiryDateStr) {
    const conductDate = this.parseDate(lpcConductDateStr);
    if (!conductDate) throw new Error('Invalid LPC conduct date provided');

    const expiryDate = this.parseDate(lpcExpiryDateStr);
    if (!expiryDate) throw new Error('Invalid LPC expiry date provided');

    // Earliest OPC Date: LPC Conduct + 4 Months
    const earliestOPC = new Date(conductDate.getTime());
    earliestOPC.setUTCMonth(earliestOPC.getUTCMonth() + 4);
    earliestOPC.setUTCDate(earliestOPC.getUTCDate() + 1);

    // Latest OPC Date: LPC Expiry - 4 Months (End of Month)
    let latestOPC = new Date(expiryDate.getTime());
    latestOPC.setUTCMonth(latestOPC.getUTCMonth() - 4);
    latestOPC = this.getEndOfMonth(latestOPC);

    // Target OPC Date: Mid-point (~6 months)
    const targetOPC = new Date(conductDate.getTime());
    targetOPC.setUTCMonth(targetOPC.getUTCMonth() + 6);

    return {
      lpcConductDate: this.formatDate(conductDate),
      lpcExpiryDate: this.formatDate(expiryDate),
      earliestOPCDate: this.formatDate(earliestOPC),
      latestOPCDate: this.formatDate(latestOPC),
      targetOPCDate: this.formatDate(targetOPC),
      opcWindowSummary: `OPC must be conducted between ${this.formatDate(earliestOPC)} and ${this.formatDate(latestOPC)}.`
    };
  }

  /**
   * Combined calculator method for PPC/LPC & OPC Windows
   */
  static calculatePPCValidity({ conductDate, currentExpiryDate = null }) {
    const lpcResult = this.calculateLPCExpiry(conductDate, currentExpiryDate);
    const opcResult = this.calculateOPCWindow(lpcResult.lpcConductDate, lpcResult.newLPCExpiryDate);
    return {
      ...lpcResult,
      ...opcResult
    };
  }
}

// ES Module exports
export { PPCValidityEngine };

export function calculatePPCValidity(params) {
  return PPCValidityEngine.calculatePPCValidity(params);
}

export function calculatePpcWindows(conductDate, expiryDate) {
  return {
    lpc: PPCValidityEngine.calculateLPCExpiry(conductDate, expiryDate),
    opc: PPCValidityEngine.calculateOPCWindow(conductDate, expiryDate)
  };
}

// CommonJS module export compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PPCValidityEngine;
}
