// js/tools.js (1310_R147) - Flight Deck Compliance Tools Module
// Implements Hub 1 (Universal Validity) & Hub 2 (FDP & CAAM/BOP/FTL/1 Discretion Engine)

import { MAB_AIRPORTS, searchAirports, findAirport } from './data/airports.js';
import { getScanHistory, getProfileData } from './storage.js';

// ----------------------------------------------------------------------------
// UTILITY: AVIATION TIME PARSER & TIMEZONE CONVERTER
// ----------------------------------------------------------------------------

/**
 * Parses raw time inputs ('0000', '0815', '815', '08:15') into clean 'HH:MM'
 */
export function parseAviationTime(input) {
  if (!input) return '';
  let clean = input.toString().trim().replace(/[^\d:]/g, '');
  if (!clean.includes(':')) {
    if (clean.length === 4) {
      clean = `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
    } else if (clean.length === 3) {
      clean = `0${clean.slice(0, 1)}:${clean.slice(1, 3)}`;
    } else if (clean.length === 2) {
      clean = `${clean}:00`;
    } else if (clean.length === 1) {
      clean = `0${clean}:00`;
    }
  }
  const parts = clean.split(':');
  let hh = parseInt(parts[0] || '0', 10);
  let mm = parseInt(parts[1] || '0', 10);
  if (isNaN(hh)) hh = 0;
  if (isNaN(mm)) mm = 0;
  hh = Math.max(0, Math.min(23, hh));
  mm = Math.max(0, Math.min(59, mm));
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

/**
 * Calculates Local Time from UTC Time and Airport tzOffset (in hours)
 */
export function calculateLocalFromUtc(utcTimeStr, tzOffset = 8) {
  if (!utcTimeStr) return '';
  const parsed = parseAviationTime(utcTimeStr);
  if (!parsed.includes(':')) return '';
  const [hh, mm] = parsed.split(':').map(n => parseInt(n, 10));
  
  let totalMinutes = (hh * 60) + mm + Math.round(tzOffset * 60);
  while (totalMinutes < 0) totalMinutes += 1440;
  totalMinutes = totalMinutes % 1440;

  const localH = Math.floor(totalMinutes / 60);
  const localM = totalMinutes % 60;
  return `${localH.toString().padStart(2, '0')}:${localM.toString().padStart(2, '0')}`;
}

/**
 * Calculates UTC Time from Local Time and Airport tzOffset
 */
export function calculateUtcFromLocal(localTimeStr, tzOffset = 8) {
  return calculateLocalFromUtc(localTimeStr, -tzOffset);
}

// ----------------------------------------------------------------------------
// HUB 1: UNIVERSAL VALIDITY CALCULATOR ENGINES
// ----------------------------------------------------------------------------

/**
 * PPC Dual-Window Calculator (LPC & OPC) - CAD 6 Part 1 & OM-A 5.1.6
 */
export function calculatePpcWindows(conductDateStr, expiryDateStr) {
  if (!expiryDateStr) return null;
  
  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) return null;

  // Last day of expiry month
  const lastDayExpiry = new Date(expiry.getFullYear(), expiry.getMonth() + 1, 0);

  // LPC 3-Month Anniversary Protection Window
  const lpcWindowStart = new Date(lastDayExpiry.getFullYear(), lastDayExpiry.getMonth() - 2, 1);
  const lpcWindowEnd = new Date(lastDayExpiry);

  let conductDate = conductDateStr ? new Date(conductDateStr) : new Date();
  if (isNaN(conductDate.getTime())) conductDate = new Date();

  const newLpcExpiry = new Date(conductDate.getFullYear() + 1, conductDate.getMonth() + 1, 0);

  // OPC Conduct Window:
  // - No earlier than 4 months post-LPC conduct
  // - No later than 4 months pre-LPC expiry
  const opcEarliest = new Date(conductDate.getFullYear(), conductDate.getMonth() + 4, 1);
  const opcLatest = new Date(lastDayExpiry.getFullYear(), lastDayExpiry.getMonth() - 4, 0);

  const formatDate = (d) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return {
    newLpcExpiry: formatDate(newLpcExpiry),
    lpcWindowStart: formatDate(lpcWindowStart),
    lpcWindowEnd: formatDate(lpcWindowEnd),
    opcEarliest: formatDate(opcEarliest),
    opcLatest: formatDate(opcLatest)
  };
}

/**
 * Recurrent Course / Line Check Expiry Calculator
 */
export function calculateCourseExpiry(courseType, conductDateStr) {
  if (!conductDateStr) return null;
  const conduct = new Date(conductDateStr);
  if (isNaN(conduct.getTime())) return null;

  let monthsValidity = 12;
  if (courseType === 'dgr') monthsValidity = 24;
  if (courseType === 'sms') monthsValidity = 36;

  const expiry = new Date(conduct.getFullYear(), conduct.getMonth() + monthsValidity + 1, 0);
  const revalStart = new Date(expiry.getFullYear(), expiry.getMonth() - 2, 1);

  const formatDate = (d) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return {
    expiryDate: formatDate(expiry),
    revalWindowStart: formatDate(revalStart),
    revalWindowEnd: formatDate(expiry)
  };
}

/**
 * CAAM Class 1 Medical & DAME 45-Day Exam Window Calculator
 */
export function calculateMedicalWindow(expiryDateStr, dobStr) {
  if (!expiryDateStr) return null;
  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) return null;

  // Earliest DAME Exam = Expiry - 45 days
  const dameEarliest = new Date(expiry.getTime() - (45 * 24 * 60 * 60 * 1000));

  let ageNotice = 'Standard 12-Month Medical Validity';
  if (dobStr) {
    const dob = new Date(dobStr);
    if (!isNaN(dob.getTime())) {
      const ageDiffMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age >= 60) {
        ageNotice = `Age ${age} (60+ Threshold) - Mandatory 6-Month Medical Renewal Cycle`;
      } else {
        ageNotice = `Age ${age} - Standard 12-Month Medical Renewal Cycle`;
      }
    }
  }

  const formatDate = (d) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return {
    dameEarliest: formatDate(dameEarliest),
    expiryDate: formatDate(expiry),
    ageNotice
  };
}

// ----------------------------------------------------------------------------
// HUB 2: FDP & DISCRETION COMPLIANCE ENGINE (CAD 1901 TABLE A)
// ----------------------------------------------------------------------------

/**
 * Look up Max Allowable FDP (CAD 1901 Table A for Acclimatised Crew)
 */
export function getMaxAllowableFdp(reportTimeStr, sectorCount = 1) {
  const parsed = parseAviationTime(reportTimeStr);
  if (!parsed.includes(':')) return 12.0;

  const [hh, mm] = parsed.split(':').map(n => parseInt(n, 10));
  const timeNum = hh + (mm / 60);

  const count = Math.max(1, Math.min(6, sectorCount));

  if (timeNum >= 6.0 && timeNum < 13.5) { // 0600 - 1329
    const limits = [13.0, 12.25, 11.50, 10.75, 10.0, 10.0];
    return limits[count - 1];
  } else if (timeNum >= 13.5 && timeNum < 18.0) { // 1330 - 1759
    const limits = [12.50, 11.75, 11.0, 10.25, 9.50, 9.50];
    return limits[count - 1];
  } else if (timeNum >= 18.0 && timeNum < 22.0) { // 1800 - 2159
    const limits = [12.0, 11.25, 10.50, 9.75, 9.0, 9.0];
    return limits[count - 1];
  } else { // 2200 - 0559 (WOCL Encroachment)
    const limits = [11.0, 10.25, 9.50, 8.75, 8.0, 8.0];
    return limits[count - 1];
  }
}

/**
 * Calculates Actual Duty, Max FDP, and Discretion Exercised
 */
export function calculateFdpAndDiscretion(reportTimeStr, sectorCount, actualEndTimeStr) {
  if (!reportTimeStr || !actualEndTimeStr) return null;

  const report = parseAviationTime(reportTimeStr);
  const actualEnd = parseAviationTime(actualEndTimeStr);

  const [rH, rM] = report.split(':').map(n => parseInt(n, 10));
  const [eH, eM] = actualEnd.split(':').map(n => parseInt(n, 10));

  let reportMin = (rH * 60) + rM;
  let endMin = (eH * 60) + eM;

  if (endMin < reportMin) endMin += 1440; // Overnight duty

  const actualFdpMinutes = endMin - reportMin;
  const maxFdpHours = getMaxAllowableFdp(reportTimeStr, sectorCount);
  const maxFdpMinutes = Math.round(maxFdpHours * 60);

  const discretionMinutes = Math.max(0, actualFdpMinutes - maxFdpMinutes);

  const formatHoursMin = (totalMin) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  return {
    reportTime: report,
    actualEndTime: actualEnd,
    actualFdpFormatted: formatHoursMin(actualFdpMinutes),
    maxFdpFormatted: formatHoursMin(maxFdpMinutes),
    discretionMinutes,
    discretionFormatted: formatHoursMin(discretionMinutes),
    discretionExercised: discretionMinutes > 0
  };
}

// ----------------------------------------------------------------------------
// SECTOR AUTO-CHAINING & AUTOCOMPLETE UI CONTROLLERS
// ----------------------------------------------------------------------------

let currentSectorCount = 2;

export function setSectorCount(count) {
  currentSectorCount = Math.max(1, Math.min(6, count));
  renderSectorCardsUI();
}

export function getSectorCount() {
  return currentSectorCount;
}

export function renderSectorCardsUI() {
  const container = document.getElementById('ftl-sectors-container');
  if (!container) return;

  let html = '';
  for (let i = 1; i <= currentSectorCount; i++) {
    html += `
      <div class="ftl-sector-card bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 relative" data-sector="${i}">
        <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-2">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Sector ${i}
          </span>
          <span class="text-[9px] font-bold text-slate-400 uppercase">Aviation 4-Digit Time Active</span>
        </div>

        <!-- AIRPORT AUTOCOMPLETE PAIR -->
        <div class="grid grid-cols-2 gap-2.5">
          <div class="relative">
            <label class="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Depart Station</label>
            <input type="text" id="sector-${i}-depart" placeholder="e.g. KUL" maxlength="4"
                   class="sector-airport-input uppercase w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black p-2 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                   data-sector="${i}" data-field="depart">
            <div id="sector-${i}-depart-popup" class="airport-popup hidden absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl mt-1 max-h-40 overflow-y-auto"></div>
          </div>
          <div class="relative">
            <label class="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Arrive Station</label>
            <input type="text" id="sector-${i}-arrive" placeholder="e.g. BKI" maxlength="4"
                   class="sector-airport-input uppercase w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black p-2 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                   data-sector="${i}" data-field="arrive">
            <div id="sector-${i}-arrive-popup" class="airport-popup hidden absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl mt-1 max-h-40 overflow-y-auto"></div>
          </div>
        </div>

        <!-- SCHEDULED TIMES (UTC & LOCAL) -->
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Sch Depart (UTC)</label>
            <input type="text" id="sector-${i}-sch-utc" placeholder="0000" maxlength="5" inputmode="numeric"
                   class="time-utc-input w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold p-2 rounded-xl text-slate-800 dark:text-slate-100"
                   data-sector="${i}" data-type="sch">
          </div>
          <div>
            <label class="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Sch Depart (Local)</label>
            <input type="text" id="sector-${i}-sch-local" placeholder="0800" maxlength="5" inputmode="numeric"
                   class="time-local-input w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs font-bold p-2 rounded-xl text-slate-600 dark:text-slate-300"
                   data-sector="${i}" data-type="sch">
          </div>
        </div>

        <!-- ACTUAL TIMES (UTC & LOCAL) -->
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Act Depart (UTC)</label>
            <input type="text" id="sector-${i}-act-utc" placeholder="0045" maxlength="5" inputmode="numeric"
                   class="time-utc-input w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold p-2 rounded-xl text-slate-800 dark:text-slate-100"
                   data-sector="${i}" data-type="act">
          </div>
          <div>
            <label class="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Act Depart (Local)</label>
            <input type="text" id="sector-${i}-act-local" placeholder="0845" maxlength="5" inputmode="numeric"
                   class="time-local-input w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs font-bold p-2 rounded-xl text-slate-600 dark:text-slate-300"
                   data-sector="${i}" data-type="act">
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  bindSectorEvents();
}

/**
 * Binds Airport Autocomplete, Time Auto-Conversion, and Sector Auto-Chaining
 */
function bindSectorEvents() {
  const container = document.getElementById('ftl-sectors-container');
  if (!container) return;

  // 1. AIRPORT INPUT AUTOCOMPLETE & SECTOR CHAINING
  container.querySelectorAll('.sector-airport-input').forEach(input => {
    const sectorNum = parseInt(input.getAttribute('data-sector'), 10);
    const fieldType = input.getAttribute('data-field');
    const popup = document.getElementById(`sector-${sectorNum}-${fieldType}-popup`);

    input.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q.length === 0) {
        if (popup) popup.classList.add('hidden');
        return;
      }

      const matches = searchAirports(q, 5);
      if (matches.length > 0 && popup) {
        popup.innerHTML = matches.map(a => `
          <div class="airport-option p-2 hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800/60 last:border-0" data-iata="${a.iata}">
            <strong class="text-blue-600 dark:text-blue-400 font-black">${a.iata}</strong>
            <span class="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">${a.name} (${a.icao})</span>
          </div>
        `).join('');
        popup.classList.remove('hidden');

        popup.querySelectorAll('.airport-option').forEach(opt => {
          opt.addEventListener('click', () => {
            const iata = opt.getAttribute('data-iata');
            input.value = iata;
            popup.classList.add('hidden');

            // SECTOR AUTO-CHAINING: Arrive Station Sector N -> Depart Station Sector N+1
            if (fieldType === 'arrive' && sectorNum < currentSectorCount) {
              const nextDepartInput = document.getElementById(`sector-${sectorNum + 1}-depart`);
              if (nextDepartInput) {
                nextDepartInput.value = iata;
              }
            }
          });
        });
      } else if (popup) {
        popup.classList.add('hidden');
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => { if (popup) popup.classList.add('hidden'); }, 200);
    });
  });

  // 2. TIME AUTO-CONVERSION (UTC <-> LOCAL & '0000' RAW DIGIT SANITIZER)
  container.querySelectorAll('.time-utc-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const sectorNum = input.getAttribute('data-sector');
      const timeType = input.getAttribute('data-type');
      const rawVal = e.target.value;

      const formatted = parseAviationTime(rawVal);
      e.target.value = formatted;

      const departInput = document.getElementById(`sector-${sectorNum}-depart`);
      const airport = departInput ? findAirport(departInput.value) : null;
      const tzOffset = airport ? airport.tzOffset : 8;

      const localInput = document.getElementById(`sector-${sectorNum}-${timeType}-local`);
      if (localInput && formatted) {
        localInput.value = calculateLocalFromUtc(formatted, tzOffset);
      }
    });
  });
}

// ----------------------------------------------------------------------------
// TOUCH SIGNATURE CANVAS HANDLERS
// ----------------------------------------------------------------------------

let sigCanvas = null;
let sigCtx = null;
let isDrawing = false;

export function initSignatureCanvas() {
  sigCanvas = document.getElementById('ftl-sig-canvas');
  if (!sigCanvas) return;

  sigCtx = sigCanvas.getContext('2d');
  sigCtx.strokeStyle = '#0284c7'; // Sky Blue
  sigCtx.lineWidth = 2.5;
  sigCtx.lineCap = 'round';

  const getPos = (e) => {
    const rect = sigCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e) => {
    isDrawing = true;
    const pos = getPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(pos.x, pos.y);
  };

  const moveDraw = (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
  };

  const endDraw = () => {
    isDrawing = false;
  };

  sigCanvas.addEventListener('touchstart', startDraw, { passive: true });
  sigCanvas.addEventListener('touchmove', moveDraw, { passive: true });
  sigCanvas.addEventListener('touchend', endDraw);
  sigCanvas.addEventListener('mousedown', startDraw);
  sigCanvas.addEventListener('mousemove', moveDraw);
  sigCanvas.addEventListener('mouseup', endDraw);
}

export function clearSignatureCanvas() {
  if (sigCanvas && sigCtx) {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  }
}

// ----------------------------------------------------------------------------
// FORM EXPORT & EMAIL DRAFT GENERATOR
// ----------------------------------------------------------------------------

export function populateCommanderSelect() {
  const select = document.getElementById('ftl-commander-select');
  if (!select) return;

  const historyList = getScanHistory() || [];
  const profile = getProfileData();

  let optionsHtml = '<option value="">-- Select Commander --</option>';

  if (profile && profile.pilotName) {
    optionsHtml += `<option value="${profile.pilotName}">${profile.pilotName} (My Profile)</option>`;
  }

  historyList.forEach(item => {
    if (item && item.pilotName) {
      optionsHtml += `<option value="${item.pilotName}">${item.pilotName} (${item.licenceNumber || 'Crew'})</option>`;
    }
  });

  select.innerHTML = optionsHtml;
}

export function draftFtlEmail() {
  const commanderSelect = document.getElementById('ftl-commander-select');
  const commanderName = commanderSelect ? commanderSelect.value : 'Commander';
  const flightNo = document.getElementById('ftl-flight-no')?.value || 'MH---';

  const subject = encodeURIComponent(`CAAM/BOP/FTL/1 Report - ${flightNo} - ${commanderName}`);
  const body = encodeURIComponent(
    `CAAM/BOP/FTL/1 COMMANDER DISCRETION REPORT\n` +
    `==========================================\n` +
    `Flight Number: ${flightNo}\n` +
    `Commander Name: ${commanderName}\n` +
    `Date Submitted: ${new Date().toLocaleDateString()}\n\n` +
    `This report has been generated via CertiFly Flight Deck Compliance Tools.\n` +
    `Attached report data confirms regulatory compliance under CAAM CAD 1901.\n`
  );

  window.location.href = `mailto:FLT_SAFETY@malaysiaairlines.com?subject=${subject}&body=${body}`;
}

export function initToolsModule() {
  renderSectorCardsUI();
  populateCommanderSelect();
  initSignatureCanvas();
}
