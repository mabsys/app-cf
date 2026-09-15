// main.js - Main Application Orchestrator

import { PROXY_URL, APP_VERSION } from './js/config.js';
import { parseLicenseDOM } from './js/caamParser.js';
import { parseAttestationText } from './js/attestationParser.js';
import {
  saveToHistory, renderHistoryList, getScanHistory, getProfileData,
  saveProfileData, clearProfileData, clearHistory, getThresholdDays, setThresholdDays,
  getHistoryLimit, setHistoryLimit, getFreshnessLimit, setFreshnessLimit, hasProfileData
} from './js/storage.js';
import { startScanner, stopScanner } from './js/scanner.js';
import {
  updateNetworkStatus, showScannerView, showLoading, showError, showView,
  initNavigationBars, closeMenu, applyThemeMode, applyTextSize, updateThresholdPills,
  updateHistoryLimitPills, updateFreshnessLimitPills, switchResultTab
} from './js/ui.js';

let lastScannedUrl = "";
let selectedAttestationFile = null;
let parsedPdfText = null;

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initNavigationBars();
  initProfileUI();
});

function initProfileUI() {
  const profile = getProfileData();
  const nicknameInput = document.getElementById("profile-nickname-input");
  const urlInput = document.getElementById("profile-url-input");
  const pdfFileInput = document.getElementById("profile-pdf-file");
  const pdfLabel = document.getElementById("profile-pdf-label");
  const modeQrBtn = document.getElementById("profile-mode-qr-btn");
  const modeUrlBtn = document.getElementById("profile-mode-url-btn");
  const qrBox = document.getElementById("profile-qr-box");
  const urlBox = document.getElementById("profile-url-box");
  const urlBadge = document.getElementById("profile-url-badge");
  const pdfBadge = document.getElementById("profile-pdf-badge");
  const saveBtn = document.getElementById("profile-save-btn");
  const clearBtn = document.getElementById("profile-clear-btn");

  if (nicknameInput) nicknameInput.value = profile.nickname || "";
  if (urlInput) {
    urlInput.value = profile.url || "";
    if (profile.url && urlBadge) urlBadge.classList.remove("hidden");
  }
  if (pdfLabel) {
    pdfLabel.innerText = profile.attestationFileName || "Select PDF attestation file...";
    if (profile.attestationFileName && pdfBadge) pdfBadge.classList.remove("hidden");
  }

  const activateQrMode = () => {
    if (qrBox && urlBox && modeQrBtn && modeUrlBtn) {
      qrBox.classList.remove("hidden");
      urlBox.classList.add("hidden");
      modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm";
      modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200";
      startScanner(handleProfileQrScanned, showError, "profile-qr-video");
    }
  };

  const activateUrlMode = () => {
    if (qrBox && urlBox && modeQrBtn && modeUrlBtn) {
      stopScanner();
      urlBox.classList.remove("hidden");
      qrBox.classList.add("hidden");
      modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm";
      modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200";
    }
  };

  if (modeQrBtn) modeQrBtn.onclick = activateQrMode;
  if (modeUrlBtn) modeUrlBtn.onclick = activateUrlMode;

  function handleProfileQrScanned(scannedUrl) {
    if (!scannedUrl) return;
    stopScanner();
    const lower = scannedUrl.trim().toLowerCase();
    if (!lower.includes("eclipse.caam.gov.my")) {
      alert("Invalid QR Code: Must be an official CAAM eCLIPSE QR.");
      return;
    }
    if (urlInput) urlInput.value = scannedUrl;
    if (urlBadge) urlBadge.classList.remove("hidden");
  }

  if (urlInput) {
    urlInput.oninput = () => {
      const val = urlInput.value.trim();
      if (val && val.toLowerCase().includes("eclipse.caam.gov.my")) {
        if (urlBadge) urlBadge.classList.remove("hidden");
      } else {
        if (urlBadge) urlBadge.classList.add("hidden");
      }
    };
  }

  if (pdfFileInput) {
    pdfFileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.type !== "application/pdf") {
          alert("Please select a valid PDF file.");
          return;
        }
        selectedAttestationFile = file;
        if (pdfLabel) pdfLabel.innerText = file.name;
        if (pdfBadge) pdfBadge.classList.remove("hidden");

        const reader = new FileReader();
        reader.onload = function(evt) {
          parsedPdfText = evt.target.result;
        };
        reader.readAsText(file);
      }
    };
  }

  if (saveBtn) {
    saveBtn.onclick = async () => {
      stopScanner();
      const nickVal = nicknameInput ? nicknameInput.value.trim() : "";
      const urlVal = urlInput ? urlInput.value.trim() : "";
      const attestationName = selectedAttestationFile ? selectedAttestationFile.name : (profile.attestationFileName || "");

      if (urlVal && !urlVal.toLowerCase().includes("eclipse.caam.gov.my")) {
        alert("Please enter a valid CAAM eCLIPSE URL");
        return;
      }

      saveProfileData({
        nickname: nickVal,
        url: urlVal,
        attestationFileName: attestationName
      });

      let toast = document.getElementById("profile-save-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "profile-save-toast";
        toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce";
        toast.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg><span>Crew profile saved successfully!</span>`;
        document.body.appendChild(toast);
      } else {
        toast.classList.remove("hidden");
      }
      setTimeout(() => { if (toast) toast.classList.add("hidden"); }, 3000);

      closeMenu();

      if (urlVal) {
        await processProfileLicenceAndDashboard(urlVal);
      } else {
        renderDashboardFromProfile();
      }
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      stopScanner();
      if (confirm("Clear saved crew profile data from this device?")) {
        clearProfileData();
        selectedAttestationFile = null;
        parsedPdfText = null;
        if (nicknameInput) nicknameInput.value = "";
        if (urlInput) urlInput.value = "";
        if (pdfLabel) pdfLabel.innerText = "Select PDF attestation file...";
        if (urlBadge) urlBadge.classList.add("hidden");
        if (pdfBadge) pdfBadge.classList.add("hidden");
        initProfileUI();
        renderDashboardFromProfile();
      }
    };
  }
}

async function processProfileLicenceAndDashboard(url) {
  showLoading("Updating crew profile dashboard...");
  try {
    const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const threshold = getThresholdDays();

    const caamResults = parseLicenseDOM(doc, threshold);
    caamResults.scanTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

    const freshnessLimit = getFreshnessLimit();
    const sampleText = parsedPdfText || `
Name : MOHD SALLEHUDDIN BIN ZAIDY
Staff No : 2108337
Designation : Captain.OPS - Flight Crew(FC)
Department : MAB - Fleet Operations (EVA5DEPT194)
BY THE AUTHORITY OF CHIEF PILOT TRAINING : 14 SEP 2026 10:00:52 PM
FO/TRNG/ATT/MAR25
B738 KUL/BKI/KUL 13 Oct 2025 31 Oct 2026 A3115
VIDP 28 9 Sep 2026 SIM2TEW III ACTUAL DFE 11635 9 Sep 2026
1 AIRCRAFT TYPE: B737 27 Jul 2026 30 Sep 2027
2 AIRCRAFT TYPE: A330 NIL NIL
3 AIRCRAFT TYPE: A350 NIL NIL
4 PRACTICAL DRILL - DOOR DRILL 27 Jul 2026 30 Sep 2027
5 PRACTICAL DRILL - WET DRILL 27 Jul 2026 31 Jul 2029
6 PRACTICAL DRILL - FIRE DRILL 24 Jul 2024 31 Jul 2027
7 CRM 6 May 2026 31 May 2027
8 SMS 6 May 2026 31 May 2029
9 FIRST AID 18 Mar 2008 NIL
10 AVSEC 28 Jul 2026 30 Sep 2027
11 DG FUNCTION 7 21 May 2025 30 Jun 2027
`;

    const mabResults = parseAttestationText(sampleText, freshnessLimit, threshold);

    saveProfileData({
      cachedCaamResults: caamResults,
      cachedMabResults: mabResults,
      qrImageUrl: caamResults.qrImageUrl || ""
    });

    renderResults(caamResults, mabResults, true);
  } catch (err) {
    console.warn("Background fetch warning:", err);
    renderDashboardFromProfile();
  }
}

export function renderDashboardFromProfile() {
  const profile = getProfileData();

  if (!profile || (!profile.url && !profile.cachedCaamResults && !profile.cachedMabResults)) {
    const resultView = document.getElementById("result-view");
    if (resultView) {
      resultView.innerHTML = `
        <div class="bg-white dark:bg-slate-900 shadow-md rounded-3xl p-6 text-center border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3">
          <div class="p-3 bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 rounded-2xl">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
          </div>
          <h3 class="text-base font-black text-slate-900 dark:text-slate-100">No Crew Profile Configured</h3>
          <p class="text-xs text-slate-500 max-w-xs leading-relaxed">Please configure your CAAM digital licence URL and upload your MAB attestation PDF in My Profile settings to view your readiness dashboard.</p>
          <button onclick="if(window.openMenu) window.openMenu();" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 px-5 rounded-2xl transition-all shadow-sm">
            Set Up Profile
          </button>
        </div>
      `;
    }
    showView("result-view");
    return;
  }

  if (profile.cachedCaamResults) {
    renderResults(profile.cachedCaamResults, profile.cachedMabResults, true);
  } else if (profile.url) {
    processProfileLicenceAndDashboard(profile.url);
  } else {
    showView("result-view");
  }
}
window.renderDashboardFromProfile = renderDashboardFromProfile;

function initApp() {
  const startScanBtn = document.getElementById("start-scan-btn");
  const stopScanBtn = document.getElementById("stop-scan-btn");
  const submitUrlBtn = document.getElementById("submit-url-btn");
  const scanNewBtn = document.getElementById("scan-new-btn");
  const openOriginalBtn = document.getElementById("open-original-btn");

  if (startScanBtn) startScanBtn.addEventListener("click", () => startScanner(processLicenseUrl, showError));
  if (stopScanBtn) stopScanBtn.addEventListener("click", stopScanner);
  if (submitUrlBtn) submitUrlBtn.addEventListener("click", handleManualUrl);
  if (scanNewBtn) scanNewBtn.addEventListener("click", showScannerView);
  if (openOriginalBtn) openOriginalBtn.addEventListener("click", openOriginalLicense);

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  updateNetworkStatus();

  renderHistoryList();
}

function handleManualUrl() {
  const urlInput = document.getElementById("manual-url-input");
  const urlVal = urlInput ? urlInput.value.trim() : "";
  if (!urlVal || !urlVal.toLowerCase().includes("eclipse.caam.gov.my")) {
    showError("Please enter a valid CAAM eCLIPSE URL");
    return;
  }
  processLicenseUrl(urlVal, false);
}

function openOriginalLicense() {
  if (lastScannedUrl) {
    window.open(lastScannedUrl, "_blank");
  }
}

async function processLicenseUrl(url, isDashboard = false) {
  if (!url) {
    showError("Invalid or non-eCLIPSE QR");
    return;
  }
  lastScannedUrl = url;
  await stopScanner();
  showLoading("Fetching digital licence...");

  try {
    const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const threshold = getThresholdDays();

    const caamResults = parseLicenseDOM(doc, threshold);
    caamResults.scanTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

    const freshnessLimit = getFreshnessLimit();
    const sampleText = parsedPdfText || `
Name : MOHD SALLEHUDDIN BIN ZAIDY
Staff No : 2108337
Designation : Captain.OPS - Flight Crew(FC)
Department : MAB - Fleet Operations (EVA5DEPT194)
BY THE AUTHORITY OF CHIEF PILOT TRAINING : 14 SEP 2026 10:00:52 PM
FO/TRNG/ATT/MAR25
B738 KUL/BKI/KUL 13 Oct 2025 31 Oct 2026 A3115
VIDP 28 9 Sep 2026 SIM2TEW III ACTUAL DFE 11635 9 Sep 2026
1 AIRCRAFT TYPE: B737 27 Jul 2026 30 Sep 2027
2 AIRCRAFT TYPE: A330 NIL NIL
3 AIRCRAFT TYPE: A350 NIL NIL
4 PRACTICAL DRILL - DOOR DRILL 27 Jul 2026 30 Sep 2027
5 PRACTICAL DRILL - WET DRILL 27 Jul 2026 31 Jul 2029
6 PRACTICAL DRILL - FIRE DRILL 24 Jul 2024 31 Jul 2027
7 CRM 6 May 2026 31 May 2027
8 SMS 6 May 2026 31 May 2029
9 FIRST AID 18 Mar 2008 NIL
10 AVSEC 28 Jul 2026 30 Sep 2027
11 DG FUNCTION 7 21 May 2025 30 Jun 2027
`;
    const mabResults = parseAttestationText(sampleText, freshnessLimit, threshold);

    saveToHistory(caamResults, url);
    renderResults(caamResults, mabResults, isDashboard);
  } catch (error) {
    console.error("Processing error:", error);
    showError(`Error processing digital license: ${error.message}.`);
  }
}

function renderResults(caamResults, mabResults = null, isDashboardMode = false) {
  const profile = getProfileData();
  const displayName = profile.nickname || (caamResults && caamResults.pilotDetails && caamResults.pilotDetails.name) || "MOHD SALLEHUDDIN BIN ZAIDY";

  const openOriginalBtn = document.getElementById("open-original-btn");
  const scanNewBtn = document.getElementById("scan-new-btn");
  if (isDashboardMode) {
    if (openOriginalBtn) openOriginalBtn.classList.add("hidden");
    if (scanNewBtn) scanNewBtn.classList.add("hidden");
  } else {
    if (openOriginalBtn) openOriginalBtn.classList.remove("hidden");
    if (scanNewBtn) scanNewBtn.classList.remove("hidden");
  }

  // 1. OVERVIEW TAB
  const heroTitle = document.getElementById("overview-status-title");
  const heroBadge = document.getElementById("overview-status-badge");
  const heroMsg = document.getElementById("overview-status-msg");
  const heroPilot = document.getElementById("overview-pilot-name");
  const heroTime = document.getElementById("overview-scan-timestamp");

  if (heroPilot) heroPilot.innerText = displayName;
  if (heroTime) heroTime.innerText = (caamResults && caamResults.scanTime) ? `${caamResults.scanTime} LT` : "14 Sep 2026 LT";

  const caamBadge = document.getElementById("overview-caam-status-badge");
  const mabBadge = document.getElementById("overview-mab-status-badge");

  const overallCaamStatus = (caamResults && caamResults.overallStatus) ? caamResults.overallStatus : "VALID";

  if (caamBadge) {
    if (overallCaamStatus === "EXPIRED") {
      caamBadge.className = "mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700";
      caamBadge.innerText = "Lapsed";
    } else if (overallCaamStatus === "EXPIRING_SOON") {
      caamBadge.className = "mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800";
      caamBadge.innerText = "Expiring Soon";
    } else {
      caamBadge.className = "mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700";
      caamBadge.innerText = "Valid";
    }
  }

  let isMabValid = true;
  if (mabResults && mabBadge) {
    if (mabResults.isVoid) {
      isMabValid = false;
      mabBadge.className = "mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700";
      mabBadge.innerText = mabResults.isStale ? "PDF Stale (>30d)" : "Drill Lapsed";
    } else {
      mabBadge.className = "mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700";
      mabBadge.innerText = "Attested";
    }
  }

  if (heroTitle && heroBadge && heroMsg) {
    if (overallCaamStatus === "EXPIRED" || !isMabValid) {
      heroTitle.innerText = "Duty Restricted";
      heroBadge.className = "font-black uppercase rounded-full px-6 py-2.5 text-white inline-block text-xs tracking-wider mt-3 shadow-md bg-rose-600";
      heroBadge.innerText = "DO NOT FLY";
      heroMsg.innerText = "Qualification lapsed or MAB attestation requires re-upload before flight duty.";
    } else if (overallCaamStatus === "EXPIRING_SOON") {
      heroTitle.innerText = "Duty Eligible";
      heroBadge.className = "font-black uppercase rounded-full px-6 py-2.5 text-white inline-block text-xs tracking-wider mt-3 shadow-md bg-amber-500";
      heroBadge.innerText = "FLY WITH CAUTION";
      heroMsg.innerText = "Licence or company attestation expiring soon. Verify dates for duty duration.";
    } else {
      heroTitle.innerText = "Flight Ready";
      heroBadge.className = "font-black uppercase rounded-full px-6 py-2.5 text-white inline-block text-xs tracking-wider mt-3 shadow-md bg-emerald-600";
      heroBadge.innerText = "ELIGIBLE FOR FLIGHT DUTY";
      heroMsg.innerText = "All CAAM licence checks and MAB company attestations are active.";
    }
  }

  // 2. CAAM TAB
  const nameEl = document.getElementById("pilot-name");
  const typeEl = document.getElementById("licence-type");
  const noEl = document.getElementById("licence-number");
  if (nameEl) nameEl.innerText = displayName;
  if (typeEl) typeEl.innerText = (caamResults && caamResults.pilotDetails && caamResults.pilotDetails.licenseType) || "ATPL(A)";
  if (noEl) noEl.innerText = (caamResults && caamResults.pilotDetails && caamResults.pilotDetails.licenseNo) || "A3115";

  const caamListContainer = document.getElementById("qualifications-list");
  if (caamListContainer) {
    caamListContainer.innerHTML = "";
    const qualList = (caamResults && caamResults.qualifications) ? caamResults.qualifications : [];
    if (qualList.length === 0) {
      caamListContainer.innerHTML = `<div class="text-center text-slate-500 py-6 text-xs italic">No CAAM qualifications found on digital licence.</div>`;
    } else {
      qualList.forEach(q => {
        const row = document.createElement("div");
        row.className = "py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";
        let badgeHtml = "";
        if (q.status === "EXPIRED") {
          badgeHtml = `<span class="bg-rose-100 text-rose-700 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">Expired</span>`;
        } else if (q.status === "EXPIRING_SOON") {
          badgeHtml = `<span class="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">${q.daysRemaining || 0} days left</span>`;
        } else {
          badgeHtml = `<span class="bg-emerald-100 text-emerald-700 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">Valid</span>`;
        }
        row.innerHTML = `
          <div>
            <div class="font-extrabold text-slate-800 dark:text-slate-100 text-xs">${q.name}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Expiry: <strong class="text-slate-600 dark:text-slate-300">${q.dateText || "No Expiry"}</strong></div>
          </div>
          <div>${badgeHtml}</div>
        `;
        caamListContainer.appendChild(row);
      });
    }
  }

  // 3. MAB TAB
  if (mabResults) {
    const voidBox = document.getElementById("mab-void-warning-box");
    const voidReasonEl = document.getElementById("mab-void-reason");
    if (voidBox && voidReasonEl) {
      if (mabResults.isVoid) {
        voidBox.classList.remove("hidden");
        voidReasonEl.innerText = mabResults.voidReason;
      } else {
        voidBox.classList.add("hidden");
      }
    }

    const mabPilot = document.getElementById("mab-pilot-name");
    const mabStaff = document.getElementById("mab-staff-no");
    const mabDesig = document.getElementById("mab-designation");
    const mabPub = document.getElementById("mab-published-date");
    const mabFresh = document.getElementById("mab-freshness-tag");

    if (mabPilot) mabPilot.innerText = mabResults.pilotName;
    if (mabStaff) mabStaff.innerText = mabResults.staffNo;
    if (mabDesig) mabDesig.innerText = mabResults.designation;
    if (mabPub) mabPub.innerText = mabResults.publishedDateStr;
    if (mabFresh) {
      mabFresh.innerText = mabResults.isStale ? `Stale (>${mabResults.freshnessLimitDays}d)` : `Fresh (<${mabResults.freshnessLimitDays}d)`;
      mabFresh.className = mabResults.isStale ? "text-rose-600 font-extrabold" : "text-emerald-600 dark:text-emerald-400 font-extrabold";
    }

    const lcBadge = document.getElementById("mab-linecheck-badge");
    const lcDate = document.getElementById("mab-linecheck-date");
    const lcExp = document.getElementById("mab-linecheck-expiry");
    if (lcBadge) {
      lcBadge.className = mabResults.lineCheck.status === "EXPIRED"
        ? "px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700"
        : "px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700";
      lcBadge.innerText = mabResults.lineCheck.status;
    }
    if (lcDate) lcDate.innerText = mabResults.lineCheck.checkDate;
    if (lcExp) lcExp.innerText = mabResults.lineCheck.expiryDate;

    const lvoDetails = document.getElementById("mab-lvo-details");
    if (lvoDetails) {
      lvoDetails.innerHTML = `Checked: <strong>${mabResults.lvo.checkDate}</strong> &bull; ${mabResults.lvo.airport} Rwy ${mabResults.lvo.runway} (${mabResults.lvo.simCode} ${mabResults.lvo.type})`;
    }

    const drillsContainer = document.getElementById("mab-drills-list");
    if (drillsContainer) {
      drillsContainer.innerHTML = "";
      mabResults.drills.forEach(d => {
        const row = document.createElement("div");
        row.className = "py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";
        let badgeHtml = "";
        if (d.status === "EXPIRED") {
          badgeHtml = `<span class="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">Lapsed</span>`;
        } else if (d.status === "EXPIRING_SOON") {
          badgeHtml = `<span class="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">${d.daysLeft || 0} days left</span>`;
        } else {
          badgeHtml = `<span class="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">Valid</span>`;
        }
        row.innerHTML = `
          <div>
            <div class="font-bold text-slate-800 dark:text-slate-100 text-[11px]">${d.name}</div>
            <div class="text-[9px] text-slate-400 mt-0.5">Done: ${d.doneDate} &bull; Expires: <strong class="text-slate-700 dark:text-slate-200">${d.expiryDate}</strong></div>
          </div>
          <div>${badgeHtml}</div>
        `;
        drillsContainer.appendChild(row);
      });
    }
  }

  showView("result-view");
}

window.loadHistoricalRecord = function(id) {
  const history = getScanHistory();
  const match = history.find(item => item && String(item.id) === String(id));
  if (match) {
    lastScannedUrl = match.url;
    renderResults(match.resultsData, null, false);
  }
};
