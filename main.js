// ./main.js (1811_R436) - CertiFly Application Shell & Orchestrator
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import { showToast, setTopBanner, renderNoticeCard, showAlertModal, showConfirmDialog } from './js/notifications.js';
import { animateOverviewDashboard, animateOverviewEntrance, animateBottomBanner } from './js/animations.js';
import { initToolsModule, filterRecurrentCourses, calculatePpcWindows, calculateCourseExpiry, calculateMedicalWindow, calculateFdpAndDiscretion, getMaxAllowableFdp, setSectorCount, getSectorCount, runToolCalculation, setToolsTab, getToolsState, switchToolCategory, setStandbyLocation, openRecurrentCourseModal, closeRecurrentCourseModal, selectRecurrentCourse, resetToolInputs, renderToolsOutputCard, formatDateDDMMMYYYY, openEfbDatePicker, closeEfbDatePicker, selectEfbDate, setEfbDatePreset, changeEfbMonth } from './js/tools.js';
import { PROXY_URL, APP_VERSION } from './js/config.js';
import { parseLicenseDOM } from './js/caamParser.js';
import { parseAttestationText, validateAttestationContent, parseQualificationSlipText, validateQualificationSlipContent } from './js/parser.js';
import { saveToHistory, renderHistoryList, getScanHistory, getProfileData, saveProfileData, clearProfileData, clearHistory, getThresholdDays, setThresholdDays, getHistoryLimit, setHistoryLimit, getFreshnessLimit, setFreshnessLimit, hasProfileData, getAttestationPdf, setAttestationPdf, removeAttestationPdf, getAttestationData, setAttestationData, clearAttestationData, getQualificationSlipPdf, setQualificationSlipPdf, removeQualificationSlipPdf, getQualificationSlipData, setQualificationSlipData, clearQualificationSlipData, getThemeMode, setThemeMode, getTextSize, setTextSize, clearAllAppData } from './js/storage.js';
import { startScanner, stopScanner, switchScanHubTab, renderRecentPilotsList, cycleCameraLens, toggleTorch, handleClipboardPaste } from './js/scanner.js';
import { updateNetworkStatus, showScannerView, showLoading, showError, showView, initNavigationBars, closeMenu, applyThemeMode, applyTextSize, updateThresholdPills, updateHistoryLimitPills, updateFreshnessLimitPills, switchResultTab, openProfileMenu, openMenu, initToolsViewUI, dispatchActiveToolCalculation, switchActiveTool, toggleProfileAccordionSection } from './js/ui.js';
import { initFestiveEngine, setFestiveEnabled } from './js/festiveEngine.js';
import { renderResults, setupResultViewScrollBanner, setLastScannedUrl, getLastScannedUrl } from './js/views/results.js';
import { initProfileUI, resetProfileQrMode, updateSaveProfileButtonLabel, renderMyQrPass, handleProfileQrScanned, processAndCacheProfileData, isValidCaamUrl, applyUrlInputValidationStyle, extractTextFromPdfFile } from './js/views/profile.js';

import { renderDashboardView, renderDashboardResults, saveDashboardTemplates, startWelcomeTextAnimation, sortCaamQualifications, setupDocumentViewers, isSupervisoryQual, isDfeQual, isFiQual } from './js/views/dashboard.js';
import { updateHistoryCounts, updateHistoryPillUI, updateBulkActionBarUI, initHistoryManageModeControls, setupHistorySwipeListeners, customRenderHistoryList, setupReverifyOnlineButton, setupPinCardButton, initHistorySearchAndFilters, toggleHistoryLimitQuickPicker } from './js/views/history.js';


let lastScannedUrl = "";
let selectedAttestationFile = null;
let selectedAttestationText = "";
let selectedQsFile = null;
let selectedQsText = "";
let selectedQsParsed = null;
let profileQrScannerActive = false;


document.addEventListener("DOMContentLoaded", () => {
  initToolsUI();
  initToolsModule();
  initApp();
  initScanHubUI();
  initNavigationBars();
  initProfileUI();
  initSettingsUI();
  initStorageUI();
  if (typeof window.initFestiveEngine === "function") {
    window.initFestiveEngine();
  }
  renderDashboardView();
});

// ----------------------------------------------------------------------------
// 3-TAB PILOT SCAN HUB EVENT BINDINGS
// ----------------------------------------------------------------------------

function initScanHubUI() {
  setupTab3ManualLayout();

  const tabCameraBtn = document.getElementById("tab-camera-btn");
  const tabQrPassBtn = document.getElementById("tab-qrpass-btn");
  const tabManualBtn = document.getElementById("tab-manual-btn");

  if (tabQrPassBtn) {
    const span = tabQrPassBtn.querySelector("span");
    if (span) span.innerText = "My QR";
    else tabQrPassBtn.innerText = "My QR";
  }

  if (tabCameraBtn) tabCameraBtn.addEventListener("click", () => {
    if (!navigator.onLine) {
      showToast("Camera scanning requires an active internet connection.", "warning");
      switchScanHubTab("manual");
      return;
    }
    switchScanHubTab("camera");
  });
  if (tabQrPassBtn) tabQrPassBtn.addEventListener("click", () => {
    switchScanHubTab("qrpass");
    renderMyQrPass();
  });
  if (tabManualBtn) tabManualBtn.addEventListener("click", () => {
    if (!navigator.onLine) {
      showToast("Manual URL entry requires an active internet connection.", "warning");
      if (typeof window.switchScanHubTab === "function") window.switchScanHubTab("qrpass");
      return;
    }
    switchScanHubTab("manual");
    setupTab3ManualLayout();
  });

  const cycleLensBtn = document.getElementById("camera-cycle-btn");
  if (cycleLensBtn) cycleLensBtn.addEventListener("click", cycleCameraLens);

  const torchBtn = document.getElementById("torch-toggle-btn");
  if (torchBtn) torchBtn.addEventListener("click", toggleTorch);

  const uploadQrBtn = document.getElementById("upload-qr-btn");
  const qrFileInput = document.getElementById("qr-file-input");

  if (uploadQrBtn && qrFileInput) {
    uploadQrBtn.addEventListener("click", () => {
      if (!navigator.onLine) {
        showToast("Photo QR scanning requires an active internet connection.", "warning");
        return;
      }
      qrFileInput.click();
    });
    qrFileInput.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (window.QrScanner) {
        try {
          showLoading("Processing QR code image...");
          const result = await window.QrScanner.scanImage(file, { returnDetailedScanResult: true });
          const decodedText = (typeof result === 'object' ? result.data : result) || "";

          if (decodedText.trim()) {
            processLicenseUrl(decodedText.trim());
          } else {
            showError("No valid QR code found in selected photo.");
          }
        } catch (err) {
          showError("Could not decode QR code from image. Please ensure image is clear.");
        }
      }
      qrFileInput.value = "";
    });
  }



  const pausedOverlay = document.getElementById("scanner-paused-overlay");
  if (pausedOverlay) {
    pausedOverlay.addEventListener("click", () => {
      startScanner(processLicenseUrl, showError);
    });
  }
}

function updateManualUrlBadge(urlStr) {
  const urlInput = document.getElementById("manual-url-input");
  const urlBadge = document.getElementById("manual-url-badge");
  if (urlBadge) urlBadge.classList.add("hidden");
  const cleanUrl = urlStr ? urlStr.trim() : "";
  applyUrlInputValidationStyle(urlInput, cleanUrl);
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

  document.getElementById("festive-pill-enable")?.addEventListener("click", () => {
    if (typeof window.setFestiveEnabled === "function") window.setFestiveEnabled(true);
  });
  document.getElementById("festive-pill-disable")?.addEventListener("click", () => {
    if (typeof window.setFestiveEnabled === "function") window.setFestiveEnabled(false);
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
  document.getElementById("storage-reset-all-btn")?.addEventListener("click", async () => {
    const confirmed = await showConfirmDialog({ title: "Reset Application Data", message: "Are you sure you want to reset all CertiFly local storage data? This action cannot be undone.", confirmText: "Reset All Data", cancelText: "Cancel", type: "danger" });
    if (confirmed) {
      localStorage.clear();
      location.reload();
    }
  });
}

function initApp() {
  window.processLicenseUrl = processLicenseUrl;
  window.resetProfileQrMode = resetProfileQrMode;
  window.showError = showError;
  window.startScanner = startScanner;
  window.showScannerView = showScannerView;
  window.renderMyQrPass = renderMyQrPass;
  window.openOriginalLicense = openOriginalLicense;

  saveDashboardTemplates();

  const startScanBtn = document.getElementById("start-scan-btn");
  const stopScanBtn = document.getElementById("stop-scan-btn");
  const submitUrlBtn = document.getElementById("submit-url-btn");
  const scanNewBtn = document.getElementById("scan-new-btn");
  const openOriginalBtn = document.getElementById("open-original-btn");

  if (startScanBtn) startScanBtn.addEventListener("click", () => startScanner(processLicenseUrl, showError));
  if (stopScanBtn) stopScanBtn.addEventListener("click", stopScanner);
  if (submitUrlBtn) submitUrlBtn.addEventListener("click", handleManualUrl);
  if (scanNewBtn) scanNewBtn.addEventListener("click", showScannerView);
  if (openOriginalBtn) openOriginalBtn.onclick = openOriginalLicense;

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
  initHistorySearchAndFilters();
  customRenderHistoryList();

  const toolsBtn = document.getElementById("dock-tools-btn");
  if (toolsBtn) {
    toolsBtn.addEventListener("click", () => {
      stopScanner();
      showView("tools-view");
    });
  }
}

function handleManualUrl() {
  if (!navigator.onLine) {
    showToast("Licence verification requires an active internet connection.", "warning");
    return;
  }
  const urlInput = document.getElementById("manual-url-input");
  const urlVal = urlInput ? urlInput.value.trim() : "";
  if (!urlVal || !isValidCaamUrl(urlVal)) {
    updateManualUrlBadge(urlVal);
    showError("Please enter a valid CAAM eCLIPSE URL");
    return;
  }
  updateManualUrlBadge("");
  if (typeof stopScanner === 'function') stopScanner();
  processLicenseUrl(urlVal);
}

async function openOriginalLicense() {
  if (!navigator.onLine) {
    showToast("Viewing live licence page requires an active internet connection.", "warning");
    return;
  }
  const profile = typeof getProfileData === 'function' ? getProfileData() : {};
  let targetUrl = lastScannedUrl;
  if (!targetUrl && profile) {
    if (profile.url) {
      targetUrl = profile.url;
    } else if (profile.cachedCaamResults && profile.cachedCaamResults.qrImageUrl) {
      targetUrl = profile.cachedCaamResults.qrImageUrl;
    } else if (profile.qrImageUrl) {
      targetUrl = profile.qrImageUrl;
    }
  }

  if (targetUrl) {
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    window.open(cleanUrl, "_blank");
  } else {
    if (typeof alert === 'function') {
      await showAlertModal("Licence URL Missing", "No stored licence URL. Please configure credentials in My Credentials.", "warning");
    }
  }
}

async function processLicenseUrl(url) {
  if (!url) {
    showError("Invalid or non-eCLIPSE QR");
    return;
  }
  const cleanUrl = url.trim();

  if (!isValidCaamUrl(cleanUrl)) {
    await stopScanner();
    await showAlertModal("Invalid QR Code", "Please scan an official CAAM eCLIPSE licence QR code.", "warning");
    startScanner(processLicenseUrl, showError);
    return;
  }

  lastScannedUrl = cleanUrl;
  setLastScannedUrl(cleanUrl);
  await stopScanner();
  showLoading("Fetching digital licence...");

  const scanTime = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(',', ', ');

  const threshold = getThresholdDays();
  const freshnessLimit = getFreshnessLimit();
  const profile = getProfileData();

  const isProfileUrlMatch = profile && profile.url && (
    profile.url.trim() === cleanUrl ||
    cleanUrl.includes(profile.url.trim()) ||
    profile.url.trim().includes(cleanUrl)
  );

  let caamResults = null;
  let fetchFailed = false;
  let fetchStatus = 0;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(cleanUrl)}`;
    const response = await fetch(fetchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      const profileMab = (isProfileUrlMatch && profile && profile.cachedMabResults) ? profile.cachedMabResults : null;
      const activeFleetCtx = (profileMab && profileMab.lineCheck) ? profileMab.lineCheck.fleet : null;
      caamResults = parseLicenseDOM(doc, threshold, activeFleetCtx);
      if (caamResults) {
        caamResults.scanTime = scanTime;
      }
    } else {
      fetchFailed = true;
      fetchStatus = response.status;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    fetchFailed = true;
  }

  if (fetchFailed || !caamResults) {
    if (isProfileUrlMatch && profile.cachedCaamResults) {
      caamResults = profile.cachedCaamResults;
      caamResults.scanTime = scanTime + " (Cached)";
      showToast("CAAM server offline/error. Displaying stored licence data.", "warning");
    } else {
      let errMsg = "The official CAAM eCLIPSE server is currently unreachable or down. Please try again later.";
      if (fetchStatus === 500) {
        errMsg = "CAAM Portal Server Error (Status 500): The official CAAM eCLIPSE server (eclipse.caam.gov.my) or proxy service is temporarily unresponsive. Please try again shortly or verify manually.";
      } else if (fetchStatus === 404) {
        errMsg = "Licence Page Not Found (Status 404): The scanned CAAM eCLIPSE URL is invalid or no longer exists.";
      } else if (fetchStatus > 0) {
        errMsg = `CAAM Server Error (Status ${fetchStatus}): Failed to fetch digital licence page. Please try again later.`;
      }
      showScannerView();
      await showAlertModal("CAAM Portal Unresponsive", errMsg, "warning");
      startScanner(processLicenseUrl, showError);
      return;
    }
  }

  let mabResults = null;
  if (isProfileUrlMatch) {
    let mabTextToParse = selectedAttestationText;
    if (!mabTextToParse && selectedAttestationFile) {
      try {
        mabTextToParse = await extractTextFromPdfFile(selectedAttestationFile);
      } catch (e) {}
    }

    let mabTextToUse = mabTextToParse;
    if (mabTextToUse) {
      mabResults = parseAttestationText(mabTextToUse, freshnessLimit, threshold);
    } else if (profile && profile.cachedMabResults) {
      mabResults = profile.cachedMabResults;
    } else {
      mabResults = null;
    }
  }

  try {
    saveToHistory(caamResults, cleanUrl);
  } catch (e) {
    console.warn("Could not save to history:", e);
  }

  renderResults(caamResults, mabResults);
}



function setupTab3ManualLayout() {
  try {
    const manualTab = document.getElementById("tab-manual-content") || document.getElementById("manual-entry-tab");

    const recentCard = document.getElementById("recent-verified-crew-card");
    if (recentCard) {
      recentCard.style.display = "none";
      recentCard.classList.add("hidden");
    }

    if (manualTab) {
      const headings = manualTab.querySelectorAll("h3, h4, div");
      headings.forEach(el => {
        if (el.innerText && el.innerText.trim().toLowerCase().includes("recently verified crew")) {
          let parent = el;
          while (parent && parent !== manualTab && parent.parentNode !== manualTab) {
            parent = parent.parentNode;
          }
          if (parent && parent !== manualTab) {
            parent.style.display = "none";
            parent.classList.add("hidden");
          }
        }
      });
    }

    const urlInput = document.getElementById("manual-url-input");
    let submitBtn = document.getElementById("submit-url-btn");
    const pasteBtn = document.getElementById("paste-url-btn");

    if (pasteBtn && pasteBtn.parentNode) {
      pasteBtn.parentNode.removeChild(pasteBtn);
    }

    if (!urlInput) return;

    if (urlInput) {
      urlInput.oninput = () => updateManualUrlBadge(urlInput.value);
      urlInput.onchange = () => updateManualUrlBadge(urlInput.value);
      urlInput.onkeyup = () => updateManualUrlBadge(urlInput.value);
      urlInput.onpaste = () => setTimeout(() => updateManualUrlBadge(urlInput.value), 50);
      urlInput.onfocus = () => updateManualUrlBadge(urlInput.value);
      urlInput.onblur = () => updateManualUrlBadge(urlInput.value);
      updateManualUrlBadge(urlInput.value);
    }

    urlInput.className = "w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all shadow-xs";

    let btnRow = document.getElementById("manual-action-btn-row");
    if (!btnRow) {
      btnRow = document.createElement("div");
      btnRow.id = "manual-action-btn-row";
      btnRow.className = "grid grid-cols-2 gap-2.5 my-3 w-full";

      const resetBtn = document.createElement("button");
      resetBtn.id = "reset-url-btn";
      resetBtn.type = "button";
      resetBtn.className = "h-11 px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer whitespace-nowrap overflow-hidden";
      resetBtn.innerHTML = `
<svg class="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
</svg>
<span>Reset</span>
`;
      resetBtn.onclick = (e) => {
        e.preventDefault();
        urlInput.value = "";
        urlInput.focus();
        updateManualUrlBadge("");
      };

      if (!submitBtn) {
        submitBtn = document.createElement("button");
        submitBtn.id = "submit-url-btn";
        submitBtn.type = "button";
        submitBtn.onclick = () => {
          if (typeof handleManualUrl === 'function') handleManualUrl();
        };
      }

      submitBtn.className = "h-11 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer whitespace-nowrap overflow-hidden";
      submitBtn.innerHTML = `
<svg class="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
<span>Verify</span>
`;

      btnRow.appendChild(resetBtn);
      if (submitBtn.parentNode && submitBtn.parentNode !== btnRow) {
        submitBtn.parentNode.insertBefore(btnRow, submitBtn);
      } else if (urlInput.parentNode) {
        urlInput.parentNode.insertBefore(btnRow, urlInput.nextSibling);
      }
      btnRow.appendChild(submitBtn);
    } else {
      if (submitBtn) {
        submitBtn.className = "h-11 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer whitespace-nowrap overflow-hidden";
        submitBtn.innerHTML = `
<svg class="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
<span>Verify</span>
`;
      }
    }
  } catch (e) {
    console.warn("setupTab3ManualLayout error:", e);
  }
}

window.initToolsModule = function() {
  if (typeof initToolsModule === 'function') {
    initToolsModule();
  }
};

function initToolsUI() {
  initToolsModule();
  if (typeof initToolsViewUI === 'function') {
    initToolsViewUI();
  }

  document.getElementById("btn-calc-ppc")?.addEventListener("click", async () => {
    const conduct = document.getElementById("ppc-conduct-date")?.value;
    const expiry = document.getElementById("ppc-expiry-date")?.value;
    const res = calculatePpcWindows(conduct, expiry);
    const resBox = document.getElementById("ppc-results-box");

    if (!res) {
      await showAlertModal("Invalid Date", "Please select a valid LPC Expiry Date.", "warning");
      return;
    }

    document.getElementById("ppc-res-expiry").innerText = res.newLpcExpiry;
    document.getElementById("ppc-res-opc-start").innerText = res.opcEarliest;
    document.getElementById("ppc-res-opc-end").innerText = res.opcLatest;
    if (resBox) resBox.classList.remove("hidden");
  });

  document.getElementById("btn-calc-recurrent")?.addEventListener("click", async () => {
    const type = document.getElementById("recurrent-drill-type")?.value || "linecheck";
    const conduct = document.getElementById("recurrent-conduct-date")?.value;
    const res = calculateCourseExpiry(type, conduct);
    const resBox = document.getElementById("recurrent-results-box");

    if (!res) {
      await showAlertModal("Invalid Date", "Please select a valid Conducted Date.", "warning");
      return;
    }

    document.getElementById("recurrent-res-expiry").innerText = res.expiryDate;
    if (resBox) resBox.classList.remove("hidden");
  });

  document.getElementById("btn-calc-medical")?.addEventListener("click", async () => {
    const last = document.getElementById("medical-last-date")?.value;
    const age = document.getElementById("medical-pilot-age")?.value;
    const res = calculateMedicalWindow(last, age);
    const resBox = document.getElementById("medical-results-box");

    if (!res) {
      await showAlertModal("Invalid Date", "Please select a valid Medical Expiry Date.", "warning");
      return;
    }

    document.getElementById("medical-res-expiry").innerText = res.expiryDate;
    document.getElementById("medical-res-dame").innerText = res.dameEarliest;
    const ageText = document.getElementById("medical-res-age-text");
    if (ageText) ageText.innerText = res.ageNotice;
    if (resBox) resBox.classList.remove("hidden");
  });

  document.getElementById("btn-calc-preflight")?.addEventListener("click", async () => {
    const report = document.getElementById("fdp-report-time")?.value;
    const count = getSectorCount();
    const maxHours = getMaxAllowableFdp(report, count);
    const resBox = document.getElementById("preflight-results-box");

    if (!report) {
      await showAlertModal("Report Time Required", "Please enter a Report Time (e.g. 08:00).", "warning");
      return;
    }

    const h = Math.floor(maxHours);
    const m = Math.round((maxHours % 1) * 60);
    document.getElementById("fdp-res-max").innerText = `${h} Hours ${m > 0 ? m + ' Mins' : ''}`;

    const [rH, rM] = report.replace(/[^\d:]/g, "").split(":").map(n => parseInt(n, 10));
    if (!isNaN(rH)) {
      let lobtH = rH + h;
      let lobtM = (rM || 0) + m;
      if (lobtM >= 60) { lobtH += 1; lobtM -= 60; }
      if (lobtH >= 24) lobtH %= 24;
      document.getElementById("fdp-res-lobt").innerText = `${lobtH.toString().padStart(2, '0')}:${lobtM.toString().padStart(2, '0')} UTC`;
    }

    if (resBox) resBox.classList.remove("hidden");
  });

  document.getElementById("btn-fdp-dec")?.addEventListener("click", () => {
    const count = getSectorCount();
    setSectorCount(count - 1);
    const badge = document.getElementById("fdp-sector-count");
    if (badge) badge.innerText = getSectorCount();
  });

  document.getElementById("btn-fdp-inc")?.addEventListener("click", () => {
    const count = getSectorCount();
    setSectorCount(count + 1);
    const badge = document.getElementById("fdp-sector-count");
    if (badge) badge.innerText = getSectorCount();
  });
}

// ----------------------------------------------------------------------------
// STEP 3: 2-TIER TOOLS CONTROLLER, SWIPE GESTURES & SMART PIPELINING
// ----------------------------------------------------------------------------

export function initToolsUIController() {
  initToolsModule();

  const catQualsBtn = document.getElementById("cat-tab-qualifications");
  const catDutyBtn = document.getElementById("cat-tab-dutyrest");

  if (catQualsBtn) catQualsBtn.addEventListener("click", () => switchToolCategory("qualifications"));
  if (catDutyBtn) catDutyBtn.addEventListener("click", () => switchToolCategory("dutyrest"));

  const catAPillsMap = [
    { pill: "pill-tool-medical", card: "tool-card-medical" },
    { pill: "pill-tool-ppc", card: "tool-card-ppc" },
    { pill: "pill-tool-recurrent", card: "tool-card-recurrent" },
    { pill: "pill-tool-recency", card: "tool-card-recency" }
  ];

  catAPillsMap.forEach(item => {
    const pill = document.getElementById(item.pill);
    if (pill) {
      pill.addEventListener("click", () => {
        switchActiveTool(item.card);
      });
    }
  });

  const catBPillsMap = [
    { pill: "pill-tool-standby", card: "tool-card-standby" },
    { pill: "pill-tool-maxfdp", card: "tool-card-maxfdp" },
    { pill: "pill-tool-preflight", card: "tool-card-preflight" },
    { pill: "pill-tool-cumulative", card: "tool-card-cumulative" }
  ];

  catBPillsMap.forEach(item => {
    const pill = document.getElementById(item.pill);
    if (pill) {
      pill.addEventListener("click", () => {
        switchActiveTool(item.card);
      });
    }
  });

  const tzUtcBtn = document.getElementById("tz-btn-utc");
  const tzLocalBtn = document.getElementById("tz-btn-local");

  if (tzUtcBtn) tzUtcBtn.addEventListener("click", () => setStandbyLocation("UTC"));
  if (tzLocalBtn) tzLocalBtn.addEventListener("click", () => setStandbyLocation("LOCAL"));

  const stbyHomeBtn = document.getElementById("btn-stby-loc-home");
  const stbyAirportBtn = document.getElementById("btn-stby-loc-airport");

  if (stbyHomeBtn) stbyHomeBtn.addEventListener("click", () => setStandbyLocation("HOME"));
  if (stbyAirportBtn) stbyAirportBtn.addEventListener("click", () => setStandbyLocation("AIRPORT"));

  const courseTrigger = document.getElementById("btn-recurrent-course-trigger");
  const courseModalClose = document.getElementById("btn-close-recurrent-modal");
  const courseSearchInput = document.getElementById("recurrent-search-input");

  if (courseTrigger) courseTrigger.addEventListener("click", openRecurrentCourseModal);
  if (courseModalClose) courseModalClose.addEventListener("click", closeRecurrentCourseModal);

  if (courseSearchInput) {
    courseSearchInput.addEventListener("input", (e) => filterRecurrentCourses(e.target.value));
  }

  document.querySelectorAll(".recurrent-module-card").forEach(card => {
    card.addEventListener("click", () => {
      const key = card.dataset.courseKey;
      const name = card.dataset.courseName;
      const category = card.dataset.courseCategory;
      if (key && name && category) {
        selectRecurrentCourse(key, name, category);
        dispatchActiveToolCalculation();
      }
    });
  });

  setupToolsCardSwipeGestures();

  document.querySelectorAll("[onclick^=\"resetToolInputs\"]").forEach(btn => {
    btn.removeAttribute("onclick");
    btn.addEventListener("click", (e) => {
      const toolCard = e.target.closest(".tool-card");
      if (toolCard) {
        const toolId = toolCard.id;
        resetToolInputs(toolId);
        dispatchActiveToolCalculation();
      }
    });
  });

  ["card-wrapper-cat-a", "card-wrapper-cat-b"].forEach(wrapperId => {
    const wrapper = document.getElementById(wrapperId);
    if (wrapper) {
      wrapper.addEventListener("input", () => dispatchActiveToolCalculation());
      wrapper.addEventListener("change", () => dispatchActiveToolCalculation());
    }
  });

  restoreToolsLocalStorage();
  dispatchActiveToolCalculation();
}

window.initToolsUIController = initToolsUIController;

function setupCardSwipeGestures(wrapperId, toolIdList) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  let startX = 0;
  let startY = 0;

  wrapper.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
  }, { passive: true });

  wrapper.addEventListener("touchend", (e) => {
    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        const state = getToolsState();
        const activeToolId = state.activeSubTab;
        const currentIndex = toolIdList.indexOf(activeToolId);

        if (currentIndex !== -1) {
          if (deltaX < 0 && currentIndex < toolIdList.length - 1) {
            const nextToolId = toolIdList[currentIndex + 1];
            switchActiveTool(nextToolId);
            dispatchActiveToolCalculation();
          } else if (deltaX > 0 && currentIndex > 0) {
            const prevToolId = toolIdList[currentIndex - 1];
            switchActiveTool(prevToolId);
            dispatchActiveToolCalculation();
          }
        }
      }
    }
  }, { passive: true });
}

function restoreToolsLocalStorage() {
  try {
    const recDay = localStorage.getItem("certifly_tool_recency_day");
    const recNight = localStorage.getItem("certifly_tool_recency_night");
    if (recDay && document.getElementById("input-recency-day")) document.getElementById("input-recency-day").value = recDay;
    if (recNight && document.getElementById("input-recency-night")) document.getElementById("input-recency-night").value = recNight;

    const cum7d = localStorage.getItem("certifly_tool_cum_duty_7d");
    const cum28d = localStorage.getItem("certifly_tool_cum_flight_28d");
    if (cum7d && document.getElementById("input-cum-duty-7d")) document.getElementById("input-cum-duty-7d").value = cum7d;
    if (cum28d && document.getElementById("input-cum-flight-28d")) document.getElementById("input-cum-flight-28d").value = cum28d;
  } catch (e) {
    console.warn("LocalStorage access error in tools:", e);
  }
}


let isSwipeAnimating = false;

function setupToolsCardSwipeGestures() {
  const catACards = ['tool-card-medical', 'tool-card-ppc', 'tool-card-recurrent', 'tool-card-recency'];
  const catBCards = ['tool-card-standby', 'tool-card-maxfdp', 'tool-card-preflight', 'tool-card-cumulative'];

  const categoryConfigs = [
    { wrapperId: 'card-wrapper-cat-a', menuId: 'subtab-strip-cat-a', cards: catACards },
    { wrapperId: 'card-wrapper-cat-b', menuId: 'subtab-strip-cat-b', cards: catBCards }
  ];

  categoryConfigs.forEach(config => {
    const wrapper = document.getElementById(config.wrapperId);
    const menu = document.getElementById(config.menuId);
    const targetContainers = [wrapper, menu].filter(Boolean);

    targetContainers.forEach(container => {
      let touchStartX = 0;
      let touchStartY = 0;

      container.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // Threshold check: horizontal swipe > 35px and dominant over vertical scroll
        if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
          const activeCardEl = (wrapper ? wrapper.querySelector('.tool-card.active') : null) || document.querySelector('.tool-card.active');
          if (!activeCardEl) return;

          const currentCardId = activeCardEl.id;
          const cardsList = config.cards;
          const currentIndex = cardsList.indexOf(currentCardId);

          if (currentIndex === -1) return;

          const isLeftSwipe = diffX < 0;  // Swipe Left -> Next Tool
          const isRightSwipe = diffX > 0; // Swipe Right -> Prev Tool

          if (isLeftSwipe && currentIndex < cardsList.length - 1) {
            const targetCardId = cardsList[currentIndex + 1];
            if (typeof switchActiveTool === 'function') switchActiveTool(targetCardId);
          } else if (isRightSwipe && currentIndex > 0) {
            const targetCardId = cardsList[currentIndex - 1];
            if (typeof switchActiveTool === 'function') switchActiveTool(targetCardId);
          }
        }
      }, { passive: true });
    });
  });
}
