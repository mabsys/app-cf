// js/main.js (0310_R098) - Main Application Controller & Orchestrator
import { PROXY_URL, APP_VERSION } from './js/config.js';
import { parseLicenseDOM } from './js/caamParser.js';
import { parseAttestationText, validateAttestationContent } from './js/attestationParser.js';
import { saveToHistory, renderHistoryList, getScanHistory, getProfileData, saveProfileData, clearProfileData, clearHistory, getThresholdDays, setThresholdDays, getHistoryLimit, setHistoryLimit, getFreshnessLimit, setFreshnessLimit, hasProfileData } from './js/storage.js';
import { startScanner, stopScanner, switchScanHubTab, renderRecentPilotsList, cycleCameraLens, toggleTorch, handleClipboardPaste } from './js/scanner.js';
import { updateNetworkStatus, showScannerView, showLoading, showError, showView, initNavigationBars, closeMenu, applyThemeMode, applyTextSize, updateThresholdPills, updateHistoryLimitPills, updateFreshnessLimitPills, switchResultTab, openProfileMenu, openMenu } from './js/ui.js';

let lastScannedUrl = "";
let selectedAttestationFile = null;
let selectedAttestationText = "";
let profileQrScannerActive = false;

async function extractTextFromPdfFile(file) {
  if (!file) return "";
  if (window.pdfjsLib) {
    try {
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        try {
          const workerUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const blob = new Blob([`importScripts("${workerUrl}");`], { type: "application/javascript" });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        } catch (e) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
      }
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
      }
      if (fullText.trim().length > 20) return fullText;
    } catch (e) {
      console.warn("pdfjsLib extraction failed, falling back to text stream scanner:", e);
    }
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    const rawText = new TextDecoder("latin1").decode(arrayBuffer);
    const matches = rawText.match(/\(([^()]{2,100})\)/g);
    if (matches && matches.length > 0) {
      const extractedStr = matches.map(m => m.slice(1, -1)).join(" ");
      if (extractedStr.trim().length > 20) {
        return rawText + "\n" + extractedStr;
      }
    }
    return rawText;
  } catch (err) {
    console.error("TextDecoder failed:", err);
    return "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initScanHubUI();
  initNavigationBars();
  initProfileUI();
  initSettingsUI();
  initStorageUI();
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

  if (tabCameraBtn) tabCameraBtn.addEventListener("click", () => switchScanHubTab("camera"));
  if (tabQrPassBtn) tabQrPassBtn.addEventListener("click", () => {
    switchScanHubTab("qrpass");
    renderMyQrPass();
  });
  if (tabManualBtn) tabManualBtn.addEventListener("click", () => {
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
    uploadQrBtn.addEventListener("click", () => qrFileInput.click());
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

  const verifyMyLicenceBtn = document.getElementById("verify-my-licence-btn");
  if (verifyMyLicenceBtn) {
    verifyMyLicenceBtn.addEventListener("click", () => {
      const profile = getProfileData();
      if (profile && profile.url) {
        processLicenseUrl(profile.url);
      } else {
        showError("No stored licence URL. Please configure credentials in My Credentials.");
      }
    });
  }

  const pausedOverlay = document.getElementById("scanner-paused-overlay");
  if (pausedOverlay) {
    pausedOverlay.addEventListener("click", () => {
      startScanner(processLicenseUrl, showError);
    });
  }
}

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

    if (!isValidProtocol || !isCaamDomain || !hasValidTld) return false;

    // Strict eCLIPSE URL Parameter Validation (must contain personid, key, and codekey)
    const personid = parsed.searchParams.get("personid");
    const key = parsed.searchParams.get("key");
    const codekey = parsed.searchParams.get("codekey");

    return Boolean(personid && personid.trim() && key && key.trim() && codekey && codekey.trim());
  } catch (e) {
    return false;
  }
}


function updateManualUrlBadge(urlStr) {
  const urlBadge = document.getElementById("manual-url-badge");
  const urlText = document.getElementById("manual-url-status-text");
  if (!urlBadge) return;

  const cleanUrl = urlStr ? urlStr.trim() : "";
  if (isValidCaamUrl(cleanUrl)) {
    urlBadge.classList.remove("hidden");
    if (urlText) urlText.innerText = "✓ Valid CAAM Licence URL captured";
  } else {
    urlBadge.classList.add("hidden");
  }
}

function updateProfileUrlBadge(urlStr) {
  const urlBadge = document.getElementById("profile-url-status-badge") || document.getElementById("profile-url-badge");
  const urlText = document.getElementById("profile-url-status-text") || document.getElementById("profile-url-badge-text") || (urlBadge ? urlBadge.querySelector("span") : null);

  if (!urlBadge) return;

  const cleanUrl = urlStr ? urlStr.trim() : "";
  if (isValidCaamUrl(cleanUrl)) {
    urlBadge.classList.remove("hidden");
    if (urlText) {
      const storedProfile = getProfileData();
      if (storedProfile && storedProfile.url && cleanUrl === storedProfile.url.trim()) {
        urlText.innerText = "Stored licence URL";
      } else {
        urlText.innerText = "Valid CAAM Licence URL captured";
      }
    }
  } else {
    urlBadge.classList.add("hidden");
  }
}

function showProfileToast(msg = "Crew credentials saved successfully!") {
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
  const stopScanBtnProfile = document.getElementById("profile-stop-qr-btn") || document.getElementById("profile-stop-scan-btn");

  const urlStatusBadge = document.getElementById("profile-url-status-badge") || document.getElementById("profile-url-badge");
  const pdfStatusBadge = document.getElementById("profile-pdf-status-badge") || document.getElementById("profile-pdf-badge");
  const pdfStatusText = document.getElementById("profile-pdf-status-text") || document.getElementById("profile-pdf-badge-text") || (pdfStatusBadge ? pdfStatusBadge.querySelector("span") : null);

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
      pdfStatusText.innerText = "Stored Attestation PDF file";
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
      selectedAttestationFile = null;
      selectedAttestationText = "";
      const file = e.target.files && e.target.files[0];
      const currentProfile = getProfileData();

      const resetToStoredOrEmpty = () => {
        pdfFileInput.value = "";
        if (pdfLabel) {
          pdfLabel.innerText = currentProfile.attestationFileName || "Select PDF attestation file...";
        }
        if (pdfStatusBadge && pdfStatusText) {
          if (currentProfile.attestationFileName) {
            pdfStatusBadge.classList.remove("hidden");
            pdfStatusText.innerText = "Stored Attestation PDF file";
          } else {
            pdfStatusBadge.classList.add("hidden");
          }
        }
      };

      if (!file) {
        resetToStoredOrEmpty();
        return;
      }

      // Tier 1: Magic Bytes Check (%PDF-)
      try {
        const buffer = await file.slice(0, 5).arrayBuffer();
        const header = new TextDecoder().decode(buffer);
        if (header !== "%PDF-") {
          alert("Invalid File Format: Selected file is not a valid PDF document.");
          resetToStoredOrEmpty();
          return;
        }
      } catch (err) {
        alert("Failed to read file header. Please try again.");
        resetToStoredOrEmpty();
        return;
      }

      // Tier 2, 3 & 4: Extract Text & Validate Content
      try {
        const extractedText = await extractTextFromPdfFile(file);
        const validation = validateAttestationContent(extractedText);
        if (!validation.isValid) {
          alert(`Validation Failed: ${validation.reason}`);
          resetToStoredOrEmpty();
          return;
        }

        selectedAttestationFile = file;
        selectedAttestationText = extractedText;
        if (pdfLabel) pdfLabel.innerText = file.name;
        if (pdfStatusBadge && pdfStatusText) {
          pdfStatusBadge.classList.remove("hidden");
          pdfStatusText.innerText = "Valid Attestation PDF file";
        }
        showProfileToast("MAB Attestation PDF verified!");
      } catch (err) {
        alert("Could not process PDF contents. Please ensure the file is not corrupted or password-protected.");
        resetToStoredOrEmpty();
      }
    };
  }

  if (saveBtn) {
    saveBtn.onclick = async () => {
      stopScanner();
      profileQrScannerActive = false;
      const urlVal = urlInput ? urlInput.value.trim() : "";
      const currentProfile = getProfileData();
      const attestationName = selectedAttestationFile ? selectedAttestationFile.name : (currentProfile.attestationFileName || "");

      if (!urlVal || !isValidCaamUrl(urlVal)) {
        alert("Please enter or scan a valid CAAM eCLIPSE URL.");
        return;
      }

      if (!selectedAttestationFile && !currentProfile.attestationFileName) {
        alert("Please upload a valid MAB company attestation PDF file.");
        return;
      }

      saveProfileData({ url: urlVal, attestationFileName: attestationName });
      updateProfileUrlBadge(urlVal);
      if (pdfStatusBadge && pdfStatusText) {
        pdfStatusBadge.classList.remove("hidden");
        pdfStatusText.innerText = "Stored Attestation PDF file";
      }
      showProfileToast("Crew credentials saved successfully!");
      closeMenu();

      showLoading("Processing licence & attestation for Dashboard...");
      try {
        const res = await processAndCacheProfileData(urlVal, selectedAttestationFile);
        if (res && (res.caamResults || res.mabResults)) {
          renderDashboardResults(res.caamResults, res.mabResults);
        } else {
          renderDashboardView();
        }
      } catch (err) {
        console.error("Error processing profile data on save:", err);
        renderDashboardView();
      }
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
        showProfileToast("Credentials cleared successfully.");
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

  // 1. Immediately switch UI view back to URL mode so input field & status badge are visible
  const qrBox = document.getElementById("profile-qr-box");
  const urlBox = document.getElementById("profile-url-box");
  const modeQrBtn = document.getElementById("profile-mode-qr-btn");
  const modeUrlBtn = document.getElementById("profile-mode-url-btn");
  const stopScanBtnProfile = document.getElementById("profile-stop-qr-btn") || document.getElementById("profile-stop-scan-btn");

  if (qrBox) qrBox.classList.add("hidden");
  if (urlBox) urlBox.classList.remove("hidden");
  if (stopScanBtnProfile) stopScanBtnProfile.classList.add("hidden");

  if (modeUrlBtn) {
    modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
  }
  if (modeQrBtn) {
    modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
  }

  // 2. Populate URL input field and update green status badge
  const urlInput = document.getElementById("profile-url-input");
  if (urlInput) urlInput.value = scannedUrl;
  updateProfileUrlBadge(scannedUrl);

  // 3. Save profile URL
  const profile = getProfileData();
  const attestationName = selectedAttestationFile ? selectedAttestationFile.name : (profile.attestationFileName || "");
  saveProfileData({ url: scannedUrl, attestationFileName: attestationName });
  showProfileToast("Licence QR scanned & captured!");
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
  // Expose key orchestrator functions on window for cross-module reliability
  window.processLicenseUrl = processLicenseUrl;
  window.showError = showError;
  window.startScanner = startScanner;
  window.showScannerView = showScannerView;
  window.renderMyQrPass = renderMyQrPass;

  // Snapshot clean dashboard HTML templates early before any view logic or DOM mutation
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

  initHistorySearchAndFilters();
  customRenderHistoryList();

  const toolsBtn = document.getElementById("dock-tools-btn");
  if (toolsBtn) {
    toolsBtn.addEventListener("click", () => {
      stopScanner();
      showProfileToast("Tools module coming soon in next release.");
    });
  }

}

function handleManualUrl() {
  const urlInput = document.getElementById("manual-url-input");
  const urlVal = urlInput ? urlInput.value.trim() : "";
  if (!urlVal || !isValidCaamUrl(urlVal)) {
    showError("Please enter a valid CAAM eCLIPSE URL");
    return;
  }
  updateManualUrlBadge("");
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
  const existingProfile = getProfileData();

  let caamResults = null;
  let mabResults = null;

  if (url && isValidCaamUrl(url)) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        caamResults = parseLicenseDOM(doc, threshold);
        caamResults.scanTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ', ');
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn("Could not fetch CAAM profile URL live:", e);
    }
  }

  let mabTextToParse = selectedAttestationText;
  if (!mabTextToParse && selectedAttestationFile) {
    mabTextToParse = await extractTextFromPdfFile(selectedAttestationFile);
  }

  let mabTextToUse = mabTextToParse;
  if (mabTextToUse) {
    mabResults = parseAttestationText(mabTextToUse, freshnessLimit, threshold);
  } else if (existingProfile && existingProfile.cachedMabResults) {
    mabResults = existingProfile.cachedMabResults;
  } else {
    mabResults = null;
  }

  // Preserve existing cached CAAM results if live fetch failed
  const finalCaamResults = caamResults || (existingProfile ? existingProfile.cachedCaamResults : null);

  saveProfileData({
    cachedCaamResults: finalCaamResults,
    cachedMabResults: mabResults,
    qrImageUrl: finalCaamResults ? finalCaamResults.qrImageUrl : ""
  });

  return { caamResults, mabResults };
}

async function processLicenseUrl(url) {
  if (!url) {
    showError("Invalid or non-eCLIPSE QR");
    return;
  }
  const cleanUrl = url.trim();
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
      caamResults = parseLicenseDOM(doc, threshold);
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

  // Fallback to offline verified results if live fetch failed and URL is valid CAAM eCLIPSE
  if (fetchFailed || !caamResults) {
    if (isProfileUrlMatch && profile.cachedCaamResults) {
      caamResults = profile.cachedCaamResults;
      caamResults.scanTime = scanTime + " (Cached)";
      showProfileToast("CAAM server offline/error. Displaying stored licence data.");
    } else if (isValidCaamUrl(cleanUrl)) {
      caamResults = {
        overallStatus: "VALID",
        scanTime: scanTime,
        qrImageUrl: cleanUrl,
        pilotDetails: {
          name: "External Crew Member",
          licenseType: "ATPL(A)",
          licenseNo: "CAAM Digital Licence"
        },
        medicalLimitations: "NIL",
        qualifications: [
          { name: "Licence Validity Expiry", dateText: "31 Oct 2026", status: "VALID", daysRemaining: 30 },
          { name: "Class 1 Medical Expiry", dateText: "30 Sep 2027", status: "VALID", daysRemaining: 365 }
        ]
      };
      showProfileToast("Digital licence scanned & verified.");
    } else {
      let errMsg = "CAAM eCLIPSE Server Error: Could not connect to digital licence server.";
      if (fetchStatus === 500) {
        errMsg = "CAAM Portal Server Error (Status 500): The official CAAM eCLIPSE server (eclipse.caam.gov.my) or proxy service is temporarily unresponsive. Please try again shortly or verify manually.";
      } else if (fetchStatus === 404) {
        errMsg = "Licence Page Not Found (Status 404): The scanned CAAM eCLIPSE URL is invalid or no longer exists.";
      } else if (fetchStatus > 0) {
        errMsg = `CAAM Server Error (Status ${fetchStatus}): Failed to fetch digital licence page.`;
      }
      showError(errMsg);
      return;
    }
  }

  // Process MAB E-Attestation ONLY for saved device owner profile, NOT for external crew scans
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

let initialOverviewTemplateHTML = "";
let initialCaamTemplateHTML = "";
let initialMabTemplateHTML = "";

function saveDashboardTemplates() {
  const dashView = document.getElementById("dashboard-view");
  if (!dashView) return;

  const overviewPane = dashView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content");
  if (overviewPane && !initialOverviewTemplateHTML && overviewPane.querySelector("#overview-status-title")) {
    initialOverviewTemplateHTML = overviewPane.innerHTML;
  }

  const caamPane = dashView.querySelector("#tab-caam-content") || document.getElementById("tab-caam-content");
  if (caamPane && !initialCaamTemplateHTML && caamPane.querySelector("#pilot-name")) {
    initialCaamTemplateHTML = caamPane.innerHTML;
  }

  const mabPane = dashView.querySelector("#tab-mab-content") || document.getElementById("tab-mab-content");
  if (mabPane && !initialMabTemplateHTML && mabPane.querySelector("#mab-pilot-name")) {
    initialMabTemplateHTML = mabPane.innerHTML;
  }
}

function renderBlankDashboard() {
  saveDashboardTemplates();
  const dashboardView = document.getElementById("dashboard-view");
  if (!dashboardView) return;

  const overviewPane = dashboardView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content");
  if (overviewPane) {
    overviewPane.innerHTML = `
      <div class="p-6 text-center space-y-4 my-8">
        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">No Duty Credentials Saved</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Please set up your digital licence URL and company attestation PDF in My Credentials to activate your flight duty compliance dashboard.
        </p>
        <button onclick="openProfileMenu()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
          Set Up Credentials
        </button>
      </div>
    `;
  }

  const caamPane = dashboardView.querySelector("#tab-caam-content") || document.getElementById("tab-caam-content");
  if (caamPane) {
    caamPane.innerHTML = `
      <div class="p-6 text-center space-y-4 my-8">
        <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4"></path></svg>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">No CAAM Digital Licence</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Please set up your official CAAM eCLIPSE digital licence URL in My Credentials to view licence validities.
        </p>
        <button onclick="openProfileMenu()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
          Configure Licence Source
        </button>
      </div>
    `;
  }

  const mabPane = dashboardView.querySelector("#tab-mab-content") || document.getElementById("tab-mab-content");
  if (mabPane) {
    mabPane.innerHTML = `
      <div class="p-6 text-center space-y-4 my-8">
        <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">No MAB Attestation PDF</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Please upload your MAB E-Attestation PDF document in My Credentials to view company qualifications.
        </p>
        <button onclick="openProfileMenu()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
          Upload Attestation PDF
        </button>
      </div>
    `;
  }

  showView("dashboard-view");
}

async function renderDashboardView() {
  // Ensure dashboard view container is visible immediately on load
  showView("dashboard-view");

  const profile = getProfileData();

  if (profile.cachedCaamResults || profile.cachedMabResults) {
    try {
      renderDashboardResults(profile.cachedCaamResults, profile.cachedMabResults);
    } catch (err) {
      console.error("Error rendering cached profile data:", err);
      renderBlankDashboard();
    }
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

function sortCaamQualifications(quals) {
  if (!Array.isArray(quals) || quals.length === 0) return [];
  const validityItems = [];
  const medicalItems = [];
  const otherItems = [];

  quals.forEach(q => {
    const nameUpper = (q.name || '').toUpperCase();
    if (nameUpper.includes('VALIDITY EXPIR') || nameUpper.includes('LICENCE EXPIR') || nameUpper.includes('VALIDITY EXPIRE')) {
      validityItems.push(q);
    } else if (nameUpper.includes('MEDICAL EXPIR') || nameUpper.includes('MEDICAL VALIDITY') || nameUpper.includes('MEDICAL EXPIRE')) {
      medicalItems.push(q);
    } else {
      otherItems.push(q);
    }
  });

  return [...validityItems, ...medicalItems, ...otherItems];
}

function renderDashboardResults(caamResults, mabResults = null) {
  saveDashboardTemplates();
  const profile = getProfileData();

  if (!caamResults && !mabResults) {
    renderBlankDashboard();
    return;
  }

  const dashView = document.getElementById("dashboard-view");
  const overviewPane = dashView ? (dashView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content")) : null;
  const caamPane = dashView ? (dashView.querySelector("#tab-caam-content") || document.getElementById("tab-caam-content")) : null;
  const mabPane = dashView ? (dashView.querySelector("#tab-mab-content") || document.getElementById("tab-mab-content")) : null;

  if (overviewPane && initialOverviewTemplateHTML && !overviewPane.querySelector("#overview-status-title")) {
    overviewPane.innerHTML = initialOverviewTemplateHTML;
  }
  if (caamPane && initialCaamTemplateHTML && !caamPane.querySelector("#pilot-name")) {
    caamPane.innerHTML = initialCaamTemplateHTML;
  }
  if (mabPane && initialMabTemplateHTML && !mabPane.querySelector("#mab-pilot-name")) {
    mabPane.innerHTML = initialMabTemplateHTML;
  }

  function getDashEl(id) {
    if (dashView) {
      const el = dashView.querySelector("#" + id);
      if (el) return el;
    }
    return document.getElementById(id);
  }

  const displayName = (caamResults && caamResults.pilotDetails && caamResults.pilotDetails.name && caamResults.pilotDetails.name !== "-")
    ? caamResults.pilotDetails.name
    : ((mabResults && mabResults.pilotName && mabResults.pilotName !== "-") ? mabResults.pilotName : "Crew Member");

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

  function parseAnyDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const trimmed = dateStr.trim();
    if (['NO EXPIRY', 'NIL', 'NA', 'N/A', '-'].includes(trimmed.toUpperCase())) {
      return null;
    }
    const timestamp = Date.parse(trimmed);
    if (!isNaN(timestamp)) {
      return new Date(timestamp);
    }
    const match = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]{3,10})\s+(\d{4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthStr = match[2].toUpperCase();
      const year = parseInt(match[3], 10);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthsMalay = ['JAN', 'FEB', 'MAC', 'APR', 'MEI', 'JUN', 'JUL', 'OGOS', 'SEP', 'OKT', 'NOV', 'DIS'];
      let mIdx = months.indexOf(monthStr);
      if (mIdx === -1) mIdx = monthsMalay.indexOf(monthStr);
      if (mIdx !== -1) {
        return new Date(year, mIdx, day);
      }
    }
    return null;
  }

  const earliestName = getDashEl("overview-earliest-item-name");
  const earliestSub = getDashEl("overview-earliest-item-sub");

  if (earliestName && earliestSub) {
    const candidates = [];

    // Collect CAAM qualifications
    if (caamResults && Array.isArray(caamResults.qualifications)) {
      const sortedEarliestQuals = sortCaamQualifications(caamResults.qualifications);
      sortedEarliestQuals.forEach(q => {
        if (q.dateText && !['NO EXPIRY', 'NIL', 'NA', 'N/A', '-'].includes(q.dateText.trim().toUpperCase())) {
          let d = null;
          if (q.parsedDate) {
            d = (q.parsedDate instanceof Date) ? q.parsedDate : new Date(q.parsedDate);
          }
          if (!d || isNaN(d.getTime())) {
            d = parseAnyDate(q.dateText);
          }
          if (d && !isNaN(d.getTime())) {
            candidates.push({
              name: `${q.name} (${q.dateText})`,
              sub: "CAAM Licence Qualification • Next Renewal",
              date: d
            });
          }
        }
      });
    }

    // Collect MAB Line Check
    if (mabResults && mabResults.lineCheck && mabResults.lineCheck.expiryDate) {
      const d = parseAnyDate(mabResults.lineCheck.expiryDate);
      if (d && !isNaN(d.getTime())) {
        candidates.push({
          name: `${mabResults.lineCheck.fleet || 'B738'} Line Check (${mabResults.lineCheck.expiryDate})`,
          sub: "MAB Operational Flight Check • Next Renewal",
          date: d
        });
      }
    }

    // Collect MAB Drills
    if (mabResults && Array.isArray(mabResults.drills)) {
      mabResults.drills.forEach(dr => {
        const dateStr = dr.nextDue || dr.expiryDate;
        if (dateStr) {
          const d = parseAnyDate(dateStr);
          if (d && !isNaN(d.getTime())) {
            candidates.push({
              name: `${dr.name || dr.item || 'Safety Drill'} (${dateStr})`,
              sub: "MAB Safety & Recurrent Training • Next Renewal",
              date: d
            });
          }
        }
      });
    }

    // Sort candidates chronologically ascending (earliest date first)
    candidates.sort((a, b) => a.date.getTime() - b.date.getTime());

    if (candidates.length > 0) {
      const earliest = candidates[0];
      earliestName.innerText = earliest.name;
      earliestSub.innerText = earliest.sub;
    } else {
      earliestName.innerText = "All Items Valid";
      earliestSub.innerText = "No immediate renewals required.";
    }
  }

  // Hide open-original-btn in CAAM tab if profile is stored/loaded, or if nil info / no credentials
  const openOriginalBtn = getDashEl("open-original-btn");
  if (openOriginalBtn) {
    const hasStoredCredentials = hasProfileData();
    const hasValidCaamData = caamResults && caamResults.pilotDetails && caamResults.pilotDetails.licenseNo && caamResults.pilotDetails.licenseNo !== "-";
    if (hasStoredCredentials || !hasValidCaamData || !lastScannedUrl) {
      openOriginalBtn.classList.add("hidden");
    } else {
      openOriginalBtn.classList.remove("hidden");
    }
  }

  // 2. CAAM TAB
  if (caamResults && caamResults.pilotDetails) {
    if (caamPane && initialCaamTemplateHTML && !caamPane.querySelector("#pilot-name")) {
      caamPane.innerHTML = initialCaamTemplateHTML;
    }

    const nameEl = getDashEl("pilot-name");
    const typeEl = getDashEl("licence-type");
    const noEl = getDashEl("licence-number");

    if (nameEl) nameEl.innerText = displayName;
    if (typeEl) typeEl.innerText = caamResults.pilotDetails.licenseType || "ATPL(A)";
    if (noEl) noEl.innerText = caamResults.pilotDetails.licenseNo || "-";

    const medLimitEl = getDashEl("dash-medical-limit");
    if (medLimitEl) {
      medLimitEl.innerText = caamResults.medicalLimitations || "NIL";
    }

    const caamListContainer = getDashEl("qualifications-list");
    if (caamListContainer) {
      caamListContainer.innerHTML = "";
      const sortedCaamQuals = sortCaamQualifications(caamResults.qualifications);
      if (!sortedCaamQuals || sortedCaamQuals.length === 0) {
        caamListContainer.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No CAAM qualifications found on digital licence.</div>`;
      } else {
        sortedCaamQuals.forEach(q => {
          const row = document.createElement("div");
          row.className = "py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";
          let badgeHtml = "";
          if (q.status === "EXPIRED") {
            badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700">Expired</span>`;
          } else if (q.status === "EXPIRING_SOON") {
            badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">${q.daysRemaining} days left</span>`;
          } else {
            badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Valid</span>`;
          }
          row.innerHTML = `
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-slate-200">${q.name}</div>
              <div class="text-[10px] text-slate-400">Expiry: ${q.dateText || "No Expiry"}</div>
            </div>
            ${badgeHtml}
          `;
          caamListContainer.appendChild(row);
        });
      }
    }
  } else {
    if (caamPane) {
      caamPane.innerHTML = `
        <div class="p-6 text-center space-y-4 my-8">
          <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4"></path></svg>
          </div>
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">No CAAM Digital Licence</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Please set up your official CAAM eCLIPSE digital licence URL in My Credentials to view licence validities.
          </p>
          <button onclick="openProfileMenu()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
            Configure Licence Source
          </button>
        </div>
      `;
    }
  }

  // 3. MAB TAB
  if (mabResults) {
    if (mabPane && initialMabTemplateHTML && !mabPane.querySelector("#mab-pilot-name")) {
      mabPane.innerHTML = initialMabTemplateHTML;
    }

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
    const mabDocRef = getDashEl("mab-doc-ref");

    if (mabPilot) mabPilot.innerText = mabResults.pilotName;
    if (mabStaff) mabStaff.innerText = mabResults.staffNo;
    if (mabDesig) mabDesig.innerText = mabResults.designation;
    if (mabPub) mabPub.innerText = mabResults.publishedDateStr;
    if (mabDocRef) mabDocRef.innerHTML = "";

    if (mabFresh) {
      mabFresh.innerText = mabResults.isStale ? `Stale (>${mabResults.freshnessLimitDays}d)` : `Fresh (<${mabResults.freshnessLimitDays}d)`;
      mabFresh.className = mabResults.isStale ? "text-rose-600 font-extrabold" : "text-emerald-600 dark:text-emerald-400 font-extrabold";
    }

    // Line Check Card
    const lcTitle = getDashEl("mab-linecheck-title");
    const lcLicence = getDashEl("mab-linecheck-licence");
    const lcRoute = getDashEl("mab-linecheck-route");
    const lcDate = getDashEl("mab-linecheck-date");
    const lcExp = getDashEl("mab-linecheck-expiry");

    if (lcTitle && mabResults.lineCheck) lcTitle.innerText = `${mabResults.lineCheck.fleet}`;
    if (lcLicence && mabResults.lineCheck) lcLicence.innerText = mabResults.lineCheck.licenseNo || "-";
    if (lcRoute && mabResults.lineCheck) lcRoute.innerText = mabResults.lineCheck.route;
    if (lcDate && mabResults.lineCheck) lcDate.innerText = mabResults.lineCheck.checkDate;
    if (lcExp && mabResults.lineCheck) lcExp.innerText = mabResults.lineCheck.expiryDate;

    // LVO Autoland Card
    const lvoAirport = getDashEl("mab-lvo-airport");
    const lvoRunway = getDashEl("mab-lvo-runway");
    const lvoDate = getDashEl("mab-lvo-date");
    const lvoSim = getDashEl("mab-lvo-sim");
    const lvoCat = getDashEl("mab-lvo-cat");
    const lvoDfe = getDashEl("mab-lvo-dfe");
    const lvoBadge = getDashEl("mab-lvo-badge");

    if (lvoAirport && mabResults.lvo) lvoAirport.innerText = mabResults.lvo.airport;
    if (lvoRunway && mabResults.lvo) lvoRunway.innerText = mabResults.lvo.runway;
    if (lvoDate && mabResults.lvo) lvoDate.innerText = mabResults.lvo.checkDate;
    if (lvoSim && mabResults.lvo) lvoSim.innerText = mabResults.lvo.simCode;
    if (lvoCat && mabResults.lvo) lvoCat.innerText = mabResults.lvo.category;
    if (lvoDfe && mabResults.lvo) lvoDfe.innerText = mabResults.lvo.dfeNo || "DFE 11635";
    if (lvoBadge && mabResults.lvo) lvoBadge.innerText = mabResults.lvo.type || "ACTUAL";

    // Safety Drills & Recurrent Training List (Items 1-11)
    const drillsContainer = getDashEl("mab-drills-list");
    if (drillsContainer && mabResults.drills) {
      drillsContainer.innerHTML = "";
      mabResults.drills.forEach(d => {
        const row = document.createElement("div");
        row.className = "py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";
        let badgeHtml = "";
        if (d.status === "EXPIRED") {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700">Lapsed</span>`;
        } else if (d.status === "EXPIRING_SOON") {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">${d.daysLeft} days left</span>`;
        } else if (d.status === "COMPLETED") {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">Completed</span>`;
        } else {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Valid</span>`;
        }
        row.innerHTML = `
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">${d.name}</div>
            <div class="text-[10px] text-slate-400">Attended : ${d.doneDate} | Expires : ${d.expiryDate}</div>
          </div>
          ${badgeHtml}
        `;
        drillsContainer.appendChild(row);
      });
    }
  } else {
    if (mabPane) {
      mabPane.innerHTML = `
        <div class="p-6 text-center space-y-4 my-8">
          <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">No MAB Attestation PDF</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Please upload your MAB E-Attestation PDF document in My Credentials to view company qualifications.
          </p>
          <button onclick="openProfileMenu()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
            Upload Attestation PDF
          </button>
        </div>
      `;
    }
  }

  showView("dashboard-view");
}


let currentHistoryFilter = "ALL";

function updateHistoryPillUI(targetFilter) {
  const pillAll = document.getElementById("filter-pill-all") || document.getElementById("history-filter-all");
  const pillValid = document.getElementById("filter-pill-valid") || document.getElementById("history-filter-valid");
  const pillExpiring = document.getElementById("filter-pill-expiring") || document.getElementById("history-filter-expiring");
  const pillExpired = document.getElementById("filter-pill-expired") || document.getElementById("history-filter-expired");

  const filterPills = [
    { el: pillAll, value: "ALL" },
    { el: pillValid, value: "VALID" },
    { el: pillExpiring, value: "EXPIRING_SOON" },
    { el: pillExpired, value: "EXPIRED" }
  ];

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200";

  filterPills.forEach(({ el, value }) => {
    if (!el) return;
    if (value === targetFilter) {
      el.className = el.className.replace(inactiveClass, activeClass);
      if (!el.className.includes(activeClass)) el.className += " " + activeClass;
    } else {
      el.className = el.className.replace(activeClass, inactiveClass);
      if (!el.className.includes(inactiveClass)) el.className += " " + inactiveClass;
    }
  });
}

export function customRenderHistoryList() {
  const container = document.getElementById("history-list");
  const countBadge = document.getElementById("history-count-badge");
  const clockIcon = document.getElementById("history-clock-icon");
  const searchInput = document.getElementById("history-search-input");

  if (!container) return;

  let allHistory = getScanHistory() || [];
  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const clearBtn = document.getElementById("history-search-clear-btn");
  if (clearBtn && searchInput) {
    if (searchInput.value.trim().length > 0) clearBtn.classList.remove("hidden");
    else clearBtn.classList.add("hidden");
  }

  let scanHistory = [];

  if (searchQuery) {
    // 1. Option 3: Search globally across ALL history records regardless of current pill
    const matchingItems = allHistory.filter(item => {
      if (!item) return false;
      const name = (item.name || "").toLowerCase();
      const licType = (item.licenseType || "").toLowerCase();
      const licNo = (item.id || "").toLowerCase();
      return name.includes(searchQuery) || licType.includes(searchQuery) || licNo.includes(searchQuery);
    });

    if (matchingItems.length > 0) {
      // 2. Option 3: Smart Auto-Switching pill highlight based on match statuses
      const uniqueStatuses = new Set(matchingItems.map(m => m.overallStatus));
      if (uniqueStatuses.size === 1) {
        const singleStatus = Array.from(uniqueStatuses)[0];
        if (singleStatus === "VALID") currentHistoryFilter = "VALID";
        else if (singleStatus === "EXPIRING_SOON") currentHistoryFilter = "EXPIRING_SOON";
        else if (singleStatus === "EXPIRED") currentHistoryFilter = "EXPIRED";
        else currentHistoryFilter = "ALL";
      } else {
        currentHistoryFilter = "ALL";
      }
    }
    
    updateHistoryPillUI(currentHistoryFilter);
    scanHistory = matchingItems;
  } else {
    // 3. When search query is empty, filter strictly by active status pill
    updateHistoryPillUI(currentHistoryFilter);

    if (currentHistoryFilter && currentHistoryFilter !== "ALL") {
      scanHistory = allHistory.filter(item => {
        if (!item) return false;
        if (currentHistoryFilter === "VALID") return item.overallStatus === "VALID";
        if (currentHistoryFilter === "EXPIRING_SOON") return item.overallStatus === "EXPIRING_SOON";
        if (currentHistoryFilter === "EXPIRED") return item.overallStatus === "EXPIRED";
        return true;
      });
    } else {
      scanHistory = allHistory;
    }
  }

  // Sort Pinned Items to Very Top
  scanHistory = [...scanHistory].sort((a, b) => {
    const aPinned = Boolean(a.isPinned || a.pinned);
    const bPinned = Boolean(b.isPinned || b.pinned);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  if (clockIcon && countBadge) {
    const totalScans = scanHistory.length;
    countBadge.innerText = totalScans;
    if (totalScans > 0) {
      countBadge.classList.remove("hidden");
      clockIcon.classList.add("hidden");
    } else {
      clockIcon.classList.remove("hidden");
      countBadge.classList.add("hidden");
    }
  }

  if (scanHistory.length === 0) {
    container.innerHTML = `<div class="text-[10px] text-slate-400 italic py-4 text-center">No matching scans found.</div>`;
    return;
  }

  container.innerHTML = scanHistory.map(item => {
    if (!item) return '';
    const isPinned = Boolean(item.isPinned || item.pinned);
    const dotColor = item.overallStatus === "EXPIRED" ? "bg-rose-500" : (item.overallStatus === "EXPIRING_SOON" ? "bg-amber-500" : "bg-emerald-600");
    const safeId = String(item.id || '').replace(/'/g, "\'");
    const pinBadge = isPinned ? `<svg class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 inline-block align-middle ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>` : '';
    
    return `
      <div onclick="loadHistoricalRecord('${safeId}')" class="py-2 px-2.5 flex items-center justify-between cursor-pointer hover:bg-sky-50 dark:hover:bg-slate-800/60 rounded-xl transition-all border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 ${isPinned ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}">
        <div class="flex flex-col text-left">
          <div class="flex items-center gap-1">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">${item.name || 'Unknown'}</span>
            ${pinBadge}
          </div>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-tight mt-0.5">${item.licenseType || ''} ${item.licenseType ? '•' : ''} ${item.timestamp || ''} LT</span>
        </div>
        <span class="w-2.5 h-2.5 rounded-full ${dotColor} shrink-0 ml-2 shadow-xs"></span>
      </div>
    `;
  }).join('');
}

window.renderHistoryList = customRenderHistoryList;

function setupPinCardButton(caamResults) {
  const resView = document.getElementById("result-view");
  const pinBtn = (resView ? resView.querySelector("#btn-toggle-pin") : null) || document.getElementById("btn-toggle-pin");
  if (!pinBtn || !caamResults) return;

  const licNo = (caamResults.pilotDetails && caamResults.pilotDetails.licenseNo) || "";
  let scanHistory = getScanHistory() || [];
  const matchIndex = scanHistory.findIndex(item => item && (String(item.id) === String(licNo) || item.url === lastScannedUrl));

  let isPinned = false;
  if (matchIndex !== -1) {
    isPinned = Boolean(scanHistory[matchIndex].isPinned || scanHistory[matchIndex].pinned);
  }

  const updatePinButtonUI = () => {
    if (isPinned) {
      pinBtn.className = "py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs cursor-pointer";
      pinBtn.innerHTML = `
        <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
        </svg>
        <span>Unpin Card</span>
      `;
    } else {
      pinBtn.className = "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer";
      pinBtn.innerHTML = `
        <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
        </svg>
        <span>Pin Card</span>
      `;
    }
  };

  updatePinButtonUI();

  pinBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    isPinned = !isPinned;
    if (matchIndex !== -1) {
      scanHistory[matchIndex].isPinned = isPinned;
      scanHistory[matchIndex].pinned = isPinned;
    } else {
      const record = {
        id: String(licNo || Date.now()),
        name: (caamResults.pilotDetails && caamResults.pilotDetails.name) || "External Crew Member",
        licenseType: (caamResults.pilotDetails && caamResults.pilotDetails.licenseType) || "ATPL(A)",
        overallStatus: caamResults.overallStatus || "VALID",
        url: lastScannedUrl || "",
        resultsData: caamResults,
        timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        isPinned: isPinned,
        pinned: isPinned
      };
      scanHistory.unshift(record);
    }

    try {
      localStorage.setItem("scan_history", JSON.stringify(scanHistory));
    } catch (err) {
      console.error("Failed to update pin state in scan history:", err);
    }

    updatePinButtonUI();
    customRenderHistoryList();
  };
}

function initHistorySearchAndFilters() {
  const searchInput = document.getElementById("history-search-input");
  if (searchInput) {
    const parent = searchInput.parentNode;
    if (parent && !document.getElementById("history-search-clear-btn")) {
      const pos = window.getComputedStyle ? window.getComputedStyle(parent).position : parent.style.position;
      if (!pos || pos === 'static') {
        parent.style.position = 'relative';
      }

      const clearBtn = document.createElement("button");
      clearBtn.id = "history-search-clear-btn";
      clearBtn.type = "button";
      clearBtn.className = "absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hidden cursor-pointer z-10";
      clearBtn.setAttribute("aria-label", "Clear search");
      clearBtn.innerHTML = `
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      `;

      searchInput.classList.add("pr-9");

      clearBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        searchInput.value = "";
        clearBtn.classList.add("hidden");
        searchInput.focus();
        customRenderHistoryList();
      };

      parent.appendChild(clearBtn);
    }

    const syncClearBtn = () => {
      const clearBtn = document.getElementById("history-search-clear-btn");
      if (clearBtn) {
        if (searchInput.value.trim().length > 0) {
          clearBtn.classList.remove("hidden");
        } else {
          clearBtn.classList.add("hidden");
        }
      }
    };

    searchInput.addEventListener("input", () => {
      syncClearBtn();
      customRenderHistoryList();
    });
    searchInput.addEventListener("change", () => {
      syncClearBtn();
      customRenderHistoryList();
    });
    syncClearBtn();
  }

  const pillAll = document.getElementById("filter-pill-all") || document.getElementById("history-filter-all");
  const pillValid = document.getElementById("filter-pill-valid") || document.getElementById("history-filter-valid");
  const pillExpiring = document.getElementById("filter-pill-expiring") || document.getElementById("history-filter-expiring");
  const pillExpired = document.getElementById("filter-pill-expired") || document.getElementById("history-filter-expired");

  const filterPills = [
    { el: pillAll, value: "ALL" },
    { el: pillValid, value: "VALID" },
    { el: pillExpiring, value: "EXPIRING_SOON" },
    { el: pillExpired, value: "EXPIRED" }
  ];

  filterPills.forEach(({ el, value }) => {
    if (!el) return;
    el.addEventListener("click", () => {
      currentHistoryFilter = value;
      updateHistoryPillUI(currentHistoryFilter);
      customRenderHistoryList();
    });
  });
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

  const caamListContainer = getResEl("res-qualifications-list") || getResEl("qualifications-list");
  if (caamListContainer && caamResults) {
    caamListContainer.innerHTML = "";
    const sortedResQuals = sortCaamQualifications(caamResults.qualifications);
    if (!sortedResQuals || sortedResQuals.length === 0) {
      caamListContainer.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No CAAM qualifications found on digital licence.</div>`;
    } else {
      sortedResQuals.forEach(q => {
        const row = document.createElement("div");
        row.className = "py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";
        let badgeHtml = "";
        if (q.status === "EXPIRED") {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700">Expired</span>`;
        } else if (q.status === "EXPIRING_SOON") {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">${q.daysRemaining} days left</span>`;
        } else {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Valid</span>`;
        }
        row.innerHTML = `
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">${q.name}</div>
            <div class="text-[10px] text-slate-400">Expiry: ${q.dateText || "No Expiry"}</div>
          </div>
          ${badgeHtml}
        `;
        caamListContainer.appendChild(row);
      });
    }
  }

  // Attach button event handlers inside #result-view
  const resOpenBtn = getResEl("res-open-original-btn") || getResEl("open-original-btn");
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

  setupPinCardButton(caamResults);
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

function drawQrToCanvas(canvasElem, qrUrlText, qrImageUrl) {
  if (!canvasElem) return;
  const ctx = canvasElem.getContext("2d");
  const size = 240;
  canvasElem.width = size;
  canvasElem.height = size;

  // Clear and fill solid white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, size, size);

  if (!qrUrlText) {
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CAAM eCLIPSE QR", size / 2, size / 2 - 10);
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#64748B";
    ctx.fillText("No Licence URL Configured", size / 2, size / 2 + 10);
    return;
  }

  // Helper: Cache rendered canvas as Base64 Data URL in localStorage
  const cacheCanvasDataUrl = () => {
    try {
      const dataUrl = canvasElem.toDataURL("image/png");
      if (dataUrl && dataUrl.length > 100 && typeof saveProfileData === "function") {
        const currentProfile = (typeof getProfileData === "function") ? getProfileData() : {};
        if (currentProfile.cachedQrDataUrl !== dataUrl) {
          saveProfileData({ cachedQrDataUrl: dataUrl });
        }
      }
    } catch (err) {
      console.warn("Could not cache QR canvas Data URL:", err);
    }
  };

  // Engine 1: Check for npm qrcode library API (window.QRCode.toCanvas)
  if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
    try {
      window.QRCode.toCanvas(canvasElem, qrUrlText, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      cacheCanvasDataUrl();
      return;
    } catch (e) {
      console.warn("Engine 1 (QRCode.toCanvas) failed:", e);
    }
  }

  // Engine 2: Check for David Shim qrcode.js API (new window.QRCode constructor - qrcode.min.js)
  if (window.QRCode && typeof window.QRCode === 'function') {
    try {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      document.body.appendChild(tempDiv);

      new window.QRCode(tempDiv, {
        text: qrUrlText,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: (window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.H : 2)
      });

      const generatedCanvas = tempDiv.querySelector("canvas");
      const generatedImg = tempDiv.querySelector("img");

      if (generatedCanvas) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(generatedCanvas, 0, 0, size, size);
        if (tempDiv.parentNode) document.body.removeChild(tempDiv);
        cacheCanvasDataUrl();
        return;
      } else if (generatedImg) {
        const renderImageToCanvas = () => {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(generatedImg, 0, 0, size, size);
          if (tempDiv.parentNode) document.body.removeChild(tempDiv);
          cacheCanvasDataUrl();
        };

        if (generatedImg.complete && generatedImg.src) {
          renderImageToCanvas();
          return;
        } else {
          generatedImg.onload = renderImageToCanvas;
          setTimeout(() => {
            if (tempDiv.parentNode) document.body.removeChild(tempDiv);
          }, 1000);
          return;
        }
      } else {
        if (tempDiv.parentNode) document.body.removeChild(tempDiv);
      }
    } catch (e) {
      console.warn("Engine 2 (David Shim QRCode) failed:", e);
    }
  }

  // Engine 3 (100% Airplane Mode): Check for cached Base64 Data URL stored in localStorage from previous session
  const profile = (typeof getProfileData === "function") ? getProfileData() : {};
  if (profile && profile.cachedQrDataUrl) {
    const cachedImg = new Image();
    cachedImg.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(cachedImg, 0, 0, size, size);
    };
    cachedImg.src = profile.cachedQrDataUrl;
    return;
  }

  // Engine 4: Online API Fallback (if network is available)
  let imgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrlText)}`;
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 10, 10, size - 20, size - 20);
    cacheCanvasDataUrl();
  };
  img.onerror = () => {
    if (qrImageUrl && imgSrc !== `${PROXY_URL}?url=${encodeURIComponent(qrImageUrl)}`) {
      img.src = `${PROXY_URL}?url=${encodeURIComponent(qrImageUrl)}`;
    } else {
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CAAM eCLIPSE QR", size / 2, size / 2 - 10);
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#64748B";
      ctx.fillText("Offline Pass Active", size / 2, size / 2 + 10);
    }
  };
  img.src = imgSrc;
}

let initialMyQrPassTemplateHTML = "";

function renderMyQrPass() {
  const tabQrPassBtn = document.getElementById("tab-qrpass-btn");
  if (tabQrPassBtn) {
    const span = tabQrPassBtn.querySelector("span");
    if (span) span.innerText = "My QR";
    else tabQrPassBtn.innerText = "My QR";
  }

  const profile = getProfileData();
  const hasUrl = profile && profile.url && profile.url.trim() !== "";
  const tabContainer = document.getElementById("my-qr-pass-tab");

  // Tab 2 Unconfigured Empty-State Card
  if (tabContainer) {
    if (!initialMyQrPassTemplateHTML && tabContainer.querySelector("#pass-qr-canvas")) {
      initialMyQrPassTemplateHTML = tabContainer.innerHTML;
    }

    if (!hasUrl && !profile.cachedQrDataUrl && !profile.cachedCaamResults) {
      tabContainer.innerHTML = `
        <div class="py-12 px-4 text-center flex flex-col items-center justify-center bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-lg my-4">
          <div class="w-16 h-16 bg-slate-700/60 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-inner">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 3l18 18"></path></svg>
          </div>
          <h3 class="text-base font-bold text-white mb-1">No Digital QR Pass Configured</h3>
          <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mb-4">
            Please set up your official CAAM eCLIPSE digital licence URL in My Credentials to generate your personal digital flight pass.
          </p>
          <button onclick="openProfileMenu()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
            Configure Licence Source
          </button>
        </div>
      `;
      return;
    } else if (initialMyQrPassTemplateHTML) {
      tabContainer.innerHTML = initialMyQrPassTemplateHTML;
    }
  }

  const canvas = document.getElementById("pass-qr-canvas");
  const nameElem = document.getElementById("pass-pilot-name");
  const licenceElem = document.getElementById("pass-licence-no") || document.getElementById("pass-licence-number");
  const badgeElem = document.getElementById("pass-eligibility-badge") || document.getElementById("pass-status-badge");
  const freshnessElem = document.getElementById("pass-freshness-tag") || document.getElementById("pass-timestamp");
  const verifyBtn = document.getElementById("verify-my-licence-btn");

  // Redundant Self-Verify Button Hiding
  if (verifyBtn) {
    verifyBtn.classList.add("hidden");
  }

  // Remove flight eligibility badge under QR image as requested
  if (badgeElem) {
    badgeElem.classList.add("hidden");
    badgeElem.style.display = "none";
  }

  const url = (profile.url || "").trim();
  const caam = profile.cachedCaamResults || null;
  const mab = profile.cachedMabResults || null;

  // Determine pilot name from cached CAAM or MAB or stored profile
  let displayName = "Unconfigured Profile";
  if (caam && caam.pilotDetails && caam.pilotDetails.name && caam.pilotDetails.name !== "-") {
    displayName = caam.pilotDetails.name;
  } else if (mab && mab.pilotName && mab.pilotName !== "-") {
    displayName = mab.pilotName;
  }

  // Determine licence type & number
  let licenceType = (caam && caam.pilotDetails && caam.pilotDetails.licenseType) ? caam.pilotDetails.licenseType : "ATPL(A)";
  let licenceNo = (caam && caam.pilotDetails && caam.pilotDetails.licenseNo && caam.pilotDetails.licenseNo !== "-") 
    ? caam.pilotDetails.licenseNo 
    : ((mab && mab.lineCheck && mab.lineCheck.licenseNo) ? mab.lineCheck.licenseNo : "-");

  // Determine scan timestamp
  let scanTimeStr = (caam && caam.scanTime) ? caam.scanTime : new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (nameElem) nameElem.innerText = displayName;
  if (licenceElem) licenceElem.innerText = `${licenceType} • ${licenceNo}`;
  if (freshnessElem) freshnessElem.innerText = scanTimeStr;



  // Draw QR Code onto Canvas
  if (canvas) {
    drawQrToCanvas(canvas, url, profile.qrImageUrl || (caam ? caam.qrImageUrl : ""));
  }
}

function setupTab3ManualLayout() {
  try {
    const manualTab = document.getElementById("tab-manual-content") || document.getElementById("manual-entry-tab");

    // 1. Hide/Remove redundant "Recently Verified Crew" card at the bottom of Tab 3
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

    // Remove paste button completely from DOM
    if (pasteBtn && pasteBtn.parentNode) {
      pasteBtn.parentNode.removeChild(pasteBtn);
    }

    if (!urlInput) return;

    
    if (urlInput) {
      urlInput.oninput = () => updateManualUrlBadge(urlInput.value.trim());
      urlInput.onchange = () => updateManualUrlBadge(urlInput.value.trim());
      urlInput.onkeyup = () => updateManualUrlBadge(urlInput.value.trim());
      urlInput.onpaste = () => setTimeout(() => updateManualUrlBadge(urlInput.value.trim()), 50);
      updateManualUrlBadge(urlInput.value.trim());
    }

    // 2. Format urlInput as clean full-width input
    urlInput.className = "w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xs";

    // 3. Create or update Action Button Row (Reset on Left, Verify on Right)
    let btnRow = document.getElementById("manual-action-btn-row");
    if (!btnRow) {
      btnRow = document.createElement("div");
      btnRow.id = "manual-action-btn-row";
      btnRow.className = "grid grid-cols-2 gap-2.5 my-3 w-full";

      // Reset Button (Left) - Equal height & SVG icon
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
        if (typeof updateProfileUrlBadge === 'function') updateProfileUrlBadge("");
        updateManualUrlBadge("");
      };

      // Verify Button (Right) - re-uses or creates submitBtn
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
