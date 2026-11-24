// ./js/views/history.js (2411_R102) - CertiFly Scan History View & Controller Engine
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import { getLastScannedUrl } from './results.js';
import { showToast, setTopBanner, showAlertModal, showConfirmDialog } from '../notifications.js';
import { getScanHistory, saveToHistory, clearHistory, getHistoryLimit, setHistoryLimit, getThresholdDays, getFreshnessLimit } from '../storage.js';
import { showView, updateHistoryLimitPills } from '../ui.js';

export function updateHistoryCounts(allHistory) {
  const cntAll = document.getElementById("count-all");
  const cntValid = document.getElementById("count-valid");
  const cntExpiring = document.getElementById("count-expiring");
  const cntExpired = document.getElementById("count-expired");

  const validCount = allHistory.filter(i => i && i.overallStatus === "VALID").length;
  const expiringCount = allHistory.filter(i => i && i.overallStatus === "EXPIRING_SOON").length;
  const expiredCount = allHistory.filter(i => i && i.overallStatus === "EXPIRED").length;

  if (cntAll) cntAll.innerText = allHistory.length;
  if (cntValid) cntValid.innerText = validCount;
  if (cntExpiring) cntExpiring.innerText = expiringCount;
  if (cntExpired) cntExpired.innerText = expiredCount;
}

export function updateHistoryPillUI(targetFilter) {
  const pillAll = document.getElementById("filter-all-btn") || document.getElementById("filter-pill-all") || document.getElementById("history-filter-all");
  const pillValid = document.getElementById("filter-valid-btn") || document.getElementById("filter-pill-valid") || document.getElementById("history-filter-valid");
  const pillExpiring = document.getElementById("filter-expiring-btn") || document.getElementById("filter-pill-expiring") || document.getElementById("history-filter-expiring");
  const pillExpired = document.getElementById("filter-expired-btn") || document.getElementById("filter-pill-expired") || document.getElementById("history-filter-expired");

  const filterPills = [
    { el: pillAll, value: "ALL" },
    { el: pillValid, value: "VALID" },
    { el: pillExpiring, value: "EXPIRING_SOON" },
    { el: pillExpired, value: "EXPIRED" }
  ];

  const activeStyles = {
    ALL: "py-1.5 px-1 rounded-lg bg-blue-600 text-white shadow-xs transition-all cursor-pointer font-extrabold",
    VALID: "py-1.5 px-1 rounded-lg bg-emerald-600 text-white shadow-xs transition-all cursor-pointer font-extrabold",
    EXPIRING_SOON: "py-1.5 px-1 rounded-lg bg-amber-500 text-white shadow-xs transition-all cursor-pointer font-extrabold",
    EXPIRED: "py-1.5 px-1 rounded-lg bg-rose-600 text-white shadow-xs transition-all cursor-pointer font-extrabold"
  };

  const inactiveStyle = "py-1.5 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-all cursor-pointer";

  filterPills.forEach(({ el, value }) => {
    if (!el) return;
    if (value === targetFilter) {
      el.className = activeStyles[value] || activeStyles.ALL;
    } else {
      el.className = inactiveStyle;
    }
  });
}

let currentHistoryFilter = "ALL";

export let activeSwipedCardId = null;
let swipeAutoDismissTimer = null;

let isManageModeActive = false;
let selectedRecordIds = new Set();
let currentlyVisibleHistoryItems = [];

window.exitHistoryManageMode = function() {
  if (!isManageModeActive) return;
  isManageModeActive = false;
  selectedRecordIds.clear();

  const manageBtn = document.getElementById("btn-history-manage");
  if (manageBtn) {
    manageBtn.innerText = "Manage";
    manageBtn.className = "py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer";
  }

  const bulkBar = document.getElementById("history-bulk-action-bar");
  if (bulkBar) bulkBar.classList.add("hidden");

  if (typeof customRenderHistoryList === "function") {
    customRenderHistoryList();
  }
};

export function updateBulkActionBarUI() {
  const countBadge = document.getElementById("bulk-selected-count");
  const selectAllBtnText = document.getElementById("btn-bulk-select-all-text");

  if (countBadge) {
    countBadge.innerText = `${selectedRecordIds.size} selected`;
  }

  if (selectAllBtnText && currentlyVisibleHistoryItems.length > 0) {
    const visibleIds = currentlyVisibleHistoryItems.map(item => String(item.id));
    const allVisibleSelected = visibleIds.every(id => selectedRecordIds.has(id));
    selectAllBtnText.innerText = allVisibleSelected ? "Deselect All" : "Select All";
  }
}

export function initHistoryManageModeControls() {
  const manageBtn = document.getElementById("btn-history-manage");
  const bulkBar = document.getElementById("history-bulk-action-bar");
  const selectAllBtn = document.getElementById("btn-bulk-select-all");
  const bookmarkBtn = document.getElementById("btn-bulk-bookmark");
  const deleteBtn = document.getElementById("btn-bulk-delete");

  if (manageBtn && !manageBtn.dataset.bound) {
    manageBtn.dataset.bound = "true";
    manageBtn.addEventListener("click", () => {
      isManageModeActive = !isManageModeActive;
      selectedRecordIds.clear();

      if (isManageModeActive) {
        manageBtn.innerText = "Done";
        manageBtn.className = "py-1 px-2.5 rounded-lg bg-blue-600 text-white shadow-xs font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer";
        if (bulkBar) bulkBar.classList.remove("hidden");
      } else {
        manageBtn.innerText = "Manage";
        manageBtn.className = "py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer";
        if (bulkBar) bulkBar.classList.add("hidden");
      }

      updateBulkActionBarUI();
      customRenderHistoryList();
    });
  }

  if (selectAllBtn && !selectAllBtn.dataset.bound) {
    selectAllBtn.dataset.bound = "true";
    selectAllBtn.addEventListener("click", () => {
      if (currentlyVisibleHistoryItems.length === 0) return;
      const visibleIds = currentlyVisibleHistoryItems.map(item => String(item.id));
      const allVisibleSelected = visibleIds.every(id => selectedRecordIds.has(id));

      if (allVisibleSelected) {
        visibleIds.forEach(id => selectedRecordIds.delete(id));
      } else {
        visibleIds.forEach(id => selectedRecordIds.add(id));
      }

      updateBulkActionBarUI();
      customRenderHistoryList();
    });
  }

  if (bookmarkBtn && !bookmarkBtn.dataset.bound) {
    bookmarkBtn.dataset.bound = "true";
    bookmarkBtn.addEventListener("click", () => {
      if (selectedRecordIds.size === 0) {
        if (typeof showProfileToast === "function") showProfileToast("No crew cards selected");
        return;
      }

      const targetIds = Array.from(selectedRecordIds);
      const allHistory = getScanHistory() || [];
      const selectedItems = allHistory.filter(item => item && selectedRecordIds.has(String(item.id)));
      const allSelectedArePinned = selectedItems.length > 0 && selectedItems.every(item => Boolean(item.isPinned || item.pinned));
      const targetPinState = !allSelectedArePinned;

      if (typeof window.bulkPinHistoryRecords === "function") {
        window.bulkPinHistoryRecords(targetIds, targetPinState);
      } else if (typeof bulkPinHistoryRecords === "function") {
        bulkPinHistoryRecords(targetIds, targetPinState);
      }

      if (typeof showProfileToast === "function") {
        const actionWord = targetPinState ? "bookmarked" : "unbookmarked";
        showProfileToast(`${targetIds.length} cards ${actionWord}`);
      }

      updateBulkActionBarUI();
      customRenderHistoryList();
    });
  }

  if (deleteBtn && !deleteBtn.dataset.bound) {
    deleteBtn.dataset.bound = "true";
    deleteBtn.addEventListener("click", async () => {
      if (selectedRecordIds.size === 0) {
        if (typeof showProfileToast === "function") showProfileToast("No crew cards selected");
        return;
      }

      const targetIds = Array.from(selectedRecordIds);
      const count = targetIds.length;
      const confirmMsg = count === 1
        ? "Are you sure you want to delete 1 selected crew record?"
        : `Are you sure you want to delete ${count} selected crew records?`;

      const confirmed = await showConfirmDialog({ title: "Delete Crew Records", message: confirmMsg, confirmText: "Delete", cancelText: "Cancel", type: "danger" });
      if (!confirmed) return;

      if (typeof window.deleteHistoryRecords === "function") {
        window.deleteHistoryRecords(targetIds);
      } else if (typeof deleteHistoryRecords === "function") {
        deleteHistoryRecords(targetIds);
      }

      const deletedCount = targetIds.length;
      selectedRecordIds.clear();

      if (typeof showProfileToast === "function") {
        showProfileToast(`${deletedCount} card${deletedCount > 1 ? 's' : ''} removed`);
      }

      const remainingHistory = getScanHistory() || [];
      if (remainingHistory.length === 0 && isManageModeActive) {
        if (typeof window.exitHistoryManageMode === "function") {
          window.exitHistoryManageMode();
        }
      } else {
        updateBulkActionBarUI();
        customRenderHistoryList();
      }
    });
  }
}

export function setupHistorySwipeListeners() {
  const containers = [
    document.getElementById("recent-pilots-list"),
    document.getElementById("history-list")
  ].filter(Boolean);

  if (containers.length === 0) return;

  if (!window.swipeTapOutsideInitialized) {
    window.swipeTapOutsideInitialized = true;
    const resetSwipedCard = () => {
      if (activeSwipedCardId) {
        const cardEl = document.getElementById("card-inner-" + activeSwipedCardId);
        if (cardEl) {
          cardEl.style.transition = "transform 0.2s ease-out";
          cardEl.style.transform = "translateX(0px)";
        }
        activeSwipedCardId = null;
        if (swipeAutoDismissTimer) {
          clearTimeout(swipeAutoDismissTimer);
          swipeAutoDismissTimer = null;
        }
      }
    };

    document.addEventListener("click", (e) => {
      if (activeSwipedCardId) {
        const activeCard = document.getElementById("card-inner-" + activeSwipedCardId);
        if (activeCard && !activeCard.contains(e.target) && !e.target.closest("button")) {
          resetSwipedCard();
        }
      }
    }, { capture: true });
  }

  containers.forEach(container => {
    if (container.dataset.swipeInitialized) return;
    container.dataset.swipeInitialized = "true";

    let startX = 0, startY = 0, currentDiffX = 0;
    let targetCard = null;
    let isSwiping = false;

    const getClientX = (e) => (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
    const getClientY = (e) => (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;

    const handleStart = (e) => {
      if (isManageModeActive) return;
      if (e.target.closest("button")) return;

      const card = e.target.closest("[data-card-id]");
      if (!card) return;

      targetCard = card;
      startX = getClientX(e);
      startY = getClientY(e);
      currentDiffX = 0;
      isSwiping = false;

      if (activeSwipedCardId && activeSwipedCardId !== card.dataset.cardId) {
        const prevEl = document.getElementById("card-inner-" + activeSwipedCardId);
        if (prevEl) {
          prevEl.style.transition = "transform 0.2s ease-out";
          prevEl.style.transform = "translateX(0px)";
        }
        activeSwipedCardId = null;
        if (swipeAutoDismissTimer) {
          clearTimeout(swipeAutoDismissTimer);
          swipeAutoDismissTimer = null;
        }
      }
    };

    const handleMove = (e) => {
      if (!targetCard) return;
      const clientX = getClientX(e);
      const clientY = getClientY(e);

      const diffX = clientX - startX;
      const diffY = clientY - startY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
        isSwiping = true;
        currentDiffX = diffX;
        targetCard.style.transition = "none";

        const currentTransformStr = targetCard.style.transform || "";
        let baseOffset = 0;

        if (currentTransformStr.includes("translateX(80px)")) baseOffset = 80;
        else if (currentTransformStr.includes("translateX(-80px)")) baseOffset = -80;

        let translateVal = baseOffset + diffX;
        if (translateVal > 90) translateVal = 90;
        if (translateVal < -90) translateVal = -90;

        targetCard.style.transform = "translateX(" + translateVal + "px)";
      }
    };

    const handleEnd = () => {
      if (!targetCard) return;
      targetCard.style.transition = "transform 0.2s ease-out";

      if (isSwiping) {
        const currentTransformStr = targetCard.style.transform || "";
        let baseOffset = 0;

        if (currentTransformStr.includes("translateX(80px)")) baseOffset = 80;
        else if (currentTransformStr.includes("translateX(-80px)")) baseOffset = -80;

        const effectiveDiff = baseOffset + currentDiffX;

        if (swipeAutoDismissTimer) {
          clearTimeout(swipeAutoDismissTimer);
          swipeAutoDismissTimer = null;
        }

        if (effectiveDiff > 35) {
          targetCard.style.transform = "translateX(80px)";
          activeSwipedCardId = targetCard.dataset.cardId;
          swipeAutoDismissTimer = setTimeout(() => {
            if (activeSwipedCardId) {
              const activeEl = document.getElementById("card-inner-" + activeSwipedCardId);
              if (activeEl) {
                activeEl.style.transition = "transform 0.2s ease-out";
                activeEl.style.transform = "translateX(0px)";
              }
              activeSwipedCardId = null;
            }
          }, 3500);
        } else if (effectiveDiff < -35) {
          targetCard.style.transform = "translateX(-80px)";
          activeSwipedCardId = targetCard.dataset.cardId;
          swipeAutoDismissTimer = setTimeout(() => {
            if (activeSwipedCardId) {
              const activeEl = document.getElementById("card-inner-" + activeSwipedCardId);
              if (activeEl) {
                activeEl.style.transition = "transform 0.2s ease-out";
                activeEl.style.transform = "translateX(0px)";
              }
              activeSwipedCardId = null;
            }
          }, 3500);
        } else {
          targetCard.style.transform = "translateX(0px)";
          if (activeSwipedCardId === targetCard.dataset.cardId) {
            activeSwipedCardId = null;
          }
        }
      }

      targetCard = null;
      isSwiping = false;
    };

    container.addEventListener("touchstart", handleStart, { passive: true });
    container.addEventListener("touchmove", handleMove, { passive: true });
    container.addEventListener("touchend", handleEnd);
    container.addEventListener("touchcancel", handleEnd);
    container.addEventListener("mousedown", handleStart);
    container.addEventListener("mousemove", (e) => { if (targetCard) handleMove(e); });
    container.addEventListener("mouseup", () => { if (targetCard) handleEnd(); });
  });
}

window.handleCardClick = function(event, safeId) {
  if (isManageModeActive) {
    if (selectedRecordIds.has(safeId)) {
      selectedRecordIds.delete(safeId);
    } else {
      selectedRecordIds.add(safeId);
    }
    updateBulkActionBarUI();
    customRenderHistoryList();
    return;
  }

  const cardInner = document.getElementById("card-inner-" + safeId);
  if (cardInner && cardInner.style.transform && cardInner.style.transform !== "translateX(0px)") {
    cardInner.style.transform = "translateX(0px)";
    activeSwipedCardId = null;
    return;
  }

  loadHistoricalRecord(safeId);
};

window.toggleSingleBookmark = function(recordId) {
  if (typeof togglePinRecord === "function") {
    togglePinRecord(recordId);
  } else if (typeof window.togglePinRecord === "function") {
    window.togglePinRecord(recordId);
  }
  customRenderHistoryList();
};

window.deleteSingleRecord = function(recordId) {
  if (!recordId) return;
  activeSwipedCardId = null;

  if (selectedRecordIds && selectedRecordIds.has(String(recordId))) {
    selectedRecordIds.delete(String(recordId));
  }

  if (typeof window.deleteHistoryRecords === "function") {
    window.deleteHistoryRecords([recordId]);
  } else if (typeof deleteHistoryRecords === "function") {
    deleteHistoryRecords([recordId]);
  }

  if (typeof showProfileToast === "function") {
    showProfileToast("Record removed");
  }

  const remaining = getScanHistory() || [];
  if (remaining.length === 0 && isManageModeActive) {
    if (typeof window.exitHistoryManageMode === "function") {
      window.exitHistoryManageMode();
    }
  } else {
    customRenderHistoryList();
  }
};

export function customRenderHistoryList() {
  activeSwipedCardId = null;
  const historyContainer = document.getElementById("history-list");
  const recentContainer = document.getElementById("recent-pilots-list");
  const targets = [historyContainer, recentContainer].filter(Boolean);

  const countBadge = document.getElementById("history-count-badge");
  const retentionTag = document.getElementById("history-retention-tag");
  const limit = (typeof getHistoryLimit === "function") ? getHistoryLimit() : 10;

  if (retentionTag) {
    retentionTag.innerText = `${limit} Scans`;
    retentionTag.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95";
    retentionTag.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentLimit = (typeof getHistoryLimit === "function") ? getHistoryLimit() : 10;
      const limits = [10, 20, 30];
      const nextLimit = limits[(limits.indexOf(currentLimit) + 1) % limits.length];
      if (typeof setHistoryLimit === "function") setHistoryLimit(nextLimit);
      if (typeof updateHistoryLimitPills === "function") updateHistoryLimitPills(nextLimit);
      customRenderHistoryList();
      if (typeof showToast === "function") showToast(`History limit set to ${nextLimit} scans`, "info", 2000);
    };
  }

  const clockIcon = document.getElementById("history-clock-icon");
  const searchInput = document.getElementById("history-search-input");

  if (targets.length === 0) return;

  setupHistorySwipeListeners();
  let allHistory = getScanHistory() || [];

  updateHistoryCounts(allHistory);

  const validIdsSet = new Set(allHistory.map(item => String(item.id)));
  selectedRecordIds.forEach(id => {
    if (!validIdsSet.has(id)) selectedRecordIds.delete(id);
  });

  if (allHistory.length === 0 && isManageModeActive) {
    if (typeof window.exitHistoryManageMode === "function") {
      window.exitHistoryManageMode();
    }
    return;
  }

  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : "";

  if (prevSearchQueryState !== "" && searchQuery === "") {
    currentHistoryFilter = "ALL";
  }
  prevSearchQueryState = searchQuery;

  const clearBtn = document.getElementById("history-search-clear-btn");
  if (clearBtn && searchInput) {
    if (searchQuery.length > 0) clearBtn.classList.remove("hidden");
    else clearBtn.classList.add("hidden");
  }

  let scanHistory = [];
  if (searchQuery) {
    const matchingItems = allHistory.filter(item => {
      if (!item) return false;
      const name = (item.name || "").toLowerCase();
      const licType = (item.licenseType || "").toLowerCase();
      const licNo = (item.id || "").toLowerCase();
      return name.includes(searchQuery) || licType.includes(searchQuery) || licNo.includes(searchQuery);
    });

    if (matchingItems.length > 0) {
      const uniqueStatuses = new Set(matchingItems.map(m => m ? m.overallStatus : null));
      uniqueStatuses.delete(null);

      if (uniqueStatuses.size === 1) {
        const singleStatus = Array.from(uniqueStatuses)[0];
        if (singleStatus === "VALID") currentHistoryFilter = "VALID";
        else if (singleStatus === "EXPIRING_SOON") currentHistoryFilter = "EXPIRING_SOON";
        else if (singleStatus === "EXPIRED") currentHistoryFilter = "EXPIRED";
        else currentHistoryFilter = "ALL";
      } else {
        currentHistoryFilter = "ALL";
      }
    }
    updateHistoryPillUI(currentHistoryFilter);
    scanHistory = matchingItems;
  } else {
    updateHistoryPillUI(currentHistoryFilter);
    if (currentHistoryFilter && currentHistoryFilter !== "ALL") {
      scanHistory = allHistory.filter(item => {
        if (!item) return false;
        if (currentHistoryFilter === "VALID") return item.overallStatus === "VALID";
        if (currentHistoryFilter === "EXPIRING_SOON") return item.overallStatus === "EXPIRING_SOON";
        if (currentHistoryFilter === "EXPIRED") return item.overallStatus === "EXPIRED";
        return true;
      });
    } else {
      scanHistory = allHistory;
    }
  }

  scanHistory = [...scanHistory].sort((a, b) => {
    const aPinned = Boolean(a.isPinned || a.pinned);
    const bPinned = Boolean(b.isPinned || b.pinned);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  currentlyVisibleHistoryItems = scanHistory;
  initHistoryManageModeControls();
  updateBulkActionBarUI();

  if (clockIcon && countBadge) {
    const totalScans = scanHistory.length;
    countBadge.innerText = totalScans;
    if (totalScans > 0) {
      countBadge.classList.remove("hidden");
      clockIcon.classList.add("hidden");
    } else {
      clockIcon.classList.remove("hidden");
      countBadge.classList.add("hidden");
    }
  }

  if (scanHistory.length === 0) {
    targets.forEach(t => { if (t) t.innerHTML = `<div class="text-[10px] text-slate-400 italic py-4 text-center">No matching scans found.</div>`; });
    return;
  }

  const cardsHtml = scanHistory.map(item => {
    if (!item) return '';
    const isPinned = Boolean(item.isPinned || item.pinned);
    const safeId = String(item.id || '').replace(/'/g, "\'");
    const pinBadge = isPinned ? `<svg class="w-3.5 h-3.5 text-orange-400 dark:text-orange-400 shrink-0 inline-block align-middle ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>` : '';

    let badgeStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300";
    let statusLabel = "Valid";

    if (item.overallStatus === "EXPIRED") {
      statusLabel = "Expired";
      badgeStyle = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300";
    } else if (item.overallStatus === "EXPIRING_SOON") {
      statusLabel = "Expiring";
      badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300";
    }

    const nameUpper = (item.name || 'UNKNOWN').toUpperCase();
    const licType = item.licenseType || 'ATPL(A)';
    const licNo = item.id || '-';
    const timestampStr = item.timestamp || '';
    const isSelected = selectedRecordIds.has(safeId);

    const checkboxHtml = isManageModeActive ? `
<div class="shrink-0 pl-1 pr-2 flex items-center justify-center">
  <div class="w-4 h-4 rounded-md border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'} flex items-center justify-center transition-all">
    ${isSelected ? '<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>' : ''}
  </div>
</div>
` : '';

    const cardBgStyle = (isManageModeActive && isSelected) ? "bg-blue-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900";

    return `
<div class="relative overflow-hidden border-b border-slate-100 dark:border-slate-800/80 last:border-b-0">
  <div class="absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-orange-200 dark:bg-orange-950/60 w-1/2 z-0">
    <button onclick="event.stopPropagation(); toggleSingleBookmark('${safeId}')" class="p-1.5 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-300/50 transition-all" title="Bookmark">
      <svg class="w-5 h-5 text-orange-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
    </button>
  </div>
  <div class="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-red-200 dark:bg-red-950/60 w-1/2 z-0">
    <button onclick="event.stopPropagation(); deleteSingleRecord('${safeId}')" class="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-300/50 transition-all" title="Delete">
      <svg class="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
    </button>
  </div>
  <div id="card-inner-${safeId}" data-card-id="${safeId}" onclick="handleCardClick(event, '${safeId}')" class="relative z-10 ${cardBgStyle} py-2.5 px-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
    <div class="flex items-center justify-between w-full active:scale-[0.985] transition-transform duration-100 ease-out">
      <div class="flex items-center gap-2 overflow-hidden flex-1 pr-2">
        ${checkboxHtml}
        <div class="flex flex-col text-left overflow-hidden flex-1">
          <div class="flex items-center gap-1">
            <span class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">${nameUpper}</span>
            ${pinBadge}
          </div>
          <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight truncate">
            ${licType} - ${licNo}
          </span>
          <span class="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
            Checked: ${timestampStr}
          </span>
        </div>
      </div>
      <div class="shrink-0">
        <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${badgeStyle}">
          ${statusLabel}
        </span>
      </div>
    </div>
  </div>
</div>
`;
  }).join('');

  targets.forEach(t => { if (t) t.innerHTML = cardsHtml; });
}

window.renderHistoryList = customRenderHistoryList;

export function setupReverifyOnlineButton() {
  const reverifyBtn = document.getElementById("btn-reverify-online");
  if (!reverifyBtn || reverifyBtn.dataset.bound) return;
  reverifyBtn.dataset.bound = "true";

  reverifyBtn.addEventListener("click", async () => {
    if (!navigator.onLine) {
      showToast("Cannot re-verify offline. Connect to internet.", "warning");
      return;
    }

    const currentScannedUrl = (typeof getLastScannedUrl === "function" ? getLastScannedUrl() : "") || (typeof window !== "undefined" && window.getLastScannedUrl ? window.getLastScannedUrl() : "");
    if (!currentScannedUrl) {
      if (typeof showProfileToast === "function") {
        showProfileToast("No licence URL available for re-verification.");
      }
      return;
    }

    const procFn = typeof processLicenseUrl === "function" ? processLicenseUrl : (typeof window !== "undefined" ? window.processLicenseUrl : null);
    if (typeof procFn === "function") await procFn(currentScannedUrl);

    if (typeof showProfileToast === "function") {
      showProfileToast("Licence re-verified & updated!");
    }
  });
}

export function setupPinCardButton(caamResults) {
  const resView = document.getElementById("result-view");
  const pinBtn = (resView ? resView.querySelector("#btn-toggle-pin") : null) || document.getElementById("btn-toggle-pin");
  if (!pinBtn || !caamResults) return;

  const currentScannedUrl = (typeof getLastScannedUrl === "function" ? getLastScannedUrl() : "") || (typeof window !== "undefined" && window.getLastScannedUrl ? window.getLastScannedUrl() : "");
  const licNo = (caamResults.pilotDetails && caamResults.pilotDetails.licenseNo) || "";
  let scanHistory = getScanHistory() || [];
  const matchIndex = scanHistory.findIndex(item => item && (String(item.id) === String(licNo) || (currentScannedUrl && item.url === currentScannedUrl)));
  let isPinned = false;

  if (matchIndex !== -1) {
    isPinned = Boolean(scanHistory[matchIndex].isPinned || scanHistory[matchIndex].pinned);
  }

  const updatePinButtonUI = () => {
    if (isPinned) {
      pinBtn.className = "py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 shadow-xs cursor-pointer";
      pinBtn.innerHTML = `
<svg class="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
</svg>
<span>Unbookmark</span>
`;
    } else {
      pinBtn.className = "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer";
      pinBtn.innerHTML = `
<svg class="w-4 h-4 text-orange-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
</svg>
<span>Bookmark</span>
`;
    }
  };

  updatePinButtonUI();

  pinBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isPinned = !isPinned;

    if (matchIndex !== -1) {
      scanHistory[matchIndex].isPinned = isPinned;
      scanHistory[matchIndex].pinned = isPinned;
    } else {
      const record = {
        id: String(licNo || Date.now()),
        name: (caamResults.pilotDetails && caamResults.pilotDetails.name) || "External Crew Member",
        licenseType: (caamResults.pilotDetails && caamResults.pilotDetails.licenseType) || "ATPL(A)",
        overallStatus: caamResults.overallStatus || "VALID",
        url: currentScannedUrl || "",
        resultsData: caamResults,
        timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        isPinned: isPinned,
        pinned: isPinned
      };
      scanHistory.unshift(record);
    }

    try {
      localStorage.setItem("scan_history", JSON.stringify(scanHistory));
    } catch (err) {
      console.error("Failed to update pin state in scan history:", err);
      showToast("Could not update pinned record", "warning");
    }

    updatePinButtonUI();
    customRenderHistoryList();
  };
}

let prevSearchQueryState = "";

export function initHistorySearchAndFilters() {
  const searchInput = document.getElementById("history-search-input");

  if (searchInput) {
    const parent = searchInput.parentNode;

    if (parent && !document.getElementById("history-search-clear-btn")) {
      const pos = window.getComputedStyle ? window.getComputedStyle(parent).position : parent.style.position;
      if (!pos || pos === 'static') {
        parent.style.position = 'relative';
      }

      const clearBtn = document.createElement("button");
      clearBtn.id = "history-search-clear-btn";
      clearBtn.type = "button";
      clearBtn.className = "absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hidden cursor-pointer z-10";
      clearBtn.setAttribute("aria-label", "Clear search");
      clearBtn.innerHTML = `
<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
</svg>
`;
      searchInput.classList.add("pr-9");

      clearBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        searchInput.value = "";
        prevSearchQueryState = "";
        currentHistoryFilter = "ALL";
        clearBtn.classList.add("hidden");
        searchInput.focus();
        customRenderHistoryList();
      };

      parent.appendChild(clearBtn);
    }

    const syncClearBtn = () => {
      const clearBtn = document.getElementById("history-search-clear-btn");
      if (clearBtn) {
        if (searchInput.value.trim().length > 0) {
          clearBtn.classList.remove("hidden");
        } else {
          clearBtn.classList.add("hidden");
        }
      }
    };

    const handleSearchInput = () => {
      syncClearBtn();
      customRenderHistoryList();
    };

    searchInput.addEventListener("input", handleSearchInput);
    searchInput.addEventListener("change", handleSearchInput);
    syncClearBtn();
  }

  const pillAll = document.getElementById("filter-all-btn") || document.getElementById("filter-pill-all") || document.getElementById("history-filter-all");
  const pillValid = document.getElementById("filter-valid-btn") || document.getElementById("filter-pill-valid") || document.getElementById("history-filter-valid");
  const pillExpiring = document.getElementById("filter-expiring-btn") || document.getElementById("filter-pill-expiring") || document.getElementById("history-filter-expiring");
  const pillExpired = document.getElementById("filter-expired-btn") || document.getElementById("filter-pill-expired") || document.getElementById("history-filter-expired");

  const filterPills = [
    { el: pillAll, value: "ALL" },
    { el: pillValid, value: "VALID" },
    { el: pillExpiring, value: "EXPIRING_SOON" },
    { el: pillExpired, value: "EXPIRED" }
  ];

  filterPills.forEach(({ el, value }) => {
    if (!el) return;
    el.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      prevSearchQueryState = "";
      currentHistoryFilter = value;
      updateHistoryPillUI(currentHistoryFilter);
      customRenderHistoryList();
    });
  });
}

let resultScrollObserver = null;
let isBannerDismissed = false;



export function toggleHistoryLimitQuickPicker(anchorEl) {
  if (!anchorEl) return;
  let picker = document.getElementById("history-limit-quick-picker");
  if (picker) {
    picker.remove();
    return;
  }

  picker = document.createElement("div");
  picker.id = "history-limit-quick-picker";
  picker.className = "absolute left-4 top-12 z-50 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl flex items-center gap-2 transition-all animate-in fade-in slide-in-from-top-2 duration-150";

  const currentLimit = (typeof getHistoryLimit === "function") ? getHistoryLimit() : 10;
  const options = [10, 20, 30];

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.type = "button";
    const isActive = (opt === currentLimit);
    btn.className = `px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
      isActive
        ? "bg-blue-600 text-white shadow-xs"
        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
    }`;
    btn.innerText = `${opt} Scans`;
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof setHistoryLimit === "function") setHistoryLimit(opt);
      if (typeof updateHistoryLimitPills === "function") updateHistoryLimitPills(opt);
      picker.remove();
      if (window.renderHistoryList) window.renderHistoryList();
    };
    picker.appendChild(btn);
  });

  const headerContainer = anchorEl.closest(".sticky") || anchorEl.parentElement;
  if (headerContainer) {
    if (window.getComputedStyle(headerContainer).position === "static") {
      headerContainer.style.position = "relative";
    }
    headerContainer.appendChild(picker);
  }

  const closeOnOutsideClick = (evt) => {
    if (picker && !picker.contains(evt.target) && evt.target !== anchorEl && !anchorEl.contains(evt.target)) {
      picker.remove();
      document.removeEventListener("click", closeOnOutsideClick);
    }
  };

  setTimeout(() => {
    document.addEventListener("click", closeOnOutsideClick);
  }, 10);
}



// Global Window Bindings
if (typeof window !== 'undefined') {
  window.renderHistoryList = customRenderHistoryList;
  window.customRenderHistoryList = customRenderHistoryList;
  window.initHistorySearchAndFilters = initHistorySearchAndFilters;
  window.toggleHistoryLimitQuickPicker = toggleHistoryLimitQuickPicker;
}
