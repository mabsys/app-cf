// js/storage.js - Scan History and Local Storage Management

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

// ----------------------------------------------------
// THRESHOLD & HISTORY SETTINGS HELPERS
// ----------------------------------------------------
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
    if (scanHistory.length > limit) {
      scanHistory = scanHistory.slice(0, limit);
      localStorage.setItem("scan_history", JSON.stringify(scanHistory));
      renderHistoryList();
    }
  } catch (e) {
    console.error("Failed to save history limit:", e);
  }
}

// ----------------------------------------------------
// SCAN HISTORY MANAGEMENT
// ----------------------------------------------------
export function getScanHistory() {
  return scanHistory;
}

export function saveToHistory(results, originalUrl) {
  const fullDateTime = results.scanTime
    ? results.scanTime
    : new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
        .replace(', ', ', ')
        .replace(' at ', ', ')
        .replace(',', ', ');

  const record = {
    id: String((results.pilotDetails && results.pilotDetails.licenseNo) || Date.now()),
    name: (results.pilotDetails && results.pilotDetails.name) || "Unknown",
    licenseType: (results.pilotDetails && results.pilotDetails.licenseType) || "",
    overallStatus: results.overallStatus || "VALID",
    url: originalUrl || "",
    resultsData: results,
    timestamp: fullDateTime
  };

  scanHistory = scanHistory.filter(item => item && String(item.id) !== record.id);
  scanHistory.unshift(record);

  const limit = getHistoryLimit();
  if (scanHistory.length > limit) scanHistory = scanHistory.slice(0, limit);

  try {
    localStorage.setItem("scan_history", JSON.stringify(scanHistory));
  } catch (e) {
    console.error("Failed to save scan history:", e);
  }
  renderHistoryList();
}

export function renderHistoryList() {
  const container = document.getElementById("history-list");
  const countBadge = document.getElementById("history-count-badge");
  const clockIcon = document.getElementById("history-clock-icon");

  if (!container) return;

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
    container.innerHTML = `<div class="text-[10px] text-slate-400 italic py-4 text-center">No recent scans on this device.</div>`;
    return;
  }

  container.innerHTML = scanHistory.map(item => {
    if (!item) return '';
    const dotColor = item.overallStatus === "EXPIRED" ? "bg-red-500" : (item.overallStatus === "EXPIRING_SOON" ? "bg-amber-500" : "bg-green-600");
    const safeId = String(item.id || '').replace(/'/g, "\\'");
    return `
      <div onclick="loadHistoricalRecord('${safeId}')" class="py-1.5 px-2 flex items-center justify-between cursor-pointer hover:bg-sky-100 transition-colors">
        <div class="flex flex-col text-left">
          <span class="text-[11px] font-semibold text-slate-800 leading-tight">${item.name || 'Unknown'}</span>
          <span class="text-[9px] text-slate-500 font-semibold uppercase tracking-normal mt-0.5">${item.licenseType || ''}  -  ${item.timestamp || ''} LT</span>
        </div>
        <span class="w-2 h-2 rounded-full ${dotColor} shrink-0 ml-2"></span>
      </div>
    `;
  }).join('');
}

export function clearHistory() {

  if (confirm("Are you sure you want to clear all recent compliance checks from this device?")) {
    scanHistory = [];
    try {
      localStorage.removeItem("scan_history");
    } catch (e) {}
    renderHistoryList();
  }
};

// ----------------------------------------------------
// PROFILE STORAGE MANAGEMENT
// ----------------------------------------------------
export function getProfileData() {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (!data) return { nickname: "", url: "", attestationFileName: "" };
    const parsed = JSON.parse(data);
    return {
      nickname: (parsed.nickname || parsed.name || "").trim(),
      url: (parsed.url || "").trim(),
      attestationFileName: (parsed.attestationFileName || "").trim()
    };
  } catch (err) {
    console.error("Failed to read profile data from storage:", err);
    return { nickname: "", url: "", attestationFileName: "" };
  }
}

export function saveProfileData(profile = {}) {
  try {
    const sanitized = {
      nickname: (profile.nickname || profile.name || "").trim(),
      url: (profile.url || "").trim(),
      attestationFileName: (profile.attestationFileName || "").trim()
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

window.clearHistory = clearHistory;
