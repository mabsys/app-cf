// js/storage.js - Local Storage & Data Persistence Controller

export const PROFILE_KEY = "certifly_profile_data";
export const THRESHOLD_KEY = "certifly_threshold_days";
export const HISTORY_LIMIT_KEY = "certifly_history_limit";
export const FRESHNESS_LIMIT_KEY = "certifly_freshness_limit";

export function getThresholdDays() {
  try {
    const saved = localStorage.getItem(THRESHOLD_KEY);
    return saved ? parseInt(saved, 10) : 30;
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

export function getFreshnessLimit() {
  try {
    const saved = localStorage.getItem(FRESHNESS_LIMIT_KEY);
    return saved ? parseInt(saved, 10) : 30;
  } catch (e) {
    return 30;
  }
}

export function setFreshnessLimit(limit) {
  try {
    localStorage.setItem(FRESHNESS_LIMIT_KEY, limit.toString());
  } catch (e) {
    console.error("Failed to save freshness limit:", e);
  }
}

export function getHistoryLimit() {
  try {
    const saved = localStorage.getItem(HISTORY_LIMIT_KEY);
    return saved ? parseInt(saved, 10) : 10;
  } catch (e) {
    return 10;
  }
}

export function setHistoryLimit(limit) {
  try {
    localStorage.setItem(HISTORY_LIMIT_KEY, limit.toString());
  } catch (e) {
    console.error("Failed to save history limit:", e);
  }
}

export function getScanHistory() {
  try {
    const raw = localStorage.getItem("scan_history");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveToHistory(results, originalUrl = "") {
  try {
    const history = getScanHistory();
    const limit = getHistoryLimit();
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      url: originalUrl,
      resultsData: results
    };
    history.unshift(entry);
    const trimmed = history.slice(0, limit);
    localStorage.setItem("scan_history", JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to save scan history:", e);
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem("scan_history");
  } catch (e) {
    console.error("Failed to clear scan history:", e);
  }
}

export function renderHistoryList() {
  const container = document.getElementById("history-list-container");
  const countEl = document.getElementById("storage-scans-count");
  if (!container) return;

  const history = getScanHistory();
  const limit = getHistoryLimit();

  if (countEl) {
    countEl.innerText = `${history.length} / ${limit}`;
  }

  if (history.length === 0) {
    container.innerHTML = `<div class="text-[10px] text-slate-400 italic py-4 text-center">No recent scans on this device.</div>`;
    return;
  }

  let html = `<div class="space-y-2">`;
  history.forEach(item => {
    const dateStr = new Date(item.timestamp).toLocaleString();
    const name = item.resultsData?.pilotDetails?.name || "CREW MEMBER";
    const status = item.resultsData?.overallStatus || "VALID";
    const badgeColor = status === "VALID" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";

    html += `
      <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2">
        <div class="min-w-0">
          <div class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${name}</div>
          <div class="text-[10px] text-slate-400">${dateStr}</div>
        </div>
        <span class="px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase shrink-0 ${badgeColor}">${status}</span>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

export function getProfileData() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveProfileData(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile data:", e);
  }
}

export function clearProfileData() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (e) {
    console.error("Failed to clear profile data:", e);
  }
}

export function hasProfileData() {
  const data = getProfileData();
  return !!(data && (data.url || data.attestationPdfText || data.cachedCaamResults));
}
