// main.js - Main Application Entry Orchestrator

import { PROXY_URL, APP_VERSION } from './js/config.js';
import { parseLicenseDOM, parseAttestationText } from './js/parser.js';
import { 
  saveToHistory, renderHistoryList, getScanHistory, getProfileData, 
  saveProfileData, clearProfileData, clearHistory, getThresholdDays, setThresholdDays,
  getHistoryLimit, setHistoryLimit, getFreshnessLimit, setFreshnessLimit
} from './js/storage.js';
import { startScanner, stopScanner } from './js/scanner.js';
import { 
  updateNetworkStatus, showScannerView, showLoading, showError, showView, 
  initNavigationBars, closeMenu, applyThemeMode, applyTextSize, updateThresholdPills, 
  updateHistoryLimitPills, updateFreshnessLimitPills, switchResultTab
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

// Helper for displaying in-app toast notification
function showProfileToast(msg = "Profile saved successfully!", isError = false) {
  const toast = document.getElementById("profile-toast");
  const toastMsg = document.getElementById("profile-toast-msg");
  if (!toast) return;

  if (toastMsg) toastMsg.innerText = msg;
  if (isError) {
    toast.className = "p-3 rounded-xl bg-rose-600 text-white text-xs font-extrabold text-center shadow-lg transition-all duration-300 flex items-center justify-center gap-2";
  } else {
    toast.className = "p-3 rounded-xl bg-emerald-600 text-white text-xs font-extrabold text-center shadow-lg transition-all duration-300 flex items-center justify-center gap-2";
  }

  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

function updateProfileUrlBadge(urlStr) {
  const urlBadge = document.getElementById("profile-url-badge") || document.getElementById("profile-url-status-badge");
  const urlText = document.getElementById("profile-url-badge-text") || document.getElementById("profile-url-status-text");
  if (!urlBadge) return;

  const cleanUrl = urlStr ? urlStr.trim() : "";

  if (cleanUrl) {
    urlBadge.classList.remove("hidden");
    if (urlText) {
      const storedProfile = getProfileData();
      if (storedProfile && storedProfile.url && cleanUrl === storedProfile.url.trim()) {
        urlText.innerText = "Stored licence URL";
      } else {
        urlText.innerText = "Valid CAAM licence URL captured";
      }
    }
  } else {
    urlBadge.classList.add("hidden");
  }
}

// ----------------------------------------------------
// 1. CREW PROFILE UI CONTROLLER
// ----------------------------------------------------
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
  const stopScanBtn = document.getElementById("profile-stop-qr-btn") || document.getElementById("profile-stop-scan-btn");

  const pdfBadge = document.getElementById("profile-pdf-badge") || document.getElementById("profile-pdf-status-badge");
  const pdfBadgeText = document.getElementById("profile-pdf-badge-text") || document.getElementById("profile-pdf-status-text");

  // 1. Set Nickname Value & Dynamic Placeholder
  if (nicknameInput) {
    nicknameInput.value = profile.nickname || "";
    nicknameInput.placeholder = profile.nickname || "e.g Maverick";
  }

  // 2. Set URL Input & Badge
  if (urlInput) urlInput.value = profile.url || "";
  updateProfileUrlBadge(profile.url || "");

  // 3. Set PDF File Label & Badge
  if (pdfLabel) pdfLabel.innerText = profile.attestationFileName || "Select PDF attestation file...";
  if (pdfBadge) {
    if (profile.attestationFileName) {
      pdfBadge.classList.remove("hidden");
      if (pdfBadgeText) pdfBadgeText.innerText = "Stored attestation PDF file";
    } else {
      pdfBadge.classList.add("hidden");
    }
  }

  stopScanner();
  if (qrBox) qrBox.classList.add("hidden");

  if (profile.url && urlBox && modeUrlBtn && modeQrBtn) {
    urlBox.classList.remove("hidden");
    modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
    modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
  } else if (urlBox && modeUrlBtn && modeQrBtn) {
    urlBox.classList.add("hidden");
  }

  if (quickVerifyBtn && profile.url) {
    quickVerifyBtn.classList.remove("hidden");
    if (quickVerifyLabel) {
      quickVerifyLabel.innerText = profile.nickname ? `Verify ${profile.nickname}'s Licence` : "Verify My Licence";
    }
  } else if (quickVerifyBtn) {
    quickVerifyBtn.classList.add("hidden");
  }

  const activateQrMode = () => {
    if (qrBox && urlBox && modeQrBtn && modeUrlBtn) {
      if (!qrBox.classList.contains("hidden")) {
        // Camera scanner is already active -> DO NOTHING!
        return;
      }
      qrBox.classList.remove("hidden");
      urlBox.classList.add("hidden");
      if (stopScanBtn) stopScanBtn.classList.remove("hidden");
      modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
      modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
      startScanner(handleProfileQrScanned, showError, "profile-qr-video");
    }
  };

  const activateUrlMode = () => {
    if (qrBox && urlBox && modeQrBtn && modeUrlBtn) {
      stopScanner();
      urlBox.classList.remove("hidden");
      qrBox.classList.add("hidden");
      if (stopScanBtn) stopScanBtn.classList.add("hidden");
      modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
      modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
    }
  };

  if (modeQrBtn) modeQrBtn.onclick = activateQrMode;
  if (modeUrlBtn) modeUrlBtn.onclick = activateUrlMode;

  if (stopScanBtn) {
    stopScanBtn.onclick = () => {
      stopScanner();
      activateUrlMode();
    };
  }

  if (urlInput) {
    urlInput.oninput = () => updateProfileUrlBadge(urlInput.value.trim());
    urlInput.onchange = () => updateProfileUrlBadge(urlInput.value.trim());
  }

  function handleProfileQrScanned(scannedUrl) {
    stopScanner();
    if (urlInput) urlInput.value = scannedUrl;
    activateUrlMode();
    updateProfileUrlBadge(scannedUrl);
    showProfileToast("CAAM Licence QR scanned successfully!");
  }

  if (pdfFileInput) {
    pdfFileInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.type !== "application/pdf") {
          showProfileToast("Please select a valid PDF file.", true);
          return;
        }
        selectedAttestationFile = file;
        if (pdfLabel) pdfLabel.innerText = file.name;
        if (pdfBadge) {
          pdfBadge.classList.remove("hidden");
          if (pdfBadgeText) pdfBadgeText.innerText = "File uploaded and ready to save";
        }
      }
    };
  }

  if (saveBtn) {
    saveBtn.onclick = () => {
      const currentStored = getProfileData();
      const nickname = nicknameInput ? nicknameInput.value.trim() : "";
      const urlVal = urlInput ? urlInput.value.trim() : "";
      const attestationName = selectedAttestationFile ? selectedAttestationFile.name : (currentStored.attestationFileName || "");

      saveProfileData({
        nickname: nickname,
        url: urlVal,
        attestationFileName: attestationName
      });

      if (nicknameInput) {
        nicknameInput.placeholder = nickname || "e.g Maverick";
      }

      updateProfileUrlBadge(urlVal);

      if (pdfBadge) {
        if (attestationName) {
          pdfBadge.classList.remove("hidden");
          if (pdfBadgeText) pdfBadgeText.innerText = "Stored attestation PDF file";
        } else {
          pdfBadge.classList.add("hidden");
        }
      }

      if (quickVerifyBtn) {
        if (urlVal) {
          quickVerifyBtn.classList.remove("hidden");
          if (quickVerifyLabel) {
            quickVerifyLabel.innerText = nickname ? `Verify ${nickname}'s Licence` : "Verify My Licence";
          }
        } else {
          quickVerifyBtn.classList.add("hidden");
        }
      }

      showProfileToast("Crew profile saved successfully!");
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      if (confirm("Clear saved crew profile data from this device?")) {
        clearProfileData();
        selectedAttestationFile = null;
        if (nicknameInput) {
          nicknameInput.value = "";
          nicknameInput.placeholder = "e.g Maverick";
        }
        if (urlInput) urlInput.value = "";
        if (pdfLabel) pdfLabel.innerText = "Select PDF attestation file...";
        if (quickVerifyBtn) quickVerifyBtn.classList.add("hidden");
        if (pdfBadge) pdfBadge.classList.add("hidden");
        updateProfileUrlBadge("");
        showProfileToast("Crew profile cleared.", false);
      }
    };
  }

  if (quickVerifyBtn) {
    quickVerifyBtn.onclick = () => {
      const savedProfile = getProfileData();
      if (savedProfile.url) {
        closeMenu();
        showLoading("Fetching digital licence...");
        processLicenseUrl(savedProfile.url);
      } else {
        showProfileToast("No licence URL saved in profile.", true);
      }
    };
  }
}

// ----------------------------------------------------
// 2. SETTINGS & STORAGE PILL HANDLERS
// ----------------------------------------------------
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

  document.getElementById("storage-clear-history-btn")?.addEventListener("click", () => {
    clearHistory();
  });

  document.getElementById("storage-reset-all-btn")?.addEventListener("click", () => {
    if (confirm("Reset all local application data, history and preferences?")) {
      localStorage.clear();
      location.reload();
    }
  });
}

// ----------------------------------------------------
// 3. APPLICATION ORCHESTRATION & EVENT LISTENERS
// ----------------------------------------------------
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

  const historyDetails = document.getElementById("history-details");
  const historyWrapper = document.getElementById("history-card-wrapper");

  if (historyDetails && historyWrapper) {
    historyDetails.addEventListener("toggle", () => {
      if (historyDetails.open) {
        historyWrapper.classList.remove("shadow-sm");
        historyWrapper.classList.add("shadow-md");
      } else {
        historyWrapper.classList.remove("shadow-md");
        historyWrapper.classList.add("shadow-sm");
      }
    });
  }

  document.addEventListener('contextmenu', (event) => {
    if (event.target.tagName === 'IMG' || event.target.tagName === 'VIDEO') {
      event.preventDefault();
    }
  });

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

  renderHistoryList();

  const manualInput = document.getElementById("manual-url-input");
  if (manualInput) {
    manualInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleManualUrl();
    });
  }
}

function handleManualUrl() {
  const input = document.getElementById("manual-url-input");
  if (!input) return;
  const url = input.value.trim();
  if (!url) {
    showError("Please enter a valid eCLIPSE licence URL.");
    return;
  }
  showLoading("Fetching digital licence...");
  processLicenseUrl(url);
}

function openOriginalLicense() {
  if (lastScannedUrl) {
    window.open(lastScannedUrl, "_blank");
  } else {
    alert("No active digital licence URL found.");
  }
}

// ----------------------------------------------------
// 4. LICENCE & ATTESTATION PROCESSING
// ----------------------------------------------------
function processLicenseUrl(targetUrl) {
  lastScannedUrl = targetUrl;
  const encodedUrl = encodeURIComponent(targetUrl);
  const targetApiUrl = `${PROXY_URL}?url=${encodedUrl}&v=${APP_VERSION}`;

  fetch(targetApiUrl)
    .then(response => {
      if (!response.ok) throw new Error("Unable to connect to CAAM server.");
      return response.text();
    })
    .then(htmlText => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      const threshold = getThresholdDays();
      const caamResults = parseLicenseDOM(doc, threshold);
      caamResults.scanTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
        .replace(',', ', ');

      const freshnessLimit = getFreshnessLimit();
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
DOOR DRILL 27 Jul 2026 30 Sep 2027
WET DRILL 27 Jul 2026 31 Jul 2029
FIRE DRILL 24 Jul 2024 31 Jul 2027
CRM 06 May 2026 31 May 2027
SMS 06 May 2026 31 May 2029
FIRST AID 18 Mar 2008 NIL
AVSEC 28 Jul 2026 30 Sep 2027
DANGEROUS GOODS FUNCTION 7 21 May 2025 30 Jun 2027
`;

      const mabResults = parseAttestationText(sampleMabText, freshnessLimit, threshold);

      saveToHistory(caamResults, targetUrl);
      renderResults(caamResults, mabResults);
    })
    .catch(err => {
      showError("Failed to fetch licence data: " + err.message);
    });
}

// ----------------------------------------------------
// 5. UNIFIED DASHBOARD RESULTS RENDERER
// ----------------------------------------------------
function renderResults(caamResults, mabResults = null) {
  const profile = getProfileData();
  const displayName = profile.nickname || caamResults.pilotDetails.name || "MOHD SALLEHUDDIN BIN ZAIDY";

  // 1. RENDER OVERVIEW TAB (#tab-overview-content)
  const heroTitle = document.getElementById("overview-status-title");
  const heroBadge = document.getElementById("overview-status-badge");
  const heroMsg = document.getElementById("overview-status-msg");
  const heroPilot = document.getElementById("overview-pilot-name");
  const heroTime = document.getElementById("overview-scan-timestamp");

  if (heroPilot) heroPilot.innerText = displayName;
  if (heroTime) heroTime.innerText = caamResults.scanTime ? `${caamResults.scanTime} LT` : "14 Sep 2026 LT";

  const caamBadge = document.getElementById("overview-caam-status-badge");
  const mabBadge = document.getElementById("overview-mab-status-badge");

  if (caamBadge) {
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
      mabBadge.innerText = mabResults.isStale ? `PDF Stale (>${mabResults.freshnessLimitDays}d)` : "Drill Lapsed";
    } else {
      mabBadge.className = "mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700";
      mabBadge.innerText = "Attested";
    }
  }

  if (heroTitle && heroBadge && heroMsg) {
    if (caamResults.overallStatus === "EXPIRED" || !isMabValid) {
      heroTitle.innerText = "Duty Restricted";
      heroBadge.className = "font-black uppercase rounded-full px-6 py-2.5 text-white inline-block text-xs tracking-wider mt-3 shadow-md bg-rose-600";
      heroBadge.innerText = "DO NOT FLY";
      heroMsg.innerText = "Qualification lapsed or MAB attestation requires re-upload before flight duty.";
    } else if (caamResults.overallStatus === "EXPIRING_SOON") {
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

  const earliestName = document.getElementById("overview-earliest-item-name");
  const earliestSub = document.getElementById("overview-earliest-item-sub");
  if (earliestName && earliestSub) {
    if (mabResults && mabResults.lineCheck) {
      earliestName.innerText = `B738 Line Check (${mabResults.lineCheck.expiryDate})`;
      earliestSub.innerText = "MAB Operational Flight Check • Next Renewal";
    }
  }

  // 2. RENDER CAAM TAB (#tab-caam-content)
  const nameEl = document.getElementById("pilot-name");
  const typeEl = document.getElementById("licence-type");
  const noEl = document.getElementById("licence-number");

  if (nameEl) nameEl.innerText = displayName;
  if (typeEl) typeEl.innerText = caamResults.pilotDetails.licenseType || "ATPL(A)";
  if (noEl) noEl.innerText = caamResults.pilotDetails.licenseNo || "A3115";

  const caamListContainer = document.getElementById("qualifications-list");
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

  // 3. RENDER MAB TAB (#tab-mab-content)
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
