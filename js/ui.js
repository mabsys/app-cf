// ./js/ui.js (2810_R275) - CertiFly Navigation, View Controller & UI State
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import { initToolsModule, runToolCalculation, setToolsTab, getToolsState, getSectorCount, setSectorCount } from './tools.js';
import { stopScanner, switchScanHubTab } from './scanner.js';
import { renderHistoryList, getThresholdDays, getHistoryLimit, getFreshnessLimit, setFreshnessLimit, hasProfileData, getProfileData, getAttestationData } from './storage.js';
import { topbarHTML } from './components/topbar.js';
import { dockHTML } from './components/dock.js';
import { menuHTML } from './components/menu.js';

const textSizeIcons = {
  std: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l3-7 3 7M5 15h4"/><path d="M13 18l4-11 4 11M14 14h6"/><path d="M11 7h2"/></svg>`,
  lg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l3-7 3 7M5 15h4"/><path d="M13 18l4-11 4 11M14 14h6"/><path d="M11 6l1-1 1 1"/></svg>`,
  xl: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l3-7 3 7M5 15h4"/><path d="M13 18l4-11 4 11M14 14h6"/><path d="M11 6l1-1 1 1M11 3l1-1 1 1"/></svg>`
};

let currentTextSize = localStorage.getItem("certifly_text_size") || localStorage.getItem("app_text_size") || "std";

export function applyTextSize(size = currentTextSize) {
  currentTextSize = size;
  localStorage.setItem("certifly_text_size", size);
  localStorage.setItem("app_text_size", size);

  const topbarTextBtn = document.getElementById("topbar-text-btn");
  if (topbarTextBtn) {
    topbarTextBtn.innerHTML = textSizeIcons[size] || textSizeIcons.std;
  }

  const tStd = document.getElementById("text-pill-std");
  const tLg = document.getElementById("text-pill-lg");
  const tXl = document.getElementById("text-pill-xl");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold";

  if (tStd && tLg && tXl) {
    tStd.className = `text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center ${size === "std" ? activeClass : inactiveClass}`;
    tLg.className = `text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center ${size === "lg" ? activeClass : inactiveClass}`;
    tXl.className = `text-pill-btn py-2 px-2 rounded-lg transition-all flex items-center justify-center ${size === "xl" ? activeClass : inactiveClass}`;
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

const themeSolidIcons = {
  system: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>`,
  light: `<svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25m-13.5 0H3m15.364 6.364l-1.591-1.591M6.758 6.758L5.167 5.167m12.728 0l-1.591 1.591M6.758 17.242l-1.591 1.591M12 18a6 6 0 100-12 6 6 0 000 12z" /></svg>`,
  dark: `<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>`
};

let currentThemeMode = localStorage.getItem("certifly_theme_mode") || localStorage.getItem("app_theme_mode") || "system";

export function applyThemeMode(mode = currentThemeMode) {
  currentThemeMode = mode;
  localStorage.setItem("certifly_theme_mode", mode);
  localStorage.setItem("app_theme_mode", mode);

  const topbarBtn = document.getElementById("topbar-theme-btn");
  if (topbarBtn) {
    topbarBtn.innerHTML = themeSolidIcons[mode] || themeSolidIcons.system;
  }

  const tLight = document.getElementById("theme-pill-light");
  const tDark = document.getElementById("theme-pill-dark");
  const tSys = document.getElementById("theme-pill-system");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold";

  if (tLight && tDark && tSys) {
    tLight.className = `theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${mode === "light" ? activeClass : inactiveClass}`;
    tDark.className = `theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${mode === "dark" ? activeClass : inactiveClass}`;
    tSys.className = `theme-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${mode === "system" ? activeClass : inactiveClass}`;
  }

  const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function cycleThemeMode() {
  const modes = ["system", "light", "dark"];
  const nextIndex = (modes.indexOf(currentThemeMode) + 1) % modes.length;
  applyThemeMode(modes[nextIndex]);
}

export function updateThresholdPills(days = getThresholdDays()) {
  const t30 = document.getElementById("threshold-pill-30");
  const t60 = document.getElementById("threshold-pill-60");
  const t90 = document.getElementById("threshold-pill-90");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold";

  if (t30 && t60 && t90) {
    t30.className = `threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${days === 30 ? activeClass : inactiveClass}`;
    t60.className = `threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${days === 60 ? activeClass : inactiveClass}`;
    t90.className = `threshold-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${days === 90 ? activeClass : inactiveClass}`;
  }
}

export function updateFreshnessLimitPills(limit = getFreshnessLimit()) {
  const f14 = document.getElementById("freshness-limit-14");
  const f30 = document.getElementById("freshness-limit-30");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold bg-transparent";

  if (f14 && f30) {
    f14.className = `freshness-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${limit === 14 ? activeClass : inactiveClass}`;
    f30.className = `freshness-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${limit === 30 ? activeClass : inactiveClass}`;
  }
}

export function updateHistoryLimitPills(limit = getHistoryLimit()) {
  const h10 = document.getElementById("history-limit-10");
  const h20 = document.getElementById("history-limit-20");
  const h30 = document.getElementById("history-limit-30");

  const activeClass = "bg-blue-600 text-white shadow-xs font-extrabold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold";

  if (h10 && h20 && h30) {
    h10.className = `history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${limit === 10 ? activeClass : inactiveClass}`;
    h20.className = `history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${limit === 20 ? activeClass : inactiveClass}`;
    h30.className = `history-limit-pill-btn py-2 px-2 text-xs rounded-lg transition-all ${limit === 30 ? activeClass : inactiveClass}`;
  }
}

export function updateQsPdfBadge(fileName) {
  const qsLabel = document.getElementById("profile-qs-pdf-label");
  const qsBadge = document.getElementById("profile-qs-pdf-badge");
  const qsStatusText = document.getElementById("profile-qs-pdf-status-text");

  if (qsLabel) {
    qsLabel.innerText = fileName || "Select PDF qualification slip file...";
  }

  if (qsBadge && qsStatusText) {
    if (fileName) {
      qsBadge.classList.remove("hidden");
      qsStatusText.innerText = "Stored Qualification Slip (QS) file";
    } else {
      qsBadge.classList.add("hidden");
    }
  }
}

export function updateActiveDockState(activeViewId) {
  const navItems = {
    'dashboard-view': document.getElementById('dock-dashboard-btn'),
    'scanner-view': document.getElementById('dock-scan-btn'),
    'history-view': document.getElementById('dock-history-btn'),
    'tools-view': document.getElementById('dock-tools-btn'),
    'menu-view': document.getElementById('dock-menu-btn')
  };

  Object.entries(navItems).forEach(([vId, btn]) => {
    if (!btn) return;
    const isSelected = (activeViewId === vId);

    if (vId === 'scanner-view') {
      if (isSelected) {
        btn.className = "dock-item-btn w-full py-2 px-1.5 bg-blue-600 text-white font-extrabold rounded-2xl shadow-md transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer";
      } else {
        btn.className = "dock-item-btn w-full py-2 px-1.5 text-blue-600 dark:text-blue-400 font-extrabold hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer";
      }
    } else {
      if (isSelected) {
        btn.className = "dock-item-btn w-full py-2 px-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer";
      } else {
        btn.className = "dock-item-btn w-full py-2 px-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer";
      }
    }
  });
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

  let startY = 0;
  let currentY = 0;
  let isDragging = false;

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

  const topbarHeight = 48;
  if (topbar) {
    topbar.style.transform = "translateY(-100%)";
    topbar.style.opacity = "0";
  }

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

  document.getElementById("topbar-text-btn")?.addEventListener("click", cycleTextSize);
  document.getElementById("topbar-theme-btn")?.addEventListener("click", cycleThemeMode);

  document.getElementById("dock-menu-btn")?.addEventListener("click", openMenu);
  document.getElementById("dock-scan-btn")?.addEventListener("click", showScannerView);
  document.getElementById("dock-dashboard-btn")?.addEventListener("click", () => {
    stopScanner();
    switchResultTab("overview");
    if (window.renderDashboardView) {
      window.renderDashboardView();
    }
    showView("dashboard-view", "overview");
  });
  
  document.getElementById("dock-history-btn")?.addEventListener("click", () => {
    stopScanner();
    renderHistoryList();
    showView("history-view");
  });

  document.getElementById("dock-tools-btn")?.addEventListener("click", () => {
    stopScanner();
    showView("tools-view");
  });

  document.getElementById("btn-result-back")?.addEventListener("click", () => {
    showView("history-view");
  });

  document.getElementById("bottom-sheet-overlay")?.addEventListener("click", closeMenu);

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

export function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const overlay = document.getElementById("offline-overlay");
  const startScanBtn = document.getElementById("start-scan-btn");
  const submitUrlBtn = document.getElementById("submit-url-btn");
  const manualInput = document.getElementById("manual-url-input");
  const openOriginalBtn = document.getElementById("open-original-btn");
  const checkerBadge = document.getElementById("checker-status-badge");
  const historyCacheBadge = document.getElementById("history-cache-badge");

  if (overlay) {
    if (isOnline) overlay.classList.add("hidden");
    else {
      overlay.classList.remove("hidden");
      stopScanner();
    }
  }

  if (checkerBadge) {
    if (isOnline) {
      checkerBadge.innerText = "Checker Active";
      checkerBadge.className = "text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-2 py-0.5 rounded-md font-bold uppercase transition-all duration-300 ease-in-out";
    } else {
      checkerBadge.innerText = "Cached View";
      checkerBadge.className = "text-[10px] text-gray-50 bg-gray-500 px-2 py-0.5 rounded-md font-bold uppercase transition-all duration-300 ease-in-out";
    }
  }

  if (historyCacheBadge) {
    if (isOnline) {
      historyCacheBadge.classList.add("hidden");
    } else {
      historyCacheBadge.classList.remove("hidden");
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

  if (manualInput) manualInput.disabled = !isOnline;

  if (openOriginalBtn) {
    openOriginalBtn.disabled = !isOnline;
    openOriginalBtn.classList.toggle("opacity-50", !isOnline);
    openOriginalBtn.classList.toggle("cursor-not-allowed", !isOnline);
  }
}

export function showView(viewId, defaultTab = null) {
  if (viewId !== "history-view" && typeof window.exitHistoryManageMode === "function") {
    window.exitHistoryManageMode();
  }
  if (viewId !== "scanner-view") {
    stopScanner();
  }

  document.querySelectorAll(".app-view").forEach(view => {
    view.classList.add("hidden");
  });

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.remove("hidden");

  if (viewId === "tools-view") {
    if (typeof window.initToolsModule === "function") window.initToolsModule();
  }

  if (viewId === "history-view") {
    renderHistoryList();
  }

  if (viewId === "dashboard-view") {
    let savedTab = localStorage.getItem("certifly_active_tab") || "overview";
    if (typeof hasProfileData === "function" && !hasProfileData()) {
      savedTab = "overview";
    }
    switchResultTab(savedTab);
  }

  updateActiveDockState(viewId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showScannerView() {
  stopScanner();

  const errorMsg = document.getElementById("error-message");
  if (errorMsg) errorMsg.innerText = "";

  const manualInput = document.getElementById("manual-url-input");
  if (manualInput) manualInput.value = "";

  document.body.classList.remove("bg-green-100", "bg-orange-100", "bg-red-100");
  document.body.classList.add("bg-slate-50");

  showView("scanner-view");

  if (typeof switchScanHubTab === "function") {
    switchScanHubTab("camera");
  }

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
    errMsg.classList.remove("hidden");
  } else {
    alert(msg);
  }

  const manualInput = document.getElementById("manual-url-input");
  if (manualInput) manualInput.value = "";

  showView("scanner-view");
}

export function switchResultTab(tabName = 'overview') {
  const tabs = ['overview', 'caam', 'mab'];
  const activeTab = tabs.includes(tabName) ? tabName : 'overview';
  localStorage.setItem('certifly_active_tab', activeTab);

  const baseBtnClass = 'res-tab-btn py-2 px-1 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer';
  const activeClass = baseBtnClass + ' bg-blue-600 text-white shadow-xs font-extrabold';
  const inactiveClass = baseBtnClass + ' text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold bg-transparent';

  tabs.forEach(t => {
    const btns = document.querySelectorAll('#res-tab-btn-' + t);
    const panes = document.querySelectorAll('#tab-' + t + '-content');

    btns.forEach(btn => {
      btn.className = (t === activeTab) ? activeClass : inactiveClass;
    });

    panes.forEach(pane => {
      if (t === activeTab) {
        pane.classList.remove('hidden');
      } else {
        pane.classList.add('hidden');
      }
    });
  });
}

export function openProfileMenu() {
  openMenu();
  setTimeout(() => {
    const navBtn = document.querySelector('[data-target="pane-profile"]');
    if (navBtn) navBtn.click();
  }, 150);
}

if (typeof window !== 'undefined') {
  window.showScannerView = showScannerView;
  window.switchResultTab = switchResultTab;
  window.openMenu = openMenu;
  window.closeMenu = closeMenu;
  window.openProfileMenu = openProfileMenu;
  window.applyThemeMode = applyThemeMode;
  window.applyTextSize = applyTextSize;
}


// ==================================================================
// PHASE 3: CERTIFLY™ TOOLS VIEW UI CONTROLLER
// ==================================================================

let activeCategory = 'qualifications'; // 'qualifications' | 'dutyrest'
let activeToolCardId = 'tool-card-medical';

export function normalizeToolCardId(rawId) {
  if (!rawId) return 'tool-card-medical';
  const s = String(rawId).toLowerCase().replace('_', '-').trim();
  if (s.includes('med')) return 'tool-card-medical';
  if (s.includes('ppc') || s.includes('lpc')) return 'tool-card-ppc';
  if (s.includes('recurrent')) return 'tool-card-recurrent';
  if (s.includes('recency')) return 'tool-card-recency';
  if (s.includes('standby') || s.includes('stby')) return 'tool-card-standby';
  if (s.includes('max') || s.includes('fdp')) return 'tool-card-maxfdp';
  if (s.includes('pre') || s.includes('rest')) return 'tool-card-preflight';
  if (s.includes('cum')) return 'tool-card-cumulative';
  return s.startsWith('tool-card-') ? s : 'tool-card-' + s;
}

export function switchToolCategory(category) {
  const normCategory = (category === 'dutyrest' || category === 'time' || category === 'fdp') ? 'dutyrest' : 'qualifications';
  const state = getToolsState ? getToolsState() : {};
  if (state) state.activeCategory = normCategory;

  const tabA = document.getElementById('cat-tab-qualifications');
  const tabB = document.getElementById('cat-tab-dutyrest');
  const paneA = document.getElementById('cat-pane-qualifications');
  const paneB = document.getElementById('cat-pane-dutyrest');

  const activeTabClass = 'cat-tab-btn active py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-md cursor-pointer';
  const inactiveTabClass = 'cat-tab-btn py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';

  if (normCategory === 'qualifications') {
    if (tabA) { tabA.className = activeTabClass; tabA.setAttribute('aria-selected', 'true'); }
    if (tabB) { tabB.className = inactiveTabClass; tabB.setAttribute('aria-selected', 'false'); }
    if (paneA) paneA.classList.remove('hidden');
    if (paneB) paneB.classList.add('hidden');

    const catACards = ['tool-card-medical', 'tool-card-ppc', 'tool-card-recurrent', 'tool-card-recency'];
    const targetCard = (state && catACards.includes(state.activeToolId)) ? state.activeToolId : 'tool-card-medical';
    switchActiveTool(targetCard);
  } else {
    if (tabA) { tabA.className = inactiveTabClass; tabA.setAttribute('aria-selected', 'false'); }
    if (tabB) { tabB.className = activeTabClass; tabB.setAttribute('aria-selected', 'true'); }
    if (paneA) paneA.classList.add('hidden');
    if (paneB) paneB.classList.remove('hidden');

    const catBCards = ['tool-card-standby', 'tool-card-maxfdp', 'tool-card-preflight', 'tool-card-cumulative'];
    const targetCard = (state && catBCards.includes(state.activeToolId)) ? state.activeToolId : 'tool-card-standby';
    switchActiveTool(targetCard);
  }
}

export function switchActiveTool(rawId) {
  const toolCardId = normalizeToolCardId(rawId);
  const state = getToolsState ? getToolsState() : {};
  if (state) state.activeToolId = toolCardId;

  const catACards = ['tool-card-medical', 'tool-card-ppc', 'tool-card-recurrent', 'tool-card-recency'];
  const catBCards = ['tool-card-standby', 'tool-card-maxfdp', 'tool-card-preflight', 'tool-card-cumulative'];

  const isCatA = catACards.includes(toolCardId);
  if (state) state.activeCategory = isCatA ? 'qualifications' : 'dutyrest';

  const paneA = document.getElementById('cat-pane-qualifications');
  const paneB = document.getElementById('cat-pane-dutyrest');
  if (paneA && paneB) {
    if (isCatA) {
      paneA.classList.remove('hidden');
      paneB.classList.add('hidden');
    } else {
      paneA.classList.add('hidden');
      paneB.classList.remove('hidden');
    }
  }

  const tabA = document.getElementById('cat-tab-qualifications');
  const tabB = document.getElementById('cat-tab-dutyrest');
  const activeTabClass = 'cat-tab-btn active py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-md cursor-pointer';
  const inactiveTabClass = 'cat-tab-btn py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';
  if (tabA && tabB) {
    if (isCatA) {
      tabA.className = activeTabClass; tabA.setAttribute('aria-selected', 'true');
      tabB.className = inactiveTabClass; tabB.setAttribute('aria-selected', 'false');
    } else {
      tabA.className = inactiveTabClass; tabA.setAttribute('aria-selected', 'false');
      tabB.className = activeTabClass; tabB.setAttribute('aria-selected', 'true');
    }
  }

  const allToolCards = [...catACards, ...catBCards];
  allToolCards.forEach(cardId => {
    const cardEl = document.getElementById(cardId);
    if (!cardEl) return;

    if (cardId === toolCardId) {
      cardEl.classList.remove('hidden');
      cardEl.classList.add('active');

      const inner3d = cardEl.querySelector('.card-3d-inner');
      if (inner3d) {
        inner3d.classList.remove('is-flipped');
      }
    } else {
      cardEl.classList.add('hidden');
      cardEl.classList.remove('active');
    }
  });

  const catAPills = [
    { id: 'pill-tool-medical', card: 'tool-card-medical', idx: 0 },
    { id: 'pill-tool-ppc', card: 'tool-card-ppc', idx: 1 },
    { id: 'pill-tool-recurrent', card: 'tool-card-recurrent', idx: 2 },
    { id: 'pill-tool-recency', card: 'tool-card-recency', idx: 3 }
  ];

  let catAIdx = 0;
  catAPills.forEach(item => {
    const pillBtn = document.getElementById(item.id);
    if (!pillBtn) return;
    if (item.card === toolCardId) {
      catAIdx = item.idx;
      pillBtn.className = "subtab-pill active flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-blue-500/40 bg-blue-500/20 text-blue-400 dark:text-blue-300 cursor-pointer";
    } else {
      pillBtn.className = "subtab-pill flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer";
    }
  });

  const catBPills = [
    { id: 'pill-tool-standby', card: 'tool-card-standby', idx: 0 },
    { id: 'pill-tool-maxfdp', card: 'tool-card-maxfdp', idx: 1 },
    { id: 'pill-tool-preflight', card: 'tool-card-preflight', idx: 2 },
    { id: 'pill-tool-cumulative', card: 'tool-card-cumulative', idx: 3 }
  ];

  let catBIdx = 0;
  catBPills.forEach(item => {
    const pillBtn = document.getElementById(item.id);
    if (!pillBtn) return;
    if (item.card === toolCardId) {
      catBIdx = item.idx;
      pillBtn.className = "subtab-pill active flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-blue-500/40 bg-blue-500/20 text-blue-400 dark:text-blue-300 cursor-pointer";
    } else {
      pillBtn.className = "subtab-pill flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer";
    }
  });

  const dotsA = document.querySelectorAll('#page-dots-cat-a .page-dot');
  dotsA.forEach((dot, idx) => {
    if (idx === catAIdx) {
      dot.className = "page-dot active w-5 h-1.5 rounded-full bg-blue-500 transition-all duration-300";
    } else {
      dot.className = "page-dot w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 transition-all duration-300";
    }
  });

  const dotsB = document.querySelectorAll('#page-dots-cat-b .page-dot');
  dotsB.forEach((dot, idx) => {
    if (idx === catBIdx) {
      dot.className = "page-dot active w-5 h-1.5 rounded-full bg-blue-500 transition-all duration-300";
    } else {
      dot.className = "page-dot w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 transition-all duration-300";
    }
  });

  dispatchActiveToolCalculation();
}

export function dispatchActiveToolCalculation() {
  const activeToolCard = document.querySelector('.tool-card.active');
  const activeToolId = activeToolCard ? activeToolCard.id : activeToolCardId;
  let toolType = activeToolId.replace('tool-card-', '');
  if (toolType === 'maxfdp') toolType = 'max-fdp';
  if (toolType === 'preflight') toolType = 'pre-flight-rest';

  let inputData = {};

  try {
    switch (toolType) {
      case 'medical':
        inputData = {
          examDate: document.getElementById('input-med-exam-date')?.value || '',
          licenseType: document.getElementById('input-med-license-type')?.value || 'ATPL',
          ageBracket: document.getElementById('input-med-age-bracket')?.value || '40_TO_59'
        };
        break;

      case 'ppc':
        inputData = {
          lpcConductDateStr: document.getElementById('input-ppc-conduct-date')?.value || '',
          currentLPCExpiryDateStr: document.getElementById('input-ppc-expiry-date')?.value || ''
        };
        break;

      case 'recurrent':
        inputData = {
          completionDate: document.getElementById('input-recurrent-conduct-date')?.value || '',
          courseType: (getToolsState ? getToolsState()?.recurrentCourseKey : null) || 'LINE_CHECK'
        };
        break;

      case 'recency':
        inputData = {
          capacity: document.getElementById('input-recency-capacity')?.value || 'PIC',
          flightDate: document.getElementById('input-recency-flight-date')?.value || '',
          l1Date: document.getElementById('input-recency-l1-date')?.value || '',
          l2Date: document.getElementById('input-recency-l2-date')?.value || '',
          l3Date: document.getElementById('input-recency-l3-date')?.value || ''
        };
        break;

      case 'standby':
        inputData = {
          startTime: document.getElementById('input-stby-start-time')?.value || '08:00',
          reportTime: document.getElementById('input-stby-callout-time')?.value || '12:00',
          location: document.getElementById('input-stby-location')?.value || 'HOME'
        };
        break;

      case 'max-fdp':
        inputData = {
          reportTime: document.getElementById('input-maxfdp-report-time')?.value || '06:00',
          sectors: parseInt(document.getElementById('input-maxfdp-sectors')?.value || '2', 10),
          isAcclimatised: document.getElementById('input-maxfdp-acclimatised')?.value !== 'false',
          reliefType: document.getElementById('input-maxfdp-relief')?.value || 'NONE',
          splitRestHours: parseFloat(document.getElementById('input-maxfdp-split-rest')?.value || '0')
        };
        break;

      case 'pre-flight-rest':
        inputData = {
          dutyHours: parseFloat(document.getElementById('input-preflight-duty-hours')?.value || '10'),
          location: document.getElementById('input-preflight-location')?.value || 'HOME'
        };
        break;

      case 'cumulative':
        inputData = {
          duty7d: document.getElementById('input-cum-duty-7d')?.value || '',
          duty14d: document.getElementById('input-cum-duty-14d')?.value || '',
          duty28d: document.getElementById('input-cum-duty-28d')?.value || '',
          flight28d: document.getElementById('input-cum-flight-28d')?.value || ''
        };
        break;
    }
  } catch (err) {
    console.warn("Error gathering inputs for " + toolType + ":", err);
  }

  runToolCalculation(toolType, inputData);
}

export function autoFillFromCredentials() {
  const profile = getProfileData();
  const caam = profile?.cachedCaamResults;
  const mab = getAttestationData() || profile?.cachedMabResults;

  if (activeToolCardId === 'tool-card-medical') {
    const medExamInput = document.getElementById('input-med-exam-date');
    if (medExamInput && caam?.medicalExpiryISO) medExamInput.value = caam.medicalExpiryISO;
  } else if (activeToolCardId === 'tool-card-ppc') {
    const ppcConductInput = document.getElementById('input-ppc-conduct-date');
    const ppcExpiryInput = document.getElementById('input-ppc-expiry-date');
    if (ppcConductInput && mab?.lineCheck?.checkDateISO) ppcConductInput.value = mab.lineCheck.checkDateISO;
    if (ppcExpiryInput && mab?.lineCheck?.expiryDateISO) ppcExpiryInput.value = mab.lineCheck.expiryDateISO;
  } else if (activeToolCardId === 'tool-card-recurrent') {
    const recConductInput = document.getElementById('input-recurrent-conduct-date');
    if (recConductInput && mab?.lineCheck?.checkDateISO) recConductInput.value = mab.lineCheck.checkDateISO;
  }

  dispatchActiveToolCalculation();
}

export function initToolsViewUI() {
  // Delegate tools view initialization to main.js / tools.js controller
  if (window.initToolsUIController) {
    window.initToolsUIController();
  }

  // Bind Category Segmented Control
  document.getElementById('cat-tab-qualifications')?.addEventListener('click', () => switchToolCategory('qualifications'));
  document.getElementById('cat-tab-dutyrest')?.addEventListener('click', () => switchToolCategory('dutyrest'));

  // Bind Sub-Tab Pills
  const subPills = [
    { id: 'pill-tool-medical', card: 'tool-card-medical' },
    { id: 'pill-tool-ppc', card: 'tool-card-ppc' },
    { id: 'pill-tool-recurrent', card: 'tool-card-recurrent' },
    { id: 'pill-tool-recency', card: 'tool-card-recency' },
    { id: 'pill-tool-standby', card: 'tool-card-standby' },
    { id: 'pill-tool-maxfdp', card: 'tool-card-maxfdp' },
    { id: 'pill-tool-preflight', card: 'tool-card-preflight' },
    { id: 'pill-tool-cumulative', card: 'tool-card-cumulative' }
  ];

  subPills.forEach(item => {
    document.getElementById(item.id)?.addEventListener('click', () => switchActiveTool(item.card));
  });

  const inputContainer = document.getElementById('tools-view');
  if (inputContainer) {
    inputContainer.addEventListener('input', () => dispatchActiveToolCalculation());
    inputContainer.addEventListener('change', () => dispatchActiveToolCalculation());
  }

  switchToolCategory('qualifications');
}

if (typeof window !== 'undefined') {
  window.initToolsViewUI = initToolsViewUI;
  window.switchToolCategory = switchToolCategory;
  window.switchActiveTool = switchActiveTool;
  window.dispatchActiveToolCalculation = dispatchActiveToolCalculation;
  window.switchTier1 = switchToolCategory;
  window.switchSubTab = switchActiveTool;
}
