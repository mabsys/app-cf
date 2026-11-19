// ./js/views/toolsUI.js (1811_R101) - CertiFly Tools View UI & Gesture Controller
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

import { showAlertModal } from '../notifications.js';
import { initToolsModule, calculatePpcWindows, calculateCourseExpiry, calculateMedicalWindow, getMaxAllowableFdp, getSectorCount, setSectorCount, getToolsState } from '../tools.js';
import { initToolsViewUI, switchActiveTool, dispatchActiveToolCalculation } from '../ui.js';

window.initToolsModule = function() {
  if (typeof initToolsModule === 'function') {
    initToolsModule();
  }
};

export function initToolsUI() {
  initToolsModule();
  if (typeof initToolsViewUI === 'function') {
    initToolsViewUI();
  }

  document.getElementById("btn-calc-ppc")?.addEventListener("click", async () => {
    const conduct = document.getElementById("ppc-conduct-date")?.value;
    const expiry = document.getElementById("ppc-expiry-date")?.value;
    const res = calculatePpcWindows(conduct, expiry);
    const resBox = document.getElementById("ppc-results-box");

    if (!res) {
      await showAlertModal("Invalid Date", "Please select a valid LPC Expiry Date.", "warning");
      return;
    }

    document.getElementById("ppc-res-expiry").innerText = res.newLpcExpiry;
    document.getElementById("ppc-res-opc-start").innerText = res.opcEarliest;
    document.getElementById("ppc-res-opc-end").innerText = res.opcLatest;
    if (resBox) resBox.classList.remove("hidden");
  });

  document.getElementById("btn-calc-recurrent")?.addEventListener("click", async () => {
    const type = document.getElementById("recurrent-drill-type")?.value || "linecheck";
    const conduct = document.getElementById("recurrent-conduct-date")?.value;
    const res = calculateCourseExpiry(type, conduct);
    const resBox = document.getElementById("recurrent-results-box");

    if (!res) {
      await showAlertModal("Invalid Date", "Please select a valid Conducted Date.", "warning");
      return;
    }

    document.getElementById("recurrent-res-expiry").innerText = res.expiryDate;
    if (resBox) resBox.classList.remove("hidden");
  });

  document.getElementById("btn-calc-medical")?.addEventListener("click", async () => {
    const last = document.getElementById("medical-last-date")?.value;
    const age = document.getElementById("medical-pilot-age")?.value;
    const res = calculateMedicalWindow(last, age);
    const resBox = document.getElementById("medical-results-box");

    if (!res) {
      await showAlertModal("Invalid Date", "Please select a valid Medical Expiry Date.", "warning");
      return;
    }

    document.getElementById("medical-res-expiry").innerText = res.expiryDate;
    document.getElementById("medical-res-dame").innerText = res.dameEarliest;
    const ageText = document.getElementById("medical-res-age-text");
    if (ageText) ageText.innerText = res.ageNotice;
    if (resBox) resBox.classList.remove("hidden");
  });

  document.getElementById("btn-calc-preflight")?.addEventListener("click", async () => {
    const report = document.getElementById("fdp-report-time")?.value;
    const count = getSectorCount();
    const maxHours = getMaxAllowableFdp(report, count);
    const resBox = document.getElementById("preflight-results-box");

    if (!report) {
      await showAlertModal("Report Time Required", "Please enter a Report Time (e.g. 08:00).", "warning");
      return;
    }

    const h = Math.floor(maxHours);
    const m = Math.round((maxHours % 1) * 60);
    document.getElementById("fdp-res-max").innerText = `${h} Hours ${m > 0 ? m + ' Mins' : ''}`;

    const [rH, rM] = report.replace(/[^\d:]/g, "").split(":").map(n => parseInt(n, 10));
    if (!isNaN(rH)) {
      let lobtH = rH + h;
      let lobtM = (rM || 0) + m;
      if (lobtM >= 60) { lobtH += 1; lobtM -= 60; }
      if (lobtH >= 24) lobtH %= 24;
      document.getElementById("fdp-res-lobt").innerText = `${lobtH.toString().padStart(2, '0')}:${lobtM.toString().padStart(2, '0')} UTC`;
    }

    if (resBox) resBox.classList.remove("hidden");
  });

  document.getElementById("btn-fdp-dec")?.addEventListener("click", () => {
    const count = getSectorCount();
    setSectorCount(count - 1);
    const badge = document.getElementById("fdp-sector-count");
    if (badge) badge.innerText = getSectorCount();
  });

  document.getElementById("btn-fdp-inc")?.addEventListener("click", () => {
    const count = getSectorCount();
    setSectorCount(count + 1);
    const badge = document.getElementById("fdp-sector-count");
    if (badge) badge.innerText = getSectorCount();
  });
}

// ----------------------------------------------------------------------------
// STEP 3: 2-TIER TOOLS CONTROLLER, SWIPE GESTURES & SMART PIPELINING
// ----------------------------------------------------------------------------

export function initToolsUIController() {
  initToolsModule();

  const catQualsBtn = document.getElementById("cat-tab-qualifications");
  const catDutyBtn = document.getElementById("cat-tab-dutyrest");

  if (catQualsBtn) catQualsBtn.addEventListener("click", () => switchToolCategory("qualifications"));
  if (catDutyBtn) catDutyBtn.addEventListener("click", () => switchToolCategory("dutyrest"));

  const catAPillsMap = [
    { pill: "pill-tool-medical", card: "tool-card-medical" },
    { pill: "pill-tool-ppc", card: "tool-card-ppc" },
    { pill: "pill-tool-recurrent", card: "tool-card-recurrent" },
    { pill: "pill-tool-recency", card: "tool-card-recency" }
  ];

  catAPillsMap.forEach(item => {
    const pill = document.getElementById(item.pill);
    if (pill) {
      pill.addEventListener("click", () => {
        switchActiveTool(item.card);
      });
    }
  });

  const catBPillsMap = [
    { pill: "pill-tool-standby", card: "tool-card-standby" },
    { pill: "pill-tool-maxfdp", card: "tool-card-maxfdp" },
    { pill: "pill-tool-preflight", card: "tool-card-preflight" },
    { pill: "pill-tool-cumulative", card: "tool-card-cumulative" }
  ];

  catBPillsMap.forEach(item => {
    const pill = document.getElementById(item.pill);
    if (pill) {
      pill.addEventListener("click", () => {
        switchActiveTool(item.card);
      });
    }
  });

  const tzUtcBtn = document.getElementById("tz-btn-utc");
  const tzLocalBtn = document.getElementById("tz-btn-local");

  if (tzUtcBtn) tzUtcBtn.addEventListener("click", () => setStandbyLocation("UTC"));
  if (tzLocalBtn) tzLocalBtn.addEventListener("click", () => setStandbyLocation("LOCAL"));

  const stbyHomeBtn = document.getElementById("btn-stby-loc-home");
  const stbyAirportBtn = document.getElementById("btn-stby-loc-airport");

  if (stbyHomeBtn) stbyHomeBtn.addEventListener("click", () => setStandbyLocation("HOME"));
  if (stbyAirportBtn) stbyAirportBtn.addEventListener("click", () => setStandbyLocation("AIRPORT"));

  const courseTrigger = document.getElementById("btn-recurrent-course-trigger");
  const courseModalClose = document.getElementById("btn-close-recurrent-modal");
  const courseSearchInput = document.getElementById("recurrent-search-input");

  if (courseTrigger) courseTrigger.addEventListener("click", openRecurrentCourseModal);
  if (courseModalClose) courseModalClose.addEventListener("click", closeRecurrentCourseModal);

  if (courseSearchInput) {
    courseSearchInput.addEventListener("input", (e) => filterRecurrentCourses(e.target.value));
  }

  document.querySelectorAll(".recurrent-module-card").forEach(card => {
    card.addEventListener("click", () => {
      const key = card.dataset.courseKey;
      const name = card.dataset.courseName;
      const category = card.dataset.courseCategory;
      if (key && name && category) {
        selectRecurrentCourse(key, name, category);
        dispatchActiveToolCalculation();
      }
    });
  });

  setupToolsCardSwipeGestures();

  document.querySelectorAll("[onclick^=\"resetToolInputs\"]").forEach(btn => {
    btn.removeAttribute("onclick");
    btn.addEventListener("click", (e) => {
      const toolCard = e.target.closest(".tool-card");
      if (toolCard) {
        const toolId = toolCard.id;
        resetToolInputs(toolId);
        dispatchActiveToolCalculation();
      }
    });
  });

  ["card-wrapper-cat-a", "card-wrapper-cat-b"].forEach(wrapperId => {
    const wrapper = document.getElementById(wrapperId);
    if (wrapper) {
      wrapper.addEventListener("input", () => dispatchActiveToolCalculation());
      wrapper.addEventListener("change", () => dispatchActiveToolCalculation());
    }
  });

  restoreToolsLocalStorage();
  dispatchActiveToolCalculation();
}

window.initToolsUIController = initToolsUIController;

export function setupCardSwipeGestures(wrapperId, toolIdList) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  let startX = 0;
  let startY = 0;

  wrapper.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
  }, { passive: true });

  wrapper.addEventListener("touchend", (e) => {
    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        const state = getToolsState();
        const activeToolId = state.activeSubTab;
        const currentIndex = toolIdList.indexOf(activeToolId);

        if (currentIndex !== -1) {
          if (deltaX < 0 && currentIndex < toolIdList.length - 1) {
            const nextToolId = toolIdList[currentIndex + 1];
            switchActiveTool(nextToolId);
            dispatchActiveToolCalculation();
          } else if (deltaX > 0 && currentIndex > 0) {
            const prevToolId = toolIdList[currentIndex - 1];
            switchActiveTool(prevToolId);
            dispatchActiveToolCalculation();
          }
        }
      }
    }
  }, { passive: true });
}

export function restoreToolsLocalStorage() {
  try {
    const recDay = localStorage.getItem("certifly_tool_recency_day");
    const recNight = localStorage.getItem("certifly_tool_recency_night");
    if (recDay && document.getElementById("input-recency-day")) document.getElementById("input-recency-day").value = recDay;
    if (recNight && document.getElementById("input-recency-night")) document.getElementById("input-recency-night").value = recNight;

    const cum7d = localStorage.getItem("certifly_tool_cum_duty_7d");
    const cum28d = localStorage.getItem("certifly_tool_cum_flight_28d");
    if (cum7d && document.getElementById("input-cum-duty-7d")) document.getElementById("input-cum-duty-7d").value = cum7d;
    if (cum28d && document.getElementById("input-cum-flight-28d")) document.getElementById("input-cum-flight-28d").value = cum28d;
  } catch (e) {
    console.warn("LocalStorage access error in tools:", e);
  }
}


let isSwipeAnimating = false;

export function setupToolsCardSwipeGestures() {
  const catACards = ['tool-card-medical', 'tool-card-ppc', 'tool-card-recurrent', 'tool-card-recency'];
  const catBCards = ['tool-card-standby', 'tool-card-maxfdp', 'tool-card-preflight', 'tool-card-cumulative'];

  const categoryConfigs = [
    { wrapperId: 'card-wrapper-cat-a', menuId: 'subtab-strip-cat-a', cards: catACards },
    { wrapperId: 'card-wrapper-cat-b', menuId: 'subtab-strip-cat-b', cards: catBCards }
  ];

  categoryConfigs.forEach(config => {
    const wrapper = document.getElementById(config.wrapperId);
    const menu = document.getElementById(config.menuId);
    const targetContainers = [wrapper, menu].filter(Boolean);

    targetContainers.forEach(container => {
      let touchStartX = 0;
      let touchStartY = 0;

      container.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // Threshold check: horizontal swipe > 35px and dominant over vertical scroll
        if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
          const activeCardEl = (wrapper ? wrapper.querySelector('.tool-card.active') : null) || document.querySelector('.tool-card.active');
          if (!activeCardEl) return;

          const currentCardId = activeCardEl.id;
          const cardsList = config.cards;
          const currentIndex = cardsList.indexOf(currentCardId);

          if (currentIndex === -1) return;

          const isLeftSwipe = diffX < 0;  // Swipe Left -> Next Tool
          const isRightSwipe = diffX > 0; // Swipe Right -> Prev Tool

          if (isLeftSwipe && currentIndex < cardsList.length - 1) {
            const targetCardId = cardsList[currentIndex + 1];
            if (typeof switchActiveTool === 'function') switchActiveTool(targetCardId);
          } else if (isRightSwipe && currentIndex > 0) {
            const targetCardId = cardsList[currentIndex - 1];
            if (typeof switchActiveTool === 'function') switchActiveTool(targetCardId);
          }
        }
      }, { passive: true });
    });
  });
}

if (typeof window !== 'undefined') {
  window.initToolsUI = initToolsUI;
  window.initToolsUIController = initToolsUIController;
}
