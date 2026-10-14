// js/tools.js (1410_R152) - Flight Deck Compliance Tools Module
// Implements Hub 1 (Universal Validity Accordion Cards) & Hub 2 (FDP & CAAM/BOP/FTL/1 Discretion Engine)

import { MAB_AIRPORTS, searchAirports, findAirport } from './data/airports.js';
import { getScanHistory, getProfileData } from './storage.js';

// ----------------------------------------------------------------------------
// UTILITY: AVIATION TIME PARSER & TIMEZONE CONVERTER
// ----------------------------------------------------------------------------

export function parseAviationTime(input) {
  if (!input) return "";
  let clean = String(input).replace(/[^\d:]/g, "");
  if (!clean.includes(":")) {
    if (clean.length === 4) {
      clean = `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
    } else if (clean.length === 3) {
      clean = `0${clean.slice(0, 1)}:${clean.slice(1, 3)}`;
    }
  }
  return clean;
}

export function calculateLocalFromUtc(utcTimeStr, tzOffsetHours = 8) {
  const parsed = parseAviationTime(utcTimeStr);
  if (!parsed.includes(":")) return "";
  const [hh, mm] = parsed.split(":").map(n => parseInt(n, 10));
  let localH = hh + Math.floor(tzOffsetHours);
  let localM = mm + Math.round((tzOffsetHours % 1) * 60);
  if (localM >= 60) { localH += 1; localM -= 60; }
  if (localH >= 24) localH %= 24;
  if (localH < 0) localH = (localH + 24) % 24;
  return `${localH.toString().padStart(2, '0')}:${localM.toString().padStart(2, '0')}`;
}

export function calculateUtcFromLocal(localTimeStr, tzOffsetHours = 8) {
  const parsed = parseAviationTime(localTimeStr);
  if (!parsed.includes(":")) return "";
  const [hh, mm] = parsed.split(":").map(n => parseInt(n, 10));
  let utcH = hh - Math.floor(tzOffsetHours);
  let utcM = mm - Math.round((tzOffsetHours % 1) * 60);
  if (utcM < 0) { utcH -= 1; utcM += 60; }
  if (utcH < 0) utcH = (utcH + 24) % 24;
  if (utcH >= 24) utcH %= 24;
  return `${utcH.toString().padStart(2, '0')}:${utcM.toString().padStart(2, '0')}`;
}

// ----------------------------------------------------------------------------
// HUB 1: UNIVERSAL QUALIFICATION & VALIDITY CALCULATORS
// ----------------------------------------------------------------------------

export function calculatePpcWindows(conductDateStr, expiryDateStr) {
  if (!expiryDateStr) return null;
  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) return null;

  const lastDayExpiry = new Date(expiry.getFullYear(), expiry.getMonth() + 1, 0);
  const lpcWindowStart = new Date(lastDayExpiry.getFullYear(), lastDayExpiry.getMonth() - 2, 1);
  const lpcWindowEnd = new Date(lastDayExpiry);

  let conductDate = conductDateStr ? new Date(conductDateStr) : new Date();
  if (isNaN(conductDate.getTime())) conductDate = new Date();

  const newLpcExpiry = new Date(conductDate.getFullYear() + 1, conductDate.getMonth() + 1, 0);
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
    revalWindowEnd: formatDate(expiry),
    monthsValidity
  };
}

export function calculateMedicalWindow(expiryDateStr, dobStr) {
  if (!expiryDateStr) return null;
  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) return null;

  const dameEarliest = new Date(expiry.getTime() - (45 * 24 * 60 * 60 * 1000));
  let ageNotice = 'Standard 12-Month Medical Validity';
  let isAge60Plus = false;

  if (dobStr) {
    const dob = new Date(dobStr);
    if (!isNaN(dob.getTime())) {
      const ageDiffMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age >= 60) {
        isAge60Plus = true;
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
    ageNotice,
    isAge60Plus
  };
}

// ----------------------------------------------------------------------------
// HUB 2: FDP & DISCRETION COMPLIANCE ENGINE (CAD 1901 TABLE A)
// ----------------------------------------------------------------------------

export function getMaxAllowableFdp(reportTimeStr, sectorCount = 1) {
  const parsed = parseAviationTime(reportTimeStr);
  if (!parsed.includes(':')) return 12.0;

  const [hh, mm] = parsed.split(':').map(n => parseInt(n, 10));
  const timeNum = hh + (mm / 60);

  const count = Math.max(1, Math.min(6, sectorCount));

  if (timeNum >= 6.0 && timeNum < 13.5) {
    const limits = [13.0, 12.25, 11.50, 10.75, 10.0, 10.0];
    return limits[count - 1];
  } else if (timeNum >= 13.5 && timeNum < 18.0) {
    const limits = [12.50, 11.75, 11.0, 10.25, 9.50, 9.50];
    return limits[count - 1];
  } else if (timeNum >= 18.0 && timeNum < 22.0) {
    const limits = [12.0, 11.25, 10.50, 9.75, 9.0, 9.0];
    return limits[count - 1];
  } else {
    const limits = [11.0, 10.25, 9.50, 8.75, 8.0, 8.0];
    return limits[count - 1];
  }
}

export function calculateFdpAndDiscretion(reportTimeStr, sectorCount, actualEndTimeStr) {
  if (!reportTimeStr || !actualEndTimeStr) return null;

  const report = parseAviationTime(reportTimeStr);
  const actualEnd = parseAviationTime(actualEndTimeStr);

  const [rH, rM] = report.split(':').map(n => parseInt(n, 10));
  const [eH, eM] = actualEnd.split(':').map(n => parseInt(n, 10));

  let reportMin = (rH * 60) + rM;
  let endMin = (eH * 60) + eM;
  if (endMin < reportMin) endMin += 1440;

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
  const container = document.getElementById("ftl-sectors-container");
  if (!container) return;

  let html = "";
  for (let i = 1; i <= currentSectorCount; i++) {
    html += `
      <div class="ftl-sector-card bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 relative" data-sector="${i}">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
          <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">Sector ${i}</span>
          <span class="text-[9px] text-slate-400 font-bold">CAAM/BOP/FTL/1</span>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <!-- Departure Airport -->
          <div class="relative">
            <label class="text-[9px] font-bold text-slate-400 uppercase block mb-1">Depart Station</label>
            <input type="text" id="sector-${i}-dept-input" class="sector-apt-input w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black p-2.5 rounded-xl uppercase" placeholder="e.g. KUL" autocomplete="off" data-sector="${i}" data-type="dept">
            <div id="sector-${i}-dept-popover" class="apt-popover hidden absolute top-full left-0 right-0 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-40 overflow-y-auto mt-1 text-xs"></div>
          </div>

          <!-- Arrival Airport -->
          <div class="relative">
            <label class="text-[9px] font-bold text-slate-400 uppercase block mb-1">Arrive Station</label>
            <input type="text" id="sector-${i}-arr-input" class="sector-apt-input w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black p-2.5 rounded-xl uppercase" placeholder="e.g. BKI" autocomplete="off" data-sector="${i}" data-type="arr">
            <div id="sector-${i}-arr-popover" class="apt-popover hidden absolute top-full left-0 right-0 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-40 overflow-y-auto mt-1 text-xs"></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <!-- Planned Depart UTC & Local -->
          <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase">Sched Depart Time</span>
            <div class="grid grid-cols-2 gap-1.5">
              <div>
                <span class="text-[8px] font-bold text-slate-400 uppercase block">UTC</span>
                <input type="text" id="sector-${i}-utc-dept" class="sector-time-input w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-extrabold p-1.5 rounded-lg text-slate-800 dark:text-slate-100" placeholder="00:15" data-sector="${i}" data-field="utc-dept">
              </div>
              <div>
                <span class="text-[8px] font-bold text-slate-400 uppercase block">Local</span>
                <input type="text" id="sector-${i}-local-dept" class="sector-time-input w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-extrabold p-1.5 rounded-lg text-slate-800 dark:text-slate-100" placeholder="08:15" data-sector="${i}" data-field="local-dept">
              </div>
            </div>
          </div>

          <!-- Actual Depart UTC & Local -->
          <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase">Actual Depart Time</span>
            <div class="grid grid-cols-2 gap-1.5">
              <div>
                <span class="text-[8px] font-bold text-slate-400 uppercase block">UTC</span>
                <input type="text" id="sector-${i}-act-utc-dept" class="sector-time-input w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-extrabold p-1.5 rounded-lg text-slate-800 dark:text-slate-100" placeholder="00:45" data-sector="${i}" data-field="act-utc-dept">
              </div>
              <div>
                <span class="text-[8px] font-bold text-slate-400 uppercase block">Local</span>
                <input type="text" id="sector-${i}-act-local-dept" class="sector-time-input w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-extrabold p-1.5 rounded-lg text-slate-800 dark:text-slate-100" placeholder="08:45" data-sector="${i}" data-field="act-local-dept">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  bindSectorEvents();
}

function bindSectorEvents() {
  const aptInputs = document.querySelectorAll(".sector-apt-input");
  aptInputs.forEach(input => {
    input.addEventListener("input", (e) => {
      const q = e.target.value.trim().toUpperCase();
      const secIndex = e.target.getAttribute("data-sector");
      const type = e.target.getAttribute("data-type");
      const popover = document.getElementById(`sector-${secIndex}-${type}-popover`);

      if (!popover) return;
      if (q.length < 1) {
        popover.classList.add("hidden");
        return;
      }

      const matches = searchAirports(q);
      if (matches.length === 0) {
        popover.classList.add("hidden");
        return;
      }

      let popHtml = "";
      matches.slice(0, 5).forEach(apt => {
        popHtml += `
          <div class="apt-item p-2 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 last:border-none" data-iata="${apt.iata}" data-sector="${secIndex}" data-type="${type}">
            <span class="font-black text-blue-600 dark:text-blue-400">${apt.iata}</span>
            <span class="text-[10px] text-slate-500 truncate ml-2">${apt.name} (${apt.icao})</span>
          </div>
        `;
      });

      popover.innerHTML = popHtml;
      popover.classList.remove("hidden");

      popover.querySelectorAll(".apt-item").forEach(item => {
        item.addEventListener("click", (evt) => {
          const selectedIata = evt.currentTarget.getAttribute("data-iata");
          input.value = selectedIata;
          popover.classList.add("hidden");

          // Auto-chaining: if Sector N arrival station is set, set Sector N+1 departure station
          if (type === "arr") {
            const nextSecIndex = parseInt(secIndex, 10) + 1;
            const nextDeptInput = document.getElementById(`sector-${nextSecIndex}-dept-input`);
            if (nextDeptInput) {
              nextDeptInput.value = selectedIata;
            }
          }
        });
      });
    });
  });

  const timeInputs = document.querySelectorAll(".sector-time-input");
  timeInputs.forEach(input => {
    input.addEventListener("blur", (e) => {
      const raw = e.target.value;
      const formatted = parseAviationTime(raw);
      e.target.value = formatted;

      const secIndex = e.target.getAttribute("data-sector");
      const field = e.target.getAttribute("data-field");
      const deptApt = document.getElementById(`sector-${secIndex}-dept-input`)?.value || "KUL";
      const aptObj = findAirport(deptApt) || { tzOffset: 8 };

      if (field === "utc-dept" && formatted) {
        const localField = document.getElementById(`sector-${secIndex}-local-dept`);
        if (localField) localField.value = calculateLocalFromUtc(formatted, aptObj.tzOffset);
      } else if (field === "act-utc-dept" && formatted) {
        const actLocalField = document.getElementById(`sector-${secIndex}-act-local-dept`);
        if (actLocalField) actLocalField.value = calculateLocalFromUtc(formatted, aptObj.tzOffset);
      }
    });
  });
}

// ----------------------------------------------------------------------------
// TOUCH CANVAS SIGNATURE PAD CONTROLLER
// ----------------------------------------------------------------------------

let signatureCanvas = null;
let signatureCtx = null;
let isDrawing = false;

export function initSignatureCanvas() {
  signatureCanvas = document.getElementById("ftl-signature-canvas");
  if (!signatureCanvas) return;

  signatureCtx = signatureCanvas.getContext("2d");
  signatureCtx.strokeStyle = "#1e3a8a";
  signatureCtx.lineWidth = 2.5;
  signatureCtx.lineCap = "round";

  const getPos = (e) => {
    const rect = signatureCanvas.getBoundingClientRect();
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
    signatureCtx.beginPath();
    signatureCtx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    signatureCtx.lineTo(pos.x, pos.y);
    signatureCtx.stroke();
  };

  const stopDraw = () => {
    isDrawing = false;
  };

  signatureCanvas.addEventListener("mousedown", startDraw);
  signatureCanvas.addEventListener("mousemove", draw);
  signatureCanvas.addEventListener("mouseup", stopDraw);

  signatureCanvas.addEventListener("touchstart", startDraw, { passive: true });
  signatureCanvas.addEventListener("touchmove", draw, { passive: true });
  signatureCanvas.addEventListener("touchend", stopDraw);

  const clearBtn = document.getElementById("btn-clear-signature");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearSignatureCanvas);
  }
}

export function clearSignatureCanvas() {
  if (signatureCanvas && signatureCtx) {
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  }
}

export function populateCommanderSelect() {
  const select = document.getElementById("ftl-commander-select");
  if (!select) return;

  const history = getScanHistory();
  let html = `<option value="">Select Commander from Scan History...</option>`;
  if (history && history.length > 0) {
    history.forEach(item => {
      if (item.name) {
        html += `<option value="${item.name}">${item.name} (${item.caamNo || 'CAAM'})</option>`;
      }
    });
  }
  select.innerHTML = html;
}

export function draftFtlEmail() {
  const commander = document.getElementById("ftl-commander-select")?.value || "Commander";
  const reportTime = document.getElementById("fdp-report-time")?.value || "08:00";
  const narrative = document.getElementById("ftl-narrative")?.value || "Operational extension under Commander Discretion.";

  const subject = encodeURIComponent(`CAAM/BOP/FTL/1 Discretion Report - Capt. ${commander}`);
  const body = encodeURIComponent(
    `FLIGHT SAFETY & COMPLIANCE REPORT\n` +
    `----------------------------------------\n` +
    `Document: CAAM/BOP/FTL/1 Discretion Extension\n` +
    `Commander: ${commander}\n` +
    `Report Time: ${reportTime} UTC\n` +
    `Sectors Flown: ${currentSectorCount}\n\n` +
    `Commander Justification Narrative:\n${narrative}\n\n` +
    `Signed electronically via CertiFly PWA Compliance Checker.`
  );

  window.location.href = `mailto:FLT_SAFETY@malaysiaairlines.com?subject=${subject}&body=${body}`;
}

// ----------------------------------------------------------------------------
// ACCORDION ENGINE & INITIALIZATION HOOKS
// ----------------------------------------------------------------------------

export function initToolsModule() {
  renderSectorCardsUI();
  populateCommanderSelect();
  initSignatureCanvas();
  initAccordionEngine();
  initCalculatorResetHandlers();
}

function initAccordionEngine() {
  // Hub 1 vs Hub 2 Category Filter Switcher
  const btnValidity = document.getElementById("tools-tab-validity-btn");
  const btnFdp = document.getElementById("tools-tab-fdp-btn");
  const paneValidity = document.getElementById("hub-validity-pane");
  const paneFdp = document.getElementById("hub-fdp-pane");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold cursor-pointer";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-extrabold cursor-pointer";

  if (btnValidity && btnFdp && paneValidity && paneFdp) {
    btnValidity.addEventListener("click", () => {
      btnValidity.className = `tools-tab-btn py-2.5 px-2 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 ${activeClass}`;
      btnFdp.className = `tools-tab-btn py-2.5 px-2 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 ${inactiveClass}`;
      paneValidity.classList.remove("hidden");
      paneFdp.classList.add("hidden");
    });

    btnFdp.addEventListener("click", () => {
      btnFdp.className = `tools-tab-btn py-2.5 px-2 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 ${activeClass}`;
      btnValidity.className = `tools-tab-btn py-2.5 px-2 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 ${inactiveClass}`;
      paneFdp.classList.remove("hidden");
      paneValidity.classList.add("hidden");
    });
  }

  // Generic Accordion Card Toggle Handler
  const accordionCards = document.querySelectorAll(".accordion-card");
  accordionCards.forEach(card => {
    const header = card.querySelector(".accordion-header");
    const body = card.querySelector(".accordion-body");
    const chevron = card.querySelector(".accordion-chevron");

    if (header && body) {
      header.addEventListener("click", () => {
        const isOpen = !body.classList.contains("hidden");

        // Collapse all sibling cards in the same pane
        const parentPane = card.parentElement;
        if (parentPane) {
          parentPane.querySelectorAll(".accordion-card").forEach(sibling => {
            const sibBody = sibling.querySelector(".accordion-body");
            const sibChevron = sibling.querySelector(".accordion-chevron");
            if (sibBody) sibBody.classList.add("hidden");
            if (sibChevron) sibChevron.style.transform = "rotate(0deg)";
          });
        }

        // Toggle clicked card
        if (!isOpen) {
          body.classList.remove("hidden");
          if (chevron) chevron.style.transform = "rotate(180deg)";
        }
      });
    }
  });
}

function initCalculatorResetHandlers() {
  // Reset PPC
  document.getElementById("btn-reset-ppc")?.addEventListener("click", () => {
    const conduct = document.getElementById("ppc-conduct-date");
    const expiry = document.getElementById("ppc-expiry-date");
    const resBox = document.getElementById("ppc-results-box");
    if (conduct) conduct.value = "";
    if (expiry) expiry.value = "";
    if (resBox) resBox.classList.add("hidden");
  });

  // Reset Recurrent
  document.getElementById("btn-reset-recurrent")?.addEventListener("click", () => {
    const conduct = document.getElementById("recurrent-conduct-date");
    const resBox = document.getElementById("recurrent-results-box");
    if (conduct) conduct.value = "";
    if (resBox) resBox.classList.add("hidden");
  });

  // Reset Medical
  document.getElementById("btn-reset-medical")?.addEventListener("click", () => {
    const expiry = document.getElementById("medical-last-date");
    const age = document.getElementById("medical-pilot-age");
    const resBox = document.getElementById("medical-results-box");
    if (expiry) expiry.value = "";
    if (age) age.value = "";
    if (resBox) resBox.classList.add("hidden");
  });

  // Reset Preflight FDP
  document.getElementById("btn-reset-preflight")?.addEventListener("click", () => {
    const report = document.getElementById("fdp-report-time");
    const check = document.getElementById("fdp-acclimatised-check");
    const resBox = document.getElementById("preflight-results-box");
    if (report) report.value = "";
    if (check) check.checked = true;
    setSectorCount(2);
    if (resBox) resBox.classList.add("hidden");
  });
}
