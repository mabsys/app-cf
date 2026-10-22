/**
 * CAAM/BOP/FTL/1 Discretion Assistant Controller
 * ------------------------------------------------------------------
 * Manages form state, OOOI/ACARS voyage timestamps, local time conversions
 * using `airports.js`, live FDP discretion math, validation, and PDF overlay mapping.
 *
 * Applicable Standard: CAAM CAD 1901 / OM-A Chapter 7 / CAAM/BOP/FTL/1
 */

// Relative import assuming file sits inside /js/engines/
import { findAirport, searchAirports } from '../data/airports.js';

// Safe fallback helper if loaded directly in a non-ESM script environment
const safeFindAirport = (typeof findAirport === 'function') 
  ? findAirport 
  : (code) => (window.MAB_AIRPORTS ? window.MAB_AIRPORTS.find(a => a.iata === code || a.icao === code) : null);

const safeSearchAirports = (typeof searchAirports === 'function')
  ? searchAirports
  : (query, limit = 6) => (window.MAB_AIRPORTS ? window.MAB_AIRPORTS.slice(0, limit) : []);

// ==================================================================
// 1. TIME & LOCATION UTILITIES
// ==================================================================

/**
 * Formats integer minutes into HH:MM string.
 */
export function formatMinutesToHHMM(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) return '00:00';
  const absMin = Math.abs(totalMinutes);
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
  const mm = String(absMin % 60).padStart(2, '0');
  return `${totalMinutes < 0 ? '-' : ''}${hh}:${mm}`;
}

/**
 * Parses HH:MM or HHMM time string into total minutes from midnight.
 */
export function parseHHMMToMinutes(hhmmStr) {
  if (!hhmmStr || typeof hhmmStr !== 'string') return 0;
  const cleaned = hhmmStr.trim().replace(':', '');
  if (cleaned.length < 3 || cleaned.length > 4) return 0;
  const mm = parseInt(cleaned.slice(-2), 10) || 0;
  const hh = parseInt(cleaned.slice(0, -2), 10) || 0;
  return (hh * 60) + mm;
}

/**
 * Calculates duration in minutes between two UTC HH:MM times (handles overnight crossing).
 */
export function calculateUTCMinutesDuration(startHHMM, endHHMM) {
  const startMins = parseHHMMToMinutes(startHHMM);
  let endMins = parseHHMMToMinutes(endHHMM);
  if (endMins < startMins) {
    endMins += 24 * 60; // Crosses UTC midnight
  }
  return endMins - startMins;
}

/**
 * Converts a UTC HH:MM timestamp into Local HH:MM string using airport UTC offset.
 */
export function convertUTCToLocal(utcHHMM, airportCode) {
  if (!utcHHMM) return { localFormatted: '--:--', tzOffsetFormatted: 'UTC+0', airportName: '' };
  
  const airport = safeFindAirport(airportCode);
  const tzOffset = airport ? airport.tzOffset : 8; // Default to UTC+8 (Malaysia) if unspecified
  
  const utcMins = parseHHMMToMinutes(utcHHMM);
  let localMins = utcMins + Math.round(tzOffset * 60);
  
  // Wrap around 24 hours
  while (localMins < 0) localMins += 24 * 60;
  localMins = localMins % (24 * 60);
  
  const sign = tzOffset >= 0 ? '+' : '';
  const offsetLabel = Number.isInteger(tzOffset) 
    ? `UTC${sign}${tzOffset}` 
    : `UTC${sign}${tzOffset.toFixed(1)}`;

  return {
    localFormatted: formatMinutesToHHMM(localMins),
    tzOffsetFormatted: offsetLabel,
    airportName: airport ? airport.name : airportCode || ''
  };
}

/**
 * Projects next sector departure UTC timestamp by adding turnaround minutes to last arrival.
 */
export function projectNextSectorDeparture(lastArrivalUTC, turnaroundMinutes = 45) {
  if (!lastArrivalUTC) return '00:00';
  const arrMins = parseHHMMToMinutes(lastArrivalUTC);
  const projMins = (arrMins + turnaroundMinutes) % (24 * 60);
  return formatMinutesToHHMM(projMins);
}


// ==================================================================
// 2. FORM STATE INITIALIZER
// ==================================================================

/**
 * Creates default state object for CAAM/BOP/FTL/1 form.
 * Auto-prefills baseline FTL calculations if `maxFdpOutput` is supplied.
 */
export function createDefaultFormState(maxFdpOutput = null) {
  const todayISO = new Date().toISOString().split('T')[0];

  const state = {
    // PART A: General Metadata
    partA: {
      operatorName: 'MALAYSIA AIRLINES BERHAD (MAB)',
      aircraftRegistration: '9M-MTB',
      flightNumber: 'MH123',
      flightDate: todayISO,
      picName: 'CAPT. AHMAD RAZALI',
      crewType: 'flight_crew', // 'flight_crew' | 'cabin_crew'
    },

    // PART B: Questions 1-6 Baseline FTL
    partBBaseline: {
      isAcclimatised: true,
      precedingRestHours: 12.0,
      allowableTableFdpMinutes: 13 * 60, // 13:00 Base
      splitDutyRestHours: 0,
      splitDutyCreditMinutes: 0,
      inflightReliefType: 'none', // 'none' | 'bunk' | 'seat'
      inflightReliefRestHours: 0,
      inflightReliefCreditMinutes: 0,
      totalExtensionsAllowedMinutes: 0,
      revisedAllowableFdpMinutes: 13 * 60, // 13:00 Baseline
    },

    // PART B: Voyage Timestamps & Sectors Table
    voyage: {
      dutyStartAirport: 'WMKK',
      dutyStartUTC: '00:15',
      dutyStartLocal: '08:15',

      dutyEndAirport: 'WMKK',
      dutyEndUTC: '14:00',
      dutyEndLocal: '22:00',

      sectors: [
        {
          sectorNumber: 1,
          depAirport: 'WMKK',
          arrAirport: 'WBKK',
          schedDepUTC: '01:00',
          schedArrUTC: '03:30',
          actOffChocksUTC: '01:15',
          actOnChocksUTC: '04:02',
          actOffChocksLocal: '09:15',
          actOnChocksLocal: '12:02',
          blockTimeMinutes: 167,
        },
        {
          sectorNumber: 2,
          depAirport: 'WBKK',
          arrAirport: 'WMKK',
          schedDepUTC: '04:15',
          schedArrUTC: '06:45',
          actOffChocksUTC: '04:47',
          actOnChocksUTC: '07:22',
          actOffChocksLocal: '12:47',
          actOnChocksLocal: '15:22',
          blockTimeMinutes: 155,
        }
      ],

      // Summary Math
      plannedFdpMinutes: 12 * 60,
      actualFdpMinutes: 13 * 60 + 45, // 13:45
      discretionExercisedMinutes: 45,  // 00:45 Exceeded
      isDiscretionTriggered: true,

      maxPermittedFlyingHours28d: 100,
      actualFlyingHoursFlown28d: 78.5,
      actualFlightTimeThisDutyMinutes: 322, // 5h 22m
    },

    // PART C: Justification & Crew Sign-Off
    partC: {
      delayCategories: {
        atc: true,
        technical: false,
        weather: false,
        others: false,
      },
      justificationText: 'Heavy outbound ATC departure congestion at WMKK (+15m) followed by weather hold over WBKK (+25m) during sector 1 arrival.',
      crewMembers: [
        { rank: 'CAPT', name: 'AHMAD RAZALI', extensionMinutes: 45 },
        { rank: 'FO', name: 'TAN KAH WAI', extensionMinutes: 45 },
      ],
      signatureDataUrl: null, // Base64 PNG
      reportDate: todayISO,
    }
  };

  // Pre-fill from `max-fdp-calculator.js` output if available
  if (maxFdpOutput) {
    populateFromMaxFdpEngine(state, maxFdpOutput);
  } else {
    recalculateVoyageTotals(state);
  }

  return state;
}

/**
 * Pre-fills form state from an active `max-fdp-calculator.js` engine result object.
 */
export function populateFromMaxFdpEngine(state, maxFdpResult) {
  if (!maxFdpResult) return;

  // Prefill Q1-Q6
  state.partBBaseline.isAcclimatised = maxFdpResult.isAcclimatised ?? true;
  state.partBBaseline.precedingRestHours = maxFdpResult.precedingRestHours ?? 12.0;
  
  if (maxFdpResult.baseAllowableFDPMinutes) {
    state.partBBaseline.allowableTableFdpMinutes = maxFdpResult.baseAllowableFDPMinutes;
  }
  if (maxFdpResult.splitDutyExtensionMinutes) {
    state.partBBaseline.splitDutyCreditMinutes = maxFdpResult.splitDutyExtensionMinutes;
  }
  if (maxFdpResult.inflightReliefExtensionMinutes) {
    state.partBBaseline.inflightReliefCreditMinutes = maxFdpResult.inflightReliefExtensionMinutes;
  }
  if (maxFdpResult.totalExtensionsMinutes) {
    state.partBBaseline.totalExtensionsAllowedMinutes = maxFdpResult.totalExtensionsMinutes;
  }
  if (maxFdpResult.finalMaxPermissibleFDPMinutes) {
    state.partBBaseline.revisedAllowableFdpMinutes = maxFdpResult.finalMaxPermissibleFDPMinutes;
  }

  // Pre-fill Duty Start if reported
  if (maxFdpResult.reportTimeUTC) {
    state.voyage.dutyStartUTC = maxFdpResult.reportTimeUTC;
    const localRes = convertUTCToLocal(maxFdpResult.reportTimeUTC, state.voyage.dutyStartAirport);
    state.voyage.dutyStartLocal = localRes.localFormatted;
  }

  recalculateVoyageTotals(state);
}


// ==================================================================
// 3. VOYAGE ACTIONS & SECTOR MANAGEMENT
// ==================================================================

/**
 * Appends a new sector leg card to the voyage table.
 */
export function addSectorLeg(state) {
  const currentSectors = state.voyage.sectors;
  const nextSeq = currentSectors.length + 1;
  const lastSector = currentSectors.length > 0 ? currentSectors[currentSectors.length - 1] : null;

  const depAirport = lastSector ? lastSector.arrAirport : 'WMKK';
  const arrAirport = depAirport === 'WMKK' ? 'WBKK' : 'WMKK';
  
  const projDepUTC = lastSector ? projectNextSectorDeparture(lastSector.actOnChocksUTC, 45) : '08:00';
  const projArrUTC = formatMinutesToHHMM((parseHHMMToMinutes(projDepUTC) + 120) % (24 * 60));

  const depLocal = convertUTCToLocal(projDepUTC, depAirport);
  const arrLocal = convertUTCToLocal(projArrUTC, arrAirport);

  currentSectors.push({
    sectorNumber: nextSeq,
    depAirport,
    arrAirport,
    schedDepUTC: projDepUTC,
    schedArrUTC: projArrUTC,
    actOffChocksUTC: projDepUTC,
    actOnChocksUTC: projArrUTC,
    actOffChocksLocal: depLocal.localFormatted,
    actOnChocksLocal: arrLocal.localFormatted,
    blockTimeMinutes: 120,
  });

  recalculateVoyageTotals(state);
}

/**
 * Removes a sector leg by index.
 */
export function removeSectorLeg(state, index) {
  if (state.voyage.sectors.length <= 1) return; // Must keep at least 1 sector
  state.voyage.sectors.splice(index, 1);
  // Re-index
  state.voyage.sectors.forEach((sec, idx) => {
    sec.sectorNumber = idx + 1;
  });
  recalculateVoyageTotals(state);
}

/**
 * Updates timestamps or airports for a specific sector and triggers conversions.
 */
export function updateSectorTimes(state, sectorIndex, updates) {
  const sector = state.voyage.sectors[sectorIndex];
  if (!sector) return;

  Object.assign(sector, updates);

  // Recalculate local times
  if (updates.actOffChocksUTC || updates.depAirport) {
    const depLocal = convertUTCToLocal(sector.actOffChocksUTC, sector.depAirport);
    sector.actOffChocksLocal = depLocal.localFormatted;
  }
  if (updates.actOnChocksUTC || updates.arrAirport) {
    const arrLocal = convertUTCToLocal(sector.actOnChocksUTC, sector.arrAirport);
    sector.actOnChocksLocal = arrLocal.localFormatted;
  }

  // Recalculate sector block time
  if (sector.actOffChocksUTC && sector.actOnChocksUTC) {
    sector.blockTimeMinutes = calculateUTCMinutesDuration(sector.actOffChocksUTC, sector.actOnChocksUTC);
  }

  // Cascading turnaround auto-forwarding to next sector if available
  if (updates.actOnChocksUTC && sectorIndex < state.voyage.sectors.length - 1) {
    const nextSector = state.voyage.sectors[sectorIndex + 1];
    if (nextSector) {
      nextSector.depAirport = sector.arrAirport;
      const projNextDep = projectNextSectorDeparture(sector.actOnChocksUTC, 45);
      nextSector.actOffChocksUTC = projNextDep;
      const depLocal = convertUTCToLocal(projNextDep, nextSector.depAirport);
      nextSector.actOffChocksLocal = depLocal.localFormatted;
    }
  }

  recalculateVoyageTotals(state);
}

/**
 * Recalculates actual FDP, total flight hours, and discretion exercised.
 */
export function recalculateVoyageTotals(state) {
  const v = state.voyage;
  const b = state.partBBaseline;

  // 1. Total Flight Time across sectors
  let totalFlightMins = 0;
  v.sectors.forEach(sec => {
    if (sec.actOffChocksUTC && sec.actOnChocksUTC) {
      sec.blockTimeMinutes = calculateUTCMinutesDuration(sec.actOffChocksUTC, sec.actOnChocksUTC);
      totalFlightMins += sec.blockTimeMinutes;
    }
  });
  v.actualFlightTimeThisDutyMinutes = totalFlightMins;

  // 2. Auto-set final Duty End location & time from last sector arrival if not manually detached
  if (v.sectors.length > 0) {
    const lastSec = v.sectors[v.sectors.length - 1];
    v.dutyEndAirport = lastSec.arrAirport;
    // Standard 15m post-flight duty buffer after on-chocks
    const postFlightDutyMins = (parseHHMMToMinutes(lastSec.actOnChocksUTC) + 15) % (24 * 60);
    v.dutyEndUTC = formatMinutesToHHMM(postFlightDutyMins);
    const endLocal = convertUTCToLocal(v.dutyEndUTC, v.dutyEndAirport);
    v.dutyEndLocal = endLocal.localFormatted;
  }

  // 3. Actual FDP = Duty End UTC - Duty Start UTC
  v.actualFdpMinutes = calculateUTCMinutesDuration(v.dutyStartUTC, v.dutyEndUTC);

  // 4. Discretion Exercised = Math.max(0, Actual FDP - Revised Allowable FDP)
  const revisedMaxMins = b.revisedAllowableFdpMinutes || 13 * 60;
  v.discretionExercisedMinutes = Math.max(0, v.actualFdpMinutes - revisedMaxMins);
  v.isDiscretionTriggered = v.discretionExercisedMinutes > 0;

  // 5. Sync discretion minutes to Part C crew list
  if (state.partC && state.partC.crewMembers) {
    state.partC.crewMembers.forEach(crew => {
      crew.extensionMinutes = v.discretionExercisedMinutes;
    });
  }
}


// ==================================================================
// 4. FORM VALIDATION & GUARD
// ==================================================================

/**
 * Validates form state and returns errors/warnings object.
 */
export function validateForm(state) {
  const errors = [];
  const warnings = [];

  const a = state.partA;
  const v = state.voyage;
  const c = state.partC;

  if (!a.operatorName.trim()) errors.push('Operator Name is required (Part A).');
  if (!a.aircraftRegistration.trim()) errors.push('Aircraft Registration is required (Part A).');
  if (!a.flightNumber.trim()) errors.push('Flight Number is required (Part A).');
  if (!a.picName.trim()) errors.push('PIC Name is required (Part A).');

  if (v.sectors.length === 0) {
    errors.push('At least one flight sector must be logged in voyage details (Part B).');
  }

  // Validate sector chronology
  v.sectors.forEach((sec, idx) => {
    if (!sec.actOffChocksUTC) errors.push(`Sector ${idx + 1} departure time is missing.`);
    if (!sec.actOnChocksUTC) errors.push(`Sector ${idx + 1} arrival time is missing.`);
    
    if (idx > 0) {
      const prevSec = v.sectors[idx - 1];
      const prevArr = parseHHMMToMinutes(prevSec.actOnChocksUTC);
      const currDep = parseHHMMToMinutes(sec.actOffChocksUTC);
      if (currDep < prevArr && Math.abs(currDep - prevArr) < 12 * 60) {
        warnings.push(`Sector ${idx + 1} departure (${sec.actOffChocksUTC}) appears prior to Sector ${idx} arrival (${prevSec.actOnChocksUTC}).`);
      }
    }
  });

  // Discretion justification checks if discretion exercised
  if (v.isDiscretionTriggered) {
    const anyCatSelected = Object.values(c.delayCategories).some(Boolean);
    if (!anyCatSelected) {
      errors.push('At least one Delay Reason category (ATC, Technical, Weather, Others) must be selected in Part C.');
    }
    if (!c.justificationText || c.justificationText.trim().length < 10) {
      errors.push('Please provide a detailed justification explanation (minimum 10 characters) in Part C.');
    }
    if (!c.signatureDataUrl) {
      warnings.push('PIC Digital Touch Signature is missing in Part C.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}


// ==================================================================
// 5. PDF OVERLAY COORDINATES MATRIX (`pdf-lib` / CAAM Template Mapping)
// ==================================================================

/**
 * Maps current form state into X/Y page coordinates for overlaying text onto 
 * the official `CAAMBOPFTL1.pdf` template.
 * Page geometry assumed: Standard A4 (595.28 x 841.89 pt).
 */
export function mapFormToPdfCoordinates(state) {
  const a = state.partA;
  const b = state.partBBaseline;
  const v = state.voyage;
  const c = state.partC;

  return {
    page1: {
      // PART A
      operatorName: { text: a.operatorName, x: 130, y: 772, size: 9 },
      aircraftRegistration: { text: a.aircraftRegistration, x: 440, y: 772, size: 9 },
      flightNumber: { text: a.flightNumber, x: 130, y: 752, size: 9 },
      flightDate: { text: a.flightDate, x: 440, y: 752, size: 9 },
      picName: { text: a.picName, x: 130, y: 732, size: 9 },
      
      // Crew Type Checkboxes
      isFlightCrewCheck: { check: a.crewType === 'flight_crew', x: 440, y: 732 },
      isCabinCrewCheck: { check: a.crewType === 'cabin_crew', x: 510, y: 732 },

      // PART B: Questions 1-6
      q1AcclimatisedYes: { check: b.isAcclimatised, x: 310, y: 680 },
      q1AcclimatisedNo: { check: !b.isAcclimatised, x: 350, y: 680 },
      q1PrecedingRest: { text: `${b.precedingRestHours} hrs`, x: 480, y: 680, size: 9 },

      q2BaseTableFdp: { text: formatMinutesToHHMM(b.allowableTableFdpMinutes), x: 440, y: 658, size: 9 },
      
      q3SplitRestHours: { text: `${b.splitDutyRestHours} hrs`, x: 260, y: 636, size: 9 },
      q3SplitCredit: { text: formatMinutesToHHMM(b.splitDutyCreditMinutes), x: 440, y: 636, size: 9 },

      q4ReliefBunkCheck: { check: b.inflightReliefType === 'bunk', x: 210, y: 614 },
      q4ReliefSeatCheck: { check: b.inflightReliefType === 'seat', x: 260, y: 614 },
      q4ReliefCredit: { text: formatMinutesToHHMM(b.inflightReliefCreditMinutes), x: 440, y: 614, size: 9 },

      q5TotalExtensions: { text: formatMinutesToHHMM(b.totalExtensionsAllowedMinutes), x: 440, y: 592, size: 9 },
      q6RevisedAllowableFdp: { text: formatMinutesToHHMM(b.revisedAllowableFdpMinutes), x: 440, y: 570, size: 9 },

      // PART B: Voyage Schedule Table
      dutyStartRow: {
        place: v.dutyStartAirport,
        utc: v.dutyStartUTC,
        local: v.dutyStartLocal,
        y: 508
      },

      sectorsRows: v.sectors.slice(0, 4).map((sec, idx) => ({
        depPlace: sec.depAirport,
        schedDepUTC: sec.schedDepUTC,
        schedDepLocal: convertUTCToLocal(sec.schedDepUTC, sec.depAirport).localFormatted,
        actDepUTC: sec.actOffChocksUTC,
        actDepLocal: sec.actOffChocksLocal,

        arrPlace: sec.arrAirport,
        schedArrUTC: sec.schedArrUTC,
        schedArrLocal: convertUTCToLocal(sec.schedArrUTC, sec.arrAirport).localFormatted,
        actArrUTC: sec.actOnChocksUTC,
        actArrLocal: sec.actOnChocksLocal,

        y: 486 - (idx * 22)
      })),

      dutyEndRow: {
        place: v.dutyEndAirport,
        utc: v.dutyEndUTC,
        local: v.dutyEndLocal,
        y: 398
      },

      // PART B: Summary Totals Row
      plannedFdpTotal: { text: formatMinutesToHHMM(v.plannedFdpMinutes), x: 120, y: 360, size: 9 },
      actualFdpTotal: { text: formatMinutesToHHMM(v.actualFdpMinutes), x: 240, y: 360, size: 9 },
      discretionExercised: { text: formatMinutesToHHMM(v.discretionExercisedMinutes), x: 380, y: 360, size: 10, isBold: true },
      
      maxFlyingHoursCap: { text: `${v.maxPermittedFlyingHours28d} hrs`, x: 240, y: 335, size: 9 },
      actualHoursFlown: { text: `${formatMinutesToHHMM(v.actualFlightTimeThisDutyMinutes)} hrs`, x: 440, y: 335, size: 9 },
    },

    page2: {
      // PART C: Justification Checkboxes
      atcCheck: { check: c.delayCategories.atc, x: 120, y: 770 },
      techCheck: { check: c.delayCategories.technical, x: 200, y: 770 },
      weatherCheck: { check: c.delayCategories.weather, x: 290, y: 770 },
      othersCheck: { check: c.delayCategories.others, x: 380, y: 770 },

      // Explanation Box
      justificationText: { text: c.justificationText, x: 60, y: 740, maxWidth: 480, lineSpacing: 14, size: 9 },

      // Crew Members List (up to 10 rows)
      crewRows: c.crewMembers.slice(0, 10).map((crew, idx) => ({
        rank: crew.rank,
        name: crew.name,
        extension: formatMinutesToHHMM(crew.extensionMinutes),
        y: 580 - (idx * 20)
      })),

      // PIC Signature Block
      picSignatureImage: c.signatureDataUrl ? { dataUrl: c.signatureDataUrl, x: 360, y: 220, width: 140, height: 45 } : null,
      picSignatureDate: { text: c.reportDate, x: 120, y: 210, size: 9 },
    }
  };
}


// ==================================================================
// 6. CLIENT-SIDE PDF GENERATOR ENGINE (`pdf-lib` Integration)
// ==================================================================

/**
 * Applies the form state overlays onto a `pdf-lib` PDFDocument instance.
 * @param {Object} pdfDoc - `PDFDocument` instance loaded via `pdf-lib`
 * @param {Object} state - Form state object
 */
export async function overlayFormOnPdfTemplate(pdfDoc, state) {
  if (!pdfDoc) throw new Error('pdfDoc instance is required.');

  const coords = mapFormToPdfCoordinates(state);
  const pages = pdfDoc.getPages();
  const page1 = pages[0];
  const page2 = pages.length > 1 ? pages[1] : pages[0];

  const font = await pdfDoc.embedFont('Helvetica');
  const fontBold = await pdfDoc.embedFont('Helvetica-Bold');

  // Helper function to draw text
  const drawT = (page, item) => {
    if (!item || item.text === undefined || item.text === null) return;
    page.drawText(String(item.text), {
      x: item.x,
      y: item.y,
      size: item.size || 9,
      font: item.isBold ? fontBold : font,
    });
  };

  // Helper function to draw checkmarks
  const drawC = (page, item) => {
    if (!item || !item.check) return;
    page.drawText('X', {
      x: item.x,
      y: item.y,
      size: 10,
      font: fontBold,
    });
  };

  // --- PAGE 1 OVERLAYS ---
  const p1 = coords.page1;
  drawT(page1, p1.operatorName);
  drawT(page1, p1.aircraftRegistration);
  drawT(page1, p1.flightNumber);
  drawT(page1, p1.flightDate);
  drawT(page1, p1.picName);

  drawC(page1, p1.isFlightCrewCheck);
  drawC(page1, p1.isCabinCrewCheck);

  drawC(page1, p1.q1AcclimatisedYes);
  drawC(page1, p1.q1AcclimatisedNo);
  drawT(page1, p1.q1PrecedingRest);

  drawT(page1, p1.q2BaseTableFdp);
  drawT(page1, p1.q3SplitRestHours);
  drawT(page1, p1.q3SplitCredit);

  drawC(page1, p1.q4ReliefBunkCheck);
  drawC(page1, p1.q4ReliefSeatCheck);
  drawT(page1, p1.q4ReliefCredit);

  drawT(page1, p1.q5TotalExtensions);
  drawT(page1, p1.q6RevisedAllowableFdp);

  // Duty Start Row
  if (p1.dutyStartRow) {
    drawT(page1, { text: p1.dutyStartRow.place, x: 60, y: p1.dutyStartRow.y });
    drawT(page1, { text: p1.dutyStartRow.utc, x: 180, y: p1.dutyStartRow.y });
    drawT(page1, { text: p1.dutyStartRow.local, x: 260, y: p1.dutyStartRow.y });
  }

  // Voyage Sectors
  p1.sectorsRows.forEach(sec => {
    drawT(page1, { text: sec.depPlace, x: 60, y: sec.y });
    drawT(page1, { text: sec.actDepUTC, x: 180, y: sec.y });
    drawT(page1, { text: sec.actDepLocal, x: 260, y: sec.y });

    drawT(page1, { text: sec.arrPlace, x: 340, y: sec.y });
    drawT(page1, { text: sec.actArrUTC, x: 420, y: sec.y });
    drawT(page1, { text: sec.actArrLocal, x: 490, y: sec.y });
  });

  // Duty End Row
  if (p1.dutyEndRow) {
    drawT(page1, { text: p1.dutyEndRow.place, x: 340, y: p1.dutyEndRow.y });
    drawT(page1, { text: p1.dutyEndRow.utc, x: 420, y: p1.dutyEndRow.y });
    drawT(page1, { text: p1.dutyEndRow.local, x: 490, y: p1.dutyEndRow.y });
  }

  // Summary Totals
  drawT(page1, p1.plannedFdpTotal);
  drawT(page1, p1.actualFdpTotal);
  drawT(page1, p1.discretionExercised);
  drawT(page1, p1.maxFlyingHoursCap);
  drawT(page1, p1.actualHoursFlown);


  // --- PAGE 2 OVERLAYS ---
  const p2 = coords.page2;
  drawC(page2, p2.atcCheck);
  drawC(page2, p2.techCheck);
  drawC(page2, p2.weatherCheck);
  drawC(page2, p2.othersCheck);

  // Multi-line justification text
  if (p2.justificationText && p2.justificationText.text) {
    const text = p2.justificationText.text;
    const words = text.split(' ');
    let currentLine = '';
    let startY = p2.justificationText.y;

    words.forEach(word => {
      if ((currentLine + word).length > 70) {
        page2.drawText(currentLine, { x: p2.justificationText.x, y: startY, size: 9, font });
        startY -= p2.justificationText.lineSpacing;
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    if (currentLine) {
      page2.drawText(currentLine, { x: p2.justificationText.x, y: startY, size: 9, font });
    }
  }

  // Crew List
  p2.crewRows.forEach(crew => {
    page2.drawText(crew.rank, { x: 60, y: crew.y, size: 9, font });
    page2.drawText(crew.name, { x: 140, y: crew.y, size: 9, font });
    page2.drawText(crew.extension, { x: 440, y: crew.y, size: 9, font });
  });

  // Signature image
  if (p2.picSignatureImage && p2.picSignatureImage.dataUrl) {
    try {
      const pngImage = await pdfDoc.embedPng(p2.picSignatureImage.dataUrl);
      page2.drawImage(pngImage, {
        x: p2.picSignatureImage.x,
        y: p2.picSignatureImage.y,
        width: p2.picSignatureImage.width,
        height: p2.picSignatureImage.height,
      });
    } catch (e) {
      console.warn('Could not embed signature PNG image:', e);
    }
  }

  drawT(page2, p2.picSignatureDate);

  return pdfDoc;
}


// ==================================================================
// 7. ORCHESTRATOR CONTROLLER CLASS (`CAAMFTL1Controller`)
// ==================================================================

export class CAAMFTL1Controller {
  constructor(initialMaxFdpOutput = null) {
    this.state = createDefaultFormState(initialMaxFdpOutput);
    this.listeners = [];
  }

  /**
   * Returns current form state.
   */
  getState() {
    return this.state;
  }

  /**
   * Binds subscriber listener for UI state changes.
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.state));
  }

  /**
   * Updates Part A metadata.
   */
  updatePartA(partAUpdates) {
    Object.assign(this.state.partA, partAUpdates);
    this.notify();
  }

  /**
   * Updates Part B baseline inputs (Q1-Q6).
   */
  updatePartBBaseline(baselineUpdates) {
    Object.assign(this.state.partBBaseline, baselineUpdates);
    recalculateVoyageTotals(this.state);
    this.notify();
  }

  /**
   * Updates sector leg times/airports.
   */
  updateSector(index, updates) {
    updateSectorTimes(this.state, index, updates);
    this.notify();
  }

  /**
   * Adds a sector leg.
   */
  addSector() {
    addSectorLeg(this.state);
    this.notify();
  }

  /**
   * Removes a sector leg.
   */
  removeSector(index) {
    removeSectorLeg(this.state, index);
    this.notify();
  }

  /**
   * Updates Part C justification & crew list.
   */
  updatePartC(partCUpdates) {
    if (partCUpdates.delayCategories) {
      Object.assign(this.state.partC.delayCategories, partCUpdates.delayCategories);
    }
    if (partCUpdates.justificationText !== undefined) {
      this.state.partC.justificationText = partCUpdates.justificationText;
    }
    if (partCUpdates.signatureDataUrl !== undefined) {
      this.state.partC.signatureDataUrl = partCUpdates.signatureDataUrl;
    }
    this.notify();
  }

  /**
   * Validates form state.
   */
  validate() {
    return validateForm(this.state);
  }

  /**
   * Generates formatted text summary block for copying into emails or DTR records.
   */
  generateSummaryText() {
    const a = this.state.partA;
    const v = this.state.voyage;
    const c = this.state.partC;

    return `
=====================================================
CAAM/BOP/FTL/1 DISCRETION REPORT SUMMARY
=====================================================
Flight: ${a.flightNumber} | Date: ${a.flightDate} | Reg: ${a.aircraftRegistration}
PIC: ${a.picName} (${a.operatorName})

VOYAGE TIMESTAMPS:
• Duty Start: ${v.dutyStartAirport} @ ${v.dutyStartUTC} UTC (${v.dutyStartLocal} Local)
${v.sectors.map(s => `• Sector ${s.sectorNumber}: ${s.depAirport} ➔ ${s.arrAirport} | Off: ${s.actOffChocksUTC} UTC (${s.actOffChocksLocal} Local) | On: ${s.actOnChocksUTC} UTC (${s.actOnChocksLocal} Local)`).join('\n')}
• Duty Completed: ${v.dutyEndAirport} @ ${v.dutyEndUTC} UTC (${v.dutyEndLocal} Local)

FTL & DISCRETION TOTALS:
• Revised Max Allowable FDP : ${formatMinutesToHHMM(this.state.partBBaseline.revisedAllowableFdpMinutes)}
• Actual FDP Achieved       : ${formatMinutesToHHMM(v.actualFdpMinutes)}
• DISCRETION EXERCISED     : ${formatMinutesToHHMM(v.discretionExercisedMinutes)} (${v.isDiscretionTriggered ? 'YES' : 'NO'})

JUSTIFICATION / REASON:
• Delays: ${Object.entries(c.delayCategories).filter(([_, val]) => val).map(([key]) => key.toUpperCase()).join(', ')}
• Details: ${c.justificationText}
=====================================================
`.trim();
  }
}
