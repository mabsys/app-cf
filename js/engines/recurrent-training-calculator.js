// ./engines/recurrent-training-calculator.js (3110_R305) - Recurrent Training Engine
/**
 * Recurrent Training & Checking Calculator Engine for Flight Crew (v2)
 * Grounded in OM-A, OM-D, and CAAM Regulations
 * 
 * Excludes:
 * - Adverse Weather, FTL Recurrent, RHS Qualification, Special Aerodrome Recency,
 *   Landing Recency (45/90 days), and Lapsed Penalty Rules.
 * - Operational Status Evaluation (evaluateStatus, color badges, live countdowns).
 */

class RecurrentTrainingEngine {
  /**
   * Helper: Get the last day of a given month for a Date object (UTC)
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
   * Defined Qualification Rules Catalog
   */
  static QUALIFICATION_RULES = {
    LINE_CHECK: {
      id: 'LINE_CHECK',
      name: 'Line Check (LC)',
      validityMonths: 12,
      windowMonths: 3,
      endOfMonthExpiry: true,
      category: 'Annual Check'
    },
    SEP_AIRCRAFT_TYPE: {
      id: 'SEP_AIRCRAFT_TYPE',
      name: 'SEP (Aircraft Type Check)',
      validityMonths: 12,
      windowMonths: 3,
      endOfMonthExpiry: true,
      category: 'Annual SEP'
    },
    DOOR_DRILL: {
      id: 'DOOR_DRILL',
      name: 'Practical Door Drill',
      validityMonths: 12,
      windowMonths: 3,
      endOfMonthExpiry: true,
      category: 'Annual SEP'
    },
    CRM: {
      id: 'CRM',
      name: 'Crew Resource Management (CRM)',
      validityMonths: 12,
      windowMonths: 3,
      endOfMonthExpiry: true,
      category: 'Annual Refresher'
    },
    AVSEC: {
      id: 'AVSEC',
      name: 'Aviation Security (AVSEC)',
      validityMonths: 12,
      windowMonths: 3,
      endOfMonthExpiry: true,
      category: 'Annual Refresher'
    },
    ROUTE_AERODROME_COMPETENCE: {
      id: 'ROUTE_AERODROME_COMPETENCE',
      name: 'Route & Aerodrome Competence',
      validityMonths: 12,
      windowMonths: 0,
      endOfMonthExpiry: true,
      category: 'Annual Competence'
    },
    DGR_FUNCTION_7: {
      id: 'DGR_FUNCTION_7',
      name: 'Dangerous Goods (DGR - Function 7)',
      validityMonths: 24,
      windowMonths: 3,
      endOfMonthExpiry: true,
      category: '24-Month Module'
    },
    SMS: {
      id: 'SMS',
      name: 'Safety Management System (SMS)',
      validityMonths: 36,
      windowMonths: 3,
      endOfMonthExpiry: true,
      category: '36-Month Module'
    },
    FIRE_SMOKE_DRILL: {
      id: 'FIRE_SMOKE_DRILL',
      name: 'Fire & Smoke House Practical Drill',
      validityMonths: 36,
      windowMonths: 0,
      endOfMonthExpiry: true,
      category: '36-Month Practical'
    },
    WET_DITCHING_DRILL: {
      id: 'WET_DITCHING_DRILL',
      name: 'Wet / Swimming & Dinghy Drill',
      validityMonths: 36,
      windowMonths: 0,
      endOfMonthExpiry: true,
      category: '36-Month Practical'
    },
    LVO_AUTOLAND: {
      id: 'LVO_AUTOLAND',
      name: 'Low Visibility Operations (LVO / Autoland)',
      validityDays: 180,
      endOfMonthExpiry: false,
      category: 'Semi-Annual Recency'
    }
  };

  /**
   * Calculate Next Expiry Date based on Completion Date & Current Expiry Date
   * Implements the 3-Month Renewal / Anniversary Preservation Rule
   */
  static calculateExpiry(qualKey, completionDateStr, currentExpiryDateStr = null) {
    const rule = this.QUALIFICATION_RULES[qualKey];
    if (!rule) throw new Error(`Unknown qualification key: ${qualKey}`);

    const completionDate = this.parseDate(completionDateStr);
    if (!completionDate) throw new Error('Invalid completion date');

    const currentExpiry = this.parseDate(currentExpiryDateStr);

    // Handle 180-Day Recency (e.g. LVO)
    if (rule.validityDays) {
      const exp = new Date(completionDate.getTime() + rule.validityDays * 24 * 60 * 60 * 1000);
      return {
        qualId: rule.id,
        name: rule.name,
        category: rule.category,
        completionDate: this.formatDate(completionDate),
        newExpiryDate: this.formatDate(exp),
        anniversaryPreserved: false,
        calculationMethod: `${rule.validityDays} Days from completion date`
      };
    }

    // Standard Month-based calculations
    let newExpiry;
    let anniversaryPreserved = false;

    if (rule.windowMonths > 0 && currentExpiry) {
      // Calculate start of window (windowMonths before currentExpiry)
      const windowStart = new Date(currentExpiry.getTime());
      windowStart.setUTCMonth(windowStart.getUTCMonth() - rule.windowMonths);

      // Check if completion happened within the 3-month window prior to current expiry and before/on current expiry
      if (completionDate >= windowStart && completionDate <= currentExpiry) {
        anniversaryPreserved = true;
        // Extend from current expiry
        newExpiry = new Date(currentExpiry.getTime());
        newExpiry.setUTCMonth(newExpiry.getUTCMonth() + rule.validityMonths);
        if (rule.endOfMonthExpiry) {
          newExpiry = this.getEndOfMonth(newExpiry);
        }
      }
    }

    if (!anniversaryPreserved) {
      // Calculate from completion date
      newExpiry = new Date(completionDate.getTime());
      newExpiry.setUTCMonth(newExpiry.getUTCMonth() + rule.validityMonths);
      if (rule.endOfMonthExpiry) {
        newExpiry = this.getEndOfMonth(newExpiry);
      }
    }

    return {
      qualId: rule.id,
      name: rule.name,
      category: rule.category,
      completionDate: this.formatDate(completionDate),
      currentExpiryDate: currentExpiry ? this.formatDate(currentExpiry) : null,
      newExpiryDate: this.formatDate(newExpiry),
      anniversaryPreserved,
      calculationMethod: anniversaryPreserved
        ? `Preserved Anniversary: +${rule.validityMonths} months added to current expiry (${this.formatDate(currentExpiry)})`
        : `Reset: +${rule.validityMonths} months from completion date (${rule.endOfMonthExpiry ? 'End of Month' : 'Exact Date'})`
    };
  }
}

// ES Module exports
export { RecurrentTrainingEngine };

export function calculateExpiry(qualKey, completionDateStr, currentExpiryDateStr = null) {
  return RecurrentTrainingEngine.calculateExpiry(qualKey, completionDateStr, currentExpiryDateStr);
}

// CommonJS module export compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecurrentTrainingEngine;
}
