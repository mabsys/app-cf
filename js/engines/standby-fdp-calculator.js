/**
 * Standby Call-Out FDP Deductor Engine for Flight Crew
 * Grounded in CAD 1901 Section 2.9 and OM-A Section 7.5.7 Regulations
 * 
 * Tailored specifically for Flight Crew only (disregards Cabin Crew rules).
 */

class StandbyFDPEngine {
  /**
   * Helper: Parse Date or Date String safely
   */
  static parseDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Helper: Convert Date object to YYYY-MM-DD HH:mm string format
   */
  static formatDateTime(date) {
    if (!date) return null;
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }

  /**
   * Helper: Format decimal hours to HH:mm string
   */
  static formatHoursToHHMM(decimalHours) {
    if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours)) return '00:00';
    const totalMinutes = Math.round(decimalHours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Table A: Two or more Flight Crew - Acclimatised (CAD 1901 2.10 / OM-A Figure 7.5.8(1))
   */
  static TABLE_A_ACCLIMATISED = {
    '0600-0759': [13.0, 12.25, 11.5, 10.75, 10.0, 9.5, 9.0, 9.0],
    '0800-1259': [14.0, 13.25, 12.5, 11.75, 11.0, 10.5, 10.0, 9.5],
    '1300-1759': [13.0, 12.25, 11.5, 10.75, 10.0, 9.5, 9.0, 9.0],
    '1800-2159': [12.0, 11.25, 10.5, 9.75, 9.0, 9.0, 9.0, 9.0],
    '2200-0559': [11.0, 10.25, 9.5, 9.0, 9.0, 9.0, 9.0, 9.0]
  };

  /**
   * Table B: Two or more Flight Crew - Not Acclimatised (CAD 1901 2.10 / OM-A Figure 7.5.8(1))
   */
  static TABLE_B_NOT_ACCLIMATISED = {
    'UP_TO_18_OR_OVER_30': [13.0, 12.25, 11.5, 10.75, 10.0, 9.25, 9.0],
    'BETWEEN_18_AND_30': [11.5, 11.0, 10.5, 9.75, 9.0, 9.0, 9.0]
  };

  /**
   * Determine Local Time of Start Band
   */
  static getLocalTimeBand(localHours, localMinutes = 0) {
    const totalMin = localHours * 60 + localMinutes;
    if (totalMin >= 360 && totalMin <= 479) return '0600-0759';
    if (totalMin >= 480 && totalMin <= 779) return '0800-1259';
    if (totalMin >= 780 && totalMin <= 1079) return '1300-1759';
    if (totalMin >= 1080 && totalMin <= 1319) return '1800-2159';
    return '2200-0559';
  }

  /**
   * Lookup Base Table FDP
   */
  static lookupBaseFDP(timeBand, sectors, isAcclimatised, precedingRestCategory) {
    if (isAcclimatised) {
      const tableRow = this.TABLE_A_ACCLIMATISED[timeBand] || this.TABLE_A_ACCLIMATISED['2200-0559'];
      const sectorIndex = Math.min(Math.max(sectors - 1, 0), tableRow.length - 1);
      return tableRow[sectorIndex];
    } else {
      const categoryKey = precedingRestCategory === 'BETWEEN_18_AND_30' ? 'BETWEEN_18_AND_30' : 'UP_TO_18_OR_OVER_30';
      const tableRow = this.TABLE_B_NOT_ACCLIMATISED[categoryKey];
      const sectorIndex = Math.min(Math.max(sectors - 1, 0), tableRow.length - 1);
      return tableRow[sectorIndex];
    }
  }

  /**
   * Main Standby Call-Out FDP Calculator Engine
   * 
   * @param {Object} params
   * @param {string} params.standbyStartISO - UTC ISO string for standby start (e.g. "2026-10-25T00:00:00Z")
   * @param {string} params.calloutReportISO - UTC ISO string for call-out report time (e.g. "2026-10-25T07:30:00Z")
   * @param {number} [params.localTimezoneOffsetHours=8] - Local UTC offset in hours (e.g., +8 for MYT)
   * @param {string} [params.standbyLocation='HOME'] - 'HOME' (Home/Hotel) or 'AIRPORT' (Airport Readiness)
   * @param {number} [params.noticeGivenHours=2.0] - Notice hours given before report time
   * @param {boolean} [params.isAcclimatised=true] - Whether crew is acclimatised
   * @param {string} [params.precedingRestCategory='UP_TO_18_OR_OVER_30'] - Unacclimatised rest category
   * @param {number} [params.flightCrewCount=2] - Number of flight crew (2, 3, or 4)
   * @param {number} [params.sectorsPlanned=1] - Number of flight sectors planned
   * @param {number} [params.longestSectorHours=0] - Longest sector duration in hours
   * 
   * @returns {Object} Standby case assessment, FDP deduction, net permissible FDP, and cutoff timestamps.
   */
  static calculateStandbyFDP(params) {
    const {
      standbyStartISO,
      calloutReportISO,
      localTimezoneOffsetHours = 8,
      standbyLocation = 'HOME',
      noticeGivenHours = 2.0,
      isAcclimatised = true,
      precedingRestCategory = 'UP_TO_18_OR_OVER_30',
      flightCrewCount = 2,
      sectorsPlanned = 1,
      longestSectorHours = 0
    } = params;

    const standbyStartUTC = this.parseDate(standbyStartISO);
    const reportDateUTC = this.parseDate(calloutReportISO);

    if (!standbyStartUTC || !reportDateUTC) {
      throw new Error('Invalid ISO timestamp provided for standby start or report time.');
    }

    if (reportDateUTC < standbyStartUTC) {
      throw new Error('Call-out report time cannot be earlier than standby start time.');
    }

    const notes = [];
    const warnings = [];

    // Calculate Dates in Local Time
    const standbyStartLocal = new Date(standbyStartUTC.getTime() + localTimezoneOffsetHours * 3600 * 1000);
    const reportDateLocal = new Date(reportDateUTC.getTime() + localTimezoneOffsetHours * 3600 * 1000);

    // Calculate Standby Duration in Hours
    const standbyDurationHours = (reportDateUTC.getTime() - standbyStartUTC.getTime()) / (3600 * 1000);

    if (standbyDurationHours > 12.0) {
      warnings.push('STANDBY LIMIT EXCEEDED: Standby duration exceeds maximum permissible 12:00 hours limit.');
    }

    // Determine Standby Start Band and Report Band
    const standbyBand = this.getLocalTimeBand(standbyStartLocal.getUTCHours(), standbyStartLocal.getUTCMinutes());
    const reportBand = this.getLocalTimeBand(reportDateLocal.getUTCHours(), reportDateLocal.getUTCMinutes());

    // Evaluate Effective Sectors (2-Pilot Long Range Scaling)
    let effectiveSectors = sectorsPlanned;
    if (flightCrewCount === 2 && longestSectorHours > 7) {
      if (longestSectorHours <= 9) {
        effectiveSectors = isAcclimatised ? 2 : 4;
        notes.push(`2-Pilot Long Range Scaling: Longest sector (${this.formatHoursToHHMM(longestSectorHours)}) > 7h to 9h scaled sector count to ${effectiveSectors}.`);
      } else if (longestSectorHours <= 11) {
        effectiveSectors = isAcclimatised ? 3 : 4;
        notes.push(`2-Pilot Long Range Scaling: Longest sector (${this.formatHoursToHHMM(longestSectorHours)}) > 9h to 11h scaled sector count to ${effectiveSectors}.`);
      } else if (longestSectorHours > 11) {
        if (!isAcclimatised) {
          warnings.push('PROHIBITED: 2-Pilot non-acclimatised operation with a sector exceeding 11 hours is NOT PERMITTED.');
        } else {
          effectiveSectors = 4;
          notes.push(`2-Pilot Long Range Scaling: Longest sector (${this.formatHoursToHHMM(longestSectorHours)}) > 11h scaled sector count to 4.`);
        }
      }
    }

    // Determine Active Table Band Logic (CAD 1901 2.9 / OM-A 7.5.7)
    let activeBand = standbyBand;
    let bandDeterminationReason = 'Standby Start Time Band used as default.';

    // Check Night Home Standby Exception (2200 to 0800 local, notice <= 2h)
    const standbyLocalHour = standbyStartLocal.getUTCHours();
    const isNightStandby = (standbyLocalHour >= 22 || standbyLocalHour < 8);

    if (standbyLocation === 'HOME' && isNightStandby && noticeGivenHours <= 2.0) {
      activeBand = reportBand;
      bandDeterminationReason = 'Night Home Standby Rule: Standby undertaken at home between 2200-0800 with <= 2h notice; FDP time band determined by actual report time.';
      notes.push(bandDeterminationReason);
    } else if (standbyLocation === 'AIRPORT') {
      activeBand = standbyBand;
      bandDeterminationReason = 'Airport Immediate Readiness: FDP time band strictly determined by standby start time.';
      notes.push(bandDeterminationReason);
    } else {
      // General Rule: Check if Report Band is more limiting
      const fdpAtStandbyBand = this.lookupBaseFDP(standbyBand, effectiveSectors, isAcclimatised, precedingRestCategory);
      const fdpAtReportBand = this.lookupBaseFDP(reportBand, effectiveSectors, isAcclimatised, precedingRestCategory);

      if (fdpAtReportBand < fdpAtStandbyBand) {
        activeBand = reportBand;
        bandDeterminationReason = `More Limiting Band Enforced: Report time band (${reportBand}, ${this.formatHoursToHHMM(fdpAtReportBand)}h) is more limiting than standby start band (${standbyBand}, ${this.formatHoursToHHMM(fdpAtStandbyBand)}h).`;
        notes.push(bandDeterminationReason);
      } else {
        bandDeterminationReason = `Standby Start Band Applied: Standby start band (${standbyBand}) is equal or more limiting than report band (${reportBand}).`;
        notes.push(bandDeterminationReason);
      }
    }

    // Base FDP from Table A / B
    const baseTableFDPHours = this.lookupBaseFDP(activeBand, effectiveSectors, isAcclimatised, precedingRestCategory);

    // Standby Call-Out Case & Deduction Logic
    let caseType = 'CASE_A';
    let caseLabel = 'Case A (< 6 Hours Standby Completed)';
    let excessStandbyHours = 0;
    let fdpDeductionHours = 0;

    if (standbyDurationHours < 6.0) {
      caseType = 'CASE_A';
      caseLabel = 'Case A (< 6 Hours Standby Completed)';
      excessStandbyHours = 0;
      fdpDeductionHours = 0;
      notes.push('Case A Applied: Standby completed is under 6 hours. No FDP deduction required.');
    } else {
      caseType = 'CASE_B';
      caseLabel = 'Case B (>= 6 Hours Standby Completed)';
      excessStandbyHours = standbyDurationHours - 6.0;
      fdpDeductionHours = excessStandbyHours;
      notes.push(`Case B Applied: Standby completed is ${this.formatHoursToHHMM(standbyDurationHours)} (>= 6 hours). Allowable FDP reduced by excess standby of ${this.formatHoursToHHMM(excessStandbyHours)}.`);
    }

    // Net Permissible FDP
    const netPermissibleFDPHours = Math.max(0, baseTableFDPHours - fdpDeductionHours);

    // Latest On-Chocks Cutoff Timestamp
    const cutoffUTC = new Date(reportDateUTC.getTime() + netPermissibleFDPHours * 3600 * 1000);
    const cutoffLocal = new Date(cutoffUTC.getTime() + localTimezoneOffsetHours * 3600 * 1000);

    return {
      standbyDurationHours,
      standbyDurationFormatted: this.formatHoursToHHMM(standbyDurationHours),
      caseType,
      caseLabel,
      standbyLocation,
      standbyBand,
      reportBand,
      activeBand,
      bandDeterminationReason,
      effectiveSectorsUsed: effectiveSectors,
      baseTableFDPHours,
      baseTableFDPFormatted: this.formatHoursToHHMM(baseTableFDPHours),
      excessStandbyHours,
      excessStandbyFormatted: this.formatHoursToHHMM(excessStandbyHours),
      fdpDeductionHours,
      fdpDeductionFormatted: this.formatHoursToHHMM(fdpDeductionHours),
      netPermissibleFDPHours,
      netPermissibleFDPFormatted: this.formatHoursToHHMM(netPermissibleFDPHours),
      standbyStartUTC: this.formatDateTime(standbyStartUTC),
      standbyStartLocal: this.formatDateTime(standbyStartLocal),
      reportTimestampUTC: this.formatDateTime(reportDateUTC),
      reportTimestampLocal: this.formatDateTime(reportDateLocal),
      cutoffTimestampUTC: this.formatDateTime(cutoffUTC),
      cutoffTimestampLocal: this.formatDateTime(cutoffLocal),
      notes,
      warnings
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StandbyFDPEngine;
}
