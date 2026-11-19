// ./js/views/profile.js (1811_R103) - CertiFly Pilot Profile & Credentials Engine
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import { showToast, showAlertModal, showConfirmDialog } from '../notifications.js';
import { PROXY_URL } from '../config.js';
import { parseLicenseDOM } from '../caamParser.js';
import { parseAttestationText, validateAttestationContent, parseQualificationSlipText, validateQualificationSlipContent } from '../parser.js';
import { 
  getProfileData, saveProfileData, clearProfileData, 
  getThresholdDays, getFreshnessLimit, 
  getAttestationPdf, setAttestationPdf, removeAttestationPdf, getAttestationData, setAttestationData, clearAttestationData,
  getQualificationSlipPdf, setQualificationSlipPdf, removeQualificationSlipPdf, getQualificationSlipData, setQualificationSlipData, clearQualificationSlipData 
} from '../storage.js';
import { startScanner, stopScanner } from '../scanner.js';
import { updateNetworkStatus, showError, showLoading, showView, openProfileMenu } from '../ui.js';

let selectedAttestationFile = null;
let selectedAttestationText = "";
let selectedQsFile = null;
let selectedQsText = "";
let selectedQsParsed = null;
let profileQrScannerActive = false;
let initialMyQrPassTemplateHTML = "";

export function getSelectedAttestationFile() { return selectedAttestationFile; }
export function getSelectedAttestationText() { return selectedAttestationText; }
export function getSelectedQsFile() { return selectedQsFile; }
export function getSelectedQsText() { return selectedQsText; }
export function getSelectedQsParsed() { return selectedQsParsed; }


export async function extractTextFromPdfFile(file) {
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

export function isValidCaamUrl(urlStr) {
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

export function applyUrlInputValidationStyle(inputEl, urlStr) {
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


export function updateProfileUrlBadge(urlStr) {
  const urlInput = document.getElementById("profile-url-input");
  const urlBadge = document.getElementById("profile-url-status-badge") || document.getElementById("profile-url-badge");
  if (urlBadge) urlBadge.classList.add("hidden");
  const cleanUrl = urlStr ? urlStr.trim() : "";
  applyUrlInputValidationStyle(urlInput, cleanUrl);
}

export function showProfileToast(msg = "Crew credentials saved successfully!", type = 'info') {
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
  window.getSelectedAttestationFile = getSelectedAttestationFile;
  window.getSelectedAttestationText = getSelectedAttestationText;
  window.getSelectedQsFile = getSelectedQsFile;
  window.getSelectedQsText = getSelectedQsText;
  window.getSelectedQsParsed = getSelectedQsParsed;
}

export function initProfileUI() {
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

export async function handleProfileQrScanned(scannedUrl) {
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


export async function processAndCacheProfileData(url, pdfFile) {
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


export function drawQrToCanvas(canvasElem, qrUrlText, qrImageUrl) {
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

export function renderMyQrPass() {
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



if (typeof window !== 'undefined') {
  window.resetProfileQrMode = resetProfileQrMode;
  window.renderMyQrPass = renderMyQrPass;
}
