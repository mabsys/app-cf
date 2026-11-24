// ./js/views/dashboard.js (1911_R107) - CertiFly Dashboard Engine & Overview Controller
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import { openPdfViewerModal } from '../modals/pdfViewerModal.js';
import { showAlertModal, showToast, showConfirmDialog, renderNoticeCard } from '../notifications.js';
import { animateOverviewDashboard, animateOverviewEntrance } from '../animations.js';
import { getProfileData, getAttestationData, getQualificationSlipData, getAttestationPdf, getQualificationSlipPdf, getFreshnessLimit, getThresholdDays } from '../storage.js';
import { showView, showLoading, openProfileMenu } from '../ui.js';
import { getSelectedAttestationFile, getSelectedQsFile, getSelectedQsParsed } from './profile.js';

export function isSupervisoryQual(name) {
  if (!name) return false;
  return /(DFE|EXAMINER|CHECK PILOT|FI|FLIGHT INSTRUCTOR|INSTRUCTOR|TRI|TRE)/i.test(name) || /FI\(\d+\)/i.test(name) || /DFE\(\d+\)/i.test(name);
}

export function isDfeQual(name) {
  if (!name) return false;
  return /(DFE|EXAMINER|CHECK PILOT)/i.test(name) || /DFE\(\d+\)/i.test(name);
}

export function isFiQual(name) {
  if (!name) return false;
  return /(FI|FLIGHT INSTRUCTOR|INSTRUCTOR|TRI|TRE)/i.test(name) || /FI\(\d+\)/i.test(name);
}

export function getDashEl(id) {
  const dashView = document.getElementById("dashboard-view");
  if (dashView) {
    const el = dashView.querySelector("#" + id);
    if (el) return el;
  }
  return document.getElementById(id);
}

let initialOverviewTemplateHTML = "";
let initialCaamTemplateHTML = "";
let initialMabTemplateHTML = "";
let initialMyQrPassTemplateHTML = "";

export function saveDashboardTemplates() {
  const dashView = document.getElementById("dashboard-view");
  if (!dashView) return;

  const overviewPane = dashView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content");
  if (overviewPane && !initialOverviewTemplateHTML && (overviewPane.querySelector("#overview-hero-card") || overviewPane.querySelector("#ov-caam-expiry"))) {
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

let welcomeAnimTimer = null;
let currentWelcomeCycleId = 0;

export function startWelcomeTextAnimation() {
  const el = document.getElementById("welcome-text-anim");
  if (!el) return;

  if (welcomeAnimTimer) {
    clearTimeout(welcomeAnimTimer);
    welcomeAnimTimer = null;
  }
  currentWelcomeCycleId++;
  const cycleId = currentWelcomeCycleId;

  if (typeof el.getAnimations === 'function') {
    try {
      el.getAnimations().forEach(anim => anim.cancel());
    } catch (e) {}
  }

  const greetings = [
    "Welcome!",
    "Selamat Datang!",
    "欢迎！",
    "நல்வரவு!",
    "Selamat Datai!",
    "Kopisanangan!",
    "ਜੀ ਆਇਆਂ ਨੂੰ!"
  ];

  let index = 0;

  function animateTextChange(targetEl, newText, onComplete) {
    if (!document.body.contains(targetEl) || cycleId !== currentWelcomeCycleId) return;

    if (typeof targetEl.animate === 'function') {
      try {
        const fadeOut = targetEl.animate([
          { opacity: 1, transform: 'translateY(0px) scale(1)' },
          { opacity: 0, transform: 'translateY(-8px) scale(0.95)' }
        ], {
          duration: 320,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
          fill: 'forwards'
        });

        fadeOut.onfinish = () => {
          if (!document.body.contains(targetEl) || cycleId !== currentWelcomeCycleId) return;
          targetEl.textContent = newText;
          const fadeIn = targetEl.animate([
            { opacity: 0, transform: 'translateY(8px) scale(0.95)' },
            { opacity: 1, transform: 'translateY(0px) scale(1)' }
          ], {
            duration: 420,
            easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            fill: 'forwards'
          });

          fadeIn.onfinish = () => {
            if (!document.body.contains(targetEl) || cycleId !== currentWelcomeCycleId) return;
            if (onComplete) onComplete();
          };
        };
        return;
      } catch (e) {
        // Fallback below
      }
    }

    targetEl.style.transition = 'all 300ms ease-in';
    targetEl.style.opacity = '0';
    targetEl.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      if (!document.body.contains(targetEl) || cycleId !== currentWelcomeCycleId) return;
      targetEl.textContent = newText;
      targetEl.style.transition = 'all 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      targetEl.style.opacity = '1';
      targetEl.style.transform = 'translateY(0px)';
      if (onComplete) {
        setTimeout(() => {
          if (cycleId === currentWelcomeCycleId) onComplete();
        }, 400);
      }
    }, 300);
  }

  function cycle() {
    if (cycleId !== currentWelcomeCycleId) return;
    const targetEl = document.getElementById("welcome-text-anim");
    if (!targetEl || !document.body.contains(targetEl)) return;

    index = (index + 1) % greetings.length;
    animateTextChange(targetEl, greetings[index], () => {
      if (cycleId === currentWelcomeCycleId && document.body.contains(targetEl)) {
        welcomeAnimTimer = setTimeout(cycle, 2200);
      }
    });
  }

  welcomeAnimTimer = setTimeout(cycle, 2000);
}
if (typeof window !== "undefined") {
  window.startWelcomeTextAnimation = startWelcomeTextAnimation;
}async function renderBlankDashboard() {
  saveDashboardTemplates();
  const dashboardView = document.getElementById("dashboard-view");
  if (!dashboardView) return;

  const overviewPane = dashboardView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content");
  if (overviewPane) {
    overviewPane.innerHTML = `
<div class="p-6 text-center space-y-4 my-4">
  <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path stroke-dasharray="66" stroke-width="2" d="M12 3h7v18h-14v-18h7Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="66;0"></animate></path><path stroke-dasharray="14" stroke-dashoffset="14" d="M14.5 3.5v3h-5v-3"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" to="0"></animate></path><path stroke-dasharray="12" stroke-dashoffset="12" stroke-width="2" d="M9 13l2 2l4 -4"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.9s" dur="0.2s" to="0"></animate></path></g></svg>
  </div>
  <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center h-7 overflow-hidden">
    <span id="welcome-text-anim" class="inline-block transition-all">Welcome!</span>
  </h3>
  <p class="dyn-txt text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">Let’s get your personal dashboard up and running! Have your licence QR & attestation PDF file ready.</p>
  <button onclick="openProfileMenu('licence')" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
    Set Up Credentials
  </button>
</div>
`;
    startWelcomeTextAnimation();
  }

  const caamPane = dashboardView.querySelector("#tab-caam-content") || document.getElementById("tab-caam-content");
  if (caamPane) {
    caamPane.innerHTML = `
<div class="p-6 text-center space-y-4 my-4">
  <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4"></path></svg>
  </div>
  <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">No CAAM Digital Licence</h3>
  <p class="dyn-txt text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
    Scan the QR code on your physical licence card or paste its URL in My Credentials to continue.
  </p>
  <button onclick="openProfileMenu('licence')" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
    Configure Licence Source
  </button>
</div>
`;
  }

  const mabPane = dashboardView.querySelector("#tab-mab-content") || document.getElementById("tab-mab-content");
  if (mabPane) {
    mabPane.innerHTML = `
<div class="p-6 text-center space-y-4 my-4">
  <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
  </div>
  <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">No MAB Attestation PDF</h3>
  <p class="dyn-txt text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
    Upload your MAB E-Attestation PDF document in My Credentials to view company qualifications.
  </p>
  <button onclick="openProfileMenu('docs')" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
    Upload Attestation PDF
  </button>
</div>
`;
  }

  await setupDocumentViewers();
  showView("dashboard-view");
  if (typeof window.mountFestiveOverlay === "function") {
    window.mountFestiveOverlay();
  }
}

export async function renderDashboardView() {
  showView("dashboard-view");
  const profile = getProfileData();

  const hasCaam = Boolean((profile.cachedCaamResults && profile.cachedCaamResults.pilotDetails) || (profile.url && isValidCaamUrl(profile.url)));
  const selAttFile = (typeof getSelectedAttestationFile === "function") ? getSelectedAttestationFile() : null;
  const hasMab = Boolean(profile.cachedMabResults || profile.attestationFileName || selAttFile);

  if (!hasCaam || !hasMab) {
    renderBlankDashboard();
    return;
  }

  if (profile.cachedCaamResults && profile.cachedMabResults) {
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

export function sortCaamQualifications(quals) {
  if (!Array.isArray(quals) || quals.length === 0) return [];

  function getTier(q) {
    const nameUpper = (q.name || '').toUpperCase();
    if (nameUpper.includes('RADIO TELEPHONY') || nameUpper.includes('RADIOTELEPHONY') || nameUpper.includes('RTOL') || nameUpper.includes('TELEPHONY') || nameUpper.includes('R/T')) return 3;
    if (nameUpper.includes('ENGLISH') || nameUpper.includes('LANGUAGE') || nameUpper.includes('ELP')) return 4;
    if (nameUpper.includes('MEDICAL') || nameUpper.includes('CLASS 1') || nameUpper.includes('CLASS 2') || nameUpper.includes('CLASS1') || nameUpper.includes('CLASS2')) return 2;
    if (nameUpper.includes('VALIDITY') || nameUpper.includes('LICENCE') || nameUpper.includes('ATPL') || nameUpper.includes('CPL') || nameUpper.includes('PPL') || nameUpper.includes('MPL') || nameUpper.includes('AIRLINE TRANSPORT') || nameUpper.includes('COMMERCIAL PILOT') || nameUpper.includes('PRIVATE PILOT')) return 1;
    if (nameUpper.includes('A3') || nameUpper.includes('B7') || nameUpper.includes('ATR') || nameUpper.includes('DHC') || nameUpper.includes('B412') || nameUpper.includes('IR') || nameUpper.includes('INSTRUMENT') || nameUpper.includes('TYPE') || nameUpper.includes('RATING') || nameUpper.includes('PBN') || nameUpper.includes('PERFORMANCE') || nameUpper.includes('NIGHT') || nameUpper.includes('ENDORSEMENT') || nameUpper.includes('INSTRUCTOR') || nameUpper.includes('EXAMINER') || nameUpper.includes('CHECK PILOT') || nameUpper.includes('TRI') || nameUpper.includes('TRE') || nameUpper.includes('FI')) return 5;
    return 6;
  }

  return [...quals].sort((a, b) => {
    const tierA = getTier(a);
    const tierB = getTier(b);
    if (tierA !== tierB) return tierA - tierB;
    const isLegacyA = a.isLegacy || a.status === 'INACTIVE_LEGACY' ? 1 : 0;
    const isLegacyB = b.isLegacy || b.status === 'INACTIVE_LEGACY' ? 1 : 0;
    return isLegacyA - isLegacyB;
  });
}

export async function renderDashboardResults(caamResults, mabResults = null) {
  saveDashboardTemplates();
  const profile = getProfileData();

  const hasValidCaam = caamResults && caamResults.pilotDetails && caamResults.pilotDetails.name && caamResults.pilotDetails.name !== "-";
  const hasValidMab = mabResults && (mabResults.pilotName || mabResults.lineCheck || (mabResults.drills && mabResults.drills.length > 0));

  if (!hasValidCaam || !hasValidMab) {
    renderBlankDashboard();
    return;
  }

  const dashView = document.getElementById("dashboard-view");
  const overviewPane = dashView ? (dashView.querySelector("#tab-overview-content") || document.getElementById("tab-overview-content")) : null;
  const caamPane = dashView ? (dashView.querySelector("#tab-caam-content") || document.getElementById("tab-caam-content")) : null;
  const mabPane = dashView ? (dashView.querySelector("#tab-mab-content") || document.getElementById("tab-mab-content")) : null;

  if (overviewPane && initialOverviewTemplateHTML && !(overviewPane.querySelector("#overview-hero-card") || overviewPane.querySelector("#ov-caam-expiry"))) {
    overviewPane.innerHTML = initialOverviewTemplateHTML;
  }
  if (caamPane && initialCaamTemplateHTML && !caamPane.querySelector("#pilot-name")) {
    caamPane.innerHTML = initialCaamTemplateHTML;
  }
  if (mabPane && initialMabTemplateHTML && !mabPane.querySelector("#mab-pilot-name")) {
    mabPane.innerHTML = initialMabTemplateHTML;
  }

  const displayName = (caamResults && caamResults.pilotDetails && caamResults.pilotDetails.name && caamResults.pilotDetails.name !== "-")
    ? caamResults.pilotDetails.name
    : ((mabResults && mabResults.pilotName && mabResults.pilotName !== "-") ? mabResults.pilotName : "Crew Member");

  const greetingEl = getDashEl("overview-greeting");
  if (greetingEl) {
    const hour = new Date().getHours();
    let greeting = "Good Morning";
    if (hour >= 12 && hour < 18) greeting = "Good Afternoon";
    else if (hour >= 18) greeting = "Good Evening";

    const rawDesig = (mabResults && mabResults.designation) || (profile && profile.designation) || "";
    let title = "Captain";
    if (rawDesig) {
      const u = rawDesig.toUpperCase().trim();
      if (u.includes("FIRST OFFICER") || u.includes("F/O") || u.includes("FO")) title = "First Officer";
      else if (u.includes("SECOND OFFICER") || u.includes("S/O") || u.includes("SO")) title = "Second Officer";
      else if (u.includes("CADET")) title = "Cadet";
      else if (u.includes("CAPTAIN") || u.includes("CAPT")) title = "Captain";
      else if (u.includes("FE") || u.includes("ENGINEER")) title = "FE";
    }
    greetingEl.innerText = `${greeting}, ${title}`;
  }

  const heroPilot = getDashEl("overview-pilot-name");
  const heroTime = getDashEl("overview-scan-timestamp");

  if (heroPilot) heroPilot.innerText = displayName;
  if (heroTime) heroTime.innerText = (caamResults && caamResults.scanTime) ? `${caamResults.scanTime} LT` : "18 Oct 2026 LT";

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

  function getDaysUntil(dateStr) {
    if (!dateStr) return null;
    let d = (dateStr instanceof Date) ? dateStr : parseAnyDate(dateStr);
    if (!d || isNaN(d.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);

    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  function applyStatusTheme(days, badgeEl, textEl, ledEl, pillEl, validLabel = "Valid", barEl = null) {
    const threshold = (typeof getThresholdDays === 'function') ? getThresholdDays() : 30;

    if (days === null || days === undefined) {
      if (badgeEl) { badgeEl.innerText = "N/A"; badgeEl.className = "px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"; }
      if (textEl) textEl.innerText = "N/A";
      if (ledEl) ledEl.className = "w-2 h-2 rounded-full bg-slate-400 shrink-0";
      if (barEl) { barEl.style.width = "0%"; barEl.className = "h-full bg-slate-400 rounded-full transition-all duration-500"; }
      return "UNKNOWN";
    }

    if (days < 0) {
      if (badgeEl) { badgeEl.innerText = "Lapsed"; badgeEl.className = "px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"; }
      if (textEl) textEl.innerText = "LAPSED";
      if (ledEl) ledEl.className = "w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] shrink-0";
      if (pillEl) pillEl.className = "flex items-center gap-2 p-2 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 transition-all";
      if (barEl) {
        barEl.style.width = "5%";
        barEl.className = "h-full bg-rose-500 rounded-full transition-all duration-500";
      }
      return "EXPIRED";
    } else if (days <= threshold) {
      if (badgeEl) { badgeEl.innerText = `${days}d Left`; badgeEl.className = "px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"; }
      if (textEl) textEl.innerText = `${days}d LEFT`;
      if (ledEl) ledEl.className = "w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] shrink-0 animate-pulse";
      if (pillEl) pillEl.className = "flex items-center gap-2 p-2 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 transition-all";
      if (barEl) {
        const pct = Math.min(100, Math.max(5, Math.round((days / 365.25) * 100)));
        barEl.style.width = `${pct}%`;
        barEl.className = "h-full bg-amber-400 animate-pulse rounded-full transition-all duration-500";
      }
      return "WARNING";
    } else {
      if (badgeEl) { badgeEl.innerText = validLabel; badgeEl.className = "px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"; }
      if (textEl) textEl.innerText = validLabel.toUpperCase();
      if (ledEl) ledEl.className = "w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0";
      if (pillEl) pillEl.className = "flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 transition-all";
      if (barEl) {
        const pct = Math.min(100, Math.max(5, Math.round((days / 365.25) * 100)));
        barEl.style.width = `${pct}%`;
        barEl.className = "h-full bg-emerald-500 rounded-full transition-all duration-500";
      }
      return "VALID";
    }
  }

  const allCandidates = [];
  let markerPct = 0;

  // A. CAAM Digital Licence
  let caamDays = null;
  if (caamResults) {
    const licExpiryQual = (caamResults.qualifications || []).find(q => q.name && (q.name.includes("ATPL") || q.name.includes("CPL") || q.name.includes("LICENCE")));
    const caamExpDate = caamResults.licenceExpiry || (licExpiryQual ? licExpiryQual.dateText : null);
    caamDays = getDaysUntil(caamExpDate);

    const caamExpEl = getDashEl("ov-caam-expiry");
    const caamDaysEl = getDashEl("ov-caam-days");
    const caamBadgeEl = getDashEl("ov-caam-badge");
    const caamBarEl = getDashEl("ov-caam-bar");

    if (caamExpEl) caamExpEl.innerText = (caamExpDate || "N/A").toUpperCase();
    if (caamDaysEl) caamDaysEl.innerText = caamDays !== null ? (caamDays < 0 ? "Lapsed" : `${caamDays} Days Remaining`) : "N/A";
    applyStatusTheme(caamDays, caamBadgeEl, null, null, null, "Valid", caamBarEl);

    if (caamDays !== null) {
      allCandidates.push({ name: "CAAM Digital Licence", days: caamDays, tab: "caam" });
    }
  }

  // B. Class 1 Medical
  let medDays = null;
  if (caamResults) {
    const medQual = (caamResults.qualifications || []).find(q => {
      if (!q || !q.name) return false;
      const u = q.name.toUpperCase();
      return u.includes("MEDICAL") || u.includes("CLASS 1") || u.includes("CLASS1") || u.includes("PERUBATAN") || u.includes("CLASS 2") || u.includes("CLASS2");
    });
    const medExpDate = caamResults.medicalExpiry || (medQual ? medQual.dateText : null);
    medDays = getDaysUntil(medExpDate);

    const medExpEl = getDashEl("ov-medical-expiry");
    const medDaysEl = getDashEl("ov-medical-days");
    const medBadgeEl = getDashEl("ov-medical-badge");
    const medBarEl = getDashEl("ov-medical-bar");

    if (medExpEl) medExpEl.innerText = (medExpDate || "N/A").toUpperCase();
    if (medDaysEl) medDaysEl.innerText = medDays !== null ? (medDays < 0 ? "Lapsed" : `${medDays} Days Remaining`) : "N/A";
    applyStatusTheme(medDays, medBadgeEl, null, null, null, "Valid", medBarEl);

    if (medDays !== null) {
      allCandidates.push({ name: "Class 1 Medical", days: medDays, tab: "caam" });
    }
  }

  // C. B737 Type Rating & IR
  let typeDays = null;
  if (caamResults) {
    const typeQual = (caamResults.qualifications || []).find(q => {
      if (!q || !q.name) return false;
      const u = q.name.toUpperCase();
      return u.includes("B737") || u.includes("B738") || u.includes("B7M8") || u.includes("TYPE RATING") || u.includes("PPC") || u.includes("IR");
    });
    const typeExpDate = typeQual ? typeQual.dateText : null;
    typeDays = getDaysUntil(typeExpDate);

    const typeExpEl = getDashEl("ov-type-expiry");
    const typeDaysEl = getDashEl("ov-type-days");
    const typeBadgeEl = getDashEl("ov-type-badge");
    const typeBarEl = getDashEl("ov-type-bar");

    if (typeExpEl) typeExpEl.innerText = (typeExpDate || "N/A").toUpperCase();
    if (typeDaysEl) typeDaysEl.innerText = typeDays !== null ? (typeDays < 0 ? "Lapsed" : `${typeDays} Days Remaining`) : "N/A";
    applyStatusTheme(typeDays, typeBadgeEl, null, null, null, "Valid", typeBarEl);

    if (typeDays !== null) {
      allCandidates.push({ name: "B737 Type Rating & IR", days: typeDays, tab: "caam" });
    }
  }

  // D. MAB Line Check
  let lcDays = null;
  if (mabResults && mabResults.lineCheck) {
    const lcRoute = mabResults.lineCheck.route || (mabResults.lineCheck.fleet ? `${mabResults.lineCheck.fleet} Check` : "Line Check");
    const lcExpDate = mabResults.lineCheck.expiryDate || mabResults.lineCheck.nextDue;
    lcDays = getDaysUntil(lcExpDate);

    const lcExpEl = getDashEl("ov-linecheck-expiry");
    const lcRouteEl = getDashEl("ov-linecheck-route");
    const lcBadgeEl = getDashEl("ov-linecheck-badge");
    const lcBarEl = getDashEl("ov-linecheck-bar");

    if (lcExpEl) lcExpEl.innerText = (lcExpDate || "N/A").toUpperCase();
    if (lcRouteEl) lcRouteEl.innerText = lcDays !== null ? (lcDays < 0 ? "Lapsed" : `${lcDays} Days Remaining`) : "N/A";
    applyStatusTheme(lcDays, lcBadgeEl, null, null, null, "Valid", lcBarEl);

    if (lcDays !== null) {
      allCandidates.push({ name: `MAB Line Check`, days: lcDays, tab: "mab" });
    }
  }

  // E1. LVO 180-Day Recency Tile Handler
  const lvoMarkerEl = getDashEl("ov-lvo-marker");
  const lvoCheckDateEl = getDashEl("ov-lvo-checkdate");
  const lvoDaysTextEl = getDashEl("ov-lvo-days-text");

  let lvoCheckDateStr = null;
  let lvoDaysRemaining = null;

  if (mabResults) {
    if (mabResults.lvo && (mabResults.lvo.checkDate || mabResults.lvo.date)) {
      lvoCheckDateStr = mabResults.lvo.checkDate || mabResults.lvo.date;
    } else if (Array.isArray(mabResults.drills)) {
      const lvoMatch = mabResults.drills.find(d => {
        const name = (d.name || d.item || "").toUpperCase();
        return name.includes("LVO") || name.includes("AUTOLAND") || name.includes("CAT III");
      });
      if (lvoMatch) {
        lvoCheckDateStr = lvoMatch.checkDate || lvoMatch.date || lvoMatch.issueDate || lvoMatch.nextDue;
      }
    }
  }

  if (lvoCheckDateStr) {
    const daysSinceCheck = getDaysUntil(lvoCheckDateStr);
    const daysElapsed = (daysSinceCheck !== null && daysSinceCheck <= 0) ? Math.abs(daysSinceCheck) : 0;
    lvoDaysRemaining = Math.max(0, 180 - daysElapsed);

    if (lvoCheckDateEl) lvoCheckDateEl.innerText = formatPassportDisplayDate(lvoCheckDateStr) || lvoCheckDateStr.toUpperCase();
    if (lvoDaysTextEl) {
      if (lvoDaysRemaining <= 0) {
        lvoDaysTextEl.innerText = "Recency Expired (Lapsed)";
        lvoDaysTextEl.className = "text-[9px] font-bold text-rose-400 truncate";
      } else {
        lvoDaysTextEl.innerText = `${lvoDaysRemaining} Days Remaining`;
        lvoDaysTextEl.className = "dyn-txt text-[9px] font-bold text-slate-400 truncate";
      }
    }

    markerPct = Math.min(100, Math.max(0, Math.round((daysElapsed / 180) * 100)));
    if (lvoMarkerEl) lvoMarkerEl.style.left = `${markerPct}%`;
    allCandidates.push({ name: "LVO Recency", days: lvoDaysRemaining, tab: "mab" });
  } else {
    if (lvoCheckDateEl) lvoCheckDateEl.innerText = "N/A";
    if (lvoDaysTextEl) lvoDaysTextEl.innerText = "N/A";
    if (lvoMarkerEl) lvoMarkerEl.style.left = "0%";
  }

  // E2. Vertical Sparkline Histogram Drills Array
  const drillItems = [
    { key: "actype", name: ["AIRCRAFT TYPE", "B737", "A330", "A350", "TYPE RATING", "FLEET"], label: "B737", defaultBg: "bg-teal-500" },
    { key: "door", name: ["DOOR"], label: "Door Drill", defaultBg: "bg-cyan-500" },
    { key: "wet", name: ["WET", "DINGHY"], label: "Wet Drill", defaultBg: "bg-blue-500" },
    { key: "fire", name: ["FIRE", "SMOKE"], label: "Fire Drill", defaultBg: "bg-violet-500" },
    { key: "crm", name: ["CRM"], label: "CRM", defaultBg: "bg-purple-500" },
    { key: "sms", name: ["SMS"], label: "SMS", defaultBg: "bg-fuchsia-500" },
    { key: "dg", name: ["DG", "DANGEROUS"], label: "DG-7", defaultBg: "bg-pink-500" },
    { key: "avsec", name: ["AVSEC"], label: "AVSEC", defaultBg: "bg-indigo-500" },
    { key: "supervisory", name: ["DFE", "FI", "EXAMINER", "INSTRUCTOR"], label: "DFE / FI", defaultBg: "bg-blue-500" }
  ];

  let minDrillDays = null;
  let avgDrillDays = null;
  const collectedDrillDays = [];
  const drillThreshold = (typeof getThresholdDays === 'function') ? getThresholdDays() : 30;

  drillItems.forEach(item => {
    const colEl = getDashEl("vbar-col-" + item.key);
    const vBarEl = getDashEl("vbar-drill-" + item.key);
    const dotEl = getDashEl("dot-legend-" + item.key);
    const legendEl = getDashEl("legend-drill-" + item.key);

    let matched = null;
    if (mabResults && Array.isArray(mabResults.drills)) {
      matched = mabResults.drills.find(d => {
        const dName = (d.name || d.item || "").toUpperCase();
        const expStr = d.nextDue || d.expiryDate || "";
        const hasValidDate = expStr && !['NIL', 'N/A', 'NA', '-'].includes(expStr.trim().toUpperCase()) && getDaysUntil(expStr) !== null;

        if (item.key === "actype") {
          return item.name.some(keyword => dName.includes(keyword)) && hasValidDate;
        }
        if (item.key === "supervisory") {
          return /\b(DFE|FI|FLIGHT\s+INSTRUCTOR|EXAMINER|CHECK\s+PILOT|TRI|TRE)\b/i.test(dName);
        }
        return item.name.some(keyword => dName.includes(keyword));
      });
    }

    if (!matched && item.key === "actype" && mabResults && mabResults.lineCheck && mabResults.lineCheck.fleet) {
      matched = { name: mabResults.lineCheck.fleet, expiryDate: mabResults.lineCheck.expiryDate };
    }

    if (!matched && item.key === "supervisory" && caamResults && Array.isArray(caamResults.qualifications)) {
      const supCaam = caamResults.qualifications.find(q => q.name && isSupervisoryQual(q.name));
      if (supCaam) {
        matched = { name: supCaam.name, expiryDate: supCaam.dateText };
      }
    }

    if (item.key === "actype") {
      let fleetText = "B737";
      if (matched) {
        const dName = (matched.name || matched.item || "").toUpperCase();
        if (dName.includes("A330")) fleetText = "A330";
        else if (dName.includes("A350")) fleetText = "A350";
        else if (dName.includes("B737") || dName.includes("B738") || dName.includes("B7M8")) fleetText = "B737";
        else if (mabResults && mabResults.lineCheck && mabResults.lineCheck.fleet) fleetText = mabResults.lineCheck.fleet;
      } else if (mabResults && mabResults.lineCheck && mabResults.lineCheck.fleet) {
        fleetText = mabResults.lineCheck.fleet;
      }
      const actypeTxtEl = getDashEl("txt-legend-actype");
      if (actypeTxtEl) actypeTxtEl.innerText = fleetText;
    }

    if (item.key === "supervisory" && !matched) {
      if (colEl) colEl.style.display = "none";
      if (legendEl) legendEl.style.display = "none";
    } else {
      if (colEl) colEl.style.display = "flex";
      if (legendEl) legendEl.style.display = "flex";

      let dDays = matched ? getDaysUntil(matched.nextDue || matched.expiryDate) : null;
      if (dDays !== null) {
        collectedDrillDays.push(dDays);
        allCandidates.push({ name: item.label, days: dDays, tab: "mab" });

        const pct = Math.min(100, Math.max(4, Math.round((dDays / 365.25) * 100)));
        if (vBarEl) {
          vBarEl.style.height = pct + "%";
          if (dDays < 0) {
            vBarEl.className = "w-full max-w-[14px] bg-rose-500 rounded-t-sm transition-all duration-500";
          } else if (dDays <= drillThreshold) {
            vBarEl.className = "w-full max-w-[14px] bg-amber-400 animate-pulse rounded-t-sm transition-all duration-500";
          } else {
            vBarEl.className = "w-full max-w-[14px] " + item.defaultBg + " rounded-t-sm transition-all duration-500";
          }
        }

        if (dotEl) {
          if (dDays < 0) {
            dotEl.className = "w-2 h-2 rounded-full bg-rose-500 shrink-0";
          } else if (dDays <= drillThreshold) {
            dotEl.className = "w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse";
          } else {
            dotEl.className = "w-2 h-2 rounded-full " + item.defaultBg + " shrink-0";
          }
        }
      } else {
        if (vBarEl) {
          vBarEl.style.height = "100%";
          vBarEl.className = "w-full max-w-[14px] " + item.defaultBg + " rounded-t-sm transition-all duration-500";
        }
        if (dotEl) {
          dotEl.className = "w-2 h-2 rounded-full " + item.defaultBg + " shrink-0";
        }
      }
    }
  });

  if (collectedDrillDays.length > 0) {
    minDrillDays = Math.min(...collectedDrillDays);
    avgDrillDays = collectedDrillDays.reduce((a, b) => a + b, 0) / collectedDrillDays.length;
  }

  function formatPassportDisplayDate(dateStr) {
    if (!dateStr) return "NOT CONFIGURED";
    const str = String(dateStr).trim();
    const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const monthIdx = parseInt(ymdMatch[2], 10) - 1;
      const day = ymdMatch[3];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }

    let d = (dateStr instanceof Date) ? dateStr : parseAnyDate(dateStr);
    if (!d || isNaN(d.getTime())) {
      const ts = Date.parse(str);
      if (!isNaN(ts)) d = new Date(ts);
    }

    if (d && !isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    return str.toUpperCase();
  }

  // F. Passport & ELP Footer Bento
  const passExpEl = getDashEl("ov-passport-expiry");
  const passNoEl = getDashEl("ov-passport-no");
  const passDaysEl = getDashEl("ov-passport-days");
  const passBarEl = getDashEl("ov-passport-bar");
  const passCardEl = getDashEl("ov-passport-card") || (passExpEl ? (passExpEl.closest('.bento-card') || passExpEl.parentElement) : null);
  if (passCardEl) {
    passCardEl.style.cursor = "pointer";
    passCardEl.onclick = () => {
      if (typeof openProfileMenu === "function") openProfileMenu('passport');
    };
  }

  const passportNo = (profile && profile.passportNo) ? profile.passportNo.trim() : "";
  const rawPassExp = (profile && profile.passportExpiry) ? profile.passportExpiry.trim() : "";
  let passDays = null;

  if (passportNo || rawPassExp) {
    const formattedDate = formatPassportDisplayDate(rawPassExp);
    passDays = rawPassExp ? getDaysUntil(rawPassExp) : null;

    if (passExpEl) passExpEl.innerText = formattedDate;
    if (passNoEl) passNoEl.innerText = passportNo ? `No: ${passportNo}` : "No: Not Configured";

    if (passDaysEl) {
      if (passDays !== null && passDays !== undefined) {
        if (passDays < 0) {
          passDaysEl.innerText = "Expired";
        } else {
          passDaysEl.innerText = `${passDays} Days Remaining`;
        }
      } else {
        passDaysEl.innerText = "Expiry Not Configured";
      }
    }

    if (passBarEl) {
      if (passDays === null || passDays === undefined) {
        passBarEl.style.width = "0%";
        passBarEl.className = "h-full bg-slate-400 rounded-full transition-all duration-500 relative z-10";
      } else if (passDays <= 180) {
        const pct = passDays < 0 ? 5 : Math.min(100, Math.max(5, Math.round((passDays / 365.25) * 100)));
        passBarEl.style.width = `${pct}%`;
        passBarEl.className = "h-full bg-rose-500 rounded-full transition-all duration-500 relative z-10";
      } else if (passDays <= 240) {
        const pct = Math.min(100, Math.max(5, Math.round((passDays / 365.25) * 100)));
        passBarEl.style.width = `${pct}%`;
        passBarEl.className = "h-full bg-amber-400 animate-pulse rounded-full transition-all duration-500 relative z-10";
      } else {
        const pct = Math.min(100, Math.max(5, Math.round((passDays / 365.25) * 100)));
        passBarEl.style.width = `${pct}%`;
        passBarEl.className = "h-full bg-indigo-500 rounded-full transition-all duration-500 relative z-10";
      }
    }
  } else {
    if (passExpEl) passExpEl.innerText = "NOT CONFIGURED";
    if (passNoEl) passNoEl.innerText = "Tap to configure";
    if (passDaysEl) passDaysEl.innerText = "";
    if (passBarEl) {
      passBarEl.style.width = "0%";
      passBarEl.className = "h-full bg-slate-300 dark:bg-slate-700 rounded-full transition-all duration-500 relative z-10";
    }
  }

  if (passDays !== null && passDays !== undefined) {
    allCandidates.push({ name: "Passport Clearance", days: passDays, tab: "mab" });
  }

  // F2. English Language Proficiency (ELP) Validity
  const elpBarEl = getDashEl("ov-elp-bar");
  const elpScaleEl = getDashEl("ov-elp-scale");
  const elpExpEl = getDashEl("ov-elp-expiry");
  const elpLevelEl = getDashEl("ov-elp-level");
  const elpYearsEl = getDashEl("ov-elp-years");

  let elpQual = null;
  if (caamResults) {
    if (caamResults.elp) {
      elpQual = caamResults.elp;
    } else if (Array.isArray(caamResults.qualifications)) {
      elpQual = caamResults.qualifications.find(q => {
        const n = (q.name || "").toUpperCase();
        return n.includes("ENGLISH") || n.includes("ELP") || n.includes("LANGUAGE PROFICIENCY") || n.includes("LANGUAGE");
      });
    }
  }

  if (elpQual) {
    const qName = (elpQual.name || "").toUpperCase();
    let level = 5;
    if (qName.includes("LEVEL 6") || qName.includes("LVL 6") || qName.includes("LEVEL-6") || qName.includes("L6")) {
      level = 6;
    } else if (qName.includes("LEVEL 4") || qName.includes("LVL 4") || qName.includes("LEVEL-4") || qName.includes("L4")) {
      level = 4;
    } else if (qName.includes("LEVEL 5") || qName.includes("LVL 5") || qName.includes("LEVEL-5") || qName.includes("L5")) {
      level = 5;
    }

    const rawExpStr = elpQual.dateText || elpQual.expiryDate || "";
    const isLevel6 = level === 6 || rawExpStr.toUpperCase().includes("PERMANENT") || rawExpStr.toUpperCase().includes("NO EXPIRY") || rawExpStr.toUpperCase().includes("NIL") || !rawExpStr;

    if (isLevel6 || level === 6) {
      if (elpExpEl) elpExpEl.innerText = "NO EXPIRY";
      if (elpLevelEl) elpLevelEl.innerText = "Level 6";
      if (elpYearsEl) {
        elpYearsEl.innerText = "";
        elpYearsEl.style.display = "none";
      }
      if (elpBarEl) {
        elpBarEl.style.width = "0%";
        elpBarEl.className = "h-full bg-slate-300 dark:bg-slate-700 rounded-full transition-all duration-500 relative z-10";
      }
      if (elpScaleEl) {
        elpScaleEl.innerHTML = `<span>0Y</span><span class="absolute left-1/2 -translate-x-1/2">3Y</span><span>6Y</span>`;
      }
    } else {
      const elpDays = getDaysUntil(rawExpStr);
      const formattedElpDate = formatPassportDisplayDate(rawExpStr);

      if (elpExpEl) elpExpEl.innerText = formattedElpDate;
      if (elpLevelEl) elpLevelEl.innerText = `Level ${level}`;

      if (elpDays !== null && elpDays !== undefined) {
        allCandidates.push({ name: `ELP Level ${level}`, days: elpDays, tab: "caam" });

        const yearsExact = (elpDays / 365.25);
        const yearsRounded = Math.max(0, Math.round(yearsExact * 10) / 10);

        if (elpYearsEl) {
          elpYearsEl.style.display = "block";
          if (elpDays < 0) {
            elpYearsEl.innerText = "Expired";
            elpYearsEl.className = "text-[9px] font-bold text-rose-500 mt-0.5";
          } else {
            const yearsStr = yearsRounded === 1 ? "1 Year" : `${yearsRounded} Years`;
            elpYearsEl.innerText = `${yearsStr} Remaining`;
            elpYearsEl.className = "text-[9px] font-bold text-slate-400 mt-0.5";
          }
        }

        const maxYears = level === 4 ? 3 : 6;
        const maxDays = maxYears * 365.25;
        const pct = elpDays < 0 ? 5 : Math.min(100, Math.max(5, Math.round((elpDays / maxDays) * 100)));

        if (elpBarEl) {
          elpBarEl.style.width = `${pct}%`;
          if (elpDays <= 365.25) {
            elpBarEl.className = "h-full bg-rose-500 rounded-full transition-all duration-500 relative z-10";
          } else if (elpDays <= 730.5) {
            elpBarEl.className = "h-full bg-amber-400 animate-pulse rounded-full transition-all duration-500 relative z-10";
          } else {
            elpBarEl.className = "h-full bg-purple-500 rounded-full transition-all duration-500 relative z-10";
          }
        }

        if (elpScaleEl) {
          if (level === 4) {
            elpScaleEl.innerHTML = `<span>0Y</span><span class="absolute left-[33.3%] -translate-x-1/2">1Y</span><span class="absolute left-[66.7%] -translate-x-1/2">2Y</span><span>3Y</span>`;
          } else {
            elpScaleEl.innerHTML = `<span>0Y</span><span>1Y</span><span>2Y</span><span>3Y</span><span>4Y</span><span>5Y</span><span>6Y</span>`;
          }
        }
      } else {
        if (elpYearsEl) elpYearsEl.innerText = "--";
        if (elpBarEl) elpBarEl.style.width = "0%";
      }
    }
  } else {
    if (elpExpEl) elpExpEl.innerText = "NOT FOUND";
    if (elpLevelEl) elpLevelEl.innerText = "Level --";
    if (elpYearsEl) elpYearsEl.innerText = "Tap to view CAAM Licence";
    if (elpBarEl) {
      elpBarEl.style.width = "0%";
      elpBarEl.className = "h-full bg-slate-300 dark:bg-slate-700 rounded-full transition-all duration-500 relative z-10";
    }
    if (elpScaleEl) {
      elpScaleEl.innerHTML = `<span>0Y</span><span class="absolute left-1/2 -translate-x-1/2">3Y</span><span>6Y</span>`;
    }
  }

  // G. Legality Rings Arc Computation
  allCandidates.sort((a, b) => a.days - b.days);

  const ringPercentEl = getDashEl("ov-ring-percent");
  const ringLabelEl = getDashEl("ov-ring-label");
  const bottleneckTextEl = getDashEl("ov-bottleneck-text");
  const bottleneckLedEl = getDashEl("ov-bottleneck-led");

  const ringCaam = getDashEl("ring-caam");
  const ringMab = getDashEl("ring-mab");
  const userThreshold = (typeof getThresholdDays === 'function') ? getThresholdDays() : 30;

  const caamItems = [caamDays, medDays, typeDays].filter(d => d !== null && d !== undefined);
  const caamMinDays = caamItems.length > 0 ? Math.min(...caamItems) : 365;

  const caamPct = Math.min(100, Math.max(0, caamMinDays));
  const caamOffset = Math.round(188.50 * (1 - caamPct / 100));

  const isCaamLapsed = caamMinDays <= 0;
  const isCaamWarning = caamMinDays <= userThreshold && caamMinDays > 0;
  const caamColor = isCaamLapsed ? "#EF4444" : (isCaamWarning ? "#F59E0B" : "#3B82F6");

  const ringCaamBack = getDashEl("ring-caam-back");
  const ringMabBack = getDashEl("ring-mab-back");
  const ringPercentElBack = getDashEl("ov-ring-percent-back");

  if (ringCaam) {
    ringCaam.setAttribute("stroke", caamColor);
    ringCaam.setAttribute("stroke-dashoffset", String(caamOffset));
    const dotCaam = getDashEl("legend-dot-caam");
    if (dotCaam) dotCaam.style.backgroundColor = caamColor;
  }

  if (ringCaamBack) {
    ringCaamBack.setAttribute("stroke", caamColor);
    ringCaamBack.setAttribute("stroke-dashoffset", String(caamOffset));
  }

  const mabItems = [lcDays, minDrillDays].filter(d => d !== null && d !== undefined);
  const mabMinDays = mabItems.length > 0 ? Math.min(...mabItems) : 365;

  const mabPct = Math.min(100, Math.max(0, mabMinDays));
  const mabOffset = Math.round(263.89 * (1 - mabPct / 100));

  const isMabLapsed = mabMinDays <= 0;
  const isMabWarning = mabMinDays <= userThreshold && mabMinDays > 0;
  const mabColor = isMabLapsed ? "#EF4444" : (isMabWarning ? "#F59E0B" : "#1D4ED8");

  if (ringMab) {
    ringMab.setAttribute("stroke", mabColor);
    ringMab.setAttribute("stroke-dashoffset", String(mabOffset));
    const dotMab = getDashEl("legend-dot-mab");
    if (dotMab) dotMab.style.backgroundColor = mabColor;
  }

  if (ringMabBack) {
    ringMabBack.setAttribute("stroke", mabColor);
    ringMabBack.setAttribute("stroke-dashoffset", String(mabOffset));
  }

  const leastDays = Math.min(caamMinDays, mabMinDays);
  const leastDaysText = leastDays > 100 ? "100+" : (leastDays <= 0 ? "0" : String(leastDays));

  if (ringPercentEl) ringPercentEl.innerText = leastDaysText;
  if (ringPercentElBack) ringPercentElBack.innerText = leastDaysText;

  if (leastDays <= 0 || isCaamLapsed || isMabLapsed) {
    if (ringLabelEl) {
      ringLabelEl.innerText = "RESTRICTED";
      ringLabelEl.className = "px-2 py-0.5 rounded text-[11px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300";
    }
  } else if (leastDays <= userThreshold) {
    if (ringLabelEl) {
      ringLabelEl.innerText = "ATTENTION";
      ringLabelEl.className = "px-2 py-0.5 rounded text-[11px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300";
    }
  } else {
    if (ringLabelEl) {
      ringLabelEl.innerText = "OPERATIONAL";
      ringLabelEl.className = "px-2 py-0.5 rounded text-[11px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300";
    }
  }

  if (allCandidates.length > 0 && allCandidates[0].days <= userThreshold) {
    const b = allCandidates[0];
    if (bottleneckTextEl) bottleneckTextEl.innerText = `Next Expiry: ${b.name} (${b.days < 0 ? 'Lapsed' : b.days + 'd'})`;
    if (bottleneckLedEl) {
      bottleneckLedEl.className = b.days < 0
        ? "w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] shrink-0 mt-0.5"
        : "w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] shrink-0 animate-pulse mt-0.5";
    }
  } else {
    if (bottleneckTextEl) bottleneckTextEl.innerText = "All Credentials Active";

    try {
      if (typeof initHeroCardFlip === 'function') {
        initHeroCardFlip();
      } else if (window.CertiFlyAnimations && window.CertiFlyAnimations.initHeroCardFlip) {
        window.CertiFlyAnimations.initHeroCardFlip();
      }
    } catch (flipErr) {
      console.warn("Hero flip init skipped/error:", flipErr);
    }

    try {
      if (typeof animateOverviewDashboard === 'function') {
        animateOverviewDashboard({
          caamOffset,
          mabOffset,
          caamColor,
          mabColor,
          targetDays: leastDays,
          lvoPct: markerPct
        });
      }
    } catch (animErr) {
      console.warn("Anime.js animation trigger skipped/error:", animErr);
    }

    if (bottleneckLedEl) bottleneckLedEl.className = "w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0 mt-0.5";
  }

  // CAAM TAB
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
        const activeQuals = sortedCaamQuals.filter(q => !q.isLegacy && q.status !== "INACTIVE_LEGACY");
        const legacyQuals = sortedCaamQuals.filter(q => q.isLegacy || q.status === "INACTIVE_LEGACY");

        activeQuals.forEach(q => {
          const row = document.createElement("div");
          row.className = "py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";

          let badgeHtml = "";
          const isSupervisory = Boolean(q.isSupervisory) || isSupervisoryQual(q.name);

          if (isSupervisory) {
            if (q.status === "EXPIRED" || q.status === "ROLE_EXPIRED") {
              const label = isDfeQual(q.name) ? "Examiner Lapsed" : (isFiQual(q.name) ? "Instructor Lapsed" : "Role Lapsed");
            badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">${label}</span>`;
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

        if (legacyQuals.length > 0) {
          const legacyHeader = document.createElement("div");
          legacyHeader.className = "mt-4 pt-1 flex items-center justify-between";
          legacyHeader.innerHTML = `
<span class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Previous / Legacy Endorsements</span>
`;
          caamListContainer.appendChild(legacyHeader);

          legacyQuals.forEach(q => {
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
  } else {
    if (caamPane) {
      caamPane.innerHTML = `
<div class="p-6 text-center space-y-4 my-4">
  <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4"></path></svg>
  </div>
  <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">No CAAM Digital Licence</h3>
  <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
    Please set up your official CAAM eCLIPSE digital licence URL in My Credentials to view licence validities.
  </p>
  <button onclick="openProfileMenu('licence')" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
    Configure Licence Source
  </button>
</div>
`;
    }
  }

  // MAB TAB
  if (mabResults) {
    if (mabPane && initialMabTemplateHTML && !mabPane.querySelector("#mab-pilot-name")) {
      mabPane.innerHTML = initialMabTemplateHTML;
    }

    const voidBox = getDashEl("mab-void-warning-box");
    if (voidBox) voidBox.classList.add("hidden");

    if (mabResults.isVoid) {
      const freshnessLimit = typeof getFreshnessLimit === 'function' ? getFreshnessLimit() : 30;
      const voidMsg = mabResults.voidReason || `Attestation PDF is older than ${freshnessLimit} days or a qualification has lapsed.`;

      renderNoticeCard("tab-mab-content", {
        id: "mab-void-notice",
        title: "MAB ATTESTATION VOID / STALE",
        message: `${voidMsg}<br/><button onclick="if(typeof openProfileMenu==='function'){openProfileMenu('docs');}else{openMenu();setTimeout(()=>{const nav=document.querySelector('[data-target=pane-profile]');if(nav)nav.click();},150);}" type="button" class="mt-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] uppercase py-2 px-3.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"><svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg><span>Upload New Attestation PDF</span></button>`,
        type: "danger",
        dismissible: false
      });

      if (!sessionStorage.getItem("mab_void_modal_prompted")) {
        sessionStorage.setItem("mab_void_modal_prompted", "true");
        setTimeout(async () => {
          const confirmed = await showConfirmDialog({
            title: "MAB Attestation VOID / Stale",
            message: `Your MAB attestation PDF has expired (>${freshnessLimit} days) or has lapsed qualifications. Would you like to upload a new monthly PDF in Credentials now?`,
            confirmText: "Upload New PDF",
            cancelText: "Dismiss",
            type: "danger"
          });
          if (confirmed) {
            if (typeof openProfileMenu === "function") {
              openProfileMenu('docs');
            } else if (typeof openMenu === "function") {
              openMenu();
              setTimeout(() => {
                const nav = document.querySelector('[data-target="pane-profile"]');
                if (nav) nav.click();
              }, 150);
            }
          }
        }, 200);
      }
    } else {
      const existingNotice = document.getElementById("mab-void-notice");
      if (existingNotice) existingNotice.remove();
    }

    const mabPilot = getDashEl("mab-pilot-name");
    const mabStaff = getDashEl("mab-staff-no");
    const mabDesig = getDashEl("mab-designation");
    const mabPub = getDashEl("mab-published-date");
    const mabFresh = getDashEl("mab-freshness-tag");
    const mabDocRef = getDashEl("mab-doc-ref");

    if (mabPilot) mabPilot.innerText = mabResults.pilotName;
    if (mabStaff) mabStaff.innerText = mabResults.staffNo;

    if (mabDesig) {
      const rawDesig = mabResults.designation || "";
      const cleanDesig = rawDesig.replace(/\.OPS.*$/i, "").trim();
      mabDesig.innerText = cleanDesig || "-";
    }

    if (mabPub) mabPub.innerText = mabResults.publishedDateStr;
    if (mabDocRef) mabDocRef.innerHTML = "";

    if (mabFresh) {
      const freshnessLimit = typeof getFreshnessLimit === 'function' ? getFreshnessLimit() : 30;
      let ageInDays = null;

      if (mabResults && mabResults.publishedDateStr) {
        const pubDate = parseAnyDate(mabResults.publishedDateStr);
        if (pubDate && !isNaN(pubDate.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          pubDate.setHours(0, 0, 0, 0);
          ageInDays = Math.floor((today.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      if (ageInDays === null && mabResults && typeof mabResults.ageInDays === 'number') {
        ageInDays = mabResults.ageInDays;
      }

      if (typeof ageInDays === 'number' && !isNaN(ageInDays)) {
        const daysLeft = freshnessLimit - ageInDays;
        if (daysLeft < 0) {
          const overdue = Math.abs(daysLeft);
          mabFresh.innerText = `Lapsed (${overdue}d overdue)`;
          mabFresh.className = "text-rose-600 dark:text-rose-400 font-extrabold";
          if (mabResults) mabResults.isStale = true;
        } else if (daysLeft <= 5) {
          mabFresh.innerText = `${daysLeft}d Remaining`;
          mabFresh.className = "text-amber-600 dark:text-amber-400 font-extrabold";
        } else {
          mabFresh.innerText = `${daysLeft}d Remaining`;
          mabFresh.className = "text-emerald-600 dark:text-emerald-400 font-extrabold";
        }
      } else {
        mabFresh.innerText = "Unknown Freshness";
        mabFresh.className = "text-slate-500 font-extrabold";
      }
    }

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

    const drillsContainer = getDashEl("mab-drills-list");
    if (drillsContainer && mabResults.drills) {
      drillsContainer.innerHTML = "";
      mabResults.drills.forEach(d => {
        const row = document.createElement("div");
        row.className = "py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0";

        let badgeHtml = "";
        if (d.status === "EXPIRED") {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">Lapsed</span>`;
        } else if (d.status === "EXPIRING_SOON") {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">${d.daysLeft} days left</span>`;
        } else if (d.status === "COMPLETED") {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">Completed</span>`;
        } else {
          badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">Valid</span>`;
        }

        row.innerHTML = `
<div>
  <div class="text-xs font-bold text-slate-800 dark:text-slate-200">${d.name}</div>
  <div class="dyn-txt text-[10px] text-slate-400 uppercase pt-0.5 font-semibold">${d.doneDate} → ${d.expiryDate}</div>
</div>
${badgeHtml}
`;
        drillsContainer.appendChild(row);
      });
    }
  } else {
    if (mabPane) {
      mabPane.innerHTML = `
<div class="p-6 text-center space-y-4 my-4">
  <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
  </div>
  <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">No MAB Attestation PDF</h3>
  <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
    Please upload your MAB E-Attestation PDF document in My Credentials to view company qualifications.
  </p>
  <button onclick="openProfileMenu('docs')" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
    Upload Attestation PDF
  </button>
</div>
`;
    }
  }

  await setupDocumentViewers();
  showView("dashboard-view");
  if (typeof window.mountFestiveOverlay === "function") {
    window.mountFestiveOverlay();
  }
}

export async function setupDocumentViewers() {
  const openCaamLicenceBtn = getDashEl("open-original-btn");
  if (openCaamLicenceBtn) {
    openCaamLicenceBtn.onclick = openOriginalLicense;
  }

  const attestationBtn = getDashEl("mab-view-attestation-btn");
  const qsBtn = getDashEl("mab-view-qs-btn");
  const qsBadgeText = getDashEl("mab-qs-status-text");
  const qsBadgePill = getDashEl("mab-qs-cert-no");

  const selQsParsed = (typeof getSelectedQsParsed === "function") ? getSelectedQsParsed() : null;
  const qsData = getQualificationSlipData() || selQsParsed;

  const qsBadgeBox = getDashEl("mab-qs-badge");
  if (qsBadgeText && qsBadgePill) {
    if (qsData) {
      qsBadgeText.innerText = "Qualification Slip: Stored & Valid";
      qsBadgePill.innerText = "Verified";
      qsBadgePill.className = "text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md uppercase";
      if (qsBadgeBox) {
        qsBadgeBox.classList.remove("cursor-pointer", "hover:bg-slate-200", "dark:hover:bg-slate-700", "hover:text-slate-800", "dark:hover:text-slate-200", "hover:border", "hover:border-blue-500", "active:scale-[0.99]");
        qsBadgeBox.title = "";
        qsBadgeBox.onclick = null;
      }
    } else {
      qsBadgeText.innerText = "Qualification Slip: Not Configured";
      qsBadgePill.innerText = "Not Set";
      qsBadgePill.className = "text-[10px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase";
      if (qsBadgeBox) {
        qsBadgeBox.classList.remove("hover:border", "hover:border-blue-500");
        qsBadgeBox.classList.add("cursor-pointer", "hover:bg-slate-200", "dark:hover:bg-slate-700", "hover:text-slate-800", "dark:hover:text-slate-200", "transition-all", "active:scale-[0.99]");
        qsBadgeBox.title = "Click to configure Qualification Slip in My Credentials";
        qsBadgeBox.onclick = () => {
          if (typeof openProfileMenu === "function") openProfileMenu('docs');
        };
      }
    }
  }

  if (attestationBtn) {
    const attBlob = await getAttestationPdf();
    const selAttFile = (typeof getSelectedAttestationFile === "function") ? getSelectedAttestationFile() : null;
    if (attBlob || selAttFile) {
      attestationBtn.disabled = false;
      attestationBtn.className = "w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]";
      attestationBtn.onclick = async () => {
        let blob = attBlob;
        if (!blob && selAttFile) blob = selAttFile;
        if (!blob && typeof getAttestationPdf === 'function') {
          try { blob = await getAttestationPdf(); } catch (e) {}
        }
        if (blob) {
          if (typeof openPdfViewerModal === 'function') {
            openPdfViewerModal(blob, 'e-Attestation');
          } else if (typeof window.openPdfViewerModal === 'function') {
            window.openPdfViewerModal(blob, 'e-Attestation');
          } else {
            const blobUrl = (blob instanceof Blob) ? URL.createObjectURL(blob) : (typeof blob === 'string' ? blob : null);
            if (blobUrl) window.open(blobUrl, "_blank");
          }
        } else {
          await showAlertModal("File Not Found", "Attestation PDF file not found in local storage.", "error");
        }
      };
    } else {
      attestationBtn.disabled = true;
      attestationBtn.className = "w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200 dark:border-slate-700/60";
      attestationBtn.onclick = null;
    }
  }

  if (qsBtn) {
    const qsBlob = await getQualificationSlipPdf();
    const selQsFile = (typeof getSelectedQsFile === "function") ? getSelectedQsFile() : null;
    if (qsBlob || selQsFile) {
      qsBtn.disabled = false;
      qsBtn.className = "w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]";
      qsBtn.onclick = async () => {
        let blob = qsBlob;
        if (!blob && selQsFile) blob = selQsFile;
        if (!blob && typeof getQualificationSlipPdf === 'function') {
          try { blob = await getQualificationSlipPdf(); } catch (e) {}
        }
        if (blob) {
          if (typeof openPdfViewerModal === 'function') {
            openPdfViewerModal(blob, 'Qualification Slip (QS)');
          } else if (typeof window.openPdfViewerModal === 'function') {
            window.openPdfViewerModal(blob, 'Qualification Slip (QS)');
          } else {
            const blobUrl = (blob instanceof Blob) ? URL.createObjectURL(blob) : (typeof blob === 'string' ? blob : null);
            if (blobUrl) window.open(blobUrl, "_blank");
          }
        } else {
          await showAlertModal("File Not Found", "Qualification Slip PDF file not found in local storage.", "error");
        }
      };
    } else {
      qsBtn.disabled = true;
      qsBtn.className = "w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200 dark:border-slate-700/60";
      qsBtn.onclick = null;
    }
  }
}


if (typeof window !== 'undefined') {
  window.renderDashboardView = renderDashboardView;
  window.renderDashboardResults = renderDashboardResults;
  window.startWelcomeTextAnimation = startWelcomeTextAnimation;
  window.saveDashboardTemplates = saveDashboardTemplates;
  window.sortCaamQualifications = sortCaamQualifications;
  window.setupDocumentViewers = setupDocumentViewers;
}
