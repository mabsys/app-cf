// ./js/festiveEngine.js - CertiFly Hybrid Remote Festive Overlay Engine
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance Suite

const REMOTE_FESTIVE_CONFIG_URL = './assets/festive-config.json';
const FESTIVE_STORAGE_ENABLED_KEY = 'certifly_festive_enabled';
const FESTIVE_STORAGE_CONFIG_KEY = 'certifly_festive_config';

/**
 * Built-in Offline Fallback Calendar for Lunar & Annual Festive Events
 */
export const DEFAULT_FESTIVE_CONFIG = {
  version: '2026.1',
  updatedAt: '2026-11-12',
  events: [
    {
      id: 'pilots_day_2026',
      name: "World Pilots' Day",
      type: 'pilots_day',
      startDate: '2026-04-25',
      endDate: '2026-04-27',
      themeColor: '#3b82f6',
      badgeText: "Happy World Pilots' Day!"
    },
    {
      id: 'merdeka_2026',
      name: 'National Day',
      type: 'merdeka',
      startDate: '2026-08-30',
      endDate: '2026-09-01',
      themeColor: '#2563eb',
      badgeText: 'Selamat Hari Merdeka'
    },
    {
      id: 'year_end_2026',
      name: 'Year End & New Year',
      type: 'year_end',
      startDate: '2026-12-22',
      endDate: '2027-01-03',
      themeColor: '#38bdf8',
      badgeText: 'Happy Holidays & New Year'
    }
  ]
};

/**
 * SVG Graphics Templates for TopBar Center Archway & Hanging Side Accents
 */
const FESTIVE_GRAPHICS_MAP = {
  year_end: `
    <div class="relative w-full h-full flex items-center justify-between px-2">
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-30 dark:opacity-50">
        <svg class="w-56 h-12" viewBox="0 0 220 50" fill="none">
          <path d="M10 15 Q 110 40 210 15" stroke="#38bdf8" stroke-width="2" />
          <polygon points="110,8 113,16 121,16 115,21 117,29 110,24 103,29 105,21 99,16 107,16" fill="#7dd3fc" />
        </svg>
      </div>
      <div class="absolute top-full left-3 -mt-1 pointer-events-none">
        <svg class="w-9 h-14 text-sky-400" viewBox="0 0 36 56" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="18" y1="0" x2="18" y2="24" stroke-dasharray="2 2" />
          <path d="M18 24 M18 16 L18 32 M10 24 L26 24 M12 18 L24 30 M12 30 L24 18" />
        </svg>
      </div>
      <div class="absolute top-full right-3 -mt-1 pointer-events-none">
        <svg class="w-9 h-14 text-sky-400" viewBox="0 0 36 56" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="18" y1="0" x2="18" y2="24" stroke-dasharray="2 2" />
          <path d="M18 24 M18 16 L18 32 M10 24 L26 24 M12 18 L24 30 M12 30 L24 18" />
        </svg>
      </div>
    </div>
  `,
  pilots_day: `
    <div class="relative w-full h-full flex items-center justify-between px-2">
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-35 dark:opacity-55">
        <svg class="w-56 h-12 text-blue-500" viewBox="0 0 220 50" fill="none" stroke="currentColor">
          <path d="M20 25 C60 10 90 20 110 32 C130 20 160 10 200 25" stroke-width="2" />
          <circle cx="110" cy="30" r="8" fill="#3b82f6" stroke="#fbbf24" stroke-width="1.5" />
        </svg>
      </div>
      <div class="absolute top-full left-3 -mt-1 pointer-events-none">
        <svg class="w-8 h-12 text-amber-400" viewBox="0 0 32 48" fill="none" stroke="currentColor">
          <line x1="16" y1="0" x2="16" y2="18" stroke-width="1.5" />
          <polygon points="16,18 26,26 22,38 16,33 10,38 6,26" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" />
        </svg>
      </div>
      <div class="absolute top-full right-3 -mt-1 pointer-events-none">
        <svg class="w-8 h-12 text-amber-400" viewBox="0 0 32 48" fill="none" stroke="currentColor">
          <line x1="16" y1="0" x2="16" y2="18" stroke-width="1.5" />
          <polygon points="16,18 26,26 22,38 16,33 10,38 6,26" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" />
        </svg>
      </div>
    </div>
  `,
  merdeka: `
    <div class="relative w-full h-full flex items-center justify-between px-2">
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-30 dark:opacity-50">
        <svg class="w-56 h-12" viewBox="0 0 220 50" fill="none">
          <path d="M10 35 Q 110 10 210 35" stroke="#2563eb" stroke-width="2" />
          <polygon points="110,12 113,20 121,20 115,25 117,33 110,28 103,33 105,25 99,20 107,20" fill="#f59e0b" />
        </svg>
      </div>
      <div class="absolute top-full left-3 -mt-1 pointer-events-none">
        <svg class="w-8 h-14" viewBox="0 0 32 56" fill="none">
          <line x1="16" y1="0" x2="16" y2="20" stroke="#2563eb" stroke-width="1.5" />
          <rect x="8" y="20" width="16" height="24" rx="2" fill="#dc2626" stroke="#fbbf24" stroke-width="1" />
        </svg>
      </div>
      <div class="absolute top-full right-3 -mt-1 pointer-events-none">
        <svg class="w-8 h-14" viewBox="0 0 32 56" fill="none">
          <line x1="16" y1="0" x2="16" y2="20" stroke="#2563eb" stroke-width="1.5" />
          <rect x="8" y="20" width="16" height="24" rx="2" fill="#dc2626" stroke="#fbbf24" stroke-width="1" />
        </svg>
      </div>
    </div>
  `
};

export function isFestiveEnabled() {
  if (typeof localStorage === 'undefined') return true;
  const stored = localStorage.getItem(FESTIVE_STORAGE_ENABLED_KEY);
  return stored !== 'false';
}

export function setFestiveEnabled(enabled) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(FESTIVE_STORAGE_ENABLED_KEY, enabled ? 'true' : 'false');
  }
  updateFestivePills(enabled);
  if (enabled) {
    mountFestiveOverlay();
  } else {
    unmountFestiveOverlay();
  }
}

export function getFestiveConfig() {
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(FESTIVE_STORAGE_CONFIG_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.events)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('FestiveEngine: Error reading cached festive config:', e);
    }
  }
  return DEFAULT_FESTIVE_CONFIG;
}

export async function syncFestiveConfigRemote() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return getFestiveConfig();
  }

  try {
    const res = await fetch(REMOTE_FESTIVE_CONFIG_URL, { cache: 'no-cache' });
    if (res.ok) {
      const remoteConfig = await res.json();
      if (remoteConfig && Array.isArray(remoteConfig.events)) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(FESTIVE_STORAGE_CONFIG_KEY, JSON.stringify(remoteConfig));
        }
        return remoteConfig;
      }
    }
  } catch (err) {
    console.warn('FestiveEngine: Remote sync skipped (offline or network block):', err);
  }

  return getFestiveConfig();
}

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

let scrollListenerBound = false;

function initFestiveScrollFade() {
  if (scrollListenerBound) return;
  scrollListenerBound = true;

  const handleScroll = () => {
    const shelf = document.getElementById('topbar-festive-shelf');
    if (!shelf) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollTop > 25) {
      shelf.style.opacity = '0';
    } else {
      shelf.style.opacity = '1';
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
}

export function mountFestiveOverlay() {
  if (!isFestiveEnabled()) {
    unmountFestiveOverlay();
    return;
  }

  const activeEvent = getActiveFestiveEvent();
  if (!activeEvent) {
    unmountFestiveOverlay();
    return;
  }

  const topbar = document.getElementById('topbar') || document.querySelector('header');
  if (!topbar) return;

  if (!topbar.classList.contains('relative')) {
    topbar.classList.add('relative');
  }

  let shelf = document.getElementById('topbar-festive-shelf');
  if (!shelf) {
    shelf = document.createElement('div');
    shelf.id = 'topbar-festive-shelf';
    shelf.className = 'absolute inset-0 w-full max-w-md mx-auto pointer-events-none select-none z-20 overflow-visible transition-opacity duration-300 opacity-100';
    topbar.appendChild(shelf);
  }

  const graphicMarkup = FESTIVE_GRAPHICS_MAP[activeEvent.type] || FESTIVE_GRAPHICS_MAP.raya;
  shelf.innerHTML = graphicMarkup;

  const brandTitle = topbar.querySelector('h1') || topbar.querySelector('.text-base') || topbar.querySelector('span');
  if (brandTitle) {
    brandTitle.classList.add('drop-shadow-sm');
  }

  initFestiveScrollFade();
}

export function unmountFestiveOverlay() {
  const shelf = document.getElementById('topbar-festive-shelf');
  if (shelf) {
    shelf.remove();
  }
}

export function updateFestivePills(enabledState = isFestiveEnabled()) {
  const enableBtn = document.getElementById('festive-pill-enable');
  const disableBtn = document.getElementById('festive-pill-disable');

  if (!enableBtn || !disableBtn) return;

  const activeClass = 'festive-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-xs cursor-pointer font-extrabold';
  const inactiveClass = 'festive-pill-btn py-2 px-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer';

  if (enabledState) {
    enableBtn.className = activeClass;
    disableBtn.className = inactiveClass;
  } else {
    enableBtn.className = inactiveClass;
    disableBtn.className = activeClass;
  }
}

export function initFestiveEngine() {
  updateFestivePills();

  if (isFestiveEnabled()) {
    mountFestiveOverlay();
    syncFestiveConfigRemote().then(() => {
      if (isFestiveEnabled()) {
        mountFestiveOverlay();
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.initFestiveEngine = initFestiveEngine;
  window.setFestiveEnabled = setFestiveEnabled;
  window.updateFestivePills = updateFestivePills;
  window.mountFestiveOverlay = mountFestiveOverlay;
  window.unmountFestiveOverlay = unmountFestiveOverlay;
}
