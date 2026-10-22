/**
 * Max Flying Duty Period (FDP) & Extensions Calculator Engine for Flight Crew
 * Grounded in CAD 1901 - FTL (Issue 01/Rev 01) and OM-A Chapter 7 Regulations
 * 
 * Specifically tailored for Flight Crew only (disregards Cabin Crew rules).
 */

class MaxFDPEngine {
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
   * Helper: Format decimal hours to HH:mm string (e.g., 12.25 -> "12:15", 13.5 -> "13:30")
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
   * Values in decimal hours for 1 to 8+ sectors.
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
   * Values in decimal hours for 1 to 7+ sectors.
   */
  static TABLE_B_NOT_ACCLIMATISED = {
    'UP_TO_18_OR_OVER_30': [13.0, 12.25, 11.5, 10.75, 10.0, 9.25, 9.0],
    'BETWEEN_18_AND_30': [11.5, 11.0, 10.5, 9.75, 9.0, 9.0, 9.0]
  };

  /**
   * Determine Local Time of Start Band (HH:mm local string or Date)
   */
  static getLocalTimeBand(localHours, localMinutes = 0) {
    const totalMin = localHours * 60 + localMinutes;
    if (totalMin >= 360 && totalMin <= 479) return '0600-0759';
    if (totalMin >= 480 && totalMin <= 779) return '0800-1259';
    if (totalMin >= 780 && totalMin <= 1079) return '1300-1759';
    if (totalMin >= 1080 && totalMin <= 1319) return '1800-2159';
    return '2200-0559'; // Covers 22:00 to 05:59
  }

  /**
   * Main Max FDP & Extensions Calculator Engine
   * 
   * @param {Object} params
   * @param {string} params.reportTimestampISO - UTC ISO string for report time (e.g. "2026-10-25T07:30:00Z")
   * @param {number} params.localTimezoneOffsetHours - UTC offset in hours at report location (e.g., +8 for MYT)
   * @param {boolean} [params.isAcclimatised=true] - Whether crew is acclimatised
   * @param {string} [params.precedingRestCategory='UP_TO_18_OR_OVER_30'] - If unacclimatised: 'UP_TO_18_OR_OVER_30' or 'BETWEEN_18_AND_30'
   * @param {number} [params.flightCrewCount=2] - Number of flight crew (2, 3, or 4)
   * @param {number} [params.sectorsPlanned=1] - Actual number of flight sectors planned
   * @param {number} [params.longestSectorHours=0] - Length of longest sector in hours (for 2-pilot long range check)
   * @param {string} [params.fleetType='B737'] - Aircraft fleet: 'B737' (30m buffer) or 'A330' / 'A350' (45m buffer)
   * @param {string} [params.inflightReliefType='NONE'] - In-flight rest type: 'NONE', 'BUNK', or 'SEAT'
   * @param {number} [params.inflightRestHours=0] - Total in-flight rest duration in decimal hours
   * @param {number} [params.splitDutyGroundRestHours=0] - Gross ground rest duration between sectors in decimal hours
   * 
   * @returns {Object} Complete calculation results, extensions breakdown, and cutoff timestamps.
   */
  static calculateMaxFDP(params) {
    const {
      reportTimestampISO,
      localTimezoneOffsetHours = 8,
      isAcclimatised = true,
      precedingRestCategory = 'UP_TO_18_OR_OVER_30',
      flightCrewCount = 2,
      sectorsPlanned = 1,
      longestSectorHours = 0,
      fleetType = 'B737',
      inflightReliefType = 'NONE',
      inflightRestHours = 0,
      splitDutyGroundRestHours = 0
    } = params;

    const reportDateUTC = this.parseDate(reportTimestampISO);
    if (!reportDateUTC) throw new Error('Invalid report timestamp ISO string provided.');

    // Calculate Local Report Time
    const reportDateLocal = new Date(reportDateUTC.getTime() + localTimezoneOffsetHours * 3600 * 1000);
    const localHours = reportDateLocal.getUTCHours();
    const localMinutes = reportDateLocal.getUTCMinutes();
    const localTimeBand = this.getLocalTimeBand(localHours, localMinutes);

    const notes = [];
    let isProhibited = false;
    let prohibitionReason = null;

    // -------------------------------------------------------------
    // STEP 1: Handle 4-Crew Long Haul Variation (OM-A 7.5.18)
    // -------------------------------------------------------------
    if (flightCrewCount >= 4 && sectorsPlanned === 1) {
      notes.push('4-Crew Long Haul Variation Applied (OM-A 7.5.18): Single sector scheduled FDP max 17:00h.');
      const baseFDP = 17.0;
      const maxPermissibleFDP = 19.25; // 19h 15m
      
      const cutoffUTC = new Date(reportDateUTC.getTime() + maxPermissibleFDP * 3600 * 1000);
      const cutoffLocal = new Date(cutoffUTC.getTime() + localTimezoneOffsetHours * 3600 * 1000);

      return {
        isProhibited: false,
        prohibitionReason: null,
        timeBand: localTimeBand,
        acclimatisedStatus: isAcclimatised ? 'Acclimatised' : 'Not Acclimatised',
        effectiveSectorsUsed: 1,
        baseAllowableFDPHours: baseFDP,
        baseAllowableFDPFormatted: '17:00',
        inflightReliefExtensionHours: 0,
        inflightReliefExtensionFormatted: '00:00',
        splitDutyExtensionHours: 0,
        splitDutyExtensionFormatted: '00:00',
        totalExtensionsHours: 0,
        totalExtensionsFormatted: '00:00',
        finalMaxPermissibleFDPHours: maxPermissibleFDP,
        finalMaxPermissibleFDPFormatted: '19:15',
        reportTimestampUTC: this.formatDateTime(reportDateUTC),
        reportTimestampLocal: this.formatDateTime(reportDateLocal),
        cutoffTimestampUTC: this.formatDateTime(cutoffUTC),
        cutoffTimestampLocal: this.formatDateTime(cutoffLocal),
        notes
      };
    }

    // -------------------------------------------------------------
    // STEP 2: Two-Pilot Long Range Sector Scaling (CAD 1901 2.11 / OM-A 7.5.9)
    // -------------------------------------------------------------
    let effectiveSectors = sectorsPlanned;

    if (flightCrewCount === 2 && longestSectorHours > 7) {
      if (longestSectorHours <= 9) {
        effectiveSectors = isAcclimatised ? 2 : 4;
        notes.push(`2-Pilot Long Range Scaling: Longest sector (${this.formatHoursToHHMM(longestSectorHours)}) > 7h to 9h scaled sector count from ${sectorsPlanned} to ${effectiveSectors}.`);
      } else if (longestSectorHours <= 11) {
        effectiveSectors = isAcclimatised ? 3 : 4;
        notes.push(`2-Pilot Long Range Scaling: Longest sector (${this.formatHoursToHHMM(longestSectorHours)}) > 9h to 11h scaled sector count from ${sectorsPlanned} to ${effectiveSectors}.`);
      } else if (longestSectorHours > 11) {
        if (!isAcclimatised) {
          isProhibited = true;
          prohibitionReason = 'PROHIBITED: 2-Pilot non-acclimatised operation with a sector exceeding 11 hours is NOT PERMITTED under CAAM CAD 1901 Section 2.11 / OM-A 7.5.9.';
        } else {
          effectiveSectors = 4;
          notes.push(`2-Pilot Long Range Scaling: Longest sector (${this.formatHoursToHHMM(longestSectorHours)}) > 11h scaled sector count from ${sectorsPlanned} to 4.`);
        }
      }
    }

    if (isProhibited) {
      return {
        isProhibited: true,
        prohibitionReason,
        timeBand: localTimeBand,
        acclimatisedStatus: isAcclimatised ? 'Acclimatised' : 'Not Acclimatised',
        effectiveSectorsUsed: effectiveSectors,
        baseAllowableFDPHours: 0,
        baseAllowableFDPFormatted: '00:00',
        inflightReliefExtensionHours: 0,
        inflightReliefExtensionFormatted: '00:00',
        splitDutyExtensionHours: 0,
        splitDutyExtensionFormatted: '00:00',
        totalExtensionsHours: 0,
        totalExtensionsFormatted: '00:00',
        finalMaxPermissibleFDPHours: 0,
        finalMaxPermissibleFDPFormatted: '00:00',
        reportTimestampUTC: this.formatDateTime(reportDateUTC),
        reportTimestampLocal: this.formatDateTime(reportDateLocal),
        cutoffTimestampUTC: null,
        cutoffTimestampLocal: null,
        notes: [prohibitionReason, ...notes]
      };
    }

    // -------------------------------------------------------------
    // STEP 3: Baseline Table Lookup (Table A or Table B)
    // -------------------------------------------------------------
    let baseFDP = 0;

    if (isAcclimatised) {
      const tableRow = this.TABLE_A_ACCLIMATISED[localTimeBand] || this.TABLE_A_ACCLIMATISED['2200-0559'];
      const sectorIndex = Math.min(Math.max(effectiveSectors - 1, 0), tableRow.length - 1);
      baseFDP = tableRow[sectorIndex];
    } else {
      const categoryKey = precedingRestCategory === 'BETWEEN_18_AND_30' ? 'BETWEEN_18_AND_30' : 'UP_TO_18_OR_OVER_30';
      const tableRow = this.TABLE_B_NOT_ACCLIMATISED[categoryKey];
      const sectorIndex = Math.min(Math.max(effectiveSectors - 1, 0), tableRow.length - 1);
      baseFDP = tableRow[sectorIndex];
    }

    // -------------------------------------------------------------
    // STEP 4: In-Flight Relief Extension (CAD 1901 2.12 / OM-A 7.5.10)
    // -------------------------------------------------------------
    let inflightExtension = 0;
    let inflightCap = 18.0; // Bunk Cap

    if (inflightReliefType && inflightReliefType !== 'NONE') {
      if (inflightRestHours < 3.0) {
        notes.push('In-Flight Relief Warning: In-flight rest is less than 3 hours (minimum threshold required). No FDP extension granted.');
      } else {
        if (inflightReliefType === 'BUNK') {
          inflightExtension = inflightRestHours * 0.5; // 50% credit
          inflightCap = 18.0;
          notes.push(`In-Flight Relief (Bunk): +50% credit applied (${this.formatHoursToHHMM(inflightRestHours)} rest = +${this.formatHoursToHHMM(inflightExtension)} extension).`);
        } else if (inflightReliefType === 'SEAT') {
          inflightExtension = inflightRestHours * (1.0 / 3.0); // 33.3% credit
          inflightCap = 15.0;
          notes.push(`In-Flight Relief (Business Seat): +33.3% credit applied (${this.formatHoursToHHMM(inflightRestHours)} rest = +${this.formatHoursToHHMM(inflightExtension)} extension).`);
        }
      }
    }

    // -------------------------------------------------------------
    // STEP 5: Split Duty Extension (CAD 1901 2.13 / OM-A 7.5.11)
    // -------------------------------------------------------------
    let splitExtension = 0;

    if (splitDutyGroundRestHours > 0) {
      const bufferMinutes = (fleetType === 'A330' || fleetType === 'A350') ? 45 : 30;
      const bufferHours = bufferMinutes / 60.0;
      const netGroundRest = splitDutyGroundRestHours - bufferHours;

      if (netGroundRest < 3.0) {
        notes.push(`Split Duty Notice: Net ground rest after ${bufferMinutes}m duty buffer (${this.formatHoursToHHMM(netGroundRest)}) is less than 3 hours. No split duty extension granted.`);
      } else {
        const applicableRest = Math.min(netGroundRest, 10.0);
        splitExtension = applicableRest * 0.5; // 50% credit
        notes.push(`Split Duty: Net ground rest ${this.formatHoursToHHMM(netGroundRest)} after ${bufferMinutes}m buffer grants +50% extension (+${this.formatHoursToHHMM(splitExtension)}).`);
      }
    }

    // -------------------------------------------------------------
    // STEP 6: Combine Extensions & Apply Hard Regulatory Caps
    // -------------------------------------------------------------
    let rawTotalFDP = baseFDP + inflightExtension + splitExtension;
    let finalFDP = rawTotalFDP;

    if (inflightReliefType === 'SEAT' && finalFDP > 15.0) {
      finalFDP = 15.0;
      notes.push('Regulatory Cap Applied: In-flight seat rest FDP is capped at maximum 15:00 hours.');
    } else if (inflightReliefType === 'BUNK' && finalFDP > 18.0) {
      finalFDP = 18.0;
      notes.push('Regulatory Cap Applied: In-flight bunk rest FDP is capped at maximum 18:00 hours.');
    }

    // -------------------------------------------------------------
    // STEP 7: Calculate On-Chocks Cutoff Timestamps
    // -------------------------------------------------------------
    const cutoffUTC = new Date(reportDateUTC.getTime() + finalFDP * 3600 * 1000);
    const cutoffLocal = new Date(cutoffUTC.getTime() + localTimezoneOffsetHours * 3600 * 1000);

    return {
      isProhibited: false,
      prohibitionReason: null,
      timeBand: localTimeBand,
      acclimatisedStatus: isAcclimatised ? 'Acclimatised' : 'Not Acclimatised',
      effectiveSectorsUsed: effectiveSectors,
      baseAllowableFDPHours: baseFDP,
      baseAllowableFDPFormatted: this.formatHoursToHHMM(baseFDP),
      inflightReliefExtensionHours: inflightExtension,
      inflightReliefExtensionFormatted: this.formatHoursToHHMM(inflightExtension),
      splitDutyExtensionHours: splitExtension,
      splitDutyExtensionFormatted: this.formatHoursToHHMM(splitExtension),
      totalExtensionsHours: inflightExtension + splitExtension,
      totalExtensionsFormatted: this.formatHoursToHHMM(inflightExtension + splitExtension),
      finalMaxPermissibleFDPHours: finalFDP,
      finalMaxPermissibleFDPFormatted: this.formatHoursToHHMM(finalFDP),
      reportTimestampUTC: this.formatDateTime(reportDateUTC),
      reportTimestampLocal: this.formatDateTime(reportDateLocal),
      cutoffTimestampUTC: this.formatDateTime(cutoffUTC),
      cutoffTimestampLocal: this.formatDateTime(cutoffLocal),
      notes
    };
  }
}

// Node.js export compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaxFDPEngine;
}
