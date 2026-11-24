// ./js/views/results.js (2411_R102) - CertiFly Single-Licence Inspection / Result View Engine
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import { animateBottomBanner } from '../animations.js';
import { getProfileData, getScanHistory } from '../storage.js';
import { showScannerView, showView } from '../ui.js';
import { sortCaamQualifications, isSupervisoryQual, isDfeQual, isFiQual } from './dashboard.js';
import { setupReverifyOnlineButton, setupPinCardButton } from './history.js';

let isBannerDismissed = false;
let resultScrollObserver = null;
let lastScannedUrl = "";

export function setLastScannedUrl(url) {
  lastScannedUrl = url || "";
}

export function getLastScannedUrl() {
  return lastScannedUrl;
}

export function setupResultViewScrollBanner(caamResults) {
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

export function renderResults(caamResults, mabResults = null) {
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



if (typeof window !== "undefined") {
  window.setLastScannedUrl = setLastScannedUrl;
  window.getLastScannedUrl = getLastScannedUrl;
}
