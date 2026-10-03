// js/ui.js (0210_R098) - View State, Navigation, and Network Controller

import { stopScanner } from './scanner.js';
import { renderHistoryList, getThresholdDays, getHistoryLimit, getFreshnessLimit, setFreshnessLimit, hasProfileData } from './storage.js';
import { topbarHTML } from './components/topbar.js';
import { dockHTML } from './components/dock.js';
import { menuHTML } from './components/menu.js';

const textSizeIcons = {
  std: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h2.25m-2.25 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h9.75" /></svg>`,
  lg: `<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h2.25m-2.25 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h9.75" /></svg>`,
  xl: `<svg class="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h2.25m-2.25 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h9.75" /></svg>`
};

let currentTextSize = localStorage.getItem("app_text_size") || "std";

export function applyTextSize(size = currentTextSize) {
  currentTextSize = size;
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

let currentThemeMode = localStorage.getItem("app_theme_mode") || "light";

export function applyThemeMode(mode = currentThemeMode) {
  currentThemeMode = mode;
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

  try { stopScanner(); } catch(e) {}

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

export function initScannerTabs() {
  const cameraBtn = document.getElementById("tab-camera-btn");
  const qrPassBtn = document.getElementById("tab-qrpass-btn");
  const manualBtn = document.getElementById("tab-manual-btn");

  const cameraTab = document.getElementById("camera-scan-tab");
  const qrPassTab = document.getElementById("my-qr-pass-tab");
  const manualTab = document.getElementById("manual-entry-tab");

  const activeBtnClass = "py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all bg-blue-600 text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer";
  const inactiveBtnClass = "py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer";

  function switchScanTab(activeTab) {
    if (cameraBtn) cameraBtn.className = (activeTab === "camera") ? activeBtnClass : inactiveBtnClass;
    if (qrPassBtn) qrPassBtn.className = (activeTab === "qrpass") ? activeBtnClass : inactiveBtnClass;
    if (manualBtn) manualBtn.className = (activeTab === "manual") ? activeBtnClass : inactiveBtnClass;

    if (cameraTab) cameraTab.classList.toggle("hidden", activeTab !== "camera");
    if (qrPassTab) qrPassTab.classList.toggle("hidden", activeTab !== "qrpass");
    if (manualTab) manualTab.classList.toggle("hidden", activeTab !== "manual");

    if (activeTab === "qrpass") {
      if (window.renderMyQrPass) window.renderMyQrPass();
    } else if (activeTab === "manual" || activeTab === "camera") {
      try { stopScanner(); } catch(e) {}
    }
  }

  cameraBtn?.addEventListener("click", () => switchScanTab("camera"));
  qrPassBtn?.addEventListener("click", () => switchScanTab("qrpass"));
  manualBtn?.addEventListener("click", () => switchScanTab("manual"));
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
    if (window.renderDashboardView) {
      window.renderDashboardView();
    } else {
      showView("dashboard-view");
    }
  });

  document.getElementById("dock-history-btn")?.addEventListener("click", () => {
    showScannerView();
    const historyDir = document.getElementById("history-directory");
    if (historyDir) {
      historyDir.scrollIntoView({ behavior: "smooth" });
    }
  });

  document.getElementById("btn-result-back")?.addEventListener("click", () => {
    showScannerView();
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
        try { stopScanner(); } catch(e) {}
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
  initScannerTabs();
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
  const cacheBadge = document.getElementById("history-cache-badge");

  if (overlay) {
    if (isOnline) {
      overlay.classList.add("hidden");
      overlay.classList.remove("flex");
    } else {
      overlay.classList.remove("hidden");
      overlay.classList.add("flex");
      try { stopScanner(); } catch(e) {}
    }
  }

  if (cacheBadge) {
    if (isOnline) {
      cacheBadge.classList.add("hidden");
    } else {
      cacheBadge.classList.remove("hidden");
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

export function showView(viewId) {
  document.querySelectorAll(".app-view").forEach(view => {
    view.classList.add("hidden");
  });

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.remove("hidden");

  if (viewId === "result-view" || viewId === "dashboard-view") {
    let savedTab = localStorage.getItem("certifly_active_tab") || "overview";
    if (viewId === "dashboard-view" && typeof hasProfileData === "function" && !hasProfileData()) {
      savedTab = "overview";
    }
    switchResultTab(savedTab);
  }

  const historyDir = document.getElementById("history-directory");
  if (historyDir) {
    if (viewId === "scanner-view") {
      historyDir.classList.remove("hidden");
    }
  }

  const historyDetails = document.getElementById("history-details");
  if (historyDetails) historyDetails.removeAttribute("open");
}

export function showScannerView() {
  try { stopScanner(); } catch(e) {}
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
  try { stopScanner(); } catch(e) {}

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
  if (window.startScanner) {
    window.startScanner(window.processLicenseUrl, null);
  }
}

window.showScannerView = showScannerView;
window.showView = showView;
window.showLoading = showLoading;
window.showError = showError;

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

window.switchResultTab = switchResultTab;

export function openProfileMenu() {
  openMenu();
  setTimeout(() => {
    const navBtn = document.querySelector('[data-target="pane-profile"]');
    if (navBtn) navBtn.click();
  }, 150);
}

window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.openProfileMenu = openProfileMenu;
// js/ui.js (0210_R098) - View State, Navigation, and Network Controller

import { stopScanner } from './scanner.js';
import { renderHistoryList, getThresholdDays, getHistoryLimit, getFreshnessLimit, setFreshnessLimit, hasProfileData } from './storage.js';
import { topbarHTML } from './components/topbar.js';
import { dockHTML } from './components/dock.js';
import { menuHTML } from './components/menu.js';

const textSizeIcons = {
  std: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h2.25m-2.25 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h9.75" /></svg>`,
  lg: `<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h2.25m-2.25 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h9.75" /></svg>`,
  xl: `<svg class="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h2.25m-2.25 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h9.75" /></svg>`
};

let currentTextSize = localStorage.getItem("app_text_size") || "std";

export function applyTextSize(size = currentTextSize) {
  currentTextSize = size;
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

let currentThemeMode = localStorage.getItem("app_theme_mode") || "light";

export function applyThemeMode(mode = currentThemeMode) {
  currentThemeMode = mode;
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

  try { stopScanner(); } catch(e) {}

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

export function initScannerTabs() {
  const cameraBtn = document.getElementById("tab-camera-btn");
  const qrPassBtn = document.getElementById("tab-qrpass-btn");
  const manualBtn = document.getElementById("tab-manual-btn");

  const cameraTab = document.getElementById("camera-scan-tab");
  const qrPassTab = document.getElementById("my-qr-pass-tab");
  const manualTab = document.getElementById("manual-entry-tab");

  const activeBtnClass = "py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all bg-blue-600 text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer";
  const inactiveBtnClass = "py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer";

  function switchScanTab(activeTab) {
    if (cameraBtn) cameraBtn.className = (activeTab === "camera") ? activeBtnClass : inactiveBtnClass;
    if (qrPassBtn) qrPassBtn.className = (activeTab === "qrpass") ? activeBtnClass : inactiveBtnClass;
    if (manualBtn) manualBtn.className = (activeTab === "manual") ? activeBtnClass : inactiveBtnClass;

    if (cameraTab) cameraTab.classList.toggle("hidden", activeTab !== "camera");
    if (qrPassTab) qrPassTab.classList.toggle("hidden", activeTab !== "qrpass");
    if (manualTab) manualTab.classList.toggle("hidden", activeTab !== "manual");

    if (activeTab === "qrpass") {
      if (window.renderMyQrPass) window.renderMyQrPass();
    } else if (activeTab === "manual" || activeTab === "camera") {
      try { stopScanner(); } catch(e) {}
    }
  }

  cameraBtn?.addEventListener("click", () => switchScanTab("camera"));
  qrPassBtn?.addEventListener("click", () => switchScanTab("qrpass"));
  manualBtn?.addEventListener("click", () => switchScanTab("manual"));
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
    if (window.renderDashboardView) {
      window.renderDashboardView();
    } else {
      showView("dashboard-view");
    }
  });

  document.getElementById("dock-history-btn")?.addEventListener("click", () => {
    showScannerView();
    const historyDir = document.getElementById("history-directory");
    if (historyDir) {
      historyDir.scrollIntoView({ behavior: "smooth" });
    }
  });

  document.getElementById("btn-result-back")?.addEventListener("click", () => {
    showScannerView();
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
        try { stopScanner(); } catch(e) {}
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
  initScannerTabs();
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
  const cacheBadge = document.getElementById("history-cache-badge");

  if (overlay) {
    if (isOnline) {
      overlay.classList.add("hidden");
      overlay.classList.remove("flex");
    } else {
      overlay.classList.remove("hidden");
      overlay.classList.add("flex");
      try { stopScanner(); } catch(e) {}
    }
  }

  if (cacheBadge) {
    if (isOnline) {
      cacheBadge.classList.add("hidden");
    } else {
      cacheBadge.classList.remove("hidden");
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

export function showView(viewId) {
  document.querySelectorAll(".app-view").forEach(view => {
    view.classList.add("hidden");
  });

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.remove("hidden");

  if (viewId === "result-view" || viewId === "dashboard-view") {
    let savedTab = localStorage.getItem("certifly_active_tab") || "overview";
    if (viewId === "dashboard-view" && typeof hasProfileData === "function" && !hasProfileData()) {
      savedTab = "overview";
    }
    switchResultTab(savedTab);
  }

  const historyDir = document.getElementById("history-directory");
  if (historyDir) {
    if (viewId === "scanner-view") {
      historyDir.classList.remove("hidden");
    }
  }

  const historyDetails = document.getElementById("history-details");
  if (historyDetails) historyDetails.removeAttribute("open");
}

export function showScannerView() {
  try { stopScanner(); } catch(e) {}
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
  try { stopScanner(); } catch(e) {}

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
  if (window.startScanner) {
    window.startScanner(window.processLicenseUrl, null);
  }
}

window.showScannerView = showScannerView;
window.showView = showView;
window.showLoading = showLoading;
window.showError = showError;

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

window.switchResultTab = switchResultTab;

export function openProfileMenu() {
  openMenu();
  setTimeout(() => {
    const navBtn = document.querySelector('[data-target="pane-profile"]');
    if (navBtn) navBtn.click();
  }, 150);
}

window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.openProfileMenu = openProfileMenu;
