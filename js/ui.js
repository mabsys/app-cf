// js/ui.js - View State, Navigation, and Network Controller

import { stopScanner } from './scanner.js';
import { renderHistoryList } from './storage.js';
import { topbarHTML } from './components/topbar.js';
import { dockHTML } from './components/dock.js';

// ----------------------------------------------------
// 1. DYNAMIC TEXT SCALING
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
  const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function cycleThemeMode() {
  const modes = ["system", "light", "dark"];
  const nextIndex = (modes.indexOf(currentThemeMode) + 1) % modes.length;
  applyThemeMode(modes[nextIndex]);
}

// ----------------------------------------------------
// 3. FLOATING MENU & GRABBER SWIPE-TO-DISMISS
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
    dock.classList.add("translate-y-full", "pointer-events-none");
  }

  overlay.classList.remove("hidden");
  menu.classList.remove("hidden");

  requestAnimationFrame(() => {
    overlay.classList.remove("opacity-0");
    overlay.classList.add("opacity-100");
    menu.classList.remove("translate-y-[120%]");
    menu.classList.add("translate-y-0");
  });
}

export function closeMenu() {
  const menu = document.getElementById("bottom-sheet-menu");
  const overlay = document.getElementById("bottom-sheet-overlay");
  const dock = document.getElementById("persistent-dock");

  if (!menu || !overlay) return;

  overlay.classList.remove("opacity-100");
  overlay.classList.add("opacity-0");
  menu.classList.remove("translate-y-0");
  menu.classList.add("translate-y-[120%]");

  setTimeout(() => {
    overlay.classList.add("hidden");
    menu.classList.add("hidden");
    menu.style.transform = "";

    // Restore persistent bottom dock
    if (dock) {
      dock.classList.remove("translate-y-full", "pointer-events-none");
    }

    // Reset sub-panes to main
    const paneMain = document.getElementById("pane-main");
    const subPanes = document.querySelectorAll(".sub-pane");
    if (paneMain) paneMain.classList.remove("-translate-x-full");
    subPanes.forEach(pane => {
      pane.classList.add("translate-x-full", "hidden");
    });
  }, 300);
}

function initGrabberGesture() {
  const menu = document.getElementById("bottom-sheet-menu");
  const dragHandle = document.getElementById("sheet-drag-handle");
  if (!menu || !dragHandle) return;

  const handleTouchStart = (e) => {
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    isDragging = true;
    menu.style.transition = 'none';
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY;
    if (deltaY > 0) {
      menu.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    menu.style.transition = '';
    const deltaY = currentY - startY;
    if (deltaY > 80) {
      closeMenu();
    } else {
      menu.style.transform = 'translateY(0)';
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
// 4. DUAL NAVIGATION BARS
// ----------------------------------------------------
export function initNavigationBars() {
  if (!document.getElementById("persistent-topbar")) {
    document.body.insertAdjacentHTML('afterbegin', topbarHTML);
  }
  if (!document.getElementById("persistent-dock")) {
    document.body.insertAdjacentHTML('beforeend', dockHTML);
  }

  const topbar = document.getElementById("persistent-topbar");
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
      const topbarTranslate = (1 - progress) * -100;
      topbar.style.transform = `translateY(${topbarTranslate}%)`;
      topbar.style.opacity = progress > 0.05 ? "1" : "0";
    }

    lastClampedScrollY = clampedScrollY;
  }, { passive: true });

  // Connect Top Bar toggle buttons
  document.getElementById("topbar-text-btn")?.addEventListener("click", cycleTextSize);
  document.getElementById("topbar-theme-btn")?.addEventListener("click", cycleThemeMode);

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

  // Nav item clicks inside menu sheet
  document.addEventListener("click", (e) => {
    const navBtn = e.target.closest(".nav-item-btn");
    if (navBtn) {
      const targetId = navBtn.getAttribute("data-target");
      const targetPane = document.getElementById(targetId);
      const paneMain = document.getElementById("pane-main");

      if (targetPane && paneMain) {
        paneMain.classList.add("-translate-x-full");
        targetPane.classList.remove("hidden", "translate-x-full");
      }
    }

    const backBtn = e.target.closest(".back-btn");
    if (backBtn) {
      const subPane = backBtn.closest(".sub-pane");
      const paneMain = document.getElementById("pane-main");

      if (subPane && paneMain) {
        subPane.classList.add("translate-x-full");
        paneMain.classList.remove("-translate-x-full");
        setTimeout(() => {
          subPane.classList.add("hidden");
        }, 300);
      }
    }
  });

  initGrabberGesture();
  applyTextSize(currentTextSize);
  applyThemeMode(currentThemeMode);
}

// ----------------------------------------------------
// 5. NETWORK STATUS CONTROLLER
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
// 6. VIEW STATE CONTROLLER
// ----------------------------------------------------
export function showView(viewId) {
  document.querySelectorAll(".app-view").forEach(view => {
    view.classList.add("hidden");
  });

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.remove("hidden");

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
  `;
}

export function cycleTextSize() {
  const sizes = ["std", "lg", "xl"];
  const nextIndex = (sizes.indexOf(currentTextSize) + 1) % sizes.length;
  applyTextSize(sizes[nextIndex]);
}

// ----------------------------------------------------
// 2. APPEARANCE 3-STATE CYCLER (Solid Mini Heroicons)
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

  const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function cycleThemeMode() {
  const modes = ["system", "light", "dark"];
  const nextIndex = (modes.indexOf(currentThemeMode) + 1) % modes.length;
  applyThemeMode(modes[nextIndex]);
}

// ----------------------------------------------------
// 3. DUAL NAVIGATION BARS & MENU SHEET CONTROLLER
// ----------------------------------------------------

export function openMenu() {
  const menu = document.getElementById("bottom-sheet-menu");
  const overlay = document.getElementById("bottom-sheet-overlay");
  if (!menu || !overlay) return;

  overlay.classList.remove("hidden");
  menu.classList.remove("hidden");

  requestAnimationFrame(() => {
    overlay.classList.remove("opacity-0");
    menu.classList.remove("translate-y-full");
  });
}

export function closeMenu() {
  const menu = document.getElementById("bottom-sheet-menu");
  const overlay = document.getElementById("bottom-sheet-overlay");
  if (!menu || !overlay) return;

  overlay.classList.add("opacity-0");
  menu.classList.add("translate-y-full");

  setTimeout(() => {
    overlay.classList.add("hidden");
    menu.classList.add("hidden");

    // Reset to main pane on close
    const mainPane = document.getElementById("pane-main");
    const subPanes = document.querySelectorAll(".sub-pane");
    if (mainPane) mainPane.classList.remove("-translate-x-full");
    subPanes.forEach(pane => {
      pane.classList.add("translate-x-full", "hidden");
    });
  }, 300);
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
  const dockMaxTravel = 80;
  let currentTranslateY = 0;

  const getMaxScrollY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  let lastClampedScrollY = Math.max(0, Math.min(window.scrollY, getMaxScrollY()));

  window.addEventListener("scroll", () => {
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
      const topbarTranslate = (1 - progress) * -100;
      topbar.style.transform = `translateY(${topbarTranslate}%)`;
      topbar.style.opacity = progress > 0.05 ? "1" : "0";
    }

    lastClampedScrollY = clampedScrollY;
  }, { passive: true });

  // Connect Top Bar toggle buttons
  document.getElementById("topbar-text-btn")?.addEventListener("click", cycleTextSize);
  document.getElementById("topbar-theme-btn")?.addEventListener("click", cycleThemeMode);

  // Connect Dock buttons
  document.getElementById("dock-menu-btn")?.addEventListener("click", openMenu);
  document.getElementById("bottom-sheet-overlay")?.addEventListener("click", closeMenu);
  document.getElementById("dock-scan-btn")?.addEventListener("click", showScannerView);

  document.getElementById("dock-dashboard-btn")?.addEventListener("click", () => {
    showScannerView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.getElementById("dock-history-btn")?.addEventListener("click", () => {
    showScannerView();
    const historyDetails = document.getElementById("history-details");
    if (historyDetails) {
      if (!historyDetails.hasAttribute("open")) {
        historyDetails.setAttribute("open", "true");
      }
      historyDetails.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  // Handle menu sheet category navigation buttons
  document.addEventListener("click", (e) => {
    const navBtn = e.target.closest(".nav-item-btn");
    if (navBtn) {
      const targetId = navBtn.getAttribute("data-target");
      const targetPane = document.getElementById(targetId);
      const mainPane = document.getElementById("pane-main");

      if (targetPane && mainPane) {
        mainPane.classList.add("-translate-x-full");
        targetPane.classList.remove("hidden");
        requestAnimationFrame(() => {
          targetPane.classList.remove("translate-x-full");
        });
      }
    }

    const backBtn = e.target.closest(".back-btn");
    if (backBtn) {
      const subPane = backBtn.closest(".sub-pane");
      const mainPane = document.getElementById("pane-main");

      if (subPane && mainPane) {
        subPane.classList.add("translate-x-full");
        mainPane.classList.remove("-translate-x-full");
        setTimeout(() => {
          subPane.classList.add("hidden");
        }, 300);
      }
    }
  });

  // Apply initial preference states and icons on load
  applyTextSize(currentTextSize);
  applyThemeMode(currentThemeMode);
}

// ----------------------------------------------------
// 4. NETWORK STATUS CONTROLLER
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
// 5. VIEW STATE CONTROLLER
// ----------------------------------------------------

export function showView(viewId) {
  document.querySelectorAll(".app-view").forEach(view => {
    view.classList.add("hidden");
  });

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.remove("hidden");

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
