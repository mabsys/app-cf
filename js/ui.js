// js/ui.js - View State, Navigation, and Network Controller

import { stopScanner } from './scanner.js';
import { renderHistoryList, getThresholdDays, setThresholdDays, getHistoryLimit, setHistoryLimit, getFreshnessLimit, setFreshnessLimit } from './storage.js';
import { topbarHTML } from './components/topbar.js';
import { dockHTML } from './components/dock.js';
import { menuHTML } from './components/menu.js';

// ----------------------------------------------------
// 1. DYNAMIC TEXT SCALING (Scoped to <main>)
// ----------------------------------------------------
const textSizeIcons = {
  std: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l3-7 3 7M5 15h4"/><path d="M13 18l4-11 4 11M14 14h6"/><path d="M11 7h2"/></svg>`,
  lg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l3-7 3 7M5 15h4"/><path d="M13 18l4-11 4 11M14 14h6"/><path d="M11 6l1-1 1 1"/></svg>`,
  xl: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l3-7 3 7M5 15h4"/><path d="M13 18l4-11 4 11M14 14h6"/><path d="M11 6l1-1 1 1M11 3l1-1 1 1"/></svg>`
};

let currentTextSize = localStorage.getItem("app_text_size") || "std";

export function applyTextSize(size = currentTextSize) {
  currentTextSize = size;
  localStorage.setItem("app_text_size", size);

  const topbarTextBtn = document.getElementById("topbar-text-btn");
  if (topbarTextBtn) {
    topbarTextBtn.innerHTML = textSizeIcons[size] || textSizeIcons.std;
  }

  // Highlight Text Scale Pill Buttons
  const tStd = document.getElementById("text-pill-std");
  const tLg = document.getElementById("text-pill-lg");
  const tXl = document.getElementById("text-pill-xl");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold bg-transparent";

  if (tStd && tLg && tXl) {
    tStd.className = `text-pill-btn py-2 px-2 text-xs rounded-lg transition-all flex items-center justify-center cursor-pointer ${size === "std" ? activeClass : inactiveClass}`;
    tLg.className = `text-pill-btn py-2 px-2 text-xs rounded-lg transition-all flex items-center justify-center cursor-pointer ${size === "lg" ? activeClass : inactiveClass}`;
    tXl.className = `text-pill-btn py-2 px-2 text-xs rounded-lg transition-all flex items-center justify-center cursor-pointer ${size === "xl" ? activeClass : inactiveClass}`;
  }

  document.documentElement.style.fontSize = "100%";

  let styleEl = document.getElementById("certifly-text-scale-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "certifly-text-scale-style";
    document.head.appendChild(styleEl);
  }

  if (size === "std") {
    styleEl.textContent = "";
    return;
  }

  const mult = size === "lg" ? 1.15 : 1.30;

  styleEl.textContent = `
    main { font-size: ${(mult * 100).toFixed(1)}% !important; }
    main .text-\[9px\] { font-size: ${(9 * mult).toFixed(1)}px !important; }
    main .text-\[10px\] { font-size: ${(10 * mult).toFixed(1)}px !important; }
    main .text-\[11px\] { font-size: ${(11 * mult).toFixed(1)}px !important; }
    main .text-\[13px\] { font-size: ${(13 * mult).toFixed(1)}px !important; }
    main .text-xxs { font-size: ${(0.625 * mult).toFixed(4)}rem !important; }
    main .text-xs { font-size: ${(0.75 * mult).toFixed(4)}rem !important; }
    main .text-sm { font-size: ${(0.875 * mult).toFixed(4)}rem !important; }
    main .text-base { font-size: ${(1.0 * mult).toFixed(4)}rem !important; }
    main .text-lg { font-size: ${(1.125 * mult).toFixed(4)}rem !important; }
    main .text-xl { font-size: ${(1.25 * mult).toFixed(4)}rem !important; }
    main .text-2xl { font-size: ${(1.5 * mult).toFixed(4)}rem !important; }
    main .text-3xl { font-size: ${(1.875 * mult).toFixed(4)}rem !important; }
    main .text-4xl { font-size: ${(2.25 * mult).toFixed(4)}rem !important; }
  `;
}

export function cycleTextSize() {
  const sizes = ["std", "lg", "xl"];
  const nextIndex = (sizes.indexOf(currentTextSize) + 1) % sizes.length;
  applyTextSize(sizes[nextIndex]);
}

// ----------------------------------------------------
// 2. APPEARANCE THEME CYCLER
// ----------------------------------------------------
const themeSolidIcons = {
  system: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M6 3.5A1.5 1.5 0 0 1 7.5 2h5A1.5 1.5 0 0 1 14 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 6 16.5v-13ZM10 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/></svg>`,
  light: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM4.25 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 4.25 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.061ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.06 1.06l1.06 1.06Z"/></svg>`,
  dark: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .868.397 6.5 6.5 0 1 0 9.277 9.277.75.75 0 0 1 1.266.697 8 8 0 1 1-11.808-10.102.75.75 0 0 1 .397-.269Z" clip-rule="evenodd"/></svg>`
};

let currentThemeMode = localStorage.getItem("app_theme_mode") || "system";

export function applyThemeMode(mode = currentThemeMode) {
  currentThemeMode = mode;
  localStorage.setItem("app_theme_mode", mode);

  const topbarBtn = document.getElementById("topbar-theme-btn");
  if (topbarBtn) {
    topbarBtn.innerHTML = themeSolidIcons[mode] || themeSolidIcons.system;
  }

  // Highlight Theme Mode Pill Buttons
  const tLight = document.getElementById("theme-pill-light");
  const tDark = document.getElementById("theme-pill-dark");
  const tSys = document.getElementById("theme-pill-system");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold bg-transparent";

  if (tLight && tDark && tSys) {
    tLight.className = `theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${mode === "light" ? activeClass : inactiveClass}`;
    tDark.className = `theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${mode === "dark" ? activeClass : inactiveClass}`;
    tSys.className = `theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${mode === "system" ? activeClass : inactiveClass}`;
  }

  const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function cycleThemeMode() {
  const modes = ["system", "light", "dark"];
  const nextIndex = (modes.indexOf(currentThemeMode) + 1) % modes.length;
  applyThemeMode(modes[nextIndex]);
}

// ----------------------------------------------------
// 3. THRESHOLD, FRESHNESS & HISTORY LIMIT PILL CONTROLLERS
// ----------------------------------------------------
export function updateThresholdPills(days = getThresholdDays()) {
  const t30 = document.getElementById("threshold-pill-30");
  const t60 = document.getElementById("threshold-pill-60");
  const t90 = document.getElementById("threshold-pill-90");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold bg-transparent";

  if (t30 && t60 && t90) {
    t30.className = `threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${days === 30 ? activeClass : inactiveClass}`;
    t60.className = `threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${days === 60 ? activeClass : inactiveClass}`;
    t90.className = `threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${days === 90 ? activeClass : inactiveClass}`;
  }
}

export function updateFreshnessLimitPills(limit = getFreshnessLimit()) {
  const f14 = document.getElementById("freshness-limit-14");
  const f30 = document.getElementById("freshness-limit-30");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold bg-transparent";

  if (f14 && f30) {
    f14.className = `freshness-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${limit === 14 ? activeClass : inactiveClass}`;
    f30.className = `freshness-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${limit === 30 ? activeClass : inactiveClass}`;
  }
}

export function updateHistoryLimitPills(limit = getHistoryLimit()) {
  const h10 = document.getElementById("history-limit-10");
  const h20 = document.getElementById("history-limit-20");
  const h30 = document.getElementById("history-limit-30");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold bg-transparent";

  if (h10 && h20 && h30) {
    h10.className = `history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${limit === 10 ? activeClass : inactiveClass}`;
    h20.className = `history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${limit === 20 ? activeClass : inactiveClass}`;
    h30.className = `history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all cursor-pointer ${limit === 30 ? activeClass : inactiveClass}`;
  }
}

// ----------------------------------------------------
// 4. FLOATING MENU & GESTURE SWIPE-TO-DISMISS
// ----------------------------------------------------
let startY = 0;
let currentY = 0;
let isDragging = false;

export function openMenu() {
  const menu = document.getElementById("bottom-sheet-menu");
  const overlay = document.getElementById("bottom-sheet-overlay");
  const dock = document.getElementById("persistent-dock");

  if (!menu || !overlay) return;

  // Hide persistent dock while menu pane is active
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

  stopScanner(); // Stop inline camera stream if running

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

    // Reset sub-panes to main
    const paneMain = document.getElementById("pane-main");
    const subPanes = document.querySelectorAll(".sub-pane");
    if (paneMain) {
      paneMain.classList.remove("opacity-0", "pointer-events-none");
      paneMain.classList.add("opacity-100", "pointer-events-auto");
    }
    subPanes.forEach(pane => {
      pane.classList.remove("translate-x-0", "opacity-100", "pointer-events-auto");
      pane.classList.add("translate-x-full", "opacity-0", "pointer-events-none", "hidden");
    });
  }, 300);
}

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
    const halfwayThreshold = menuHeight * 0.4;

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

// ----------------------------------------------------
// 5. DUAL NAVIGATION BARS (Top Bar + Bottom Dock)
// ----------------------------------------------------
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
  // Force topbar to start hidden on initial load/cache clear
  if (topbar) {
    topbar.style.transform = "translateY(-100%)";
    topbar.style.opacity = "0";
  }
  
  const dock = document.getElementById("persistent-dock");
  const topbarHeight = 48;
  const dockMaxTravel = 80;
  let currentTranslateY = 0;

  const getMaxScrollY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  let lastClampedScrollY = Math.max(0, Math.min(window.scrollY, getMaxScrollY()));

  window.addEventListener("scroll", () => {
    const menu = document.getElementById("bottom-sheet-menu");
    if (menu && !menu.classList.contains("hidden")) return;

    const maxScrollY = getMaxScrollY();
    const clampedScrollY = Math.max(0, Math.min(window.scrollY, maxScrollY));
    const delta = clampedScrollY - lastClampedScrollY;

    if (clampedScrollY <= 2) {
      currentTranslateY = 0;
    } else if (delta !== 0) {
      currentTranslateY += delta;
      currentTranslateY = Math.max(0, Math.min(currentTranslateY, topbarHeight));
    }

    const progress = currentTranslateY / topbarHeight;

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

  // Connect Menu Preference Pill Buttons DIRECTLY
  document.getElementById("theme-pill-light")?.addEventListener("click", () => applyThemeMode("light"));
  document.getElementById("theme-pill-dark")?.addEventListener("click", () => applyThemeMode("dark"));
  document.getElementById("theme-pill-system")?.addEventListener("click", () => applyThemeMode("system"));

  document.getElementById("text-pill-std")?.addEventListener("click", () => applyTextSize("std"));
  document.getElementById("text-pill-lg")?.addEventListener("click", () => applyTextSize("lg"));
  document.getElementById("text-pill-xl")?.addEventListener("click", () => applyTextSize("xl"));

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

  document.getElementById("freshness-limit-14")?.addEventListener("click", () => {
    setFreshnessLimit(14);
    updateFreshnessLimitPills(14);
  });
  document.getElementById("freshness-limit-30")?.addEventListener("click", () => {
    setFreshnessLimit(30);
    updateFreshnessLimitPills(30);
  });

  // Connect Dock buttons
  document.getElementById("dock-menu-btn")?.addEventListener("click", openMenu);
  document.getElementById("dock-scan-btn")?.addEventListener("click", showScannerView);
  document.getElementById("dock-dashboard-btn")?.addEventListener("click", () => showView("result-view"));
  document.getElementById("dock-history-btn")?.addEventListener("click", () => {
    const historyDetails = document.getElementById("history-details");
    if (historyDetails) {
      if (historyDetails.hasAttribute("open")) {
        historyDetails.removeAttribute("open");
      } else {
        historyDetails.setAttribute("open", "");
      }
    }
  });

  // Attach overlay close listener
  document.getElementById("bottom-sheet-overlay")?.addEventListener("click", closeMenu);

  // Subpane Navigation logic inside menu sheet
  document.addEventListener("click", (e) => {
    const navBtn = e.target.closest(".nav-item-btn");
    if (navBtn) {
      const targetId = navBtn.getAttribute("data-target");
      const targetPane = document.getElementById(targetId);
      const paneMain = document.getElementById("pane-main");

      if (targetPane && paneMain) {
        paneMain.classList.add("opacity-0", "pointer-events-none");
        paneMain.classList.remove("opacity-100", "pointer-events-auto");

        targetPane.classList.remove("hidden", "translate-x-full", "opacity-0", "pointer-events-none");
        targetPane.classList.add("translate-x-0", "opacity-100", "pointer-events-auto");
      }
    }

    const backBtn = e.target.closest(".back-btn");
    if (backBtn) {
      const subPane = backBtn.closest(".sub-pane");
      const paneMain = document.getElementById("pane-main");

      if (subPane && paneMain) {
        stopScanner();

        subPane.classList.remove("translate-x-0", "opacity-100", "pointer-events-auto");
        subPane.classList.add("translate-x-full", "opacity-0", "pointer-events-none");

        paneMain.classList.remove("opacity-0", "pointer-events-none");
        paneMain.classList.add("opacity-100", "pointer-events-auto");

        setTimeout(() => {
          subPane.classList.add("hidden");
        }, 300);
      }
    }
  });

  initGrabberGesture();
  applyTextSize(currentTextSize);
  applyThemeMode(currentThemeMode);
  updateThresholdPills();
  updateHistoryLimitPills();
  updateFreshnessLimitPills();
}

// ----------------------------------------------------
// 6. NETWORK STATUS CONTROLLER
// ----------------------------------------------------
export function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const overlay = document.getElementById("offline-overlay");
  const startScanBtn = document.getElementById("start-scan-btn");
  const submitUrlBtn = document.getElementById("submit-url-btn");
  const manualInput = document.getElementById("manual-url-input");
  const openOriginalBtn = document.getElementById("open-original-btn");
  const checkerBadge = document.getElementById("checker-status-badge");

  if (overlay) {
    if (isOnline) {
      overlay.classList.add("hidden");
    } else {
      overlay.classList.remove("hidden");
      stopScanner();
    }
  }

  if (checkerBadge) {
    if (isOnline) {
      checkerBadge.innerText = "Checker Active";
      checkerBadge.className = "text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-bold uppercase transition-all duration-300 ease-in-out";
    } else {
      checkerBadge.innerText = "Cached View";
      checkerBadge.className = "text-[10px] text-gray-50 bg-gray-500 px-2 py-0.5 rounded-md font-bold uppercase transition-all duration-300 ease-in-out";
    }
  }

  if (startScanBtn) {
    startScanBtn.disabled = !isOnline;
    startScanBtn.classList.toggle("opacity-50", !isOnline);
    startScanBtn.classList.toggle("cursor-not-allowed", !isOnline);
  }

  if (submitUrlBtn) {
    submitUrlBtn.disabled = !isOnline;
    submitUrlBtn.classList.toggle("opacity-50", !isOnline);
    submitUrlBtn.classList.toggle("cursor-not-allowed", !isOnline);
  }

  if (manualInput) {
    manualInput.disabled = !isOnline;
  }

  if (openOriginalBtn) {
    openOriginalBtn.disabled = !isOnline;
    openOriginalBtn.classList.toggle("opacity-50", !isOnline);
    openOriginalBtn.classList.toggle("cursor-not-allowed", !isOnline);
  }
}

// ----------------------------------------------------
// 7. VIEW STATE CONTROLLER
// ----------------------------------------------------
export function showView(viewId) {
  document.querySelectorAll(".app-view").forEach(view => {
    view.classList.add("hidden");
  });

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.remove("hidden");

  if (viewId === "result-view") {
    const savedTab = localStorage.getItem("certifly_active_tab") || "overview";
    switchResultTab(savedTab);
  }

  const historyWrapper = document.getElementById("history-card-wrapper");
  if (historyWrapper) {
    if (viewId === "scanner-view") {
      historyWrapper.classList.remove("hidden");
    } else {
      historyWrapper.classList.add("hidden");
    }
  }

  const historyDetails = document.getElementById("history-details");
  if (historyDetails) historyDetails.removeAttribute("open");
}

export function showScannerView() {
  stopScanner();
  const errorMsg = document.getElementById("error-message");
  if (errorMsg) errorMsg.innerText = "";

  const manualInput = document.getElementById("manual-url-input");
  if (manualInput) manualInput.value = "";

  document.body.classList.remove("bg-green-100", "bg-orange-100", "bg-red-100");
  document.body.classList.add("bg-slate-50");

  renderHistoryList();
  showView("scanner-view");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showLoading(msg = "Fetching digital licence...") {
  const loadingText = document.getElementById("loading-text");
  if (loadingText) loadingText.innerText = msg;
  showView("loading-view");
}

export function showError(msg) {
  stopScanner();
  const errMsg = document.getElementById("error-message");
  if (errMsg) {
    errMsg.innerHTML = msg;
  } else {
    alert(msg);
  }

  const manualInput = document.getElementById("manual-url-input");
  if (manualInput) manualInput.value = "";

  showView("scanner-view");
}

window.showScannerView = showScannerView;

// ----------------------------------------------------
// RESULT VIEW TAB SWITCHER (Overview | CAAM | MAB)
// ----------------------------------------------------
export function switchResultTab(tabName = 'overview') {
  const tabs = ['overview', 'caam', 'mab'];
  const activeTab = tabs.includes(tabName) ? tabName : 'overview';
  localStorage.setItem('certifly_active_tab', activeTab);

  const baseBtnClass = 'res-tab-btn py-2 px-1 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer';
  const activeClass = baseBtnClass + ' bg-blue-600 text-white shadow-xs font-extrabold';
  const inactiveClass = baseBtnClass + ' text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold bg-transparent';

  tabs.forEach(t => {
    const btn = document.getElementById('res-tab-btn-' + t);
    const pane = document.getElementById('tab-' + t + '-content');

    if (btn) {
      btn.className = (t === activeTab) ? activeClass : inactiveClass;
    }
    if (pane) {
      if (t === activeTab) {
        pane.classList.remove('hidden');
      } else {
        pane.classList.add('hidden');
      }
    }
  });
}
window.switchResultTab = switchResultTab;
