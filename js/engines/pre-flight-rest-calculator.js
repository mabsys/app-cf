/**
 * Pre-Flight Minimum Rest & Report-Time Calculator Engine for Flight Crew
 * Grounded in CAD 1901 Section 2.14 and OM-A Section 7.5.12
 */

class PreFlightRestEngine {
  /**
   * Helper: Parse ISO string safely into UTC Date
   */
  static parseISO(isoStr) {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Helper: Format Date object to YYYY-MM-DD HH:mm (UTC or Local with offset)
   */
  static formatDateTime(dateObj, offsetHours = 0) {
    if (!dateObj) return null;
    const targetMs = dateObj.getTime() + offsetHours * 3600 * 1000;
    const d = new Date(targetMs);

    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');

    return `${y}-${m}-${day} ${hh}:${mm}`;
  }

  /**
   * Helper: Convert decimal hours to HH:mm string
   */
  static formatHoursToHHMM(decimalHours) {
    if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours)) return '00:00';
    const totalMinutes = Math.round(decimalHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Core Calculation Function
   * @param {Object} params
   * @param {string} params.precedingDutyEndTimestampISO - ISO string when preceding duty ended
   * @param {number} params.precedingDutyHours - Length of preceding duty in hours
   * @param {boolean} [params.isHomeBase=true] - Is duty ending at Home Base?
   * @param {number} [params.oneWayTravelMinutes=30] - Travel time to hotel if outstation
   * @param {number} [params.discretionReductionHours=0] - Discretion reduction requested (hours)
   * @param {boolean} [params.isPostExtendedFDPSequence=false] - Sequence protection flag
   * @param {number} [params.localTimezoneOffsetHours=8] - Local timezone offset relative to UTC
   */
  static calculateMinRest({
    precedingDutyEndTimestampISO,
    precedingDutyHours,
    isHomeBase = true,
    oneWayTravelMinutes = 30,
    discretionReductionHours = 0,
    isPostExtendedFDPSequence = false,
    localTimezoneOffsetHours = 8
  }) {
    const dutyEndDate = this.parseISO(precedingDutyEndTimestampISO);
    if (!dutyEndDate) throw new Error('Invalid preceding duty end timestamp provided');
    if (typeof precedingDutyHours !== 'number' || precedingDutyHours < 0) {
      throw new Error('Invalid preceding duty hours provided');
    }

    const notes = [];
    const warnings = [];

    // Rule A: Baseline Earned Rest = max(precedingDutyHours, 12.0)
    const baselineEarnedRestHours = Math.max(precedingDutyHours, 12.0);
    let calculatedRestHours = baselineEarnedRestHours;

    if (precedingDutyHours < 12.0) {
      notes.push(`Preceding duty (${this.formatHoursToHHMM(precedingDutyHours)}) < 12h: Flight crew baseline minimum rest floor of 12:00 applied.`);
    } else {
      notes.push(`Baseline earned rest equals preceding duty duration (${this.formatHoursToHHMM(precedingDutyHours)}).`);
    }

    // Rule B: Outstation Travel Allowance
    let excessTravelHours = 0;
    if (!isHomeBase) {
      if (oneWayTravelMinutes > 30) {
        const excessOneWayMins = oneWayTravelMinutes - 30;
        excessTravelHours = (excessOneWayMins * 2) / 60;
        calculatedRestHours += excessTravelHours;
        notes.push(`Outstation Travel: Travel time of ${oneWayTravelMinutes}m exceeds 30m standard. Added ${this.formatHoursToHHMM(excessTravelHours)} excess round-trip travel time.`);
      } else {
        notes.push(`Outstation Travel: Standard ${oneWayTravelMinutes}m one-way travel within 30m allowance.`);
      }
    }

    // Rule C & E: Discretion Reduction & Sequence Protection
    let appliedReductionHours = 0;
    if (discretionReductionHours > 0) {
      if (isPostExtendedFDPSequence) {
        warnings.push('SEQUENCE PROHIBITION: Rest following an extended FDP that succeeded a reduced rest CANNOT be reduced.');
        appliedReductionHours = 0;
      } else if (isHomeBase) {
        // Home base reduction floor is strictly 12.0 hours for flight crew
        const maxAllowedReduction = Math.max(0, calculatedRestHours - 12.0);
        appliedReductionHours = Math.min(discretionReductionHours, 1.0, maxAllowedReduction);

        if (discretionReductionHours > maxAllowedReduction) {
          warnings.push(`Home base discretion reduction capped at ${this.formatHoursToHHMM(appliedReductionHours)} to maintain mandatory 12:00 floor.`);
        } else {
          notes.push(`Applied home base discretion reduction of ${this.formatHoursToHHMM(appliedReductionHours)}.`);
        }
      } else {
        // Outstation reduction (only applicable if earned rest is exactly 12h and room occupancy >= 10h)
        if (baselineEarnedRestHours === 12.0) {
          appliedReductionHours = Math.min(discretionReductionHours, 1.0);
          notes.push(`Applied outstation reduced rest of ${this.formatHoursToHHMM(appliedReductionHours)} (down to 11:00 floor + travel allowance).`);
        } else {
          warnings.push(`Outstation rest reduction is only permitted when baseline earned rest is 12:00. Earned rest was ${this.formatHoursToHHMM(baselineEarnedRestHours)}.`);
          appliedReductionHours = 0;
        }
      }
    }

    const finalRequiredRestHours = calculatedRestHours - appliedReductionHours;

    // Rule D: Ensuing Local Night Check (> 18h duty)
    let requiresLocalNight = false;
    if (precedingDutyHours > 18.0) {
      requiresLocalNight = true;
      warnings.push('LOCAL NIGHT REQUIRED: Preceding duty exceeded 18:00. Ensuing rest MUST contain an 8-hour Local Night between 22:00 and 08:00 local time.');
    }

    // Hotel Room Availability Check
    let minRoomOccupancyHours = 10.0;
    if (!isHomeBase) {
      notes.push(`Hotel Requirement: Suitable accommodation must remain available for occupation for at least ${this.formatHoursToHHMM(minRoomOccupancyHours)}.`);
    }

    // Earliest Available Report Timestamp
    const earliestReportMs = dutyEndDate.getTime() + finalRequiredRestHours * 3600 * 1000;
    const earliestReportDate = new Date(earliestReportMs);

    return {
      precedingDutyHours,
      precedingDutyFormatted: this.formatHoursToHHMM(precedingDutyHours),
      isHomeBase,
      baselineEarnedRestHours,
      baselineEarnedRestFormatted: this.formatHoursToHHMM(baselineEarnedRestHours),
      excessTravelHours,
      excessTravelFormatted: this.formatHoursToHHMM(excessTravelHours),
      appliedReductionHours,
      appliedReductionFormatted: this.formatHoursToHHMM(appliedReductionHours),
      finalRequiredRestHours,
      finalRequiredRestFormatted: this.formatHoursToHHMM(finalRequiredRestHours),
      requiresLocalNight,
      precedingDutyEndUTC: this.formatDateTime(dutyEndDate, 0),
      precedingDutyEndLocal: this.formatDateTime(dutyEndDate, localTimezoneOffsetHours),
      earliestReportUTC: this.formatDateTime(earliestReportDate, 0),
      earliestReportLocal: this.formatDateTime(earliestReportDate, localTimezoneOffsetHours),
      notes,
      warnings
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PreFlightRestEngine;
}

export { PreFlightRestEngine }; 
export function calculatePreFlightRest(params) { 
  return PreFlightRestEngine.calculateMinRest(params); 
}
