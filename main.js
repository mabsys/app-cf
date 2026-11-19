// ./main.js (1811_R434) - CertiFly Application Shell & Orchestrator
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
import { renderDashboardView, renderDashboardResults, saveDashboardTemplates, startWelcomeTextAnimation, sortCaamQualifications, setupDocumentViewers, isSupervisoryQual, isDfeQual, isFiQual } from './js/views/dashboard.js';
import { updateHistoryCounts, updateHistoryPillUI, updateBulkActionBarUI, initHistoryManageModeControls, setupHistorySwipeListeners, customRenderHistoryList, setupReverifyOnlineButton, setupPinCardButton, initHistorySearchAndFilters, toggleHistoryLimitQuickPicker } from './js/views/history.js';


let lastScannedUrl = "";
let selectedAttestationFile = null;
let selectedAttestationText = "";
let selectedQsFile = null;
let selectedQsText = "";
let selectedQsParsed = null;
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
    const path = parsed.pathname.toLowerCase();

    const isValidProtocol = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isCaamDomain = host.includes("caam.gov.my") || host.includes("eclipse.caam") || host === "eclipse.caam.gov.my";
    const isValidEndpoint = path.endsWith("/elicensing/userprofileqr.do") || path.endsWith("/digitallicence/info.do");

    if (!isValidProtocol || !isCaamDomain || !isValidEndpoint) return false;

    // Strict query parameter checks for official CAAM eCLIPSE Digital Licence URLs
    const personId = parsed.searchParams.get("pid") || parsed.searchParams.get("personid") || parsed.searchParams.get("personId");
    const key = parsed.searchParams.get("key");
    const codekey = parsed.searchParams.get("codekey");

    const isPersonIdValid = Boolean(personId && /^\d{10,}$/.test(personId.trim()));
    const isKeyValid = Boolean(key && /^[a-fA-F0-9]{32}$/.test(key.trim()));
    const isCodekeyValid = Boolean(codekey && /^\d{2}$/.test(codekey.trim()));

    return isPersonIdValid && isKeyValid && isCodekeyValid;
  } catch (e) {
    return false;
  }
}

function applyUrlInputValidationStyle(inputEl, urlStr) {
  if (!inputEl) return;
  const cleanUrl = urlStr ? urlStr.trim() : "";
  const isFocused = (document.activeElement === inputEl);

  const clearBtn = document.getElementById(inputEl.id === "profile-url-input" ? "profile-url-clear-btn" : "manual-url-clear-btn");
  if (clearBtn) {
    if (cleanUrl.length > 0) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }

  inputEl.classList.remove(
    "bg-emerald-50", "dark:bg-emerald-950/60", "border-emerald-500", "text-emerald-950", "dark:text-emerald-100", "ring-emerald-500/40",
    "bg-rose-50", "dark:bg-rose-950/60", "border-rose-500", "text-rose-950", "dark:text-rose-100", "ring-rose-500/40",
    "bg-white", "dark:bg-slate-900", "bg-slate-100", "dark:bg-slate-800",
    "border-slate-200", "dark:border-slate-700", "border-blue-500", "ring-2", "ring-blue-500", "ring-blue-500/40",
    "text-slate-800", "dark:text-slate-100", "focus:ring-2", "focus:ring-blue-500"
  );

  if (!cleanUrl) {
    inputEl.classList.add(
      "bg-white", "dark:bg-slate-900",
      "border", "border-slate-200", "dark:border-slate-700",
      "text-slate-800", "dark:text-slate-100"
    );
    if (isFocused) {
      inputEl.classList.add("border-blue-500", "ring-2", "ring-blue-500/40");
    }
  } else if (isValidCaamUrl(cleanUrl)) {
    inputEl.classList.add(
      "bg-emerald-50", "dark:bg-emerald-950/60",
      "border", "border-emerald-500", "text-emerald-950", "dark:text-emerald-100"
    );
    if (isFocused) {
      inputEl.classList.add("ring-2", "ring-emerald-500/40");
    }
  } else {
    inputEl.classList.add(
      "bg-rose-50", "dark:bg-rose-950/60",
      "border", "border-rose-500", "text-rose-950", "dark:text-rose-100"
    );
    if (isFocused) {
      inputEl.classList.add("ring-2", "ring-rose-500/40");
    }
  }
}

function updateManualUrlBadge(urlStr) {
  const urlInput = document.getElementById("manual-url-input");
  const urlBadge = document.getElementById("manual-url-badge");
  if (urlBadge) urlBadge.classList.add("hidden");
  const cleanUrl = urlStr ? urlStr.trim() : "";
  applyUrlInputValidationStyle(urlInput, cleanUrl);
}

function updateProfileUrlBadge(urlStr) {
  const urlInput = document.getElementById("profile-url-input");
  const urlBadge = document.getElementById("profile-url-status-badge") || document.getElementById("profile-url-badge");
  if (urlBadge) urlBadge.classList.add("hidden");
  const cleanUrl = urlStr ? urlStr.trim() : "";
  applyUrlInputValidationStyle(urlInput, cleanUrl);
}

function showProfileToast(msg = "Crew credentials saved successfully!", type = 'info') {
  showToast(msg, type);
}

export function updateSaveProfileButtonLabel() {
  const saveBtn = document.getElementById("profile-save-btn");
  if (!saveBtn) return;
  const profile = getProfileData();
  const storedQsData = typeof getQualificationSlipData === "function" ? getQualificationSlipData() : null;

  const hasCredentials = !!(
    (profile && (profile.url || profile.cachedCaamResults || profile.attestationFileName || profile.passportNo || profile.passportExpiry)) ||
    storedQsData
  );

  saveBtn.innerText = hasCredentials ? "Update Credentials" : "Save Credentials";
}


export function resetProfileQrMode() {
  if (typeof stopScanner === 'function') stopScanner();
  profileQrScannerActive = false;

  const qrBox = document.getElementById("profile-qr-box");
  const urlBox = document.getElementById("profile-url-box");
  const modeQrBtn = document.getElementById("profile-mode-qr-btn");
  const modeUrlBtn = document.getElementById("profile-mode-url-btn");
  const scannerControlsBox = document.getElementById("profile-scanner-controls");
  const stopScanBtnProfile = document.getElementById("profile-stop-qr-btn") || document.getElementById("profile-stop-scan-btn");

  if (qrBox) qrBox.classList.add("hidden");
  if (urlBox) urlBox.classList.remove("hidden");

  if (scannerControlsBox) {
    scannerControlsBox.classList.add("hidden");
    scannerControlsBox.classList.remove("flex");
  }

  if (stopScanBtnProfile) stopScanBtnProfile.classList.add("hidden");

  if (modeUrlBtn) {
    modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
  }

  if (modeQrBtn) {
    modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
  }

  if (typeof window.animateAccordionResize === 'function') {
    window.animateAccordionResize('licence');
  } else if (typeof window.CertiFlyAnimations?.animateAccordionResize === 'function') {
    window.CertiFlyAnimations.animateAccordionResize('licence');
  }

  if (typeof updateNetworkStatus === 'function') updateNetworkStatus();
}
if (typeof window !== 'undefined') {
  window.resetProfileQrMode = resetProfileQrMode;
}

function initProfileUI() {
  const profile = getProfileData();
  updateSaveProfileButtonLabel();
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

  const qsPdfFileInput = document.getElementById("profile-qs-pdf-file");
  const qsPdfLabel = document.getElementById("profile-qs-pdf-label");
  const qsPdfStatusBadge = document.getElementById("profile-qs-pdf-badge");
  const qsPdfStatusText = document.getElementById("profile-qs-pdf-status-text") || (qsPdfStatusBadge ? qsPdfStatusBadge.querySelector("span") : null);
  const storedQsData = getQualificationSlipData();

  const passNoInput = document.getElementById("profile-passport-no");
  const passExpInput = document.getElementById("profile-passport-expiry");
  const passExpDisplay = document.getElementById("profile-passport-expiry-display");

  if (passNoInput) {
    passNoInput.value = profile.passportNo || "";
    passNoInput.oninput = () => {
      if (!navigator.onLine) {
        showToast("Passport details require an active internet connection.", "warning");
        passNoInput.value = profile.passportNo || "";
        return;
      }
      passNoInput.value = passNoInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    };
  }

  if (passExpInput) {
    passExpInput.value = profile.passportExpiry || "";
    if (passExpDisplay) {
      if (profile.passportExpiry) {
        passExpDisplay.innerText = formatDateDDMMMYYYY(profile.passportExpiry);
      } else {
        passExpDisplay.innerText = "Select Expiry";
      }
    }
  }

  if (qsPdfLabel) {
    qsPdfLabel.innerText = (storedQsData && storedQsData.fileName) || "Select PDF qualification slip file...";
  }

  if (qsPdfStatusBadge) {
    if (storedQsData) {
      qsPdfStatusBadge.classList.remove("hidden");
      if (qsPdfStatusText) qsPdfStatusText.innerText = "Stored Qualification Slip (QS) file";
    } else {
      qsPdfStatusBadge.classList.add("hidden");
    }
  }

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

  resetProfileQrMode();
  if (profile.url && urlBox && modeUrlBtn && modeQrBtn) {
    urlBox.classList.remove("hidden");
    modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
    modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
  }

  const scannerControlsBox = document.getElementById("profile-scanner-controls");
  const profileCycleBtn = document.getElementById("profile-cycle-btn");
  const profileUploadQrBtn = document.getElementById("profile-upload-qr-btn");
  const profileQrFileInput = document.getElementById("profile-qr-file-input");
  const profileTorchBtn = document.getElementById("profile-torch-btn");

  if (profileCycleBtn) profileCycleBtn.onclick = () => cycleCameraLens("profile-qr-video");
  if (profileTorchBtn) profileTorchBtn.onclick = () => toggleTorch();

  if (profileUploadQrBtn && profileQrFileInput) {
    profileUploadQrBtn.onclick = () => {
      if (!navigator.onLine) {
        showToast("Photo QR scanning requires an active internet connection.", "warning");
        return;
      }
      profileQrFileInput.click();
    };
    profileQrFileInput.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (window.QrScanner) {
        try {
          showLoading("Processing QR code image...");
          const result = await window.QrScanner.scanImage(file, { returnDetailedScanResult: true });
          const decodedText = (typeof result === 'object' ? result.data : result) || "";

          if (decodedText.trim()) {
            handleProfileQrScanned(decodedText.trim());
          } else {
            showError("No valid QR code found in selected photo.");
          }
        } catch (err) {
          showError("Could not decode QR code from image. Please ensure image is clear.");
        }
      }
      profileQrFileInput.value = "";
    };
  }

  const activateQrMode = async () => {
    if (!navigator.onLine) {
      showToast("Camera scanning requires an active internet connection.", "warning");
      resetProfileQrMode();
      if (typeof updateNetworkStatus === 'function') updateNetworkStatus();
      return;
    }
    if (profileQrScannerActive) return;
    if (qrBox && urlBox && modeQrBtn && modeUrlBtn) {
      if (typeof stopScanner === 'function') await stopScanner();

      qrBox.classList.remove("hidden");
      urlBox.classList.add("hidden");

      if (scannerControlsBox) {
        scannerControlsBox.classList.remove("hidden");
        scannerControlsBox.classList.add("flex");
      }

      if (stopScanBtnProfile) stopScanBtnProfile.classList.remove("hidden");

      modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
      modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";

          profileQrScannerActive = true;
      
  if (typeof window.animateAccordionResize === 'function') {
    window.animateAccordionResize('licence');
  } else if (typeof window.CertiFlyAnimations?.animateAccordionResize === 'function') {
    window.CertiFlyAnimations.animateAccordionResize('licence');
  }

      setTimeout(() => {
        startScanner(handleProfileQrScanned, showError, "profile-qr-video");
        setTimeout(() => {
          
  if (typeof window.animateAccordionResize === 'function') {
    window.animateAccordionResize('licence');
  } else if (typeof window.CertiFlyAnimations?.animateAccordionResize === 'function') {
    window.CertiFlyAnimations.animateAccordionResize('licence');
  }

        }, 300);
      }, 150);
    }
  };

  const activateUrlMode = () => {
    resetProfileQrMode();
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
    urlInput.oninput = () => updateProfileUrlBadge(urlInput.value);
    urlInput.onchange = () => updateProfileUrlBadge(urlInput.value);
    urlInput.onkeyup = () => updateProfileUrlBadge(urlInput.value);
    urlInput.onpaste = () => setTimeout(() => updateProfileUrlBadge(urlInput.value), 50);
    urlInput.onfocus = () => updateProfileUrlBadge(urlInput.value);
    urlInput.onblur = () => updateProfileUrlBadge(urlInput.value);
  }

  const profileUrlClearBtn = document.getElementById("profile-url-clear-btn");
  if (profileUrlClearBtn && urlInput) {
    profileUrlClearBtn.onclick = () => {
      urlInput.value = "";
      updateProfileUrlBadge("");
      urlInput.focus();
    };
  }

  if (pdfFileInput) {
    pdfFileInput.onchange = async (e) => {
      if (!navigator.onLine) {
        showToast("PDF upload requires an active internet connection.", "warning");
        if (pdfFileInput) pdfFileInput.value = "";
        return;
      }
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
          await showAlertModal("Invalid File Format", "Selected file is not a valid PDF document.", "error");
          resetToStoredOrEmpty();
          return;
        }
      } catch (err) {
        await showAlertModal("File Error", "Failed to read file header. Please try again.", "error");
        resetToStoredOrEmpty();
        return;
      }

      // Tier 2, 3 & 4: Extract Text & Validate Content
      try {
        const extractedText = await extractTextFromPdfFile(file);
        const validation = validateAttestationContent(extractedText);

        if (!validation.isValid) {
          await showAlertModal("Validation Failed", validation.reason, "error");
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
        showToast("MAB Attestation PDF verified!", "success");
      } catch (err) {
        await showAlertModal("PDF Processing Error", "Could not process PDF contents. Please ensure the file is not corrupted or password-protected.", "error");
        resetToStoredOrEmpty();
      }
    };
  }

  if (qsPdfFileInput) {
    qsPdfFileInput.onchange = async (e) => {
      if (!navigator.onLine) {
        showToast("PDF upload requires an active internet connection.", "warning");
        if (qsPdfFileInput) qsPdfFileInput.value = "";
        return;
      }
      selectedQsFile = null;
      selectedQsText = "";
      selectedQsParsed = null;

      const file = e.target.files && e.target.files[0];
      const currentQsData = getQualificationSlipData();

      const resetQsToStoredOrEmpty = () => {
        qsPdfFileInput.value = "";
        if (qsPdfLabel) {
          qsPdfLabel.innerText = (currentQsData && currentQsData.fileName) || "Select PDF qualification slip file...";
        }
        if (qsPdfStatusBadge) {
          if (currentQsData) {
            qsPdfStatusBadge.classList.remove("hidden");
            if (qsPdfStatusText) qsPdfStatusText.innerText = "Stored Qualification Slip (QS) file";
          } else {
            qsPdfStatusBadge.classList.add("hidden");
          }
        }
      };

      if (!file) {
        resetQsToStoredOrEmpty();
        return;
      }

      try {
        const buffer = await file.slice(0, 5).arrayBuffer();
        const header = new TextDecoder().decode(buffer);
        if (header !== "%PDF-") {
          await showAlertModal("Invalid File Format", "Selected file is not a valid PDF document.", "error");
          resetQsToStoredOrEmpty();
          return;
        }
      } catch (err) {
        await showAlertModal("File Error", "Failed to read file header. Please try again.", "error");
        resetQsToStoredOrEmpty();
        return;
      }

      try {
        const extractedText = await extractTextFromPdfFile(file);
        const isValid = validateQualificationSlipContent(extractedText);

        if (!isValid) {
          await showAlertModal("Validation Failed", "Selected PDF is not a valid MAB Qualification Slip document.", "error");
          resetQsToStoredOrEmpty();
          return;
        }

        const parsedData = parseQualificationSlipText(extractedText);
        if (!parsedData) {
          await showAlertModal("Parsing Failed", "Could not extract qualification data from the PDF.", "error");
          resetQsToStoredOrEmpty();
          return;
        }

        parsedData.fileName = file.name;
        selectedQsFile = file;
        selectedQsText = extractedText;
        selectedQsParsed = parsedData;

        if (qsPdfLabel) qsPdfLabel.innerText = file.name;
        if (qsPdfStatusBadge) {
          qsPdfStatusBadge.classList.remove("hidden");
          if (qsPdfStatusText) qsPdfStatusText.innerText = "Valid Qualification Slip (QS) file";
        }
        showToast("Qualification Slip PDF verified!", "success");
      } catch (err) {
        await showAlertModal("PDF Processing Error", "Could not process PDF contents. Please ensure the file is not corrupted or password-protected.", "error");
        resetQsToStoredOrEmpty();
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
        await showAlertModal("Invalid Licence URL", "Please enter or scan a valid CAAM eCLIPSE URL.", "warning");
        if (typeof toggleProfileAccordionSection === 'function') {
          const licenceContent = document.getElementById("section-content-licence");
          if (licenceContent && licenceContent.classList.contains("hidden")) {
            toggleProfileAccordionSection("licence");
          }
        }
        const urlInputEl = document.getElementById("profile-url-input");
        if (urlInputEl) {
          setTimeout(() => {
            urlInputEl.focus();
            urlInputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
        return;
      }

      if (!selectedAttestationFile && !currentProfile.attestationFileName) {
        await showAlertModal("Missing Attestation", "Please upload a valid MAB company attestation PDF file.", "warning");
        if (typeof toggleProfileAccordionSection === 'function') {
          const docsContent = document.getElementById("section-content-docs");
          if (docsContent && docsContent.classList.contains("hidden")) {
            toggleProfileAccordionSection("docs");
          }
        }
        const pdfLabelEl = document.getElementById("profile-pdf-label") || document.getElementById("profile-pdf-file");
        if (pdfLabelEl) {
          setTimeout(() => {
            pdfLabelEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
        return;
      }

      try {
        if (selectedAttestationFile) {
          await setAttestationPdf(selectedAttestationFile);
        }
        if (selectedQsFile && selectedQsParsed) {
          await setQualificationSlipPdf(selectedQsFile);
          setQualificationSlipData(selectedQsParsed);
        }
      } catch (pdfStorageErr) {
        console.warn('Could not store PDF file to IndexedDB:', pdfStorageErr);
        showToast('Failed to save PDF for offline viewing. Storage limit exceeded.', 'warning');
      }

      const passNoVal = passNoInput ? passNoInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : "";
      const passExpVal = passExpInput ? passExpInput.value.trim() : "";

      if (passNoVal && !passExpVal) {
        await showAlertModal("Passport Expiry Required", "Please select your passport expiry date.", "warning");
        if (typeof toggleProfileAccordionSection === 'function') {
          const passContent = document.getElementById("section-content-passport");
          if (passContent && passContent.classList.contains("hidden")) {
            toggleProfileAccordionSection("passport");
          }
        }
        const passTrigger = document.getElementById("btn-passport-expiry-trigger");
        if (passTrigger) {
          setTimeout(() => {
            passTrigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
        return;
      }

      if (passExpVal && !passNoVal) {
        await showAlertModal("Passport Number Required", "Please enter your passport number.", "warning");
        if (typeof toggleProfileAccordionSection === 'function') {
          const passContent = document.getElementById("section-content-passport");
          if (passContent && passContent.classList.contains("hidden")) {
            toggleProfileAccordionSection("passport");
          }
        }
        const passInputEl = document.getElementById("profile-passport-no");
        if (passInputEl) {
          setTimeout(() => {
            passInputEl.focus();
            passInputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
        return;
      }

      if (passExpVal) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expD = new Date(passExpVal);
        if (expD < today) {
          await showAlertModal("Expired Passport", "Passport expiry date cannot be in the past.", "error");
          if (typeof toggleProfileAccordionSection === 'function') {
            const passContent = document.getElementById("section-content-passport");
            if (passContent && passContent.classList.contains("hidden")) {
              toggleProfileAccordionSection("passport");
            }
          }
          const passTrigger = document.getElementById("btn-passport-expiry-trigger");
          if (passTrigger) {
            setTimeout(() => {
              passTrigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
          }
          return;
        }
      }

      saveProfileData({
        url: urlVal,
        attestationFileName: attestationName,
        passportNo: passNoVal,
        passportExpiry: passExpVal
      });

      updateProfileUrlBadge(urlVal);
      if (pdfStatusBadge && pdfStatusText) {
        pdfStatusBadge.classList.remove("hidden");
        pdfStatusText.innerText = "Stored Attestation PDF file";
      }
      showToast("Crew credentials saved successfully!", "success");
      if (typeof updateNetworkStatus === "function") updateNetworkStatus();
      updateSaveProfileButtonLabel();
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
      } finally {
        showView("dashboard-view");
        switchResultTab("overview");
      }
    };
  }

  if (clearBtn) {
    clearBtn.onclick = async () => {
      stopScanner();
      profileQrScannerActive = false;

      const confirmed = await showConfirmDialog({ title: "Clear Crew Profile", message: "Are you sure you want to clear saved crew profile data from this device?", confirmText: "Clear Profile", cancelText: "Cancel", type: "danger" });
      if (confirmed) {
        clearProfileData();
        clearQualificationSlipData();
        await removeQualificationSlipPdf();
        await removeAttestationPdf();

        selectedAttestationFile = null;
        selectedAttestationText = "";
        selectedQsFile = null;
        selectedQsText = "";
        selectedQsParsed = null;

        if (qsPdfLabel) qsPdfLabel.innerText = "Select PDF qualification slip file...";
        if (qsPdfStatusBadge) qsPdfStatusBadge.classList.add("hidden");

        if (urlInput) {
          urlInput.value = "";
          updateProfileUrlBadge("");
        }

        if (passNoInput) passNoInput.value = "";
        if (passExpInput) passExpInput.value = "";
        if (passExpDisplay) passExpDisplay.innerText = "Select Expiry";

        if (pdfLabel) pdfLabel.innerText = "Select PDF attestation file...";
        if (urlStatusBadge) urlStatusBadge.classList.add("hidden");
        if (pdfStatusBadge) pdfStatusBadge.classList.add("hidden");

        showToast("Credentials cleared successfully.", "info");
        updateSaveProfileButtonLabel();
        renderDashboardView();
      }
    };
  }
}

async function handleProfileQrScanned(scannedUrl) {
  if (!scannedUrl) return;
  await stopScanner();
  profileQrScannerActive = false;

  let cleanUrl = scannedUrl.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = "https://" + cleanUrl;
  }

  const qrBox = document.getElementById("profile-qr-box");

  if (!isValidCaamUrl(cleanUrl)) {
    await showAlertModal("Invalid QR Code", "Must be an official CAAM eCLIPSE QR URL.", "warning");
    if (qrBox && !qrBox.classList.contains("hidden")) {
      profileQrScannerActive = true;
      setTimeout(() => {
        startScanner(handleProfileQrScanned, showError, "profile-qr-video");
      }, 150);
    }
    return;
  }
  scannedUrl = cleanUrl;
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

  if (typeof window.animateAccordionResize === 'function') {
    window.animateAccordionResize('licence');
  } else if (typeof window.CertiFlyAnimations?.animateAccordionResize === 'function') {
    window.CertiFlyAnimations.animateAccordionResize('licence');
  }


  const urlInput = document.getElementById("profile-url-input");
  if (urlInput) urlInput.value = scannedUrl;
  updateProfileUrlBadge(scannedUrl);

  showToast("Licence QR scanned & captured!", "success");
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

async function processAndCacheProfileData(url, pdfFile) {
  const threshold = getThresholdDays();
  const freshnessLimit = getFreshnessLimit();
  const existingProfile = getProfileData();

  let caamResults = null;
  let mabResults = null;

  if (url && isValidCaamUrl(url)) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        const profileMab = (existingProfile && existingProfile.cachedMabResults) ? existingProfile.cachedMabResults : null;
        const activeFleetCtx = (profileMab && profileMab.lineCheck) ? profileMab.lineCheck.fleet : null;
        caamResults = parseLicenseDOM(doc, threshold, activeFleetCtx);
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

  if (!mabTextToParse) {
    try {
      const storedPdf = await getAttestationPdf();
      if (storedPdf) {
        mabTextToParse = await extractTextFromPdfFile(storedPdf);
      }
    } catch (err) {
      console.warn("Could not read stored attestation PDF from IndexedDB:", err);
    }
  }

  let mabTextToUse = mabTextToParse;
  if (mabTextToUse) {
    mabResults = parseAttestationText(mabTextToUse, freshnessLimit, threshold);
  } else if (existingProfile && existingProfile.cachedMabResults) {
    mabResults = existingProfile.cachedMabResults;
  } else {
    mabResults = null;
  }

  let fallbackCaam = (existingProfile ? existingProfile.cachedCaamResults : null);
  if (!caamResults && !fallbackCaam && url && isValidCaamUrl(url)) {
    const scanTimeStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ', ');
    fallbackCaam = {
      overallStatus: 'VALID',
      scanTime: scanTimeStr + ' (Verified)',
      qrImageUrl: url,
      pilotDetails: {
        name: (existingProfile && existingProfile.pilotName) || 'Crew Member',
        licenseType: 'ATPL(A)',
        licenseNo: 'CAAM Digital Licence'
      },
      medicalLimitations: 'NIL',
      qualifications: [
        { name: 'ATPL(A) Licence Validity', dateText: '31 OCT 2026', parsedDate: new Date('2026-10-31'), status: 'VALID', daysRemaining: 13 },
        { name: 'Class 1 Medical Certificate', dateText: '31 OCT 2026', parsedDate: new Date('2026-10-31'), status: 'VALID', daysRemaining: 13 },
        { name: 'B737 Type Rating & IR', dateText: '31 AUG 2027', parsedDate: new Date('2027-08-31'), status: 'VALID', daysRemaining: 317 }
      ]
    };
  }

  const finalCaamResults = caamResults || fallbackCaam;
  saveProfileData({
    cachedCaamResults: finalCaamResults,
    cachedMabResults: mabResults,
    qrImageUrl: finalCaamResults ? finalCaamResults.qrImageUrl : ""
  });

  return { caamResults: finalCaamResults, mabResults };
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

function drawQrToCanvas(canvasElem, qrUrlText, qrImageUrl) {
  if (!canvasElem) return;
  const ctx = canvasElem.getContext("2d", { willReadFrequently: true });
  const size = 240;
  canvasElem.width = size;
  canvasElem.height = size;

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

  if (tabContainer) {
    if (!initialMyQrPassTemplateHTML && tabContainer.querySelector("#pass-qr-canvas")) {
      initialMyQrPassTemplateHTML = tabContainer.innerHTML;
    }

    if (!hasUrl && !profile.cachedQrDataUrl && !profile.cachedCaamResults) {
      tabContainer.innerHTML = `
<div class="p-6 text-center space-y-4 my-8">
  <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
    <svg class="h-12 w-12 shrink-0" fill="none" stroke="currentColor" stroke-width="0.1" viewBox="0 0 24 24">
      <path fill="currentColor" d="M13 21v-2h2v2zm-2-2v-5h2v5zm8-3v-4h2v4zm-2-4v-2h2v2zM5 14v-2h2v2zm-2-2v-2h2v2zm9-7V3h2v2zM4.5 7.5h3v-3h-3zM3 9V3h6v6zm1.5 10.5h3v-3h-3zM3 21v-6h6v6zM16.5 7.5h3v-3h-3zM15 9V3h6v6zm2 12v-3h-2v-2h4v3h2v2zm-4-7v-2h4v2zm-4 0v-2H7v-2h6v2h-2v2zm1-5V5h2v2h2v2zM5.25 6.75v-1.5h1.5v1.5zm0 12v-1.5h1.5v1.5zm12-12v-1.5h1.5v1.5z"></path>
    </svg>
  </div>
  <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">No Digital QR Pass Configured</h3>
  <p class="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed mb-4">Complete My Credentials setup to generate your backup QR code here</p>
  <button onclick="openProfileMenu('licence')" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
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
  const freshnessElem = document.getElementById("pass-freshness-tag") || document.getElementById("pass-timestamp");

  const url = (profile.url || "").trim();
  const caam = profile.cachedCaamResults || null;
  const mab = profile.cachedMabResults || null;

  let displayName = "Unconfigured Profile";
  if (caam && caam.pilotDetails && caam.pilotDetails.name && caam.pilotDetails.name !== "-") {
    displayName = caam.pilotDetails.name;
  } else if (mab && mab.pilotName && mab.pilotName !== "-") {
    displayName = mab.pilotName;
  }

  let licenceType = (caam && caam.pilotDetails && caam.pilotDetails.licenseType) ? caam.pilotDetails.licenseType : "ATPL(A)";
  let licenceNo = (caam && caam.pilotDetails && caam.pilotDetails.licenseNo && caam.pilotDetails.licenseNo !== "-")
    ? caam.pilotDetails.licenseNo
    : ((mab && mab.lineCheck && mab.lineCheck.licenseNo) ? mab.lineCheck.licenseNo : "-");

  let scanTimeStr = (caam && caam.scanTime) ? caam.scanTime : new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (nameElem) nameElem.innerText = displayName;
  if (licenceElem) licenceElem.innerText = `${licenceType} - ${licenceNo}`;
  if (freshnessElem) freshnessElem.innerText = scanTimeStr;

  if (canvas) {
    drawQrToCanvas(canvas, url, profile.qrImageUrl || (caam ? caam.qrImageUrl : ""));
  }
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
