// js/ui.js - View State, Navigation, Preferences & Touch Gestures Controller

import { stopScanner } from './scanner.js';
import {
  renderHistoryList,
  getThresholdDays,
  setThresholdDays,
  getHistoryLimit,
  setHistoryLimit,
  getFreshnessLimit,
  setFreshnessLimit
} from './storage.js';
import { topbarHTML } from './components/topbar.js';
import { dockHTML } from './components/dock.js';
import { menuHTML } from './components/menu.js';

let currentTextSize = "std";
let currentThemeMode = "system";

const textSizeIcons = {
  std: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h7"/></svg>`,
  lg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h12M4 18h8"/></svg>`,
  xl: `<svg class="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h14M4 18h10"/></svg>`
};

const themeSolidIcons = {
  light: `<svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clip-rule="evenodd"/></svg>`,
  dark: `<svg class="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>`,
  system: `<svg class="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm2 0v8h10V5H5z" clip-rule="evenodd"/></svg>`
};

export function applyTextSize(size) {
  currentTextSize = size;
  const root = document.documentElement;
  root.classList.remove("text-scale-std", "text-scale-lg", "text-scale-xl");
  root.classList.add(`text-scale-${size}`);

  const topbarTextBtn = document.getElementById("topbar-text-btn");
  if (topbarTextBtn) {
    topbarTextBtn.innerHTML = textSizeIcons[size] || textSizeIcons.std;
  }

  const tStd = document.getElementById("text-pill-std");
  const tLg = document.getElementById("text-pill-lg");
  const tXl = document.getElementById("text-pill-xl");

  const activeClass = "bg-blue-600 text-white font-extrabold shadow-xs";
  const inactiveClass = "text-slate-600 dark:text-slate-300 font-bold bg-transparent hover:text-slate-900 dark:hover:text-white";

  if (tStd && tLg && tXl) {
    tStd.className = `text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center ${size === "std" ? activeClass : inactiveClass}`;
    tLg.className = `text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center ${size === "lg" ? activeClass : inactiveClass}`;
    tXl.className = `text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center ${size === "xl" ? activeClass : inactiveClass}`;
  }
}

export function cycleTextSize() {
  const sizes = ["std", "lg", "xl"];
  const nextIdx = (sizes.indexOf(currentTextSize) + 1) % sizes.length;
  applyTextSize(sizes[nextIdx]);
}

export function applyThemeMode(mode) {
  currentThemeMode = mode;
  const root = document.documentElement;

  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  const topbarBtn = document.getElementById("topbar-theme-btn");
  if (topbarBtn) {
    topbarBtn.innerHTML = themeSolidIcons[mode] || themeSolidIcons.system;
  }

  const tLight = document.getElementById("theme-pill-light");
  const tDark = document.getElementById("theme-pill-dark");
  const tSys = document.getElementById("theme-pill-system");

  const activeClass = "bg-blue-600 text-white font-extrabold shadow-xs";
  const inactiveClass = "text-slate-600 dark:text-slate-300 font-bold bg-transparent hover:text-slate-900 dark:hover:text-white";

  if (tLight && tDark && tSys) {
    tLight.className = `theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${mode === "light" ? activeClass : inactiveClass}`;
    tDark.className = `theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${mode === "dark" ? activeClass : inactiveClass}`;
    tSys.className = `theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${mode === "system" ? activeClass : inactiveClass}`;
  }
}

export function cycleThemeMode() {
  const modes = ["system", "light", "dark"];
  const nextIdx = (modes.indexOf(currentThemeMode) + 1) % modes.length;
  applyThemeMode(modes[nextIdx]);
}

export function updateThresholdPills(days = getThresholdDays()) {
  const t30 = document.getElementById("threshold-pill-30");
  const t60 = document.getElementById("threshold-pill-60");
  const t90 = document.getElementById("threshold-pill-90");

  const activeClass = "bg-blue-600 text-white font-extrabold shadow-xs";
  const inactiveClass = "text-slate-600 dark:text-slate-300 font-bold bg-transparent hover:text-slate-900 dark:hover:text-white";

  if (t30 && t60 && t90) {
    t30.className = `threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${days === 30 ? activeClass : inactiveClass}`;
    t60.className = `threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${days === 60 ? activeClass : inactiveClass}`;
    t90.className = `threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${days === 90 ? activeClass : inactiveClass}`;
  }
}

export function updateFreshnessLimitPills(limit = getFreshnessLimit()) {
  const f14 = document.getElementById("freshness-limit-14");
  const f30 = document.getElementById("freshness-limit-30");

  const activeClass = "bg-blue-600 text-white font-extrabold shadow-xs";
  const inactiveClass = "text-slate-600 dark:text-slate-300 font-bold bg-transparent hover:text-slate-900 dark:hover:text-white";

  if (f14 && f30) {
    f14.className = `freshness-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${limit === 14 ? activeClass : inactiveClass}`;
    f30.className = `freshness-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${limit === 30 ? activeClass : inactiveClass}`;
  }
}

export function updateHistoryLimitPills(limit = getHistoryLimit()) {
  const h10 = document.getElementById("history-limit-10");
  const h20 = document.getElementById("history-limit-20");
  const h30 = document.getElementById("history-limit-30");

  const activeClass = "bg-blue-600 text-white font-extrabold shadow-xs";
  const inactiveClass = "text-slate-600 dark:text-slate-300 font-bold bg-transparent hover:text-slate-900 dark:hover:text-white";

  if (h10 && h20 && h30) {
    h10.className = `history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${limit === 10 ? activeClass : inactiveClass}`;
    h20.className = `history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${limit === 20 ? activeClass : inactiveClass}`;
    h30.className = `history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${limit === 30 ? activeClass : inactiveClass}`;
  }
}

// ----------------------------------------------------
// TOUCH GESTURE SWIPE-TO-DISMISS & GRABBER CONTROLLER
// ----------------------------------------------------
let startY = 0;
let currentY = 0;
let isDragging = false;

function initGrabberGesture() {
  const menu = document.getElementById("bottom-sheet-menu");
  const dragHandle = document.getElementById("sheet-drag-handle");
  if (!menu || !dragHandle) return;

  const handleTouchStart = (e) => {
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    currentY = startY;
    isDragging = true;
    menu.style.transition = 'none';
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY;

    if (deltaY >= 0) {
      menu.style.transform = `translateY(${deltaY}px)`;
    } else {
      menu.style.transform = `translateY(${deltaY * 0.2}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;

    const deltaY = currentY - startY;
    const menuHeight = menu.offsetHeight || (window.innerHeight * 0.8);
    const halfwayThreshold = menuHeight * 0.5;

    if (deltaY > halfwayThreshold) {
      closeMenu();
    } else {
      menu.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      menu.style.transform = 'translateY(0px)';
      setTimeout(() => {
        if (!isDragging) {
          menu.style.transition = '';
        }
      }, 300);
    }
  };

  dragHandle.addEventListener("touchstart", handleTouchStart, { passive: true });
  dragHandle.addEventListener("touchmove", handleTouchMove, { passive: true });
  dragHandle.addEventListener("touchend", handleTouchEnd);

  dragHandle.addEventListener("mousedown", handleTouchStart);
  window.addEventListener("mousemove", handleTouchMove);
  window.addEventListener("mouseup", handleTouchEnd);
}

export function openMenu() {
  const menu = document.getElementById("bottom-sheet-menu");
  const overlay = document.getElementById("bottom-sheet-overlay");
  const dock = document.getElementById("persistent-dock");

  if (!menu || !overlay) return;

  if (dock) {
    dock.style.transform = "translateY(120%)";
  }

  overlay.classList.remove("hidden");
  menu.classList.remove("hidden");

  // Sync all preference pill selections
  applyTextSize(currentTextSize);
  applyThemeMode(currentThemeMode);
  updateThresholdPills();
  updateHistoryLimitPills();
  updateFreshnessLimitPills();

  menu.style.transition = "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
  menu.style.transform = "translateY(120%)";

  requestAnimationFrame(() => {
    overlay.classList.remove("opacity-0");
    overlay.classList.add("opacity-100");
    menu.style.transform = "translateY(0px)";
  });
}

export function closeMenu() {
  const menu = document.getElementById("bottom-sheet-menu");
  const overlay = document.getElementById("bottom-sheet-overlay");
  const dock = document.getElementById("persistent-dock");

  if (!menu || !overlay) return;

  stopScanner();

  overlay.classList.remove("opacity-100");
  overlay.classList.add("opacity-0");

  menu.style.transition = "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
  menu.style.transform = "translateY(120%)";

  setTimeout(() => {
    overlay.classList.add("hidden");
    menu.classList.add("hidden");
    menu.style.transform = "";
    menu.style.transition = "";

    if (dock) {
      const topbarHeight = 48;
      const dockMaxTravel = 80;
      const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const clampedScrollY = Math.max(0, Math.min(window.scrollY, maxScrollY));
      const progress = Math.min(1, clampedScrollY / topbarHeight);
      dock.style.transform = `translateY(${progress * dockMaxTravel}px)`;
    }

    showSubPane("pane-main");
  }, 300);
}

export function showSubPane(paneId) {
  const subPanes = document.querySelectorAll(".sub-pane");
  subPanes.forEach(pane => {
    if (pane.id === paneId) {
      pane.classList.remove("hidden");
    } else {
      pane.classList.add("hidden");
    }
  });
}

export function initNavigationBars() {
  if (!document.getElementById("persistent-topbar")) {
    document.body.insertAdjacentHTML('afterbegin', topbarHTML);
  }
  if (!document.getElementById("persistent-dock")) {
    document.body.insertAdjacentHTML('beforeend', dockHTML);
  }
  if (!document.getElementById("bottom-sheet-menu")) {
    document.body.insertAdjacentHTML('beforeend', menuHTML);
  }

  const topbar = document.getElementById("persistent-topbar");
  const dock = document.getElementById("persistent-dock");

  // Keep topbar strictly hidden on initial page load
  if (topbar) {
    topbar.style.transform = "translateY(-100%)";
    topbar.style.opacity = "0";
  }

  const topbarHeight = 48;
  const dockMaxTravel = 80;

  const getMaxScrollY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  let lastClampedScrollY = Math.max(0, Math.min(window.scrollY, getMaxScrollY()));

  window.addEventListener("scroll", () => {
    const menu = document.getElementById("bottom-sheet-menu");
    if (menu && !menu.classList.contains("hidden")) return;

    const maxScrollY = getMaxScrollY();
    const clampedScrollY = Math.max(0, Math.min(window.scrollY, maxScrollY));
    const delta = clampedScrollY - lastClampedScrollY;

    let progress = 0;
    if (clampedScrollY <= 2) {
      progress = 0;
    } else {
      progress = Math.min(1, clampedScrollY / topbarHeight);
    }

    if (dock) {
      dock.style.transform = `translateY(${progress * dockMaxTravel}px)`;
    }
    if (topbar) {
      const topbarTranslate = -100 + (progress * 100);
      topbar.style.transform = `translateY(${topbarTranslate}%)`;
      topbar.style.opacity = progress.toFixed(2);
    }

    lastClampedScrollY = clampedScrollY;
  }, { passive: true });

  // Connect Top Bar toggle buttons
  document.getElementById("topbar-text-btn")?.addEventListener("click", cycleTextSize);
  document.getElementById("topbar-theme-btn")?.addEventListener("click", cycleThemeMode);

  // Connect Text Size Pills in Menu
  document.getElementById("text-pill-std")?.addEventListener("click", () => applyTextSize("std"));
  document.getElementById("text-pill-lg")?.addEventListener("click", () => applyTextSize("lg"));
  document.getElementById("text-pill-xl")?.addEventListener("click", () => applyTextSize("xl"));

  // Connect Theme Pills in Menu
  document.getElementById("theme-pill-light")?.addEventListener("click", () => applyThemeMode("light"));
  document.getElementById("theme-pill-dark")?.addEventListener("click", () => applyThemeMode("dark"));
  document.getElementById("theme-pill-system")?.addEventListener("click", () => applyThemeMode("system"));

  // Connect Threshold Pills in Menu
  document.getElementById("threshold-pill-30")?.addEventListener("click", () => {
    setThresholdDays(30);
    updateThresholdPills(30);
  });
  document.getElementById("threshold-pill-60")?.addEventListener("click", () => {
    setThresholdDays(60);
    updateThresholdPills(60);
  });
  document.getElementById("threshold-pill-90")?.addEventListener("click", () => {
    setThresholdDays(90);
    updateThresholdPills(90);
  });

  // Connect Freshness Limit Pills in Menu
  document.getElementById("freshness-limit-14")?.addEventListener("click", () => {
    setFreshnessLimit(14);
    updateFreshnessLimitPills(14);
  });
  document.getElementById("freshness-limit-30")?.addEventListener("click", () => {
    setFreshnessLimit(30);
    updateFreshnessLimitPills(30);
  });

  // Connect Scan History Limit Pills in Menu
  document.getElementById("history-limit-10")?.addEventListener("click", () => {
    setHistoryLimit(10);
    updateHistoryLimitPills(10);
  });
  document.getElementById("history-limit-20")?.addEventListener("click", () => {
    setHistoryLimit(20);
    updateHistoryLimitPills(20);
  });
  document.getElementById("history-limit-30")?.addEventListener("click", () => {
    setHistoryLimit(30);
    updateHistoryLimitPills(30);
  });

  // Connect Dock buttons
  document.getElementById("dock-menu-btn")?.addEventListener("click", openMenu);
  document.getElementById("dock-scan-btn")?.addEventListener("click", showScannerView);
  document.getElementById("dock-dashboard-btn")?.addEventListener("click", () => showView("result-view"));
  document.getElementById("dock-history-btn")?.addEventListener("click", () => {
    openMenu();
    renderHistoryList();
  });

  document.getElementById("bottom-sheet-overlay")?.addEventListener("click", closeMenu);
  initGrabberGesture();
}

export function updateNetworkStatus() {
  const isOffline = !navigator.onLine;
  const banner = document.getElementById("network-banner");
  if (banner) {
    if (isOffline) {
      banner.classList.remove("hidden");
    } else {
      banner.classList.add("hidden");
    }
  }
}

export function showView(viewId) {
  const views = ["scanner-view", "loading-view", "result-view"];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) {
      if (v === viewId) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    }
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showScannerView() {
  showView("scanner-view");
}

export function showLoading(msg = "Fetching digital licence...") {
  const textEl = document.getElementById("loading-text");
  if (textEl) textEl.innerText = msg;
  showView("loading-view");
}

export function showError(msg = "Failed to process licence") {
  const errorEl = document.getElementById("error-text");
  if (errorEl) errorEl.innerText = msg;
  showView("scanner-view");
}

export function switchResultTab(tabName) {
  const tabs = ["overview", "caam", "mab"];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const pane = document.getElementById(`tab-pane-${t}`);
    if (btn && pane) {
      if (t === tabName) {
        btn.classList.add("bg-blue-600", "text-white", "shadow-sm");
        btn.classList.remove("text-slate-600", "dark:text-slate-300", "hover:text-slate-900");
        pane.classList.remove("hidden");
      } else {
        btn.classList.remove("bg-blue-600", "text-white", "shadow-sm");
        btn.classList.add("text-slate-600", "dark:text-slate-300", "hover:text-slate-900");
        pane.classList.add("hidden");
      }
    }
  });
}
