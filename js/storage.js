// js/storage.js - Local Storage & Data Controller

export const PROFILE_KEY = "certifly_crew_profile";
export const THRESHOLD_KEY = "certifly_threshold_days";
export const HISTORY_LIMIT_KEY = "certifly_history_limit";
export const FRESHNESS_LIMIT_KEY = "certifly_freshness_limit";

export function getFreshnessLimit() {
  const saved = localStorage.getItem(FRESHNESS_LIMIT_KEY);
  return saved ? parseInt(saved, 10) : 30;
}

export function setFreshnessLimit(days) {
  localStorage.setItem(FRESHNESS_LIMIT_KEY, String(days));
}

export function getThresholdDays() {
  const saved = localStorage.getItem(THRESHOLD_KEY);
  return saved ? parseInt(saved, 10) : 30;
}

export function setThresholdDays(days) {
  localStorage.setItem(THRESHOLD_KEY, String(days));
}

export function getHistoryLimit() {
  const saved = localStorage.getItem(HISTORY_LIMIT_KEY);
  return saved ? parseInt(saved, 10) : 10;
}

export function setHistoryLimit(limit) {
  localStorage.setItem(HISTORY_LIMIT_KEY, String(limit));
}

export function getScanHistory() {
  try {
    const raw = localStorage.getItem("scan_history");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveToHistory(resultsData, url) {
  let history = getScanHistory();
  const maxLimit = getHistoryLimit();

  const newEntry = {
    id: String((resultsData.pilotDetails && resultsData.pilotDetails.licenseNo) || Date.now()),
    url: url || "",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    name: (resultsData.pilotDetails && resultsData.pilotDetails.name) || "Crew Member",
    licenseType: (resultsData.pilotDetails && resultsData.pilotDetails.licenseType) || "ATPL(A)",
    overallStatus: resultsData.overallStatus || "VALID",
    resultsData: resultsData
  };

  history = history.filter(item => item.id !== newEntry.id && item.url !== newEntry.url);
  history.unshift(newEntry);

  if (history.length > maxLimit) {
    history = history.slice(0, maxLimit);
  }

  try {
    localStorage.setItem("scan_history", JSON.stringify(history));
  } catch (e) {}

  renderHistoryList();
}

export function renderHistoryList() {
  const history = getScanHistory();
  const container = document.getElementById("history-list-container");
  const countEl = document.getElementById("history-count-badge");

  if (countEl) countEl.innerText = `${history.length} Saved`;

  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">No recent compliance scans found.</div>`;
    return;
  }

  container.innerHTML = history.map(item => {
    let dotColor = "bg-emerald-500";
    if (item.overallStatus === "EXPIRED") dotColor = "bg-rose-500";
    if (item.overallStatus === "EXPIRING_SOON") dotColor = "bg-amber-500";

    return `
      <div onclick="window.loadHistoricalRecord('${item.id}')" 
           class="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 cursor-pointer transition-all flex items-center justify-between">
        <div class="truncate pr-2">
          <div class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${item.name} (${item.licenseType})</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${item.timestamp} &bull; Tap to load</div>
        </div>
        <span class="w-2 h-2 rounded-full ${dotColor} shrink-0 ml-2"></span>
      </div>
    `;
  }).join('');
}

export function clearHistory() {
  if (confirm("Are you sure you want to clear all recent compliance checks from this device?")) {
    try {
      localStorage.removeItem("scan_history");
    } catch (e) {}
    renderHistoryList();
  }
}
window.clearHistory = clearHistory;

export function getProfileData() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : { nickname: "", url: "", attestationFileName: "" };
  } catch (e) {
    return { nickname: "", url: "", attestationFileName: "" };
  }
}

export function saveProfileData(data) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
  } catch (e) {}
}

export function clearProfileData() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (e) {}
}

export function hasProfileData() {
  const data = getProfileData();
  return Boolean(data.url || data.nickname || data.attestationFileName);
}
