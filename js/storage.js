// js/storage.js (0210_R098) - LocalStorage Persistence, Crew Pinning & Compact History Filter Engine

let scanHistory = [];
try {
  const raw = localStorage.getItem("scan_history");
  scanHistory = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(scanHistory)) scanHistory = [];
} catch (e) {
  scanHistory = [];
}

export const PROFILE_KEY = "certifly_profile_data";
export const THRESHOLD_KEY = "certifly_threshold_days";
export const HISTORY_LIMIT_KEY = "certifly_history_limit";
export const FRESHNESS_LIMIT_KEY = "certifly_freshness_limit";

let currentHistoryFilter = "ALL";
let historyFilterInitialized = false;

export function getFreshnessLimit() {
  try {
    const val = localStorage.getItem(FRESHNESS_LIMIT_KEY);
    return val ? parseInt(val, 10) : 30;
  } catch (e) {
    return 30;
  }
}

export function setFreshnessLimit(days) {
  try {
    localStorage.setItem(FRESHNESS_LIMIT_KEY, days.toString());
  } catch (e) {
    console.error("Failed to save freshness limit:", e);
  }
}

export function getThresholdDays() {
  try {
    const val = localStorage.getItem(THRESHOLD_KEY);
    return val ? parseInt(val, 10) : 30;
  } catch (e) {
    return 30;
  }
}

export function setThresholdDays(days) {
  try {
    localStorage.setItem(THRESHOLD_KEY, days.toString());
  } catch (e) {
    console.error("Failed to save threshold days:", e);
  }
}

export function getHistoryLimit() {
  try {
    const val = localStorage.getItem(HISTORY_LIMIT_KEY);
    return val ? parseInt(val, 10) : 10;
  } catch (e) {
    return 10;
  }
}

export function setHistoryLimit(limit) {
  try {
    localStorage.setItem(HISTORY_LIMIT_KEY, limit.toString());
    enforceHistoryLimit();
    renderHistoryList();
  } catch (e) {
    console.error("Failed to save history limit:", e);
  }
}

export function getScanHistory() {
  return scanHistory;
}

function enforceHistoryLimit() {
  const limit = getHistoryLimit();
  if (scanHistory.length <= limit) return;

  const pinned = scanHistory.filter(item => item && item.isPinned);
  const unpinned = scanHistory.filter(item => item && !item.isPinned);

  const allowedUnpinnedCount = Math.max(0, limit - pinned.length);
  const trimmedUnpinned = unpinned.slice(0, allowedUnpinnedCount);

  scanHistory = [...pinned, ...trimmedUnpinned];
  try {
    localStorage.setItem("scan_history", JSON.stringify(scanHistory));
  } catch (e) {
    console.error("Failed to persist trimmed history:", e);
  }
}

export function togglePinRecord(recordId) {
  if (!recordId) return false;
  const targetStr = String(recordId);
  const item = scanHistory.find(rec => rec && String(rec.id) === targetStr);
  if (item) {
    item.isPinned = !item.isPinned;
    item.pinned = item.isPinned;
    try {
      localStorage.setItem("scan_history", JSON.stringify(scanHistory));
    } catch (e) {
      console.error("Failed to update pin state in localStorage:", e);
    }
    renderHistoryList();
    return item.isPinned;
  }
  return false;
}

export function deleteHistoryRecords(recordIds = []) {
  if (!Array.isArray(recordIds) || recordIds.length === 0) return [];
  const targetIds = new Set(recordIds.map(id => String(id)));

  scanHistory = scanHistory.filter(item => item && !targetIds.has(String(item.id)));
  try {
    localStorage.setItem("scan_history", JSON.stringify(scanHistory));
  } catch (e) {
    console.error("Failed to update scan_history after deletion:", e);
  }

  if (typeof window !== "undefined" && typeof window.renderHistoryList === "function") {
    window.renderHistoryList();
  }
  return scanHistory;
}

export function bulkPinHistoryRecords(recordIds = [], pinState = true) {
  if (!Array.isArray(recordIds) || recordIds.length === 0) return;
  const targetIds = new Set(recordIds.map(id => String(id)));

  scanHistory.forEach(item => {
    if (item && targetIds.has(String(item.id))) {
      item.isPinned = pinState;
      item.pinned = pinState;
    }
  });

  try {
    localStorage.setItem("scan_history", JSON.stringify(scanHistory));
  } catch (e) {
    console.error("Failed to update pin states in scan_history:", e);
  }

  if (typeof window !== "undefined" && typeof window.renderHistoryList === "function") {
    window.renderHistoryList();
  }
}


if (typeof window !== "undefined") {
  window.togglePinRecord = togglePinRecord;
  window.deleteHistoryRecords = deleteHistoryRecords;
  window.bulkPinHistoryRecords = bulkPinHistoryRecords;
}


export function saveToHistory(results, originalUrl) {
  if (!results) return;

  const fullDateTime = results.scanTime
    ? results.scanTime
    : new Date().toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).replace(',', ', ');

  const licenseNo = (results.pilotDetails && results.pilotDetails.licenseNo) || "";
  const pilotName = (results.pilotDetails && results.pilotDetails.name && results.pilotDetails.name !== "-") 
    ? results.pilotDetails.name 
    : "External Crew Member";
  const licenseType = (results.pilotDetails && results.pilotDetails.licenseType) || "ATPL(A)";

  const id = String(licenseNo || (originalUrl ? originalUrl.trim() : Date.now()));

  const existingIndex = scanHistory.findIndex(item => item && (String(item.id) === id || (originalUrl && item.url === originalUrl)));
  let isPinned = false;

  if (existingIndex !== -1) {
    isPinned = Boolean(scanHistory[existingIndex].isPinned);
    scanHistory.splice(existingIndex, 1);
  }

  const record = {
    id: id,
    name: pilotName,
    licenseType: licenseType,
    licenseNo: licenseNo || "-",
    overallStatus: results.overallStatus || "VALID",
    url: originalUrl || "",
    resultsData: results,
    timestamp: fullDateTime,
    isPinned: isPinned
  };

  scanHistory.unshift(record);
  enforceHistoryLimit();

  try {
    localStorage.setItem("scan_history", JSON.stringify(scanHistory));
  } catch (e) {
    console.error("Failed to save scan history:", e);
  }

  renderHistoryList();
}

export function clearHistory() {
  scanHistory = [];
  try {
    localStorage.removeItem("scan_history");
  } catch (e) {}
  renderHistoryList();
}

export function initHistoryListControls() {
  if (historyFilterInitialized) return;

  const searchInput = document.getElementById("history-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderHistoryList();
    });
  }

  const filterAllBtn = document.getElementById("filter-all-btn");
  const filterValidBtn = document.getElementById("filter-valid-btn");
  const filterExpiringBtn = document.getElementById("filter-expiring-btn");
  const filterExpiredBtn = document.getElementById("filter-expired-btn");

  const filterBtns = [
    { btn: filterAllBtn, type: "ALL" },
    { btn: filterValidBtn, type: "VALID" },
    { btn: filterExpiringBtn, type: "EXPIRING" },
    { btn: filterExpiredBtn, type: "EXPIRED" }
  ];

  filterBtns.forEach(({ btn, type }) => {
    if (btn) {
      btn.addEventListener("click", () => {
        currentHistoryFilter = type;
        updateFilterBtnStyles(filterBtns, type);
        renderHistoryList();
      });
    }
  });

  historyFilterInitialized = true;
}

function updateFilterBtnStyles(filterBtns, activeType) {
  filterBtns.forEach(({ btn, type }) => {
    if (!btn) return;
    if (type === activeType) {
      btn.className = "py-1.5 px-1 rounded-lg bg-blue-600 text-white shadow-xs transition-all cursor-pointer font-bold";
    } else {
      btn.className = "py-1.5 px-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer font-semibold";
    }
  });
}

export function renderHistoryList() {
  if (typeof window !== "undefined" && typeof window.renderHistoryList === "function" && window.renderHistoryList !== renderHistoryList) {
    window.renderHistoryList();
    return;
  }
  initHistoryListControls();

  const container = document.getElementById("recent-pilots-list") || document.getElementById("history-list");
  const countAllEl = document.getElementById("count-all");
  const countValidEl = document.getElementById("count-valid");
  const countExpiringEl = document.getElementById("count-expiring");
  const countExpiredEl = document.getElementById("count-expired");
  const retentionTag = document.getElementById("history-retention-tag");
  const cacheBadge = document.getElementById("history-cache-badge");

  const limit = getHistoryLimit();
  if (retentionTag) {
    retentionTag.innerText = `(recent ${limit} checks)`;
  }

  if (cacheBadge) {
    if (!navigator.onLine) {
      cacheBadge.classList.remove("hidden");
    } else {
      cacheBadge.classList.add("hidden");
    }
  }

  let validCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;

  scanHistory.forEach(item => {
    if (!item) return;
    const status = item.overallStatus;
    if (status === "EXPIRED") expiredCount++;
    else if (status === "EXPIRING_SOON") expiringCount++;
    else validCount++;
  });

  if (countAllEl) countAllEl.innerText = scanHistory.length;
  if (countValidEl) countValidEl.innerText = validCount;
  if (countExpiringEl) countExpiringEl.innerText = expiringCount;
  if (countExpiredEl) countExpiredEl.innerText = expiredCount;

  if (!container) return;

  if (scanHistory.length === 0) {
    container.innerHTML = `<div class="text-[11px] text-slate-400 italic py-4 text-center">No recent verified crew yet.</div>`;
    return;
  }

  const searchInput = document.getElementById("history-search-input");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  let filtered = scanHistory.filter(item => {
    if (!item) return false;

    if (currentHistoryFilter === "VALID" && item.overallStatus !== "VALID") return false;
    if (currentHistoryFilter === "EXPIRING" && item.overallStatus !== "EXPIRING_SOON") return false;
    if (currentHistoryFilter === "EXPIRED" && item.overallStatus !== "EXPIRED") return false;

    if (query) {
      const name = (item.name || "").toLowerCase();
      const licNo = (item.licenseNo || "").toLowerCase();
      const licType = (item.licenseType || "").toLowerCase();
      return name.includes(query) || licNo.includes(query) || licType.includes(query);
    }

    return true;
  });

  filtered.sort((a, b) => {
    const aPin = a.isPinned ? 1 : 0;
    const bPin = b.isPinned ? 1 : 0;
    if (aPin !== bPin) return bPin - aPin;
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-[11px] text-slate-400 italic py-4 text-center">No crew records match your search filter.</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    if (!item) return '';

    const safeId = String(item.id || '').replace(/'/g, "\'");
    let badgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60";
    let badgeText = "Valid";

    if (item.overallStatus === "EXPIRED") {
      badgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60";
      badgeText = "Expired";
    } else if (item.overallStatus === "EXPIRING_SOON") {
      badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60";
      badgeText = "Expiring";
    }

    const pinSvg = item.isPinned ? `
      <svg class="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    ` : '';

    return `
      <div onclick="loadHistoricalRecord('${safeId}')" class="py-2.5 px-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all active:scale-[0.99]">
        <div class="flex flex-col text-left pr-2 overflow-hidden">
          <div class="flex items-center gap-1">
            <span class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">${item.name || 'External Crew Member'}</span>
            ${pinSvg}
          </div>
          <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight truncate">
            ${item.licenseType || 'ATPL(A)'} • ${item.licenseNo || '-'}
          </span>
          <span class="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
            Checked: ${item.timestamp || 'Just now'}
          </span>
        </div>
        <div class="shrink-0">
          <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${badgeClass}">
            ${badgeText}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

export function getProfileData() {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (!data) return { url: "", attestationFileName: "", cachedCaamResults: null, cachedMabResults: null, qrImageUrl: "", cachedQrDataUrl: "" };
    const parsed = JSON.parse(data);
    return {
      url: (parsed.url || "").trim(),
      attestationFileName: (parsed.attestationFileName || "").trim(),
      cachedCaamResults: parsed.cachedCaamResults || null,
      cachedMabResults: parsed.cachedMabResults || null,
      qrImageUrl: parsed.qrImageUrl || "",
      cachedQrDataUrl: parsed.cachedQrDataUrl || ""
    };
  } catch (err) {
    console.error("Failed to read profile data from storage:", err);
    return { url: "", attestationFileName: "", cachedCaamResults: null, cachedMabResults: null, qrImageUrl: "", cachedQrDataUrl: "" };
  }
}

export function saveProfileData(profile = {}) {
  try {
    const existing = getProfileData();
    const sanitized = {
      url: profile.url !== undefined ? (profile.url || "").trim() : existing.url,
      attestationFileName: profile.attestationFileName !== undefined ? (profile.attestationFileName || "").trim() : existing.attestationFileName,
      cachedCaamResults: profile.cachedCaamResults !== undefined ? profile.cachedCaamResults : existing.cachedCaamResults,
      cachedMabResults: profile.cachedMabResults !== undefined ? profile.cachedMabResults : existing.cachedMabResults,
      qrImageUrl: profile.qrImageUrl !== undefined ? profile.qrImageUrl : existing.qrImageUrl,
      cachedQrDataUrl: profile.cachedQrDataUrl !== undefined ? profile.cachedQrDataUrl : existing.cachedQrDataUrl
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error("Failed to save profile data to storage:", err);
  }
}

export function clearProfileData() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (err) {
    console.error("Failed to clear profile data from storage:", err);
  }
}

export function hasProfileData() {
  const profile = getProfileData();
  return Boolean(profile && profile.url);
}
