/**
 * Cumulative Duty & Flying Hours Budget Tracker Engine for Flight Crew
 * Grounded in CAAM CAD 1901 Sections 2.18-2.19 and OM-A Sections 7.5.16-7.5.17
 * 
 * Strictly for Flight Crew. No Emojis in code or output text.
 */

class CumulativeHoursEngine {
  /**
   * Helper: Format decimal hours into HH:mm format
   */
  static formatHHMM(decimalHours) {
    if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours)) return '00:00';
    const absVal = Math.abs(decimalHours);
    const h = Math.floor(absVal);
    const m = Math.round((absVal - h) * 60);
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const sign = decimalHours < 0 ? '-' : '';
    return `${sign}${hh}:${mm}`;
  }

  /**
   * Calculate cumulative duty and flight hour budgets and evaluation for planned pairing
   * 
   * @param {Object} params
   * @param {number} [params.loggedFlightHours28Days=0] - Flight hours in preceding 27 days
   * @param {number} [params.loggedFlightHours12Months=0] - Flight hours in preceding 12 calendar months
   * @param {number} [params.loggedDutyHours7Days=0] - Duty hours in preceding 6 days
   * @param {number} [params.loggedDutyHours14Days=0] - Duty hours in preceding 13 days
   * @param {number} [params.loggedDutyHours28Days=0] - Duty hours in preceding 27 days
   * @param {number} [params.plannedSectorFlightHours=0] - Duration of upcoming sector flight
   * @param {number} [params.plannedSectorDutyHours=0] - Duration of upcoming duty pairing
   * @param {boolean} [params.isUnforeseenDelay=false] - Enables 60h 7-day cap for operational delays
   * @param {number} [params.standbyHours=0] - Standby duty hours to evaluate
   * @param {string} [params.standbyType='STANDARD'] - 'STANDARD', 'NIGHT_UNCALLED', 'TRIPLE_NOTICE'
   * @param {number} [params.daysInactive=0] - Consecutive inactive days (if >= 28, prior duty resets)
   * @returns {Object} Cumulative budget status, remaining balances, and clearance checks
   */
  static calculateCumulativeBudget(params = {}) {
    const {
      loggedFlightHours28Days = 0,
      loggedFlightHours12Months = 0,
      loggedDutyHours7Days = 0,
      loggedDutyHours14Days = 0,
      loggedDutyHours28Days = 0,
      plannedSectorFlightHours = 0,
      plannedSectorDutyHours = 0,
      isUnforeseenDelay = false,
      standbyHours = 0,
      standbyType = 'STANDARD',
      daysInactive = 0
    } = params;

    const notes = [];
    const warnings = [];

    // 1. Inactivity Reset Check
    let effectiveDuty7 = loggedDutyHours7Days;
    let effectiveDuty14 = loggedDutyHours14Days;
    let effectiveDuty28 = loggedDutyHours28Days;

    if (daysInactive >= 28) {
      effectiveDuty7 = 0;
      effectiveDuty14 = 0;
      effectiveDuty28 = 0;
      notes.push(`Inactivity Reset: Flight crew inactive for ${daysInactive} consecutive days (>= 28 days). Prior duty hours reset to 00:00.`);
    }

    // 2. Standby Duty Weighting Calculation
    let standbyCreditMultiplier = 1.0;
    if (standbyHours > 0) {
      if (standbyType === 'NIGHT_UNCALLED') {
        standbyCreditMultiplier = 0.5;
        notes.push(`Standby Credit (50%): Nighttime home/hotel standby (2200-0800 uncalled) credited at 50% (${this.formatHHMM(standbyHours * 0.5)} credited towards duty).`);
      } else if (standbyType === 'TRIPLE_NOTICE') {
        standbyCreditMultiplier = 0.5;
        notes.push(`Standby Credit (50%): Standby with notice >= 3x minimum report time credited at 50% (${this.formatHHMM(standbyHours * 0.5)} credited towards duty).`);
      } else {
        notes.push(`Standby Credit (100%): Standard airport or daytime standby credited at 100% (${this.formatHHMM(standbyHours)} credited towards duty).`);
      }
    }
    const effectiveStandbyDuty = standbyHours * standbyCreditMultiplier;

    // 3. Include Standby and Planned Sector into Total Evaluated Hours
    const totalCurrentDuty7 = effectiveDuty7 + effectiveStandbyDuty;
    const totalCurrentDuty14 = effectiveDuty14 + effectiveStandbyDuty;
    const totalCurrentDuty28 = effectiveDuty28 + effectiveStandbyDuty;

    const totalProjectedDuty7 = totalCurrentDuty7 + plannedSectorDutyHours;
    const totalProjectedDuty14 = totalCurrentDuty14 + plannedSectorDutyHours;
    const totalProjectedDuty28 = totalCurrentDuty28 + plannedSectorDutyHours;

    const totalCurrentFlight28 = loggedFlightHours28Days;
    const totalCurrentFlight12M = loggedFlightHours12Months;

    const totalProjectedFlight28 = totalCurrentFlight28 + plannedSectorFlightHours;
    const totalProjectedFlight12M = totalCurrentFlight12M + plannedSectorFlightHours;

    // 4. Regulatory Hard Limits (Flight Crew)
    const maxDuty7Cap = isUnforeseenDelay ? 60.0 : 55.0;
    const maxDuty14Cap = 95.0;
    const maxDuty28Cap = 190.0;
    const maxFlight28Cap = 100.0;
    const maxFlight12MCap = 1000.0;

    if (isUnforeseenDelay) {
      notes.push('Unforeseen Delay Extension Active: 7-day cumulative duty cap increased from 55:00 to 60:00 under CAD 1901 2.18.');
    }

    // 5. Calculate Remaining Budgets (Current state before planned flight)
    const remainingDuty7Hours = Math.max(0, maxDuty7Cap - totalCurrentDuty7);
    const remainingDuty14Hours = Math.max(0, maxDuty14Cap - totalCurrentDuty14);
    const remainingDuty28Hours = Math.max(0, maxDuty28Cap - totalCurrentDuty28);

    const remainingFlight28Hours = Math.max(0, maxFlight28Cap - totalCurrentFlight28);
    const remainingFlight12MHours = Math.max(0, maxFlight12MCap - totalCurrentFlight12M);

    // 6. Evaluate Clearance and Violations
    let isCleared = true;
    let singleSectorExemptionApplied = false;

    // Duty Checks
    if (totalProjectedDuty7 > maxDuty7Cap) {
      isCleared = false;
      warnings.push(`EXCEEDANCE: Projected 7-day duty (${this.formatHHMM(totalProjectedDuty7)}) exceeds limit of ${this.formatHHMM(maxDuty7Cap)}.`);
    }
    if (totalProjectedDuty14 > maxDuty14Cap) {
      isCleared = false;
      warnings.push(`EXCEEDANCE: Projected 14-day duty (${this.formatHHMM(totalProjectedDuty14)}) exceeds limit of ${this.formatHHMM(maxDuty14Cap)}.`);
    }
    if (totalProjectedDuty28 > maxDuty28Cap) {
      isCleared = false;
      warnings.push(`EXCEEDANCE: Projected 28-day duty (${this.formatHHMM(totalProjectedDuty28)}) exceeds limit of ${this.formatHHMM(maxDuty28Cap)}.`);
    }

    // Flight Checks
    if (totalProjectedFlight12M > maxFlight12MCap) {
      isCleared = false;
      warnings.push(`EXCEEDANCE: Projected 12-month flight hours (${this.formatHHMM(totalProjectedFlight12M)}) exceeds limit of ${this.formatHHMM(maxFlight12MCap)}.`);
    }

    // 28-Day Flight Check & Single-Sector Exemption
    if (totalProjectedFlight28 > maxFlight28Cap) {
      if (totalCurrentFlight28 < maxFlight28Cap) {
        // Single-sector exception applies if departure starts under 100 hours
        singleSectorExemptionApplied = true;
        notes.push(`SINGLE-SECTOR ALLOWANCE APPLIED: Single sector flight departs within 28-day cap (${this.formatHHMM(totalCurrentFlight28)} < 100:00). May complete sector reaching ${this.formatHHMM(totalProjectedFlight28)}, but no further sectors permitted today.`);
      } else {
        isCleared = false;
        warnings.push(`EXCEEDANCE: 28-day flight hours already at or above 100:00 limit (${this.formatHHMM(totalCurrentFlight28)}). Cannot depart on additional flight.`);
      }
    }

    return {
      isCleared,
      singleSectorExemptionApplied,

      // Duty Hour Budgets
      duty7: {
        limitFormatted: this.formatHHMM(maxDuty7Cap),
        currentFormatted: this.formatHHMM(totalCurrentDuty7),
        projectedFormatted: this.formatHHMM(totalProjectedDuty7),
        remainingFormatted: this.formatHHMM(remainingDuty7Hours),
        isExceeded: totalProjectedDuty7 > maxDuty7Cap
      },
      duty14: {
        limitFormatted: this.formatHHMM(maxDuty14Cap),
        currentFormatted: this.formatHHMM(totalCurrentDuty14),
        projectedFormatted: this.formatHHMM(totalProjectedDuty14),
        remainingFormatted: this.formatHHMM(remainingDuty14Hours),
        isExceeded: totalProjectedDuty14 > maxDuty14Cap
      },
      duty28: {
        limitFormatted: this.formatHHMM(maxDuty28Cap),
        currentFormatted: this.formatHHMM(totalCurrentDuty28),
        projectedFormatted: this.formatHHMM(totalProjectedDuty28),
        remainingFormatted: this.formatHHMM(remainingDuty28Hours),
        isExceeded: totalProjectedDuty28 > maxDuty28Cap
      },

      // Flight Hour Budgets
      flight28: {
        limitFormatted: this.formatHHMM(maxFlight28Cap),
        currentFormatted: this.formatHHMM(totalCurrentFlight28),
        projectedFormatted: this.formatHHMM(totalProjectedFlight28),
        remainingFormatted: this.formatHHMM(remainingFlight28Hours),
        isExceeded: totalProjectedFlight28 > maxFlight28Cap && !singleSectorExemptionApplied
      },
      flight12M: {
        limitFormatted: this.formatHHMM(maxFlight12MCap),
        currentFormatted: this.formatHHMM(totalCurrentFlight12M),
        projectedFormatted: this.formatHHMM(totalProjectedFlight12M),
        remainingFormatted: this.formatHHMM(remainingFlight12MHours),
        isExceeded: totalProjectedFlight12M > maxFlight12MCap
      },

      notes,
      warnings
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CumulativeHoursEngine;
}
