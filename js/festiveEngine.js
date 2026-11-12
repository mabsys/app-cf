// ./js/festiveEngine.js (1111_R106) - CertiFly Hybrid Festive & Seasonal Overlay Engine
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

/**
 * DEFAULT_FESTIVE_CONFIG
 * Offline baseline fallback containing ONLY FIRM GREGORIAN ANNUAL DATES.
 * Variable lunar-based events (Hari Raya, CNY, Deepavali, etc.) are fetched dynamically
 * from remote festive-config.json to prevent stale offline dates across calendar years.
 */
export const DEFAULT_FESTIVE_CONFIG = {
  version: "2026.1",
  updatedAt: "2026-11-12",
  remoteConfigUrl: "./assets/festive-config.json",
  events: [
    {
      id: "pilots_day",
      name: "World Pilots' Day",
      startDate: "2026-04-26",
      endDate: "2026-04-27",
      themeColor: "#f59e0b",
      badgeText: "Happy World Pilots' Day!",
      icon: "pilots-wings"
    },
    {
      id: "merdeka_day",
      name: "National Day (Merdeka)",
      startDate: "2026-08-30",
      endDate: "2026-09-01",
      themeColor: "#3b82f6",
      badgeText: "Selamat Hari Merdeka!",
      icon: "flag-star"
    },
    {
      id: "hari_malaysia",
      name: "Hari Malaysia",
      startDate: "2026-09-15",
      endDate: "2026-09-17",
      themeColor: "#f59e0b",
      badgeText: "Selamat Hari Malaysia!",
      icon: "flag-star"
    },
    {
      id: "year_end",
      name: "Year End & New Year",
      startDate: "2026-12-24",
      endDate: "2027-01-02",
      themeColor: "#38bdf8",
      badgeText: "Happy Holidays & Happy New Year!",
      icon: "snow-sparkle"
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
 * Vector SVG Archetypes for Header Archway Halos
 */
function getFestiveSvgGraphic(iconType, themeColor) {
  switch (iconType) {
    case 'pilots-wings':
      return `
        <svg viewBox="0 0 400 80" class="w-full h-full text-amber-500 drop-shadow-md overflow-visible" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M 40 40 Q 120 10 180 35 T 200 45 T 220 35 Q 280 10 360 40" stroke="currentColor" stroke-linecap="round"/>
          <circle cx="200" cy="42" r="14" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="2"/>
          <path d="M 193 42 L 207 42 M 200 35 L 200 49" stroke="#fbbf24" stroke-width="2"/>
        </svg>`;

    case 'flag-star':
      return `
        <svg viewBox="0 0 400 80" class="w-full h-full text-blue-500 drop-shadow-md overflow-visible" fill="none" stroke="currentColor">
          <path d="M 30 20 Q 200 60 370 20" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4 4"/>
          <circle cx="200" cy="38" r="18" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-width="1.5"/>
          <polygon points="200,26 204,34 213,35 206,41 208,50 200,45 192,50 194,41 187,35 196,34" fill="#fbbf24"/>
        </svg>`;

    case 'crescent-star':
    case 'crescent-moon':
      return `
        <svg viewBox="0 0 400 80" class="w-full h-full text-emerald-500 drop-shadow-md overflow-visible" fill="none" stroke="currentColor">
          <path d="M 20 15 Q 200 65 380 15" stroke="#10b981" stroke-width="2" stroke-dasharray="6 4"/>
          <path d="M 192 22 A 16 16 0 1 0 212 42 A 13 13 0 1 1 192 22 Z" fill="#34d399" stroke="#10b981"/>
          <polygon points="214,26 216,31 221,31 217,34 219,39 214,36 209,39 211,34 207,31 212,31" fill="#fbbf24"/>
        </svg>`;

    case 'lantern':
      return `
        <svg viewBox="0 0 400 80" class="w-full h-full text-red-500 drop-shadow-md overflow-visible" fill="none" stroke="currentColor">
          <path d="M 10 10 Q 200 50 390 10" stroke="#ef4444" stroke-width="2"/>
          <rect x="186" y="22" width="28" height="36" rx="12" fill="#ef4444" fill-opacity="0.8" stroke="#f59e0b" stroke-width="2"/>
          <path d="M 200 58 L 200 70 M 194 70 L 206 70" stroke="#fbbf24" stroke-width="2"/>
        </svg>`;

    case 'snow-sparkle':
    default:
      return `
        <svg viewBox="0 0 400 80" class="w-full h-full text-sky-400 drop-shadow-md overflow-visible" fill="none" stroke="currentColor">
          <path d="M 20 10 Q 200 45 380 10" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2 4"/>
          <path d="M 200 20 L 200 56 M 182 38 L 218 38 M 188 26 L 212 50 M 188 50 L 212 26" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
  }
}

/**
 * Mounts the Festive Overlay (#topbar-festive-shelf) anchored directly to #persistent-topbar
 */
export function mountFestiveOverlay(overrideDateStr = null) {
  if (!isFestiveEnabled()) {
    unmountFestiveOverlay();
    return;
  }

  const activeEvent = getActiveFestiveEvent(overrideDateStr);

  // Target floating mini topbar component (#persistent-topbar from topbar.js) as primary anchor
  const topbar = document.getElementById('persistent-topbar')
              || document.getElementById('topbar')
              || document.querySelector('header');

  if (!activeEvent || !topbar) {
    unmountFestiveOverlay();
    return;
  }

  let shelf = document.getElementById('topbar-festive-shelf');
  if (!shelf) {
    shelf = document.createElement('div');
    shelf.id = 'topbar-festive-shelf';
    // Anchored to bottom edge of #persistent-topbar (fixed top-0 left-0 right-0 h-12)
    shelf.className = 'absolute top-full left-0 right-0 w-full max-w-md mx-auto pointer-events-none select-none overflow-visible z-50 flex items-center justify-center -mt-1 transition-opacity duration-300 opacity-100';
    if (getComputedStyle(topbar).position === 'static') {
      topbar.style.position = 'relative';
    }
    topbar.appendChild(shelf);
  }

  const color = activeEvent.themeColor || '#10b981';
  shelf.innerHTML = `
    <div class="relative w-full h-14 max-w-xs flex items-center justify-center pointer-events-none">
      ${
        activeEvent.customSvg
          ? activeEvent.customSvg
          : (activeEvent.graphicUrl
              ? `<img src="${activeEvent.graphicUrl}" alt="${activeEvent.name}" class="w-full h-full object-contain drop-shadow-md pointer-events-none" />`
              : getFestiveSvgGraphic(activeEvent.icon, color))
      }
      <div class="absolute -bottom-2 bg-slate-900/90 dark:bg-slate-950/90 text-white border border-slate-700/80 px-3 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-md flex items-center gap-1.5 backdrop-blur-md pointer-events-none">
        <span class="w-1.5 h-1.5 rounded-full animate-ping" style="background-color: ${color}"></span>
        <span>${activeEvent.badgeText || activeEvent.name}</span>
      </div>
    </div>
  `;

  initFestiveScrollFade();
}

/**
 * Unmounts the festive overlay from the DOM
 */
export function unmountFestiveOverlay() {
  const shelf = document.getElementById('topbar-festive-shelf');
  if (shelf) {
    shelf.remove();
  }
}

/**
 * Smooth Scroll-Fade Listener: Fades out overlay when scrolling down past 25px
 */
let isScrollListenerBound = false;
export function initFestiveScrollFade() {
  if (isScrollListenerBound) return;

  const scrollContainer = document.getElementById('sheet-content') || window;
  const handleScroll = () => {
    const shelf = document.getElementById('topbar-festive-shelf');
    if (!shelf) return;

    const scrollTop = scrollContainer.scrollTop || window.scrollY || 0;
    if (scrollTop > 25) {
      shelf.style.opacity = '0';
    } else {
      shelf.style.opacity = '1';
    }
  };

  scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });
  isScrollListenerBound = true;
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
