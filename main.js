// main.js - Main Application Entry Orchestrator

import { PROXY_URL, APP_VERSION } from './js/config.js';
import { parseLicenseDOM } from './js/parser.js';
import { 
  saveToHistory, renderHistoryList, getScanHistory, getProfileData, 
  saveProfileData, clearProfileData, clearHistory, getThresholdDays, setThresholdDays,
  getHistoryLimit, setHistoryLimit
} from './js/storage.js';
import { startScanner, stopScanner } from './js/scanner.js';
import { 
  updateNetworkStatus, showScannerView, showLoading, showError, showView, 
  initNavigationBars, closeMenu, applyThemeMode, applyTextSize, updateThresholdPills, updateHistoryLimitPills
} from './js/ui.js';

let lastScannedUrl = "";
let selectedAttestationFile = null;

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initNavigationBars();
  initProfileUI();
  initSettingsUI();
  initStorageUI();
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

  const saveBtn = document.getElementById("profile-save-btn");
  const clearBtn = document.getElementById("profile-clear-btn");
  const quickVerifyBtn = document.getElementById("verify-my-licence-btn");
  const quickVerifyLabel = document.getElementById("verify-my-licence-label");

  // Populate form fields
  if (nicknameInput) nicknameInput.value = profile.nickname || "";
  if (urlInput) urlInput.value = profile.url || "";
  if (pdfLabel) pdfLabel.innerText = profile.attestationFileName || "Select PDF attestation file...";

  // Quick Verify Button on Home Screen
  if (quickVerifyBtn && profile.url) {
    quickVerifyBtn.classList.remove("hidden");
    if (quickVerifyLabel) {
      quickVerifyLabel.innerText = profile.nickname ? `Verify ${profile.nickname}'s Licence` : "Verify My Licence";
    }
  } else if (quickVerifyBtn) {
    quickVerifyBtn.classList.add("hidden");
  }

  // Active Mode Selector: Scan QR vs Paste URL
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

  // Handle scanned QR result inside Profile Sub-Pane
  function handleProfileQrScanned(scannedUrl) {
    if (!scannedUrl) return;
    
    stopScanner();

    if (!scannedUrl.includes("eclipse.caam.gov.my")) {
      alert("Invalid QR Code: Must be an official CAAM eCLIPSE QR.");
      return;
    }

    if (urlInput) urlInput.value = scannedUrl;

    const nickVal = nicknameInput ? nicknameInput.value.trim() : "";
    const attestationName = selectedAttestationFile ? selectedAttestationFile.name : (profile.attestationFileName || "");

    saveProfileData({
      nickname: nickVal,
      url: scannedUrl,
      attestationFileName: attestationName
    });

    alert("Licence QR scanned & saved to profile!");
    processLicenseUrl(scannedUrl);
  }

  // PDF File Selection Handler
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
      }
    };
  }

  // Save Profile Data Button Action
  if (saveBtn) {
    saveBtn.onclick = () => {
      stopScanner();
      const nickVal = nicknameInput ? nicknameInput.value.trim() : "";
      const urlVal = urlInput ? urlInput.value.trim() : "";
      const attestationName = selectedAttestationFile ? selectedAttestationFile.name : (profile.attestationFileName || "");

      if (urlVal && !urlVal.includes("eclipse.caam.gov.my")) {
        alert("Please enter a valid CAAM eCLIPSE URL");
        return;
      }

      saveProfileData({
        nickname: nickVal,
        url: urlVal,
        attestationFileName: attestationName
      });

      alert("Pilot profile saved successfully!");
      closeMenu();
      initProfileUI();
      initStorageUI();
    };
  }

  // Clear Profile Data Button Action
  if (clearBtn) {
    clearBtn.onclick = () => {
      stopScanner();
      if (confirm("Clear saved pilot profile data from this device?")) {
        clearProfileData();
        selectedAttestationFile = null;
        if (nicknameInput) nicknameInput.value = "";
        if (urlInput) urlInput.value = "";
        if (pdfLabel) pdfLabel.innerText = "Select PDF attestation file...";
        initProfileUI();
        initStorageUI();
      }
    };
  }

  // Quick Verify Button Action (Home Screen)
  if (quickVerifyBtn) {
    quickVerifyBtn.onclick = () => {
      const currentProfile = getProfileData();
      if (currentProfile.url) {
        processLicenseUrl(currentProfile.url);
      } else {
        showError("No profile URL saved.");
      }
    };
  }
}

function initSettingsUI() {
  // Theme Mode Connected Pills
  document.getElementById("theme-pill-light")?.addEventListener("click", () => applyThemeMode("light"));
  document.getElementById("theme-pill-dark")?.addEventListener("click", () => applyThemeMode("dark"));
  document.getElementById("theme-pill-system")?.addEventListener("click", () => applyThemeMode("system"));

  // Text Scale Connected Pills
  document.getElementById("text-pill-std")?.addEventListener("click", () => applyTextSize("std"));
  document.getElementById("text-pill-lg")?.addEventListener("click", () => applyTextSize("lg"));
  document.getElementById("text-pill-xl")?.addEventListener("click", () => applyTextSize("xl"));

  // Checker Threshold Connected Pills (30, 60, 90 Days)
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
  // History Limit Connected Pills (10, 20, 30 Items)
  document.getElementById("history-limit-10")?.addEventListener("click", () => {
    setHistoryLimit(10);
    updateHistoryLimitPills(10);
    updateStorageMetrics();
  });
  document.getElementById("history-limit-20")?.addEventListener("click", () => {
    setHistoryLimit(20);
    updateHistoryLimitPills(20);
    updateStorageMetrics();
  });
  document.getElementById("history-limit-30")?.addEventListener("click", () => {
    setHistoryLimit(30);
    updateHistoryLimitPills(30);
    updateStorageMetrics();
  });

  // Storage Actions
  document.getElementById("storage-clear-history-btn")?.addEventListener("click", () => {
    clearHistory();
    updateStorageMetrics();
  });

  document.getElementById("storage-reset-all-btn")?.addEventListener("click", () => {
    if (confirm("Reset ALL application data (saved profile, history & custom settings)?")) {
      localStorage.clear();
      location.reload();
    }
  });

  updateStorageMetrics();
}

function updateStorageMetrics() {
  const scansCount = document.getElementById("storage-scans-count");
  const profileStatus = document.getElementById("storage-profile-status");

  const history = getScanHistory();
  if (scansCount) scansCount.innerText = `${history.length} / ${getHistoryLimit()}`;

  const profile = getProfileData();
  if (profileStatus) {
    if (profile && profile.url) {
      profileStatus.innerText = profile.nickname ? `Saved (${profile.nickname})` : "Saved (Active)";
      profileStatus.className = "font-extrabold text-emerald-600 dark:text-emerald-400";
    } else {
      profileStatus.innerText = "No Profile Saved";
      profileStatus.className = "font-bold text-slate-400";
    }
  }
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

  document.addEventListener('contextmenu', (event) => {
    if (event.target.id === "manual-url-input") return;
    event.preventDefault();
  }, false);

  document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('gesturestart', (event) => {
    event.preventDefault();
  });

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
  const urlInput = document.getElementById("manual-url-input").value.trim();

  if (!urlInput) {
    showError("Please enter a valid licence page URL");
    return;
  }

  if (!urlInput.startsWith("http://eclipse.caam.gov.my/ELICENSING/userprofileqr.do?") &&
      !urlInput.startsWith("https://eclipse.caam.gov.my/ELICENSING/userprofileqr.do?")) {
    showError("Please enter a valid licence page URL");
    return;
  }

  processLicenseUrl(urlInput);
}

function openOriginalLicense() {
  if (lastScannedUrl) {
    window.open(lastScannedUrl, "_blank");
  }
}

async function processLicenseUrl(url) {
  if (!url) {
    showError("Invalid or non-eCLIPSE QR");
    return;
  }

  const lowerUrl = url.trim().toLowerCase();
  const isOfficialDomain = lowerUrl.includes("eclipse.caam.gov.my");
  const isValidPath = lowerUrl.includes("/elicensing/userprofileqr.do") || lowerUrl.includes("/digitallicence/info.do");

  if (!isOfficialDomain || !isValidPath) {
    showError("Invalid or non-eCLIPSE QR");
    return;
  }

  lastScannedUrl = url;
  await stopScanner();

  showLoading("Fetching digital licence...");

  const scanTime = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(', ', ', ').replace(' at ', ', ').replace(',', ', ');

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
    const results = parseLicenseDOM(doc, threshold);
    results.scanTime = scanTime;

    saveToHistory(results, url);
    renderResults(results);
  } catch (error) {
    console.error("Processing error:", error);
    showError(`Error processing digital license: ${error.message}.`);
  }
}

function renderResults(results) {
  const timeEl = document.getElementById("scan-timestamp");
  if (timeEl) {
    timeEl.innerText = results.scanTime ? `${results.scanTime} LT` : "N/A";
  }

  const profile = getProfileData();
  const displayName = profile.nickname || results.pilotDetails.name || "N/A";

  document.getElementById("pilot-name").innerText = displayName;
  document.getElementById("licence-type").innerText = results.pilotDetails.licenseType || "N/A";
  document.getElementById("licence-number").innerText = results.pilotDetails.licenseNo || "N/A";

  if (results.qualifications && results.qualifications.length > 0) {
    results.qualifications.sort((a, b) => {
      const getRank = (nameStr) => {
        const name = (nameStr || "").toUpperCase().trim();
        if ((name.includes("VALIDITY") && !name.includes("ISSUE")) || name.includes("ATPL") || name.includes("CPL") || name.includes("PPL") || name.includes("MPL")) return 1;
        if (name.includes("CLASS 1") || name.includes("CLASS I") || name.includes("MEDICAL 1") || name.includes("MEDICAL I")) return 2;
        if (name.includes("CLASS 2") || name.includes("CLASS II") || name.includes("MEDICAL 2") || name.includes("MEDICAL II")) return 3;
        if (name.includes("RTOL") || name.includes("RADIOTELEPHONY") || name.includes("R/T") || name.includes("RADIO") || name.includes("TELEPHONY")) return 4;
        if (name.includes("ELP") || name.includes("ENGLISH") || name.includes("LANGUAGE") || name.includes("PROFICIENCY")) return 5;
        if (name.includes("INSTRUMENT RATING") || name.includes("INSTRUMENT") || name === "IR") return 7;
        return 6;
      };
      return getRank(a.name) - getRank(b.name);
    });
  }

  const statusBadge = document.getElementById("overall-status-badge");
  const resultHeader = document.getElementById("result-header");
  const overallMsg = document.getElementById("overall-message");

  statusBadge.className = "status-badge font-bold uppercase rounded px-4 py-2 text-white inline-block text-lg mt-2";
  document.body.classList.remove("bg-green-100", "bg-orange-100", "bg-red-100");

  if (results.overallStatus === "EXPIRED") {
    statusBadge.innerText = "DO NOT FLY!";
    statusBadge.classList.add("bg-red-600");
    resultHeader.style.color = "#dc2626";
    resultHeader.innerText = "Validity Expired / Invalid";
    document.body.classList.add("bg-red-100");
    overallMsg.innerHTML = "One or more qualifications have lapsed. Kindly contact Fleet Captains / SIPs.";
  } else if (results.overallStatus === "EXPIRING_SOON") {
    statusBadge.innerText = "FLY WITH CAUTION!";
    statusBadge.classList.add("bg-amber-500");
    resultHeader.style.color = "#d97706";
    resultHeader.innerText = "Validity Expiring Soon";
    document.body.classList.add("bg-orange-100");
    overallMsg.innerHTML = "Some qualifications will expire soon. Ensure they remain valid throughout the duty period.";
  } else {
    resultHeader.innerText = "Licence Valid";
    statusBadge.innerText = "HAVE A SAFE FLIGHT!";
    statusBadge.classList.add("bg-green-600");
    resultHeader.style.color = "#16a34a";
    document.body.classList.add("bg-green-100");
    overallMsg.innerHTML = "All qualifications and medical checks are valid.";
  }

  const container = document.getElementById("qualifications-list");
  container.innerHTML = "";

  if (results.qualifications.length === 0) {
    container.innerHTML = `<div class="text-center text-slate-500 py-6"> No qualifications found on the scanned digital license. </div>`;
  } else {
    results.qualifications.forEach(q => {
      const qRow = document.createElement("div");
      qRow.className = "border-b border-slate-100 last:border-b-0 py-3 flex items-center justify-between";

      let statusHtml = "";
      if (q.status === "EXPIRED") {
        statusHtml = `<span class="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded font-bold uppercase">Expired</span>`;
      } else if (q.status === "EXPIRING_SOON") {
        const daysLeft = q.daysRemaining === 1 ? "1 day left" : `${q.daysRemaining} days left`;
        statusHtml = `<span class="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded font-bold uppercase">${daysLeft}</span>`;
      } else {
        statusHtml = `<span class="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded font-bold uppercase">Valid</span>`;
      }

      qRow.innerHTML = `
        <div class="flex-grow pr-4">
          <div class="font-semibold text-slate-800 text-sm md:text-base">${q.name}</div>
          <div class="text-xs text-slate-500">Expiry:<span class="uppercase text-bold"> ${q.dateText || "No Expiry"}</span></div>
        </div>
        <div class="flex-shrink-0 text-right">
          ${statusHtml}
        </div>
      `;
      container.appendChild(qRow);
    });
  }

  showView("result-view");
}

window.loadHistoricalRecord = function(id) {
  const history = getScanHistory();
  const match = history.find(item => item.id === id);
  if (match) {
    lastScannedUrl = match.url;
    renderResults(match.resultsData);
  }
};
