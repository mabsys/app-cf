// ./main.js (1811_R435) - CertiFly Application Shell & Orchestrator
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



function setupResultViewScrollBanner(caamResults) {
  const banner = document.getElementById("res-bottom-banner");
  const closeBtn = document.getElementById("res-bottom-banner-close");
  const statusCard = document.getElementById("res-status-card");
  const actionsFooter = document.getElementById("res-actions-footer");
  const resView = document.getElementById("result-view");

  if (!banner) return;

  isBannerDismissed = false;
  banner.classList.add("hidden");

  banner.onclick = (e) => {
    if (e.target.closest("#res-bottom-banner-close")) return;
    if (lastScannedUrl) {
      window.open(lastScannedUrl, "_blank");
    } else if (caamResults && caamResults.qrImageUrl) {
      window.open(caamResults.qrImageUrl, "_blank");
    }
  };

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      isBannerDismissed = true;
      animateBottomBanner(banner, false);
    };
  }

  if (resultScrollObserver) {
    resultScrollObserver.disconnect();
    resultScrollObserver = null;
  }

  if (!statusCard || !actionsFooter || typeof IntersectionObserver === "undefined") return;

  let isStatusCardVisible = true;
  let isFooterVisible = false;

  function updateBannerVisibility() {
    if (isBannerDismissed) return;
    const shouldShow = !isStatusCardVisible && !isFooterVisible && resView && !resView.classList.contains("hidden");
    animateBottomBanner(banner, shouldShow);
  }

  resultScrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.target === statusCard) {
        isStatusCardVisible = entry.isIntersecting;
      } else if (entry.target === actionsFooter) {
        isFooterVisible = entry.isIntersecting;
      }
    });
    updateBannerVisibility();
  }, {
    root: null,
    threshold: 0.1
  });

  resultScrollObserver.observe(statusCard);
  resultScrollObserver.observe(actionsFooter);
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

  const displayName = (caamResults && caamResults.pilotDetails && caamResults.pilotDetails.name && caamResults.pilotDetails.name !== "-") ? caamResults.pilotDetails.name : "External Crew Member";

  const nameEl = getResEl("res-pilot-name") || getResEl("pilot-name");
  const typeEl = getResEl("res-licence-type") || getResEl("licence-type");
  const noEl = getResEl("res-licence-number") || getResEl("licence-number");
  const scanTimeEl = getResEl("res-scan-timestamp") || getResEl("scan-timestamp");
  const headerEl = getResEl("res-header") || getResEl("result-header");
  const overallBadge = getResEl("res-overall-status-badge") || getResEl("overall-status-badge");
  const overallMsg = getResEl("res-overall-message") || getResEl("overall-message");

  if (nameEl) nameEl.innerText = displayName;
  if (typeEl && caamResults && caamResults.pilotDetails) typeEl.innerText = caamResults.pilotDetails.licenseType || "ATPL(A)";
  if (noEl && caamResults && caamResults.pilotDetails) noEl.innerText = caamResults.pilotDetails.licenseNo || "-";
  if (scanTimeEl) scanTimeEl.innerText = (caamResults && caamResults.scanTime) ? `${caamResults.scanTime} LT` : "14 Sep 2026 LT";

  const medLimitEl = getResEl("res-medical-limit") || getResEl("dash-medical-limit");
  if (medLimitEl) {
    medLimitEl.innerText = (caamResults && caamResults.medicalLimitations) ? caamResults.medicalLimitations : "NIL";
  }

  const statusCard = getResEl("res-status-card") || (overallBadge ? overallBadge.parentElement : null);
  const statusLabel = getResEl("res-status-label") || (statusCard ? statusCard.querySelector("span") : null);

  if (caamResults && overallBadge && headerEl) {
    if (caamResults.overallStatus === "EXPIRED") {
      if (statusCard) statusCard.className = "bg-rose-600 dark:bg-rose-600/90 rounded-3xl p-5 shadow-md flex flex-col items-center justify-center text-center gap-1.5";
      if (statusLabel) statusLabel.className = "text-[10px] font-extrabold uppercase tracking-wider text-rose-100";
      headerEl.innerText = "Licence Lapsed";
      headerEl.className = "text-xs font-black text-white uppercase tracking-wide";
      overallBadge.className = "status-badge font-black uppercase rounded-full px-6 py-3 text-white inline-block text-sm tracking-wider bg-rose-950/60 animate-pulse";
      overallBadge.innerText = "DO NOT FLY!";
      if (scanTimeEl) scanTimeEl.className = "text-[10px] text-white uppercase font-semibold mt-1";
    } else if (caamResults.overallStatus === "EXPIRING_SOON") {
      if (statusCard) statusCard.className = "bg-amber-400 dark:bg-amber-400/90 rounded-3xl p-5 shadow-md flex flex-col items-center justify-center text-center gap-1.5";
      if (statusLabel) statusLabel.className = "text-[10px] font-extrabold uppercase tracking-wider text-amber-900";
      headerEl.innerText = "Licence Expiring Soon";
      headerEl.className = "text-xs font-black text-white uppercase tracking-wide";
      overallBadge.className = "status-badge font-black uppercase rounded-full px-6 py-3 text-white inline-block text-sm tracking-wider bg-amber-900/50";
      overallBadge.innerText = "PROCEED WITH CAUTION";
      if (scanTimeEl) scanTimeEl.className = "text-[10px] text-white uppercase font-semibold mt-1";
    } else {
      if (statusCard) statusCard.className = "bg-emerald-400 dark:bg-emerald-400/90 rounded-3xl p-5 shadow-md flex flex-col items-center justify-center text-center gap-1.5";
      if (statusLabel) statusLabel.className = "text-[10px] font-extrabold uppercase tracking-wider text-emerald-800";
      headerEl.innerText = "Licence Valid";
      headerEl.className = "text-xs font-black text-white uppercase tracking-wide";
      overallBadge.className = "status-badge font-black uppercase rounded-full px-6 py-3 text-white inline-block text-sm tracking-wider bg-emerald-900/50";
      overallBadge.innerText = "CLEARED FOR DUTY";
      if (scanTimeEl) scanTimeEl.className = "text-[10px] text-white uppercase font-semibold mt-1";
    }

    let resAdvisoryBox = getResEl("res-advisory-box");
    if (caamResults && caamResults.advisoryNotice) {
      if (!resAdvisoryBox) {
        resAdvisoryBox = document.createElement("div");
        resAdvisoryBox.id = "res-advisory-box";
        if (overallBadge && overallBadge.parentElement) {
          overallBadge.parentElement.appendChild(resAdvisoryBox);
        }
      }
      resAdvisoryBox.className = "mt-3 p-3 rounded-2xl bg-white/30 text-left";
      resAdvisoryBox.innerHTML = `
<div class="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-800">
  <svg class="w-4 h-4 text-amber-600 dark:text-amber-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
  </svg>
  <span>SPECIALIZED ROLE ADVISORY</span>
</div>
<p class="mt-1 text-[11px] font-medium text-slate-700 dark:text-slate-700 leading-tight">
  ${caamResults.advisoryNotice.message}
</p>
`;
    } else if (resAdvisoryBox) {
      resAdvisoryBox.remove();
    }
  }

  const caamListContainer = getResEl("res-qualifications-list") || getResEl("qualifications-list");
  if (caamListContainer && caamResults) {
    caamListContainer.innerHTML = "";
    const sortedResQuals = sortCaamQualifications(caamResults.qualifications);

    if (!sortedResQuals || sortedResQuals.length === 0) {
      caamListContainer.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No CAAM qualifications found on digital licence.</div>`;
    } else {
      const activeResQuals = sortedResQuals.filter(q => !q.isLegacy && q.status !== "INACTIVE_LEGACY");
      const legacyResQuals = sortedResQuals.filter(q => q.isLegacy || q.status === "INACTIVE_LEGACY");

      activeResQuals.forEach(q => {
        const row = document.createElement("div");
        row.className = "py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";

        let badgeHtml = "";
        const isSupervisory = Boolean(q.isSupervisory) || isSupervisoryQual(q.name);

        if (isSupervisory) {
          if (q.status === "EXPIRED" || q.status === "ROLE_EXPIRED") {
            const label = isDfeQual(q.name) ? "Examiner Lapsed" : (isFiQual(q.name) ? "Instructor Lapsed" : "Role Lapsed");
            badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">${label}</span>`;
          } else if (q.status === "EXPIRING_SOON") {
            badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">${q.daysRemaining} days left</span>`;
          } else {
            const label = isDfeQual(q.name) ? "Valid (Examiner)" : (isFiQual(q.name) ? "Valid (Instructor)" : "Valid");
            badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">${label}</span>`;
          }
        } else {
          if (q.status === "EXPIRED") {
            badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">Expired</span>`;
          } else if (q.status === "EXPIRING_SOON") {
            badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">${q.daysRemaining} days left</span>`;
          } else {
            badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">Valid</span>`;
          }
        }

        row.innerHTML = `
<div>
  <div class="text-xs font-bold text-slate-800 dark:text-slate-200">${q.name}</div>
  <div class="dyn-txt text-[10px] text-slate-400 uppercase pt-0.5 font-semibold">${q.dateText || "No Expiry"}</div>
</div>
${badgeHtml}
`;
        caamListContainer.appendChild(row);
      });

      if (legacyResQuals.length > 0) {
        const legacyHeader = document.createElement("div");
        legacyHeader.className = "mt-4 pt-1 flex items-center justify-between";
        legacyHeader.innerHTML = `
<span class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Previous / Legacy Endorsements</span>
`;
        caamListContainer.appendChild(legacyHeader);

        legacyResQuals.forEach(q => {
          const row = document.createElement("div");
          row.className = "py-2.5 px-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 my-1 flex items-center justify-between border border-slate-100 dark:border-slate-800/60";
          row.innerHTML = `
<div>
  <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">${q.name}</div>
  <div class="text-[10px] text-slate-400">Lapsed: ${q.dateText || "Expired"}</div>
</div>
<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Legacy / Lapsed</span>
`;
          caamListContainer.appendChild(row);
        });
      }
    }
  }

  const resHeaderNav = resView ? (resView.querySelector("header") || resView.querySelector(".topbar") || resView.querySelector("#result-view-header")) : null;
  if (resHeaderNav) {
    resHeaderNav.style.display = "none";
    resHeaderNav.classList.add("hidden");
  }

  const backBtn = document.getElementById("btn-result-back");
  if (backBtn) {
    backBtn.style.display = "none";
    backBtn.classList.add("hidden");
    if (backBtn.parentNode && (backBtn.parentNode.tagName === "HEADER" || backBtn.parentNode.classList.contains("flex"))) {
      backBtn.parentNode.style.display = "none";
      backBtn.parentNode.classList.add("hidden");
    }
  }

  const resOpenBtn = getResEl("res-open-original-btn");
  if (resOpenBtn) {
    resOpenBtn.onclick = () => {
      if (lastScannedUrl) {
        window.open(lastScannedUrl, "_blank");
      } else if (caamResults && caamResults.qrImageUrl) {
        window.open(caamResults.qrImageUrl, "_blank");
      }
    };
  }

  const resScanNewBtn = getResEl("res-scan-new-btn") || getResEl("scan-new-btn");
  if (resScanNewBtn) {
    resScanNewBtn.onclick = () => {
      showScannerView();
    };
  }

  setupReverifyOnlineButton();
  setupPinCardButton(caamResults);
  setupResultViewScrollBanner(caamResults);
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
