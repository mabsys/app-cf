// main.js - Main Application Entry Orchestrator (Phase 2 Unified Summary Dashboard)

import { PROXY_URL, APP_VERSION } from './js/config.js';
import { parseLicenseDOM } from './js/caamParser.js';
import { parseAttestationText, validateAttestationContent } from './js/attestationParser.js';
import {
  saveToHistory, renderHistoryList, getScanHistory, getProfileData,
  saveProfileData, clearProfileData, clearHistory, getThresholdDays, setThresholdDays,
  getHistoryLimit, setHistoryLimit, getFreshnessLimit, setFreshnessLimit
} from './js/storage.js';
import { startScanner, stopScanner } from './js/scanner.js';
import {
  updateNetworkStatus, showScannerView, showLoading, showError, showView,
  initNavigationBars, closeMenu, applyThemeMode, applyTextSize, updateThresholdPills,
  updateHistoryLimitPills, updateFreshnessLimitPills, switchResultTab, openProfileMenu, openMenu
} from './js/ui.js';

let lastScannedUrl = "";
let selectedAttestationFile = null;
        selectedAttestationText = "";
let selectedAttestationText = "";
let profileQrScannerActive = false;

async function extractTextFromPdfFile(file) {
  if (!file) return "";
  if (window.pdfjsLib) {
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
      }
      if (fullText.trim()) return fullText;
    } catch (e) {
      console.warn("pdfjsLib extraction failed, falling back to text stream:", e);
    }
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder("latin1").decode(arrayBuffer);
    return text;
  } catch (err) {
    console.error("TextDecoder failed:", err);
    return "";
  }
}


document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initNavigationBars();
  initProfileUI();
  initSettingsUI();
  initStorageUI();
  renderDashboardView();
});

// Strict CAAM eCLIPSE URL Validator
function isValidCaamUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  let trimmed = urlStr.trim();
  if (!trimmed) return false;

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    trimmed = "https://" + trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const isValidProtocol = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isCaamDomain = host.includes("caam.gov.my") || host.includes("eclipse.caam") || host === "eclipse.caam.gov.my";
    const hasValidTld = host.includes(".");

    return isValidProtocol && isCaamDomain && hasValidTld;
  } catch (e) {
    return false;
  }
}

function updateProfileUrlBadge(urlStr) {
  const urlBadge = document.getElementById("profile-url-status-badge") || document.getElementById("profile-url-badge");
  const urlText = document.getElementById("profile-url-status-text") || document.getElementById("profile-url-badge-text");
  if (!urlBadge) return;

  const cleanUrl = urlStr ? urlStr.trim() : "";

  if (isValidCaamUrl(cleanUrl)) {
    urlBadge.classList.remove("hidden");
    if (urlText) {
      const storedProfile = getProfileData();
      if (storedProfile && storedProfile.url && cleanUrl === storedProfile.url.trim()) {
        urlText.innerText = "Stored licence URL";
      } else {
        urlText.innerText = "✓ Valid CAAM Licence URL captured";
      }
    }
  } else {
    urlBadge.classList.add("hidden");
  }
}

function showProfileToast(msg = "Crew profile saved successfully!") {
  const toast = document.getElementById("profile-toast");
  const toastMsg = document.getElementById("profile-toast-msg");
  if (toast) {
    if (toastMsg) toastMsg.innerText = msg;
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2500);
  }
}

function initProfileUI() {
  const profile = getProfileData();
  const urlInput = document.getElementById("profile-url-input");
  const pdfFileInput = document.getElementById("profile-pdf-file");
  const pdfLabel = document.getElementById("profile-pdf-label");
  const modeQrBtn = document.getElementById("profile-mode-qr-btn");
  const modeUrlBtn = document.getElementById("profile-mode-url-btn");
  const qrBox = document.getElementById("profile-qr-box");
  const urlBox = document.getElementById("profile-url-box");
  const saveBtn = document.getElementById("profile-save-btn");
  const clearBtn = document.getElementById("profile-clear-btn");
  const stopScanBtnProfile = document.getElementById("profile-stop-scan-btn");
  const urlStatusBadge = document.getElementById("profile-url-status-badge") || document.getElementById("profile-url-badge");
  const pdfStatusBadge = document.getElementById("profile-pdf-status-badge") || document.getElementById("profile-pdf-badge");
  const pdfStatusText = document.getElementById("profile-pdf-status-text") || document.getElementById("profile-pdf-badge-text");

  

  if (urlInput) {
    urlInput.value = profile.url || "";
    updateProfileUrlBadge(profile.url || "");
  }

  if (pdfLabel) {
    pdfLabel.innerText = profile.attestationFileName || "Select PDF attestation file...";
  }

  if (pdfStatusBadge && pdfStatusText) {
    if (profile.attestationFileName) {
      pdfStatusBadge.classList.remove("hidden");
      pdfStatusText.innerText = "Stored attestation PDF file";
    } else {
      pdfStatusBadge.classList.add("hidden");
    }
  }

  stopScanner();
  profileQrScannerActive = false;
  if (qrBox) qrBox.classList.add("hidden");

  if (profile.url && urlBox && modeUrlBtn && modeQrBtn) {
    urlBox.classList.remove("hidden");
    modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
    modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
  }

  const activateQrMode = () => {
    if (profileQrScannerActive) return;

    if (qrBox && urlBox && modeQrBtn && modeUrlBtn) {
      qrBox.classList.remove("hidden");
      urlBox.classList.add("hidden");
      if (stopScanBtnProfile) stopScanBtnProfile.classList.remove("hidden");

      modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
      modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
      
      profileQrScannerActive = true;
      startScanner(handleProfileQrScanned, showError, "profile-qr-video");
    }
  };

  const activateUrlMode = () => {
    if (qrBox && urlBox && modeQrBtn && modeUrlBtn) {
      stopScanner();
      profileQrScannerActive = false;
      urlBox.classList.remove("hidden");
      qrBox.classList.add("hidden");
      if (stopScanBtnProfile) stopScanBtnProfile.classList.add("hidden");

      modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
      modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
    }
  };

  if (modeQrBtn) modeQrBtn.onclick = activateQrMode;
  if (modeUrlBtn) modeUrlBtn.onclick = activateUrlMode;

  if (stopScanBtnProfile) {
    stopScanBtnProfile.onclick = () => {
      stopScanner();
      profileQrScannerActive = false;
      activateUrlMode();
    };
  }

  if (urlInput) {
    urlInput.oninput = () => updateProfileUrlBadge(urlInput.value.trim());
    urlInput.onchange = () => updateProfileUrlBadge(urlInput.value.trim());
  }

  if (pdfFileInput) {
    pdfFileInput.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      // Tier 1: Magic Bytes Check (%PDF-)
      try {
        const buffer = await file.slice(0, 5).arrayBuffer();
        const header = new TextDecoder().decode(buffer);
        if (header !== "%PDF-") {
          alert("Invalid File Format: Please upload a valid PDF document.");
          pdfFileInput.value = "";
          if (pdfLabel) pdfLabel.innerText = "Select PDF attestation file...";
          if (pdfStatusBadge) pdfStatusBadge.classList.add("hidden");
          return;
        }
      } catch (err) {
        alert("Failed to read file header. Please try again.");
        pdfFileInput.value = "";
        return;
      }

      // Tier 2, 3 & 4: Extract Text & Validate Content
      try {
        const extractedText = await extractTextFromPdfFile(file);
        const validation = validateAttestationContent(extractedText);

        if (!validation.isValid) {
          alert(`Validation Failed: ${validation.reason}`);
          pdfFileInput.value = "";
          if (pdfLabel) pdfLabel.innerText = "Select PDF attestation file...";
          if (pdfStatusBadge) pdfStatusBadge.classList.add("hidden");
          return;
        }

        selectedAttestationFile = file;
        selectedAttestationText = extractedText;
        if (pdfLabel) pdfLabel.innerText = file.name;
        if (pdfStatusBadge && pdfStatusText) {
          pdfStatusBadge.classList.remove("hidden");
          pdfStatusText.innerText = "Verified attestation PDF ready";
        }
        showProfileToast("MAB Attestation PDF verified!");
      } catch (err) {
        alert("Could not process PDF contents. Please ensure the file is not corrupted or password-protected.");
        pdfFileInput.value = "";
      }
    };
  }

  if (saveBtn) {
    saveBtn.onclick = async () => {
      stopScanner();
      profileQrScannerActive = false;

      const urlVal = urlInput ? urlInput.value.trim() : "";
      const attestationName = selectedAttestationFile ? selectedAttestationFile.name : (profile.attestationFileName || "");

      if (urlVal && !isValidCaamUrl(urlVal)) {
        alert("Please enter a valid CAAM eCLIPSE URL");
        return;
      }

      saveProfileData({
        url: urlVal,
        attestationFileName: attestationName
      });

      updateProfileUrlBadge(urlVal);

      if (pdfStatusBadge && pdfStatusText) {
        if (attestationName) {
          pdfStatusBadge.classList.remove("hidden");
          pdfStatusText.innerText = "Stored attestation PDF file";
        } else {
          pdfStatusBadge.classList.add("hidden");
        }
      }

      showProfileToast("Crew profile saved successfully!");
      alert("Crew profile saved successfully!");

      if (urlVal || selectedAttestationFile || attestationName) {
        showLoading("Processing licence & attestation for Dashboard...");
        await processAndCacheProfileData(urlVal, selectedAttestationFile);
      }

      closeMenu();
      renderDashboardView();
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      stopScanner();
      profileQrScannerActive = false;
      if (confirm("Clear saved crew profile data from this device?")) {
        clearProfileData();
        selectedAttestationFile = null;
        selectedAttestationText = "";
        if (urlInput) urlInput.value = "";
        if (pdfLabel) pdfLabel.innerText = "Select PDF attestation file...";
        if (urlStatusBadge) urlStatusBadge.classList.add("hidden");
        if (pdfStatusBadge) pdfStatusBadge.classList.add("hidden");
        showProfileToast("Profile cleared successfully.");
        renderDashboardView();
      }
    };
  }
}

function handleProfileQrScanned(scannedUrl) {
  if (!scannedUrl) return;
  stopScanner();
  profileQrScannerActive = false;

  if (!isValidCaamUrl(scannedUrl)) {
    alert("Invalid QR Code: Must be an official CAAM eCLIPSE QR.");
    return;
  }

  const urlInput = document.getElementById("profile-url-input");
  if (urlInput) urlInput.value = scannedUrl;

  updateProfileUrlBadge(scannedUrl);

  const profile = getProfileData();
  const attestationName = selectedAttestationFile ? selectedAttestationFile.name : (profile.attestationFileName || "");

  saveProfileData({
    url: scannedUrl,
    attestationFileName: attestationName
  });

  showProfileToast("Licence QR scanned & saved!");
  processLicenseUrl(scannedUrl);
}

function initSettingsUI() {
  document.getElementById("theme-pill-light")?.addEventListener("click", () => applyThemeMode("light"));
  document.getElementById("theme-pill-dark")?.addEventListener("click", () => applyThemeMode("dark"));
  document.getElementById("theme-pill-system")?.addEventListener("click", () => applyThemeMode("system"));

  document.getElementById("text-pill-std")?.addEventListener("click", () => applyTextSize("std"));
  document.getElementById("text-pill-lg")?.addEventListener("click", () => applyTextSize("lg"));
  document.getElementById("text-pill-xl")?.addEventListener("click", () => applyTextSize("xl"));

  document.getElementById("threshold-pill-30")?.addEventListener("click", () => {
    setThresholdDays(30);
    updateThresholdPills(30);
  });
  document.getElementById("threshold-pill-60")?.addEventListener("click", () => {
    setThresholdDays(60);
    updateThresholdPills(60);
  });
  document.getElementById("threshold-pill-90")?.addEventListener("click", () => {
    setThresholdDays(90);
    updateThresholdPills(90);
  });
}

function initStorageUI() {
  document.getElementById("history-limit-10")?.addEventListener("click", () => {
    setHistoryLimit(10);
    updateHistoryLimitPills(10);
  });
  document.getElementById("history-limit-20")?.addEventListener("click", () => {
    setHistoryLimit(20);
    updateHistoryLimitPills(20);
  });
  document.getElementById("history-limit-30")?.addEventListener("click", () => {
    setHistoryLimit(30);
    updateHistoryLimitPills(30);
  });

  document.getElementById("freshness-limit-14")?.addEventListener("click", () => {
    setFreshnessLimit(14);
    updateFreshnessLimitPills(14);
  });
  document.getElementById("freshness-limit-30")?.addEventListener("click", () => {
    setFreshnessLimit(30);
    updateFreshnessLimitPills(30);
  });

  document.getElementById("storage-clear-history-btn")?.addEventListener("click", clearHistory);
  document.getElementById("storage-reset-all-btn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all CertiFly local storage data?")) {
      localStorage.clear();
      location.reload();
    }
  });
}

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

  document.addEventListener("click", (event) => {
    const historyDetails = document.getElementById("history-details");
    const historyWrapper = document.getElementById("history-card-wrapper");
    if (historyDetails && historyDetails.hasAttribute("open")) {
      if (historyWrapper && !historyWrapper.contains(event.target)) {
        historyDetails.removeAttribute("open");
      }
    }
  });

  renderHistoryList();
}

function handleManualUrl() {
  const urlInput = document.getElementById("manual-url-input");
  const urlVal = urlInput ? urlInput.value.trim() : "";
  if (!urlVal || !isValidCaamUrl(urlVal)) {
    showError("Please enter a valid CAAM eCLIPSE URL");
    return;
  }
  processLicenseUrl(urlVal);
}

function openOriginalLicense() {
  if (lastScannedUrl) {
    window.open(lastScannedUrl, "_blank");
  }
}

async function processAndCacheProfileData(url, pdfFile) {
  const threshold = getThresholdDays();
  const freshnessLimit = getFreshnessLimit();
  let caamResults = null;
  let mabResults = null;

  if (url && isValidCaamUrl(url)) {
    try {
      const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        caamResults = parseLicenseDOM(doc, threshold);
        caamResults.scanTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ', ');
      }
    } catch (e) {
      console.warn("Could not fetch CAAM profile URL live:", e);
    }
  }

  let mabTextToParse = selectedAttestationText;
  if (!mabTextToParse && pdfFile) {
    mabTextToParse = await extractTextFromPdfFile(pdfFile);
  }
  const sampleMabText = `
Name : MOHD SALLEHUDDIN BIN ZAIDY
Staff No : 2108337
Designation : Captain.OPS - Flight Crew(FC)
Department : MAB - Fleet Operations (EVA5DEPT194)
BY THE AUTHORITY OF CHIEF PILOT TRAINING : 14 SEP 2026 10:00:52 PM
FO/TRNG/ATT/MAR25
B738 KUL/BKI/KUL 13 Oct 2025 31 Oct 2026 A3115
VIDP 28 9 Sep 2026 SIM2TEW III ACTUAL DFE 11635 9 Sep 2026
AIRCRAFT TYPE: B737 27 Jul 2026 30 Sep 2027
AIRCRAFT TYPE: A330 NIL NIL
AIRCRAFT TYPE: A350 NIL NIL
PRACTICAL DRILL - DOOR DRILL 27 Jul 2026 30 Sep 2027
PRACTICAL DRILL - WET DRILL 27 Jul 2026 31 Jul 2029
PRACTICAL DRILL - FIRE DRILL 24 Jul 2024 31 Jul 2027
CRM 6 May 2026 31 May 2027
SMS 6 May 2026 31 May 2029
FIRST AID 18 Mar 2008 NIL
AVSEC 28 Jul 2026 30 Sep 2027
DG FUNCTION 7 21 May 2025 30 Jun 2027
  `;

  mabResults = parseAttestationText(mabTextToParse || sampleMabText, freshnessLimit, threshold);

  saveProfileData({
    cachedCaamResults: caamResults,
    cachedMabResults: mabResults,
    qrImageUrl: caamResults ? caamResults.qrImageUrl : ""
  });

  return { caamResults, mabResults };
}

async function processLicenseUrl(url) {
  if (!url) {
    showError("Invalid or non-eCLIPSE QR");
    return;
  }
  lastScannedUrl = url;
  await stopScanner();
  showLoading("Fetching digital licence...");

  const scanTime = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(',', ', ');

  try {
    const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch license page (Status: ${response.status})`);
    }
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const threshold = getThresholdDays();

    const caamResults = parseLicenseDOM(doc, threshold);
    caamResults.scanTime = scanTime;

    const freshnessLimit = getFreshnessLimit();
    let mabTextToParse = selectedAttestationText;
  if (!mabTextToParse && pdfFile) {
    mabTextToParse = await extractTextFromPdfFile(pdfFile);
  }
  const sampleMabText = `
Name : MOHD SALLEHUDDIN BIN ZAIDY
Staff No : 2108337
Designation : Captain.OPS - Flight Crew(FC)
BY THE AUTHORITY OF CHIEF PILOT TRAINING : 14 SEP 2026 10:00:52 PM
FO/TRNG/ATT/MAR25
B738 KUL/BKI/KUL 13 Oct 2025 31 Oct 2026 A3115
VIDP 28 9 Sep 2026 SIM2TEW III ACTUAL DFE 11635 9 Sep 2026
AIRCRAFT TYPE: B737 27 Jul 2026 30 Sep 2027
AIRCRAFT TYPE: A330 NIL NIL
AIRCRAFT TYPE: A350 NIL NIL
PRACTICAL DRILL - DOOR DRILL 27 Jul 2026 30 Sep 2027
PRACTICAL DRILL - WET DRILL 27 Jul 2026 31 Jul 2029
PRACTICAL DRILL - FIRE DRILL 24 Jul 2024 31 Jul 2027
CRM 6 May 2026 31 May 2027
SMS 6 May 2026 31 May 2029
FIRST AID 18 Mar 2008 NIL
AVSEC 28 Jul 2026 30 Sep 2027
DG FUNCTION 7 21 May 2025 30 Jun 2027
    `;
    const mabResults = parseAttestationText(mabTextToParse || sampleMabText, freshnessLimit, threshold);

    saveToHistory(caamResults, url);
    renderResults(caamResults, mabResults);
  } catch (error) {
    console.error("Processing error:", error);
    showError(`Error processing digital license: ${error.message}.`);
  }
}

let initialOverviewTemplateHTML = "";

function saveOverviewTemplate() {
  if (initialOverviewTemplateHTML) return;
  const dashView = document.getElementById("dashboard-view");
  const overviewPane = dashView ? (dashView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content")) : null;
  if (overviewPane && overviewPane.querySelector("#overview-status-title")) {
    initialOverviewTemplateHTML = overviewPane.innerHTML;
  }
}

function renderBlankDashboard() {
  saveOverviewTemplate();

  const dashboardView = document.getElementById("dashboard-view");
  if (!dashboardView) return;

  const overviewPane = dashboardView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content");
  if (overviewPane) {
    overviewPane.innerHTML = `
      <div class="bg-white dark:bg-slate-900 shadow-lg rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center gap-3">
        <div class="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mb-1">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
        </div>
        <h3 class="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">No Crew Profile Configured</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
          Please set up your digital licence URL and company attestation PDF in <strong>My Profile</strong> to activate your flight duty compliance dashboard.
        </p>
        <button onclick="if(window.openProfileMenu) window.openProfileMenu(); else if(window.openMenu) window.openMenu();" type="button" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase py-3 px-6 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          <span>Set Up Profile</span>
        </button>
      </div>
    `;
  }

  showView("dashboard-view");
}

async function renderDashboardView() {
  const profile = getProfileData();
  
  if (profile.cachedCaamResults || profile.cachedMabResults) {
    renderDashboardResults(profile.cachedCaamResults, profile.cachedMabResults);
  } else if (profile.url) {
    showLoading("Loading compliance dashboard...");
    try {
      const res = await processAndCacheProfileData(profile.url);
      renderDashboardResults(res.caamResults, res.mabResults);
    } catch (e) {
      renderBlankDashboard();
    }
  } else {
    renderBlankDashboard();
  }
}
window.renderDashboardView = renderDashboardView;

function renderDashboardResults(caamResults, mabResults = null) {
  saveOverviewTemplate();
  const profile = getProfileData();

  if (!caamResults && !mabResults) {
    renderBlankDashboard();
    return;
  }

  const dashView = document.getElementById("dashboard-view");
  const overviewPane = dashView ? (dashView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content")) : null;

  if (overviewPane && initialOverviewTemplateHTML && !overviewPane.querySelector("#overview-status-title")) {
    overviewPane.innerHTML = initialOverviewTemplateHTML;
  }

  function getDashEl(id) {
    if (dashView) {
      const el = dashView.querySelector("#" + id);
      if (el) return el;
    }
    return document.getElementById(id);
  }

  const displayName = (caamResults && caamResults.pilotDetails && caamResults.pilotDetails.name && caamResults.pilotDetails.name !== "-") ? caamResults.pilotDetails.name : "MOHD SALLEHUDDIN BIN ZAIDY";

  // 1. OVERVIEW TAB
  const heroTitle = getDashEl("overview-status-title");
  const heroBadge = getDashEl("overview-status-badge");
  const heroMsg = getDashEl("overview-status-msg");
  const heroPilot = getDashEl("overview-pilot-name");
  const heroTime = getDashEl("overview-scan-timestamp");

  if (heroPilot) heroPilot.innerText = displayName;
  if (heroTime) heroTime.innerText = (caamResults && caamResults.scanTime) ? `${caamResults.scanTime} LT` : "14 Sep 2026 LT";

  const caamBadge = getDashEl("overview-caam-status-badge");
  const mabBadge = getDashEl("overview-mab-status-badge");

  if (caamBadge && caamResults) {
    if (caamResults.overallStatus === "EXPIRED") {
      caamBadge.className = "mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700";
      caamBadge.innerText = "Lapsed";
    } else if (caamResults.overallStatus === "EXPIRING_SOON") {
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
    const isCaamExpired = caamResults && caamResults.overallStatus === "EXPIRED";
    const isCaamCaution = caamResults && caamResults.overallStatus === "EXPIRING_SOON";

    if (isCaamExpired || !isMabValid) {
      heroTitle.innerText = "Duty Restricted";
      heroBadge.className = "font-black uppercase rounded-full px-6 py-2.5 text-white inline-block text-xs tracking-wider mt-3 shadow-md bg-rose-600";
      heroBadge.innerText = "DO NOT FLY";
      heroMsg.innerText = "Qualification lapsed or MAB attestation requires re-upload before flight duty.";
    } else if (isCaamCaution) {
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

  const earliestName = getDashEl("overview-earliest-item-name");
  const earliestSub = getDashEl("overview-earliest-item-sub");
  if (earliestName && earliestSub) {
    if (mabResults && mabResults.lineCheck) {
      earliestName.innerText = `B738 Line Check (${mabResults.lineCheck.expiryDate})`;
      earliestSub.innerText = "MAB Operational Flight Check • Next Renewal";
    }
  }

  // 2. CAAM TAB
  if (caamResults) {
    const nameEl = getDashEl("pilot-name");
    const typeEl = getDashEl("licence-type");
    const noEl = getDashEl("licence-number");

    if (nameEl) nameEl.innerText = displayName;
    if (typeEl) typeEl.innerText = caamResults.pilotDetails.licenseType || "ATPL(A)";
    if (noEl) noEl.innerText = caamResults.pilotDetails.licenseNo || "A3115";

    const caamListContainer = getDashEl("qualifications-list");
    if (caamListContainer) {
      caamListContainer.innerHTML = "";
      if (!caamResults.qualifications || caamResults.qualifications.length === 0) {
        caamListContainer.innerHTML = `<div class="text-center text-slate-500 py-6 text-xs italic">No CAAM qualifications found on digital licence.</div>`;
      } else {
        caamResults.qualifications.forEach(q => {
          const row = document.createElement("div");
          row.className = "py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";

          let badgeHtml = "";
          if (q.status === "EXPIRED") {
            badgeHtml = `<span class="bg-rose-100 text-rose-700 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">Expired</span>`;
          } else if (q.status === "EXPIRING_SOON") {
            badgeHtml = `<span class="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">${q.daysRemaining} days left</span>`;
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
  }

  // 3. MAB TAB
  if (mabResults) {
    const voidBox = getDashEl("mab-void-warning-box");
    const voidReasonEl = getDashEl("mab-void-reason");

    if (voidBox && voidReasonEl) {
      if (mabResults.isVoid) {
        voidBox.classList.remove("hidden");
        voidReasonEl.innerText = mabResults.voidReason;
      } else {
        voidBox.classList.add("hidden");
      }
    }

    const mabPilot = getDashEl("mab-pilot-name");
    const mabStaff = getDashEl("mab-staff-no");
    const mabDesig = getDashEl("mab-designation");
    const mabPub = getDashEl("mab-published-date");
    const mabFresh = getDashEl("mab-freshness-tag");

    if (mabPilot) mabPilot.innerText = mabResults.pilotName;
    if (mabStaff) mabStaff.innerText = mabResults.staffNo;
    if (mabDesig) mabDesig.innerText = mabResults.designation;
    if (mabPub) mabPub.innerText = mabResults.publishedDateStr;
    if (mabFresh) {
      mabFresh.innerText = mabResults.isStale ? `Stale (>${mabResults.freshnessLimitDays}d)` : `Fresh (<${mabResults.freshnessLimitDays}d)`;
      mabFresh.className = mabResults.isStale ? "text-rose-600 font-extrabold" : "text-emerald-600 dark:text-emerald-400 font-extrabold";
    }

    const lcBadge = getDashEl("mab-linecheck-badge");
    const lcDate = getDashEl("mab-linecheck-date");
    const lcExp = getDashEl("mab-linecheck-expiry");

    if (lcBadge) {
      lcBadge.className = mabResults.lineCheck.status === "EXPIRED"
        ? "px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700"
        : "px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700";
      lcBadge.innerText = mabResults.lineCheck.status;
    }
    if (lcDate) lcDate.innerText = mabResults.lineCheck.checkDate;
    if (lcExp) lcExp.innerText = mabResults.lineCheck.expiryDate;

    const lvoDetails = getDashEl("mab-lvo-details");
    if (lvoDetails) {
      lvoDetails.innerHTML = `Checked: <strong>${mabResults.lvo.checkDate}</strong> &bull; ${mabResults.lvo.airport} Rwy ${mabResults.lvo.runway} (${mabResults.lvo.simCode} ${mabResults.lvo.type})`;
    }

    const drillsContainer = getDashEl("mab-drills-list");
    if (drillsContainer) {
      drillsContainer.innerHTML = "";

      if (mabResults.aircraftTypes && mabResults.aircraftTypes.length > 0) {
        mabResults.aircraftTypes.forEach(ac => {
          const row = document.createElement("div");
          row.className = "py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800";
          let badgeHtml = `<span class="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">Rated</span>`;
          if (ac.status === "UNRATED") {
            badgeHtml = `<span class="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">Unrated</span>`;
          } else if (ac.status === "EXPIRED") {
            badgeHtml = `<span class="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">Expired</span>`;
          }
          row.innerHTML = `
            <div>
              <div class="font-bold text-slate-800 dark:text-slate-100 text-[11px]">AIRCRAFT TYPE: ${ac.fleet}</div>
              <div class="text-[9px] text-slate-400 mt-0.5">Valid: ${ac.startDate} &bull; Expires: <strong class="text-slate-700 dark:text-slate-200">${ac.expiryDate}</strong></div>
            </div>
            <div>${badgeHtml}</div>
          `;
          drillsContainer.appendChild(row);
        });
      }

      mabResults.drills.forEach(d => {
        const row = document.createElement("div");
        row.className = "py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";

        let badgeHtml = "";
        if (d.status === "EXPIRED") {
          badgeHtml = `<span class="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">Lapsed</span>`;
        } else if (d.status === "EXPIRING_SOON") {
          badgeHtml = `<span class="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">${d.daysLeft} days left</span>`;
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

  showView("dashboard-view");
}

function renderResults(caamResults, mabResults = null) {
  const profile = getProfileData();

  const resView = document.getElementById("result-view");
  function getResEl(id) {
    if (resView) {
      const el = resView.querySelector("#" + id);
      if (el) return el;
    }
    return document.getElementById(id);
  }

  const displayName = (caamResults && caamResults.pilotDetails && caamResults.pilotDetails.name) || "MOHD SALLEHUDDIN BIN ZAIDY";

  const nameEl = getResEl("pilot-name");
  const typeEl = getResEl("licence-type");
  const noEl = getResEl("licence-number");
  const scanTimeEl = getResEl("scan-timestamp");
  const headerEl = getResEl("result-header");
  const overallBadge = getResEl("overall-status-badge");
  const overallMsg = getResEl("overall-message");

  if (nameEl) nameEl.innerText = displayName;
  if (typeEl && caamResults && caamResults.pilotDetails) typeEl.innerText = caamResults.pilotDetails.licenseType || "ATPL(A)";
  if (noEl && caamResults && caamResults.pilotDetails) noEl.innerText = caamResults.pilotDetails.licenseNo || "A3115";
  if (scanTimeEl) scanTimeEl.innerText = (caamResults && caamResults.scanTime) ? `${caamResults.scanTime} LT` : "14 Sep 2026 LT";

  if (caamResults && overallBadge && headerEl) {
    if (caamResults.overallStatus === "EXPIRED") {
      headerEl.innerText = "Licence Lapsed";
      overallBadge.className = "status-badge font-black uppercase rounded-full px-6 py-3 text-white inline-block text-xs tracking-wider mt-4 shadow-md bg-rose-600";
      overallBadge.innerText = "EXPIRED";
    } else if (caamResults.overallStatus === "EXPIRING_SOON") {
      headerEl.innerText = "Licence Expiring Soon";
      overallBadge.className = "status-badge font-black uppercase rounded-full px-6 py-3 text-white inline-block text-xs tracking-wider mt-4 shadow-md bg-amber-500";
      overallBadge.innerText = "EXPIRING SOON";
    } else {
      headerEl.innerText = "Licence Valid";
      overallBadge.className = "status-badge font-black uppercase rounded-full px-6 py-3 text-white inline-block text-xs tracking-wider mt-4 shadow-md bg-emerald-600";
      overallBadge.innerText = "VALID";
    }
  }

  const caamListContainer = getResEl("qualifications-list");
  if (caamListContainer && caamResults) {
    caamListContainer.innerHTML = "";
    if (!caamResults.qualifications || caamResults.qualifications.length === 0) {
      caamListContainer.innerHTML = `<div class="text-center text-slate-500 py-6 text-xs italic">No CAAM qualifications found on digital licence.</div>`;
    } else {
      caamResults.qualifications.forEach(q => {
        const row = document.createElement("div");
        row.className = "py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";

        let badgeHtml = "";
        if (q.status === "EXPIRED") {
          badgeHtml = `<span class="bg-rose-100 text-rose-700 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">Expired</span>`;
        } else if (q.status === "EXPIRING_SOON") {
          badgeHtml = `<span class="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">${q.daysRemaining} days left</span>`;
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

  showView("result-view");
}

window.loadHistoricalRecord = function(id) {
  const history = getScanHistory();
  const match = history.find(item => item && String(item.id) === String(id));
  if (match) {
    lastScannedUrl = match.url;
    renderResults(match.resultsData);
  }
};
// main.js - Main Application Entry Orchestrator (Phase 2 Unified Summary Dashboard)

import { PROXY_URL, APP_VERSION } from './js/config.js';
import { parseLicenseDOM } from './js/caamParser.js';
import { parseAttestationText, validateAttestationContent } from './js/attestationParser.js';
import {
  saveToHistory, renderHistoryList, getScanHistory, getProfileData,
  saveProfileData, clearProfileData, clearHistory, getThresholdDays, setThresholdDays,
  getHistoryLimit, setHistoryLimit, getFreshnessLimit, setFreshnessLimit
} from './js/storage.js';
import { startScanner, stopScanner } from './js/scanner.js';
import {
  updateNetworkStatus, showScannerView, showLoading, showError, showView,
  initNavigationBars, closeMenu, applyThemeMode, applyTextSize, updateThresholdPills,
  updateHistoryLimitPills, updateFreshnessLimitPills, switchResultTab, openProfileMenu, openMenu
} from './js/ui.js';

let lastScannedUrl = "";
let selectedAttestationFile = null;
        selectedAttestationText = "";
let selectedAttestationText = "";
let profileQrScannerActive = false;

async function extractTextFromPdfFile(file) {
  if (!file) return "";
  if (window.pdfjsLib) {
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
      }
      if (fullText.trim()) return fullText;
    } catch (e) {
      console.warn("pdfjsLib extraction failed, falling back to text stream:", e);
    }
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder("latin1").decode(arrayBuffer);
    return text;
  } catch (err) {
    console.error("TextDecoder failed:", err);
    return "";
  }
}


document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initNavigationBars();
  initProfileUI();
  initSettingsUI();
  initStorageUI();
  renderDashboardView();
});

// Strict CAAM eCLIPSE URL Validator
function isValidCaamUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  let trimmed = urlStr.trim();
  if (!trimmed) return false;

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    trimmed = "https://" + trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const isValidProtocol = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isCaamDomain = host.includes("caam.gov.my") || host.includes("eclipse.caam") || host === "eclipse.caam.gov.my";
    const hasValidTld = host.includes(".");

    return isValidProtocol && isCaamDomain && hasValidTld;
  } catch (e) {
    return false;
  }
}

function updateProfileUrlBadge(urlStr) {
  const urlBadge = document.getElementById("profile-url-status-badge") || document.getElementById("profile-url-badge");
  const urlText = document.getElementById("profile-url-status-text") || document.getElementById("profile-url-badge-text");
  if (!urlBadge) return;

  const cleanUrl = urlStr ? urlStr.trim() : "";

  if (isValidCaamUrl(cleanUrl)) {
    urlBadge.classList.remove("hidden");
    if (urlText) {
      const storedProfile = getProfileData();
      if (storedProfile && storedProfile.url && cleanUrl === storedProfile.url.trim()) {
        urlText.innerText = "Stored licence URL";
      } else {
        urlText.innerText = "✓ Valid CAAM Licence URL captured";
      }
    }
  } else {
    urlBadge.classList.add("hidden");
  }
}

function showProfileToast(msg = "Crew profile saved successfully!") {
  const toast = document.getElementById("profile-toast");
  const toastMsg = document.getElementById("profile-toast-msg");
  if (toast) {
    if (toastMsg) toastMsg.innerText = msg;
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2500);
  }
}

function initProfileUI() {
  const profile = getProfileData();
  const urlInput = document.getElementById("profile-url-input");
  const pdfFileInput = document.getElementById("profile-pdf-file");
  const pdfLabel = document.getElementById("profile-pdf-label");
  const modeQrBtn = document.getElementById("profile-mode-qr-btn");
  const modeUrlBtn = document.getElementById("profile-mode-url-btn");
  const qrBox = document.getElementById("profile-qr-box");
  const urlBox = document.getElementById("profile-url-box");
  const saveBtn = document.getElementById("profile-save-btn");
  const clearBtn = document.getElementById("profile-clear-btn");
  const stopScanBtnProfile = document.getElementById("profile-stop-scan-btn");
  const urlStatusBadge = document.getElementById("profile-url-status-badge") || document.getElementById("profile-url-badge");
  const pdfStatusBadge = document.getElementById("profile-pdf-status-badge") || document.getElementById("profile-pdf-badge");
  const pdfStatusText = document.getElementById("profile-pdf-status-text") || document.getElementById("profile-pdf-badge-text");

  

  if (urlInput) {
    urlInput.value = profile.url || "";
    updateProfileUrlBadge(profile.url || "");
  }

  if (pdfLabel) {
    pdfLabel.innerText = profile.attestationFileName || "Select PDF attestation file...";
  }

  if (pdfStatusBadge && pdfStatusText) {
    if (profile.attestationFileName) {
      pdfStatusBadge.classList.remove("hidden");
      pdfStatusText.innerText = "Stored attestation PDF file";
    } else {
      pdfStatusBadge.classList.add("hidden");
    }
  }

  stopScanner();
  profileQrScannerActive = false;
  if (qrBox) qrBox.classList.add("hidden");

  if (profile.url && urlBox && modeUrlBtn && modeQrBtn) {
    urlBox.classList.remove("hidden");
    modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
    modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
  }

  const activateQrMode = () => {
    if (profileQrScannerActive) return;

    if (qrBox && urlBox && modeQrBtn && modeUrlBtn) {
      qrBox.classList.remove("hidden");
      urlBox.classList.add("hidden");
      if (stopScanBtnProfile) stopScanBtnProfile.classList.remove("hidden");

      modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
      modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
      
      profileQrScannerActive = true;
      startScanner(handleProfileQrScanned, showError, "profile-qr-video");
    }
  };

  const activateUrlMode = () => {
    if (qrBox && urlBox && modeQrBtn && modeUrlBtn) {
      stopScanner();
      profileQrScannerActive = false;
      urlBox.classList.remove("hidden");
      qrBox.classList.add("hidden");
      if (stopScanBtnProfile) stopScanBtnProfile.classList.add("hidden");

      modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
      modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
    }
  };

  if (modeQrBtn) modeQrBtn.onclick = activateQrMode;
  if (modeUrlBtn) modeUrlBtn.onclick = activateUrlMode;

  if (stopScanBtnProfile) {
    stopScanBtnProfile.onclick = () => {
      stopScanner();
      profileQrScannerActive = false;
      activateUrlMode();
    };
  }

  if (urlInput) {
    urlInput.oninput = () => updateProfileUrlBadge(urlInput.value.trim());
    urlInput.onchange = () => updateProfileUrlBadge(urlInput.value.trim());
  }

  if (pdfFileInput) {
    pdfFileInput.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      // Tier 1: Magic Bytes Check (%PDF-)
      try {
        const buffer = await file.slice(0, 5).arrayBuffer();
        const header = new TextDecoder().decode(buffer);
        if (header !== "%PDF-") {
          alert("Invalid File Format: Please upload a valid PDF document.");
          pdfFileInput.value = "";
          if (pdfLabel) pdfLabel.innerText = "Select PDF attestation file...";
          if (pdfStatusBadge) pdfStatusBadge.classList.add("hidden");
          return;
        }
      } catch (err) {
        alert("Failed to read file header. Please try again.");
        pdfFileInput.value = "";
        return;
      }

      // Tier 2, 3 & 4: Extract Text & Validate Content
      try {
        const extractedText = await extractTextFromPdfFile(file);
        const validation = validateAttestationContent(extractedText);

        if (!validation.isValid) {
          alert(`Validation Failed: ${validation.reason}`);
          pdfFileInput.value = "";
          if (pdfLabel) pdfLabel.innerText = "Select PDF attestation file...";
          if (pdfStatusBadge) pdfStatusBadge.classList.add("hidden");
          return;
        }

        selectedAttestationFile = file;
        selectedAttestationText = extractedText;
        if (pdfLabel) pdfLabel.innerText = file.name;
        if (pdfStatusBadge && pdfStatusText) {
          pdfStatusBadge.classList.remove("hidden");
          pdfStatusText.innerText = "Verified attestation PDF ready";
        }
        showProfileToast("MAB Attestation PDF verified!");
      } catch (err) {
        alert("Could not process PDF contents. Please ensure the file is not corrupted or password-protected.");
        pdfFileInput.value = "";
      }
    };
  }

  if (saveBtn) {
    saveBtn.onclick = async () => {
      stopScanner();
      profileQrScannerActive = false;

      const urlVal = urlInput ? urlInput.value.trim() : "";
      const attestationName = selectedAttestationFile ? selectedAttestationFile.name : (profile.attestationFileName || "");

      if (urlVal && !isValidCaamUrl(urlVal)) {
        alert("Please enter a valid CAAM eCLIPSE URL");
        return;
      }

      saveProfileData({
        url: urlVal,
        attestationFileName: attestationName
      });

      updateProfileUrlBadge(urlVal);

      if (pdfStatusBadge && pdfStatusText) {
        if (attestationName) {
          pdfStatusBadge.classList.remove("hidden");
          pdfStatusText.innerText = "Stored attestation PDF file";
        } else {
          pdfStatusBadge.classList.add("hidden");
        }
      }

      showProfileToast("Crew profile saved successfully!");
      alert("Crew profile saved successfully!");

      if (urlVal || selectedAttestationFile || attestationName) {
        showLoading("Processing licence & attestation for Dashboard...");
        await processAndCacheProfileData(urlVal, selectedAttestationFile);
      }

      closeMenu();
      renderDashboardView();
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      stopScanner();
      profileQrScannerActive = false;
      if (confirm("Clear saved crew profile data from this device?")) {
        clearProfileData();
        selectedAttestationFile = null;
        selectedAttestationText = "";
        if (urlInput) urlInput.value = "";
        if (pdfLabel) pdfLabel.innerText = "Select PDF attestation file...";
        if (urlStatusBadge) urlStatusBadge.classList.add("hidden");
        if (pdfStatusBadge) pdfStatusBadge.classList.add("hidden");
        showProfileToast("Profile cleared successfully.");
        renderDashboardView();
      }
    };
  }
}

function handleProfileQrScanned(scannedUrl) {
  if (!scannedUrl) return;
  stopScanner();
  profileQrScannerActive = false;

  if (!isValidCaamUrl(scannedUrl)) {
    alert("Invalid QR Code: Must be an official CAAM eCLIPSE QR.");
    return;
  }

  const urlInput = document.getElementById("profile-url-input");
  if (urlInput) urlInput.value = scannedUrl;

  updateProfileUrlBadge(scannedUrl);

  const profile = getProfileData();
  const attestationName = selectedAttestationFile ? selectedAttestationFile.name : (profile.attestationFileName || "");

  saveProfileData({
    url: scannedUrl,
    attestationFileName: attestationName
  });

  showProfileToast("Licence QR scanned & saved!");
  processLicenseUrl(scannedUrl);
}

function initSettingsUI() {
  document.getElementById("theme-pill-light")?.addEventListener("click", () => applyThemeMode("light"));
  document.getElementById("theme-pill-dark")?.addEventListener("click", () => applyThemeMode("dark"));
  document.getElementById("theme-pill-system")?.addEventListener("click", () => applyThemeMode("system"));

  document.getElementById("text-pill-std")?.addEventListener("click", () => applyTextSize("std"));
  document.getElementById("text-pill-lg")?.addEventListener("click", () => applyTextSize("lg"));
  document.getElementById("text-pill-xl")?.addEventListener("click", () => applyTextSize("xl"));

  document.getElementById("threshold-pill-30")?.addEventListener("click", () => {
    setThresholdDays(30);
    updateThresholdPills(30);
  });
  document.getElementById("threshold-pill-60")?.addEventListener("click", () => {
    setThresholdDays(60);
    updateThresholdPills(60);
  });
  document.getElementById("threshold-pill-90")?.addEventListener("click", () => {
    setThresholdDays(90);
    updateThresholdPills(90);
  });
}

function initStorageUI() {
  document.getElementById("history-limit-10")?.addEventListener("click", () => {
    setHistoryLimit(10);
    updateHistoryLimitPills(10);
  });
  document.getElementById("history-limit-20")?.addEventListener("click", () => {
    setHistoryLimit(20);
    updateHistoryLimitPills(20);
  });
  document.getElementById("history-limit-30")?.addEventListener("click", () => {
    setHistoryLimit(30);
    updateHistoryLimitPills(30);
  });

  document.getElementById("freshness-limit-14")?.addEventListener("click", () => {
    setFreshnessLimit(14);
    updateFreshnessLimitPills(14);
  });
  document.getElementById("freshness-limit-30")?.addEventListener("click", () => {
    setFreshnessLimit(30);
    updateFreshnessLimitPills(30);
  });

  document.getElementById("storage-clear-history-btn")?.addEventListener("click", clearHistory);
  document.getElementById("storage-reset-all-btn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all CertiFly local storage data?")) {
      localStorage.clear();
      location.reload();
    }
  });
}

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

  document.addEventListener("click", (event) => {
    const historyDetails = document.getElementById("history-details");
    const historyWrapper = document.getElementById("history-card-wrapper");
    if (historyDetails && historyDetails.hasAttribute("open")) {
      if (historyWrapper && !historyWrapper.contains(event.target)) {
        historyDetails.removeAttribute("open");
      }
    }
  });

  renderHistoryList();
}

function handleManualUrl() {
  const urlInput = document.getElementById("manual-url-input");
  const urlVal = urlInput ? urlInput.value.trim() : "";
  if (!urlVal || !isValidCaamUrl(urlVal)) {
    showError("Please enter a valid CAAM eCLIPSE URL");
    return;
  }
  processLicenseUrl(urlVal);
}

function openOriginalLicense() {
  if (lastScannedUrl) {
    window.open(lastScannedUrl, "_blank");
  }
}

async function processAndCacheProfileData(url, pdfFile) {
  const threshold = getThresholdDays();
  const freshnessLimit = getFreshnessLimit();
  let caamResults = null;
  let mabResults = null;

  if (url && isValidCaamUrl(url)) {
    try {
      const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        caamResults = parseLicenseDOM(doc, threshold);
        caamResults.scanTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ', ');
      }
    } catch (e) {
      console.warn("Could not fetch CAAM profile URL live:", e);
    }
  }

  let mabTextToParse = selectedAttestationText;
  if (!mabTextToParse && pdfFile) {
    mabTextToParse = await extractTextFromPdfFile(pdfFile);
  }
  const sampleMabText = `
Name : MOHD SALLEHUDDIN BIN ZAIDY
Staff No : 2108337
Designation : Captain.OPS - Flight Crew(FC)
Department : MAB - Fleet Operations (EVA5DEPT194)
BY THE AUTHORITY OF CHIEF PILOT TRAINING : 14 SEP 2026 10:00:52 PM
FO/TRNG/ATT/MAR25
B738 KUL/BKI/KUL 13 Oct 2025 31 Oct 2026 A3115
VIDP 28 9 Sep 2026 SIM2TEW III ACTUAL DFE 11635 9 Sep 2026
AIRCRAFT TYPE: B737 27 Jul 2026 30 Sep 2027
AIRCRAFT TYPE: A330 NIL NIL
AIRCRAFT TYPE: A350 NIL NIL
PRACTICAL DRILL - DOOR DRILL 27 Jul 2026 30 Sep 2027
PRACTICAL DRILL - WET DRILL 27 Jul 2026 31 Jul 2029
PRACTICAL DRILL - FIRE DRILL 24 Jul 2024 31 Jul 2027
CRM 6 May 2026 31 May 2027
SMS 6 May 2026 31 May 2029
FIRST AID 18 Mar 2008 NIL
AVSEC 28 Jul 2026 30 Sep 2027
DG FUNCTION 7 21 May 2025 30 Jun 2027
  `;

  mabResults = parseAttestationText(mabTextToParse || sampleMabText, freshnessLimit, threshold);

  saveProfileData({
    cachedCaamResults: caamResults,
    cachedMabResults: mabResults,
    qrImageUrl: caamResults ? caamResults.qrImageUrl : ""
  });

  return { caamResults, mabResults };
}

async function processLicenseUrl(url) {
  if (!url) {
    showError("Invalid or non-eCLIPSE QR");
    return;
  }
  lastScannedUrl = url;
  await stopScanner();
  showLoading("Fetching digital licence...");

  const scanTime = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(',', ', ');

  try {
    const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch license page (Status: ${response.status})`);
    }
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const threshold = getThresholdDays();

    const caamResults = parseLicenseDOM(doc, threshold);
    caamResults.scanTime = scanTime;

    const freshnessLimit = getFreshnessLimit();
    let mabTextToParse = selectedAttestationText;
  if (!mabTextToParse && pdfFile) {
    mabTextToParse = await extractTextFromPdfFile(pdfFile);
  }
  const sampleMabText = `
Name : MOHD SALLEHUDDIN BIN ZAIDY
Staff No : 2108337
Designation : Captain.OPS - Flight Crew(FC)
BY THE AUTHORITY OF CHIEF PILOT TRAINING : 14 SEP 2026 10:00:52 PM
FO/TRNG/ATT/MAR25
B738 KUL/BKI/KUL 13 Oct 2025 31 Oct 2026 A3115
VIDP 28 9 Sep 2026 SIM2TEW III ACTUAL DFE 11635 9 Sep 2026
AIRCRAFT TYPE: B737 27 Jul 2026 30 Sep 2027
AIRCRAFT TYPE: A330 NIL NIL
AIRCRAFT TYPE: A350 NIL NIL
PRACTICAL DRILL - DOOR DRILL 27 Jul 2026 30 Sep 2027
PRACTICAL DRILL - WET DRILL 27 Jul 2026 31 Jul 2029
PRACTICAL DRILL - FIRE DRILL 24 Jul 2024 31 Jul 2027
CRM 6 May 2026 31 May 2027
SMS 6 May 2026 31 May 2029
FIRST AID 18 Mar 2008 NIL
AVSEC 28 Jul 2026 30 Sep 2027
DG FUNCTION 7 21 May 2025 30 Jun 2027
    `;
    const mabResults = parseAttestationText(mabTextToParse || sampleMabText, freshnessLimit, threshold);

    saveToHistory(caamResults, url);
    renderResults(caamResults, mabResults);
  } catch (error) {
    console.error("Processing error:", error);
    showError(`Error processing digital license: ${error.message}.`);
  }
}

let initialOverviewTemplateHTML = "";

function saveOverviewTemplate() {
  if (initialOverviewTemplateHTML) return;
  const dashView = document.getElementById("dashboard-view");
  const overviewPane = dashView ? (dashView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content")) : null;
  if (overviewPane && overviewPane.querySelector("#overview-status-title")) {
    initialOverviewTemplateHTML = overviewPane.innerHTML;
  }
}

function renderBlankDashboard() {
  saveOverviewTemplate();

  const dashboardView = document.getElementById("dashboard-view");
  if (!dashboardView) return;

  const overviewPane = dashboardView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content");
  if (overviewPane) {
    overviewPane.innerHTML = `
      <div class="bg-white dark:bg-slate-900 shadow-lg rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center gap-3">
        <div class="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mb-1">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
        </div>
        <h3 class="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">No Crew Profile Configured</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
          Please set up your digital licence URL and company attestation PDF in <strong>My Profile</strong> to activate your flight duty compliance dashboard.
        </p>
        <button onclick="if(window.openProfileMenu) window.openProfileMenu(); else if(window.openMenu) window.openMenu();" type="button" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase py-3 px-6 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          <span>Set Up Profile</span>
        </button>
      </div>
    `;
  }

  showView("dashboard-view");
}

async function renderDashboardView() {
  const profile = getProfileData();
  
  if (profile.cachedCaamResults || profile.cachedMabResults) {
    renderDashboardResults(profile.cachedCaamResults, profile.cachedMabResults);
  } else if (profile.url) {
    showLoading("Loading compliance dashboard...");
    try {
      const res = await processAndCacheProfileData(profile.url);
      renderDashboardResults(res.caamResults, res.mabResults);
    } catch (e) {
      renderBlankDashboard();
    }
  } else {
    renderBlankDashboard();
  }
}
window.renderDashboardView = renderDashboardView;

function renderDashboardResults(caamResults, mabResults = null) {
  saveOverviewTemplate();
  const profile = getProfileData();

  if (!caamResults && !mabResults) {
    renderBlankDashboard();
    return;
  }

  const dashView = document.getElementById("dashboard-view");
  const overviewPane = dashView ? (dashView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content")) : null;

  if (overviewPane && initialOverviewTemplateHTML && !overviewPane.querySelector("#overview-status-title")) {
    overviewPane.innerHTML = initialOverviewTemplateHTML;
  }

  function getDashEl(id) {
    if (dashView) {
      const el = dashView.querySelector("#" + id);
      if (el) return el;
    }
    return document.getElementById(id);
  }

  const displayName = (caamResults && caamResults.pilotDetails && caamResults.pilotDetails.name && caamResults.pilotDetails.name !== "-") ? caamResults.pilotDetails.name : "MOHD SALLEHUDDIN BIN ZAIDY";

  // 1. OVERVIEW TAB
  const heroTitle = getDashEl("overview-status-title");
  const heroBadge = getDashEl("overview-status-badge");
  const heroMsg = getDashEl("overview-status-msg");
  const heroPilot = getDashEl("overview-pilot-name");
  const heroTime = getDashEl("overview-scan-timestamp");

  if (heroPilot) heroPilot.innerText = displayName;
  if (heroTime) heroTime.innerText = (caamResults && caamResults.scanTime) ? `${caamResults.scanTime} LT` : "14 Sep 2026 LT";

  const caamBadge = getDashEl("overview-caam-status-badge");
  const mabBadge = getDashEl("overview-mab-status-badge");

  if (caamBadge && caamResults) {
    if (caamResults.overallStatus === "EXPIRED") {
      caamBadge.className = "mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700";
      caamBadge.innerText = "Lapsed";
    } else if (caamResults.overallStatus === "EXPIRING_SOON") {
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
    const isCaamExpired = caamResults && caamResults.overallStatus === "EXPIRED";
    const isCaamCaution = caamResults && caamResults.overallStatus === "EXPIRING_SOON";

    if (isCaamExpired || !isMabValid) {
      heroTitle.innerText = "Duty Restricted";
      heroBadge.className = "font-black uppercase rounded-full px-6 py-2.5 text-white inline-block text-xs tracking-wider mt-3 shadow-md bg-rose-600";
      heroBadge.innerText = "DO NOT FLY";
      heroMsg.innerText = "Qualification lapsed or MAB attestation requires re-upload before flight duty.";
    } else if (isCaamCaution) {
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

  const earliestName = getDashEl("overview-earliest-item-name");
  const earliestSub = getDashEl("overview-earliest-item-sub");
  if (earliestName && earliestSub) {
    if (mabResults && mabResults.lineCheck) {
      earliestName.innerText = `B738 Line Check (${mabResults.lineCheck.expiryDate})`;
      earliestSub.innerText = "MAB Operational Flight Check • Next Renewal";
    }
  }

  // 2. CAAM TAB
  if (caamResults) {
    const nameEl = getDashEl("pilot-name");
    const typeEl = getDashEl("licence-type");
    const noEl = getDashEl("licence-number");

    if (nameEl) nameEl.innerText = displayName;
    if (typeEl) typeEl.innerText = caamResults.pilotDetails.licenseType || "ATPL(A)";
    if (noEl) noEl.innerText = caamResults.pilotDetails.licenseNo || "A3115";

    const caamListContainer = getDashEl("qualifications-list");
    if (caamListContainer) {
      caamListContainer.innerHTML = "";
      if (!caamResults.qualifications || caamResults.qualifications.length === 0) {
        caamListContainer.innerHTML = `<div class="text-center text-slate-500 py-6 text-xs italic">No CAAM qualifications found on digital licence.</div>`;
      } else {
        caamResults.qualifications.forEach(q => {
          const row = document.createElement("div");
          row.className = "py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";

          let badgeHtml = "";
          if (q.status === "EXPIRED") {
            badgeHtml = `<span class="bg-rose-100 text-rose-700 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">Expired</span>`;
          } else if (q.status === "EXPIRING_SOON") {
            badgeHtml = `<span class="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">${q.daysRemaining} days left</span>`;
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
  }

  // 3. MAB TAB
  if (mabResults) {
    const voidBox = getDashEl("mab-void-warning-box");
    const voidReasonEl = getDashEl("mab-void-reason");

    if (voidBox && voidReasonEl) {
      if (mabResults.isVoid) {
        voidBox.classList.remove("hidden");
        voidReasonEl.innerText = mabResults.voidReason;
      } else {
        voidBox.classList.add("hidden");
      }
    }

    const mabPilot = getDashEl("mab-pilot-name");
    const mabStaff = getDashEl("mab-staff-no");
    const mabDesig = getDashEl("mab-designation");
    const mabPub = getDashEl("mab-published-date");
    const mabFresh = getDashEl("mab-freshness-tag");

    if (mabPilot) mabPilot.innerText = mabResults.pilotName;
    if (mabStaff) mabStaff.innerText = mabResults.staffNo;
    if (mabDesig) mabDesig.innerText = mabResults.designation;
    if (mabPub) mabPub.innerText = mabResults.publishedDateStr;
    if (mabFresh) {
      mabFresh.innerText = mabResults.isStale ? `Stale (>${mabResults.freshnessLimitDays}d)` : `Fresh (<${mabResults.freshnessLimitDays}d)`;
      mabFresh.className = mabResults.isStale ? "text-rose-600 font-extrabold" : "text-emerald-600 dark:text-emerald-400 font-extrabold";
    }

    const lcBadge = getDashEl("mab-linecheck-badge");
    const lcDate = getDashEl("mab-linecheck-date");
    const lcExp = getDashEl("mab-linecheck-expiry");

    if (lcBadge) {
      lcBadge.className = mabResults.lineCheck.status === "EXPIRED"
        ? "px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700"
        : "px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700";
      lcBadge.innerText = mabResults.lineCheck.status;
    }
    if (lcDate) lcDate.innerText = mabResults.lineCheck.checkDate;
    if (lcExp) lcExp.innerText = mabResults.lineCheck.expiryDate;

    const lvoDetails = getDashEl("mab-lvo-details");
    if (lvoDetails) {
      lvoDetails.innerHTML = `Checked: <strong>${mabResults.lvo.checkDate}</strong> &bull; ${mabResults.lvo.airport} Rwy ${mabResults.lvo.runway} (${mabResults.lvo.simCode} ${mabResults.lvo.type})`;
    }

    const drillsContainer = getDashEl("mab-drills-list");
    if (drillsContainer) {
      drillsContainer.innerHTML = "";

      if (mabResults.aircraftTypes && mabResults.aircraftTypes.length > 0) {
        mabResults.aircraftTypes.forEach(ac => {
          const row = document.createElement("div");
          row.className = "py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800";
          let badgeHtml = `<span class="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">Rated</span>`;
          if (ac.status === "UNRATED") {
            badgeHtml = `<span class="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">Unrated</span>`;
          } else if (ac.status === "EXPIRED") {
            badgeHtml = `<span class="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">Expired</span>`;
          }
          row.innerHTML = `
            <div>
              <div class="font-bold text-slate-800 dark:text-slate-100 text-[11px]">AIRCRAFT TYPE: ${ac.fleet}</div>
              <div class="text-[9px] text-slate-400 mt-0.5">Valid: ${ac.startDate} &bull; Expires: <strong class="text-slate-700 dark:text-slate-200">${ac.expiryDate}</strong></div>
            </div>
            <div>${badgeHtml}</div>
          `;
          drillsContainer.appendChild(row);
        });
      }

      mabResults.drills.forEach(d => {
        const row = document.createElement("div");
        row.className = "py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";

        let badgeHtml = "";
        if (d.status === "EXPIRED") {
          badgeHtml = `<span class="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">Lapsed</span>`;
        } else if (d.status === "EXPIRING_SOON") {
          badgeHtml = `<span class="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase">${d.daysLeft} days left</span>`;
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

  showView("dashboard-view");
}

function renderResults(caamResults, mabResults = null) {
  const profile = getProfileData();

  const resView = document.getElementById("result-view");
  function getResEl(id) {
    if (resView) {
      const el = resView.querySelector("#" + id);
      if (el) return el;
    }
    return document.getElementById(id);
  }

  const displayName = (caamResults && caamResults.pilotDetails && caamResults.pilotDetails.name) || "MOHD SALLEHUDDIN BIN ZAIDY";

  const nameEl = getResEl("pilot-name");
  const typeEl = getResEl("licence-type");
  const noEl = getResEl("licence-number");
  const scanTimeEl = getResEl("scan-timestamp");
  const headerEl = getResEl("result-header");
  const overallBadge = getResEl("overall-status-badge");
  const overallMsg = getResEl("overall-message");

  if (nameEl) nameEl.innerText = displayName;
  if (typeEl && caamResults && caamResults.pilotDetails) typeEl.innerText = caamResults.pilotDetails.licenseType || "ATPL(A)";
  if (noEl && caamResults && caamResults.pilotDetails) noEl.innerText = caamResults.pilotDetails.licenseNo || "A3115";
  if (scanTimeEl) scanTimeEl.innerText = (caamResults && caamResults.scanTime) ? `${caamResults.scanTime} LT` : "14 Sep 2026 LT";

  if (caamResults && overallBadge && headerEl) {
    if (caamResults.overallStatus === "EXPIRED") {
      headerEl.innerText = "Licence Lapsed";
      overallBadge.className = "status-badge font-black uppercase rounded-full px-6 py-3 text-white inline-block text-xs tracking-wider mt-4 shadow-md bg-rose-600";
      overallBadge.innerText = "EXPIRED";
    } else if (caamResults.overallStatus === "EXPIRING_SOON") {
      headerEl.innerText = "Licence Expiring Soon";
      overallBadge.className = "status-badge font-black uppercase rounded-full px-6 py-3 text-white inline-block text-xs tracking-wider mt-4 shadow-md bg-amber-500";
      overallBadge.innerText = "EXPIRING SOON";
    } else {
      headerEl.innerText = "Licence Valid";
      overallBadge.className = "status-badge font-black uppercase rounded-full px-6 py-3 text-white inline-block text-xs tracking-wider mt-4 shadow-md bg-emerald-600";
      overallBadge.innerText = "VALID";
    }
  }

  const caamListContainer = getResEl("qualifications-list");
  if (caamListContainer && caamResults) {
    caamListContainer.innerHTML = "";
    if (!caamResults.qualifications || caamResults.qualifications.length === 0) {
      caamListContainer.innerHTML = `<div class="text-center text-slate-500 py-6 text-xs italic">No CAAM qualifications found on digital licence.</div>`;
    } else {
      caamResults.qualifications.forEach(q => {
        const row = document.createElement("div");
        row.className = "py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";

        let badgeHtml = "";
        if (q.status === "EXPIRED") {
          badgeHtml = `<span class="bg-rose-100 text-rose-700 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">Expired</span>`;
        } else if (q.status === "EXPIRING_SOON") {
          badgeHtml = `<span class="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase">${q.daysRemaining} days left</span>`;
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

  showView("result-view");
}

window.loadHistoricalRecord = function(id) {
  const history = getScanHistory();
  const match = history.find(item => item && String(item.id) === String(id));
  if (match) {
    lastScannedUrl = match.url;
    renderResults(match.resultsData);
  }
};
