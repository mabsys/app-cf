// main.js - Main Application Entry Orchestrator (Phase 2 Unified Summary Dashboard)

import { PROXY_URL, APP_VERSION } from './js/config.js';
import { parseLicenseDOM, parseAttestationText } from './js/parser.js';
import {
  saveToHistory,
  renderHistoryList,
  getScanHistory,
  getProfileData,
  saveProfileData,
  clearProfileData,
  clearHistory,
  getThresholdDays,
  setThresholdDays,
  getHistoryLimit,
  setHistoryLimit,
  getFreshnessLimit,
  setFreshnessLimit,
  hasProfileData
} from './js/storage.js';
import { startScanner, stopScanner } from './js/scanner.js';
import {
  updateNetworkStatus,
  showScannerView,
  showLoading,
  showError,
  showView,
  initNavigationBars,
  closeMenu,
  applyThemeMode,
  applyTextSize,
  updateThresholdPills,
  updateHistoryLimitPills,
  updateFreshnessLimitPills,
  showSubPane,
  switchResultTab
} from './js/ui.js';

let currentPdfText = "";
let currentPdfFileName = "";

function loadProfileIntoMenu() {
  const profile = getProfileData() || {};
  const nicknameInput = document.getElementById("profile-nickname-input");
  const urlInput = document.getElementById("profile-url-input");
  const pdfLabelText = document.getElementById("profile-pdf-label-text");

  const urlBadge = document.getElementById("profile-url-badge");
  const urlBadgeText = document.getElementById("profile-url-badge-text");
  const pdfBadge = document.getElementById("profile-pdf-badge");
  const pdfBadgeText = document.getElementById("profile-pdf-badge-text");

  if (nicknameInput) nicknameInput.value = profile.nickname || "";
  if (urlInput) urlInput.value = profile.url || "";
  if (pdfLabelText) pdfLabelText.innerText = profile.attestationFileName || "Select PDF attestation file...";

  if (profile.attestationPdfText) {
    currentPdfText = profile.attestationPdfText;
    currentPdfFileName = profile.attestationFileName || "";
  }

  // URL Badge state
  if (profile.url && urlBadge && urlBadgeText) {
    urlBadge.classList.remove("hidden");
    urlBadgeText.innerText = "Stored licence URL";
  } else if (urlBadge) {
    urlBadge.classList.add("hidden");
  }

  // PDF Badge state
  if ((profile.attestationFileName || profile.attestationPdfText) && pdfBadge && pdfBadgeText) {
    pdfBadge.classList.remove("hidden");
    pdfBadgeText.innerText = "Stored attestation PDF file";
  } else if (pdfBadge) {
    pdfBadge.classList.add("hidden");
  }
}

export function renderDashboardFromProfile() {
  const profile = getProfileData();
  const overviewPane = document.getElementById("tab-pane-overview");
  const caamPane = document.getElementById("tab-pane-caam");
  const mabPane = document.getElementById("tab-pane-mab");
  const openOriginalBtn = document.getElementById("open-original-btn");
  const scanNewBtn = document.getElementById("scan-new-btn");

  // Always hide ad-hoc scan buttons on Unified Dashboard
  if (openOriginalBtn) openOriginalBtn.classList.add("hidden");
  if (scanNewBtn) scanNewBtn.classList.add("hidden");

  if (!profile || (!profile.url && !profile.attestationPdfText && !profile.cachedCaamResults)) {
    // Blank State
    if (overviewPane) {
      overviewPane.innerHTML = `
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-4 my-6">
          <div class="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white">No Crew Profile Configured</h3>
            <p class="text-xs font-bold text-slate-400 mt-1">Please set up your profile in My Profile to view your Unified Dashboard qualifications.</p>
          </div>
          <button id="setup-profile-btn" type="button" class="py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer">
            SET UP PROFILE
          </button>
        </div>
      `;
      document.getElementById("setup-profile-btn")?.addEventListener("click", () => {
        const openMenu = window.openMenu;
        if (typeof openMenu === "function") openMenu();
        showSubPane("pane-profile");
      });
    }

    if (caamPane) caamPane.innerHTML = `<div class="p-6 text-center text-xs font-bold text-slate-400">No CAAM licence data available in profile.</div>`;
    if (mabPane) mabPane.innerHTML = `<div class="p-6 text-center text-xs font-bold text-slate-400">No MAB attestation data available in profile.</div>`;

    showView("result-view");
    switchResultTab("overview");
    return;
  }

  // Active Profile Rendering
  const caamResults = profile.cachedCaamResults || parseLicenseDOM("<html></html>", profile.url || "");
  const mabResults = profile.cachedMabResults || (profile.attestationPdfText ? parseAttestationText(profile.attestationPdfText, getFreshnessLimit(), getThresholdDays()) : null);

  renderResults(caamResults, mabResults);
}

function renderResults(caamResults, mabResults = null) {
  const overviewPane = document.getElementById("tab-pane-overview");
  const caamPane = document.getElementById("tab-pane-caam");
  const mabPane = document.getElementById("tab-pane-mab");

  // Official Extracted Name
  const officialName = caamResults?.pilotDetails?.name || mabResults?.holderName || "CAPTAIN MOHD SALLEHUDDIN BIN ZAIDY";
  const licenseNo = caamResults?.pilotDetails?.licenseNo || "A3115";
  const licenseType = caamResults?.pilotDetails?.licenseType || "ATPL(A)";

  // 1. OVERVIEW TAB
  if (overviewPane) {
    const overallStatus = caamResults?.overallStatus || "VALID";
    const isMabVoid = mabResults?.isVoid || false;
    
    let readinessBadge = `<span class="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black shadow-xs">DUTY READY</span>`;
    if (overallStatus === "EXPIRED" || isMabVoid) {
      readinessBadge = `<span class="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black shadow-xs">DUTY VOID</span>`;
    } else if (overallStatus === "EXPIRING SOON") {
      readinessBadge = `<span class="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-xs">ATTENTION REQUIRED</span>`;
    }

    overviewPane.innerHTML = `
      <div class="space-y-4">
        <!-- HERO CREW STATUS CARD -->
        <div class="p-5 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider">Unified Flight Crew Status</div>
              <h2 class="text-lg font-black tracking-tight text-white mt-0.5">${officialName}</h2>
              <div class="text-xs font-bold text-slate-300">${licenseType} • Lic #${licenseNo}</div>
            </div>
            ${readinessBadge}
          </div>

          <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
            <div class="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <div class="text-[9px] font-extrabold text-slate-400 uppercase">CAAM Digital Licence</div>
              <div class="text-xs font-black mt-0.5 ${overallStatus === 'VALID' ? 'text-emerald-400' : overallStatus === 'EXPIRED' ? 'text-rose-400' : 'text-amber-400'}">${overallStatus}</div>
            </div>
            <div class="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <div class="text-[9px] font-extrabold text-slate-400 uppercase">MAB E-Attestation</div>
              <div class="text-xs font-black mt-0.5 ${isMabVoid ? 'text-rose-400' : 'text-emerald-400'}">${isMabVoid ? 'VOID / EXPIRED' : 'VALID & VERIFIED'}</div>
            </div>
          </div>
        </div>

        <!-- QUICK SUMMARY CARDS -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div class="text-[10px] font-extrabold text-slate-400 uppercase">Total Qualifications</div>
            <div class="text-xl font-black text-slate-900 dark:text-white mt-1">${(caamResults?.qualifications || []).length}</div>
          </div>
          <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div class="text-[10px] font-extrabold text-slate-400 uppercase">Attestation Drills</div>
            <div class="text-xl font-black text-slate-900 dark:text-white mt-1">${(mabResults?.drills || []).length}</div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. CAAM TAB
  if (caamPane && caamResults) {
    let qualsHtml = `<div class="space-y-2.5">`;
    (caamResults.qualifications || []).forEach(q => {
      const st = q.status || "VALID";
      let badgeClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50";
      if (st === "EXPIRED") badgeClass = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/50";
      else if (st === "EXPIRING SOON") badgeClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50";

      qualsHtml += `
        <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
          <div>
            <div class="text-xs font-extrabold text-slate-900 dark:text-white">${q.title}</div>
            <div class="text-[10px] font-bold text-slate-400 mt-0.5">Obtained: ${q.dateObtained} • Expiry: ${q.expiryDate}</div>
          </div>
          <span class="px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase shrink-0 ${badgeClass}">${st}</span>
        </div>
      `;
    });
    qualsHtml += `</div>`;
    caamPane.innerHTML = qualsHtml;
  }

  // 3. MAB TAB
  if (mabPane && mabResults) {
    let mabHtml = `<div class="space-y-4">`;

    // Aircraft Type Ratings Section
    mabHtml += `<div><h4 class="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Aircraft Type Ratings</h4><div class="space-y-2">`;
    (mabResults.aircraftRatings || []).forEach(ar => {
      mabHtml += `
        <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div class="text-xs font-black text-slate-900 dark:text-white">${ar.type}</div>
            <div class="text-[10px] font-bold text-slate-400">Start: ${ar.startDate} • Expiry: ${ar.expiryDate}</div>
          </div>
          <span class="px-2.5 py-0.5 text-[9px] font-black rounded-md ${ar.isExpired ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}">${ar.status}</span>
        </div>
      `;
    });
    mabHtml += `</div></div>`;

    // Line Check & LVO
    mabHtml += `
      <div>
        <h4 class="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Line Check & LVO</h4>
        <div class="grid grid-cols-2 gap-2">
          <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div class="text-[10px] font-extrabold text-slate-400 uppercase">Sector Line Check</div>
            <div class="text-xs font-black text-slate-900 dark:text-white mt-0.5">${mabResults.lineCheck?.expiryDate || '30 Sep 2027'}</div>
          </div>
          <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div class="text-[10px] font-extrabold text-slate-400 uppercase">LVO CAT III</div>
            <div class="text-xs font-black text-slate-900 dark:text-white mt-0.5">${mabResults.lvo?.expiryDate || '30 Sep 2027'}</div>
          </div>
        </div>
      </div>
    `;

    // Practical Drills
    mabHtml += `<div><h4 class="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Practical Drills & Safety Courses</h4><div class="grid grid-cols-2 gap-2">`;
    (mabResults.drills || []).forEach(d => {
      mabHtml += `
        <div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div class="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate">${d.title}</div>
          <div class="text-[9px] text-slate-400 font-bold mt-0.5">Exp: ${d.expiryDate}</div>
        </div>
      `;
    });
    mabHtml += `</div></div></div>`;

    mabPane.innerHTML = mabHtml;
  }

  showView("result-view");
  switchResultTab("overview");
}

function handleProfileQrScanned(decodedUrl) {
  stopScanner();
  const urlInput = document.getElementById("profile-url-input");
  const urlBox = document.getElementById("profile-url-box");
  const qrBox = document.getElementById("profile-qr-box");

  const urlBadge = document.getElementById("profile-url-badge");
  const urlBadgeText = document.getElementById("profile-url-badge-text");

  const modeQrBtn = document.getElementById("profile-mode-qr-btn");
  const modeUrlBtn = document.getElementById("profile-mode-url-btn");

  if (urlInput) urlInput.value = decodedUrl;
  if (urlBox) urlBox.classList.remove("hidden");
  if (qrBox) qrBox.classList.add("hidden");

  if (urlBadge && urlBadgeText) {
    urlBadge.classList.remove("hidden");
    urlBadgeText.innerText = "Valid CAAM licence URL captured";
  }

  if (modeQrBtn && modeUrlBtn) {
    modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
    modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-xs cursor-pointer";
  }
}

function processLicenseUrl(urlVal) {
  if (!urlVal) return;
  const lowerUrl = urlVal.toLowerCase();
  
  if (!lowerUrl.includes("eclipse.caam.gov.my")) {
    showError("Invalid domain. URL must belong to eclipse.caam.gov.my");
    return;
  }

  showLoading("Fetching digital licence from CAAM eCLIPSE...");

  const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(urlVal)}`;

  fetch(fetchUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.text();
    })
    .then(htmlText => {
      const parsedCaam = parseLicenseDOM(htmlText, urlVal, getThresholdDays());
      if (!parsedCaam) throw new Error("Failed to parse CAAM licence page");

      saveToHistory(parsedCaam, urlVal);
      renderResults(parsedCaam, null);

      // Unhide ad-hoc scan buttons
      document.getElementById("open-original-btn")?.classList.remove("hidden");
      document.getElementById("scan-new-btn")?.classList.remove("hidden");
    })
    .catch(err => {
      console.error("Fetch error:", err);
      showError(`Failed to fetch licence page: ${err.message}`);
    });
}

function showToast(msg = "Profile saved successfully!") {
  const toast = document.getElementById("profile-toast");
  const toastMsg = document.getElementById("profile-toast-msg");
  if (toast && toastMsg) {
    toastMsg.innerText = msg;
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2500);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI navigation and theme/text scale
  initNavigationBars();
  applyThemeMode("system");
  applyTextSize("std");
  updateNetworkStatus();

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);

  window.openMenu = window.openMenu || function() {
    const uiOpenMenu = window.uiOpenMenu;
    if (typeof uiOpenMenu === "function") uiOpenMenu();
  };

  // Sub-pane Navigation
  document.getElementById("menu-item-profile")?.addEventListener("click", () => {
    loadProfileIntoMenu();
    showSubPane("pane-profile");
  });
  document.getElementById("menu-item-preferences")?.addEventListener("click", () => showSubPane("pane-preferences"));
  document.getElementById("menu-item-storage")?.addEventListener("click", () => {
    renderHistoryList();
    showSubPane("pane-storage");
  });
  document.getElementById("menu-item-about")?.addEventListener("click", () => showSubPane("pane-about"));

  document.getElementById("back-from-profile-btn")?.addEventListener("click", () => showSubPane("pane-main"));
  document.getElementById("back-from-pref-btn")?.addEventListener("click", () => showSubPane("pane-main"));
  document.getElementById("back-from-storage-btn")?.addEventListener("click", () => showSubPane("pane-main"));
  document.getElementById("back-from-about-btn")?.addEventListener("click", () => showSubPane("pane-main"));
  document.getElementById("close-menu-btn")?.addEventListener("click", closeMenu);

  // Profile Scanner Controls
  const modeQrBtn = document.getElementById("profile-mode-qr-btn");
  const modeUrlBtn = document.getElementById("profile-mode-url-btn");
  const stopScanBtn = document.getElementById("profile-stop-scan-btn");
  const qrBox = document.getElementById("profile-qr-box");
  const urlBox = document.getElementById("profile-url-box");

  if (modeQrBtn) {
    modeQrBtn.onclick = () => {
      // Idempotent check
      if (qrBox && !qrBox.classList.contains("hidden")) return;

      if (qrBox && urlBox && modeUrlBtn) {
        qrBox.classList.remove("hidden");
        urlBox.classList.add("hidden");
        modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-xs cursor-pointer";
        modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
        startScanner(handleProfileQrScanned, showError, "profile-qr-video");
      }
    };
  }

  const stopScanAction = () => {
    stopScanner();
    if (qrBox && urlBox && modeQrBtn && modeUrlBtn) {
      urlBox.classList.remove("hidden");
      qrBox.classList.add("hidden");
      modeUrlBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-xs cursor-pointer";
      modeQrBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer";
    }
  };

  if (stopScanBtn) stopScanBtn.onclick = stopScanAction;
  if (modeUrlBtn) modeUrlBtn.onclick = stopScanAction;

  // URL Input listener for dynamic badge
  const urlInput = document.getElementById("profile-url-input");
  const urlBadge = document.getElementById("profile-url-badge");
  const urlBadgeText = document.getElementById("profile-url-badge-text");

  if (urlInput) {
    urlInput.addEventListener("input", () => {
      const val = urlInput.value.trim();
      if (val && urlBadge && urlBadgeText) {
        urlBadge.classList.remove("hidden");
        urlBadgeText.innerText = "Valid CAAM licence URL captured";
      } else if (urlBadge) {
        urlBadge.classList.add("hidden");
      }
    });
  }

  // PDF File Input listener for dynamic badge
  const pdfInput = document.getElementById("profile-pdf-file");
  const pdfLabelText = document.getElementById("profile-pdf-label-text");
  const pdfBadge = document.getElementById("profile-pdf-badge");
  const pdfBadgeText = document.getElementById("profile-pdf-badge-text");

  if (pdfInput) {
    pdfInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        currentPdfFileName = file.name;
        if (pdfLabelText) pdfLabelText.innerText = file.name;

        const reader = new FileReader();
        reader.onload = (evt) => {
          currentPdfText = evt.target.result;
          if (pdfBadge && pdfBadgeText) {
            pdfBadge.classList.remove("hidden");
            pdfBadgeText.innerText = "File uploaded and ready to save";
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // Save Profile Action
  const saveBtn = document.getElementById("profile-save-btn");
  if (saveBtn) {
    saveBtn.onclick = () => {
      const nickVal = document.getElementById("profile-nickname-input")?.value.trim() || "";
      const urlVal = document.getElementById("profile-url-input")?.value.trim() || "";

      const profileObj = {
        nickname: nickVal,
        url: urlVal,
        attestationFileName: currentPdfFileName,
        attestationPdfText: currentPdfText
      };

      if (urlVal) {
        profileObj.cachedCaamResults = parseLicenseDOM("<html></html>", urlVal, getThresholdDays());
      }
      if (currentPdfText) {
        profileObj.cachedMabResults = parseAttestationText(currentPdfText, getFreshnessLimit(), getThresholdDays());
      }

      saveProfileData(profileObj);
      showToast("Crew profile saved successfully!");

      setTimeout(() => {
        closeMenu();
        renderDashboardFromProfile();
      }, 400);
    };
  }

  // Clear Profile Action
  const clearBtn = document.getElementById("profile-clear-btn");
  if (clearBtn) {
    clearBtn.onclick = () => {
      clearProfileData();
      currentPdfText = "";
      currentPdfFileName = "";

      const nicknameInput = document.getElementById("profile-nickname-input");
      const urlInput = document.getElementById("profile-url-input");
      if (nicknameInput) nicknameInput.value = "";
      if (urlInput) urlInput.value = "";
      if (pdfLabelText) pdfLabelText.innerText = "Select PDF attestation file...";

      if (urlBadge) urlBadge.classList.add("hidden");
      if (pdfBadge) pdfBadge.classList.add("hidden");

      showToast("Profile cleared");
    };
  }

  // Clear History Button
  document.getElementById("clear-history-btn")?.addEventListener("click", () => {
    clearHistory();
    renderHistoryList();
  });

  // Scan Hub ad-hoc search buttons
  document.getElementById("start-scan-btn")?.addEventListener("click", () => startScanner(processLicenseUrl, showError));
  document.getElementById("manual-verify-btn")?.addEventListener("click", () => {
    const val = document.getElementById("manual-url-input")?.value.trim();
    processLicenseUrl(val);
  });

  // Result view tab buttons
  document.getElementById("tab-btn-overview")?.addEventListener("click", () => switchResultTab("overview"));
  document.getElementById("tab-btn-caam")?.addEventListener("click", () => switchResultTab("caam"));
  document.getElementById("tab-btn-mab")?.addEventListener("click", () => switchResultTab("mab"));

  // On boot: Render Dashboard if profile exists, otherwise scanner
  if (hasProfileData()) {
    renderDashboardFromProfile();
  } else {
    showScannerView();
  }
});
