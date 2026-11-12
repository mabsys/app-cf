// ./js/festiveEngine.js (1111_R111) - CertiFly Hybrid Festive & Seasonal Overlay Engine
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

/**
 * DEFAULT_FESTIVE_CONFIG
 * Offline baseline fallback containing ONLY FIRM GREGORIAN ANNUAL DATES.
 * Variable lunar-based events (Hari Raya, CNY, Deepavali, etc.) are fetched dynamically
 * from remote festive-config.json to prevent stale offline dates across calendar years.
 */
export const DEFAULT_FESTIVE_CONFIG = {
  version: "2026.3",
  updatedAt: "2026-11-12",
  remoteConfigUrl: "./assets/festive-config.json",
  remoteAssetBaseUrl: "./assets/festive/",
  events: [
    {
      id: "pilots_day",
      name: "World Pilots' Day",
      startDate: "2026-04-25",
      endDate: "2026-04-27",
      themeColor: "#f59e0b",
      badgeText: "Happy World Pilots' Day!",
      icon: "pilots-wings",
      stickerUrl: "./assets/festive/aviator-wings-gold.svg"
    },
    {
      id: "hari_raya",
      name: "Hari Raya Aidilfitri",
      startDate: "2026-03-20",
      endDate: "2026-03-24",
      themeColor: "#10b981",
      badgeText: "Selamat Hari Raya Aidilfitri!",
      icon: "crescent-star",
      stickerUrl: "./assets/festive/ketupat-hanging.svg"
    },
    {
      id: "merdeka_day",
      name: "National Day (Merdeka)",
      startDate: "2026-08-30",
      endDate: "2026-09-01",
      themeColor: "#3b82f6",
      badgeText: "Selamat Hari Merdeka!",
      icon: "flag-star",
      stickerUrl: "./assets/festive/merdeka-star-ribbon.svg"
    },
    {
      id: "hari_malaysia",
      name: "Hari Malaysia",
      startDate: "2026-09-15",
      endDate: "2026-09-17",
      themeColor: "#f59e0b",
      badgeText: "Selamat Hari Malaysia!",
      icon: "flag-star",
      stickerUrl: "./assets/festive/hari-malaysia-badge.svg"
    },
    {
      id: "cny",
      name: "Chinese New Year",
      startDate: "2027-02-05",
      endDate: "2027-02-09",
      themeColor: "#ef4444",
      badgeText: "Gong Xi Fa Cai!",
      icon: "lantern",
      stickerUrl: "./assets/festive/cny-lantern-tassel.svg"
    },
    {
      id: "year_end",
      name: "Year End & New Year",
      startDate: "2026-12-24",
      endDate: "2027-01-02",
      themeColor: "#38bdf8",
      badgeText: "Happy Holidays & Happy New Year!",
      icon: "snow-sparkle",
      stickerUrl: "./assets/festive/snow-sparkle-frost.svg"
    }
  ]
};

const STORAGE_KEY_ENABLED = 'certifly_festive_enabled';
const STORAGE_KEY_CONFIG = 'certifly_festive_config';

/**
 * Check if Festive Overlays are enabled by the user (default: true)
 */
export function isFestiveEnabled() {
  const val = localStorage.getItem(STORAGE_KEY_ENABLED);
  return val === null ? true : val === 'true';
}

/**
 * Enable or disable Festive Overlays in App Preferences
 */
export function setFestiveEnabled(enabled) {
  localStorage.setItem(STORAGE_KEY_ENABLED, enabled ? 'true' : 'false');
  updateFestivePills();
  if (enabled) {
    mountFestiveOverlay();
  } else {
    unmountFestiveOverlay();
  }
}

/**
 * Get current cached or fallback festive config
 */
export function getFestiveConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.events)) return parsed;
    }
  } catch (err) {
    console.warn('festiveEngine: Failed parsing stored festive config:', err);
  }
  return DEFAULT_FESTIVE_CONFIG;
}

/**
 * Background Remote Sync for festive-config.json
 */
export async function syncFestiveConfigRemote() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return getFestiveConfig();
  }

  const currentConfig = getFestiveConfig();
  const url = currentConfig.remoteConfigUrl || DEFAULT_FESTIVE_CONFIG.remoteConfigUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      cache: 'no-cache',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const remoteData = await res.json();
      if (remoteData && Array.isArray(remoteData.events)) {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(remoteData));
        if (isFestiveEnabled()) {
          mountFestiveOverlay();
        }
        return remoteData;
      }
    }
  } catch (err) {
    console.warn('festiveEngine: Remote sync skipped or failed:', err.message || err);
  }

  return getFestiveConfig();
}

/**
 * Evaluates current local date against active festive events
 */
export function getActiveFestiveEvent(overrideDateStr = null) {
  const config = getFestiveConfig();
  if (!config || !Array.isArray(config.events)) return null;

  const now = overrideDateStr ? new Date(overrideDateStr) : new Date();
  const todayStr = now.toISOString().split('T')[0];

  return config.events.find(evt => {
    if (!evt.startDate || !evt.endDate) return false;
    return todayStr >= evt.startDate && todayStr <= evt.endDate;
  }) || null;
}

/**
 * Vector SVG Archetypes for Front-Face Card Corner Stickers (Offline Fallback)
 */
function getFestiveStickerSvg(iconType, color) {
  switch (iconType) {
    case 'pilots-wings':
    case 'aviator-wings':
      return `
        <svg viewBox="0 0 48 48" class="w-full h-full text-amber-500 overflow-visible" fill="none" stroke="currentColor">
          <circle cx="24" cy="24" r="20" fill="#0f172a" fill-opacity="0.9" stroke="${color}" stroke-width="2"/>
          <path d="M 10 24 Q 18 16 24 22 Q 30 16 38 24 Q 24 30 10 24 Z" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="1.5"/>
          <circle cx="24" cy="24" r="4" fill="#fbbf24"/>
        </svg>`;

    case 'flag-star':
      return `
        <svg viewBox="0 0 48 48" class="w-full h-full text-blue-500 overflow-visible" fill="none">
          <circle cx="24" cy="24" r="20" fill="#0f172a" fill-opacity="0.9" stroke="${color}" stroke-width="2"/>
          <polygon points="24,12 27,19 35,20 29,26 31,34 24,30 17,34 19,26 13,20 21,19" fill="#fbbf24"/>
        </svg>`;

    case 'crescent-star':
    case 'crescent-moon':
      return `
        <svg viewBox="0 0 48 48" class="w-full h-full text-emerald-500 overflow-visible" fill="none">
          <circle cx="24" cy="24" r="20" fill="#0f172a" fill-opacity="0.9" stroke="${color}" stroke-width="2"/>
          <path d="M 16 14 A 12 12 0 1 0 28 34 A 10 10 0 1 1 16 14 Z" fill="#34d399"/>
          <polygon points="30,16 31,19 34,19 32,21 33,24 30,22 27,24 28,21 26,19 29,19" fill="#fbbf24"/>
        </svg>`;

    case 'lantern':
      return `
        <svg viewBox="0 0 48 48" class="w-full h-full text-red-500 overflow-visible" fill="none">
          <circle cx="24" cy="24" r="20" fill="#0f172a" fill-opacity="0.9" stroke="${color}" stroke-width="2"/>
          <rect x="17" y="14" width="14" height="20" rx="6" fill="#ef4444" stroke="#f59e0b" stroke-width="1.5"/>
          <path d="M 24 34 L 24 40" stroke="#fbbf24" stroke-width="2"/>
        </svg>`;

    case 'snow-sparkle':
    default:
      return `
        <svg viewBox="0 0 48 48" class="w-full h-full text-sky-400 overflow-visible" fill="none" stroke="currentColor">
          <circle cx="24" cy="24" r="20" fill="#0f172a" fill-opacity="0.9" stroke="${color}" stroke-width="2"/>
          <path d="M 24 12 L 24 36 M 12 24 L 36 24 M 16 16 L 32 32 M 16 32 L 32 16" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
  }
}

/**
 * Mounts the Festive Corner Sticker directly inside the Front Face of #overview-hero-card
 */
export function mountFestiveOverlay(overrideDateStr = null) {
  unmountFestiveOverlay();

  if (!isFestiveEnabled()) return;

  const activeEvent = getActiveFestiveEvent(overrideDateStr);
  const heroCard = document.getElementById('overview-hero-card');

  if (!activeEvent || !heroCard) return;

  // Target EXCLUSIVELY the Front Face container inside #overview-hero-card
  const frontFace = heroCard.firstElementChild;
  if (!frontFace) return;

  const sticker = document.createElement('div');
  sticker.id = 'hero-festive-sticker';
  // Spills outside top (-top-3.5) and left (-left-3.5) card boundaries
  sticker.className = 'absolute -top-3.5 -left-3.5 z-30 pointer-events-none select-none overflow-visible transition-transform duration-300 hover:scale-105';

  const color = activeEvent.themeColor || '#10b981';

  sticker.innerHTML = `
    <div class="relative w-14 h-14 overflow-visible flex items-center justify-center drop-shadow-lg">
      ${
        activeEvent.stickerUrl
          ? `<img src="${activeEvent.stickerUrl}" alt="${activeEvent.name}" class="w-full h-full object-contain overflow-visible drop-shadow-md pointer-events-none" />`
          : getFestiveStickerSvg(activeEvent.icon, color)
      }
    </div>
  `;

  frontFace.appendChild(sticker);
}

/**
 * Unmounts the festive corner sticker from the DOM
 */
export function unmountFestiveOverlay() {
  const sticker = document.getElementById('hero-festive-sticker');
  if (sticker) {
    sticker.remove();
  }
}

/**
 * Sync App Preferences pill button selection (#festive-pill-enable / #festive-pill-disable)
 */
export function updateFestivePills() {
  const enableBtn = document.getElementById('festive-pill-enable');
  const disableBtn = document.getElementById('festive-pill-disable');

  if (!enableBtn || !disableBtn) return;

  const enabled = isFestiveEnabled();

  const activeClass = "festive-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-xs cursor-pointer";
  const inactiveClass = "festive-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer";

  if (enabled) {
    enableBtn.className = activeClass;
    disableBtn.className = inactiveClass;
  } else {
    enableBtn.className = inactiveClass;
    disableBtn.className = activeClass;
  }
}

/**
 * Main Boot Initialization for Festive Engine
 */
export async function initFestiveEngine() {
  updateFestivePills();

  if (isFestiveEnabled()) {
    mountFestiveOverlay();
    await syncFestiveConfigRemote();
  }
}

if (typeof window !== 'undefined') {
  window.isFestiveEnabled = isFestiveEnabled;
  window.setFestiveEnabled = setFestiveEnabled;
  window.initFestiveEngine = initFestiveEngine;
  window.mountFestiveOverlay = mountFestiveOverlay;
  window.unmountFestiveOverlay = unmountFestiveOverlay;
  window.updateFestivePills = updateFestivePills;
}
