// ./js/views/toolsView.js (2710_R253) - Decoupled 3D Vertical Reel & 2-Faced Card Renderer
/* ==========================================================================
   CertiFly - Tools View ES Module (toolsView.js - R250)
   Decoupled 3D Vertical Reel & 2-Faced Card Renderer
   ========================================================================== */

import { switchToolCategory, executeAndFlipCard, resetToolInputs, setStandbyLocation, openRecurrentCourseModal } from '../tools.js';

export const reelState = {
  activeCategory: 'validity',
  validityIndex: 0,
  dutyrestIndex: 0,
  isDragging: false,
  startY: 0,
  dragOffset: 0
};

const CATEGORY_MAP = {
  validity: ['medical', 'ppc', 'recurrent', 'recency'],
  dutyrest: ['standby', 'max-fdp', 'pre-flight-rest', 'cumulative']
};

export function renderToolsView(containerSelector = '#tools-view-container') {
  const container = typeof containerSelector === 'string' 
    ? document.querySelector(containerSelector) 
    : containerSelector;

  if (!container) return;

  container.innerHTML = `
    <div id="tools-view-root" class="w-full h-full flex flex-col justify-between overflow-hidden bg-slate-900 text-white relative select-none">
      
      <!-- CATEGORY SWITCHER BAR -->
      <div class="p-3 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md z-20 flex justify-center items-center">
        <div class="flex p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 max-w-[340px] w-full shadow-inner">
          <button type="button" id="btn-cat-validity" class="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer bg-sky-500 text-white shadow-md shadow-sky-500/20">
            Validity (4)
          </button>
          <button type="button" id="btn-cat-dutyrest" class="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-slate-400 hover:text-slate-200">
            Duty & Rest (4)
          </button>
        </div>
      </div>

      <!-- 3D VERTICAL REEL VIEWPORT -->
      <div id="reel-3d-viewport" class="reel-3d-viewport flex-1 relative overflow-hidden flex items-center justify-center p-4 perspective-1000 cursor-grab active:cursor-grabbing">
        
        <!-- UP / DOWN NAV ARROWS -->
        <button type="button" id="btn-reel-prev" class="absolute top-2 left-1/2 -translate-x-1/2 z-30 text-slate-400 hover:text-white bg-slate-800/70 p-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm cursor-pointer transition-all active:scale-90">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
        </button>
        <button type="button" id="btn-reel-next" class="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 text-slate-400 hover:text-white bg-slate-800/70 p-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm cursor-pointer transition-all active:scale-90">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>

        <!-- CAROUSEL PAGE DOTS -->
        <div id="reel-dots-container" class="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2.5 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80 backdrop-blur-sm">
          <button type="button" data-dot-idx="0" class="reel-dot w-2.5 h-2.5 rounded-full bg-sky-500 transition-all cursor-pointer"></button>
          <button type="button" data-dot-idx="1" class="reel-dot w-2.5 h-2.5 rounded-full bg-slate-700 transition-all cursor-pointer"></button>
          <button type="button" data-dot-idx="2" class="reel-dot w-2.5 h-2.5 rounded-full bg-slate-700 transition-all cursor-pointer"></button>
          <button type="button" data-dot-idx="3" class="reel-dot w-2.5 h-2.5 rounded-full bg-slate-700 transition-all cursor-pointer"></button>
        </div>

        <!-- REEL CYLINDER STAGE -->
        <div id="reel-cylinder" class="reel-cylinder-container w-full max-w-[360px] h-[380px] relative flex items-center justify-center preserve-3d">
          
          <!-- Category A Cards (Validity Suite) -->
          <div id="suite-validity" class="suite-container w-full h-full relative flex items-center justify-center preserve-3d">
            ${renderMedicalCard()}
            ${renderPpcCard()}
            ${renderRecurrentCard()}
            ${renderRecencyCard()}
          </div>

          <!-- Category B Cards (Duty & Rest Suite) -->
          <div id="suite-dutyrest" class="suite-container w-full h-full relative flex items-center justify-center preserve-3d hidden">
            ${renderStandbyCard()}
            ${renderMaxFdpCard()}
            ${renderPreflightCard()}
            ${renderCumulativeCard()}
          </div>

        </div>
      </div>

    </div>
  `;

  // Attach 3D Reel Listeners & Initialize Positions
  init3DReelController();
}

// --------------------------------------------------------------------------
// 3D Vertical Reel Controller & Gesture Engine
// --------------------------------------------------------------------------
export function init3DReelController() {
  const btnValidity = document.getElementById('btn-cat-validity');
  const btnDutyrest = document.getElementById('btn-cat-dutyrest');
  const btnPrev = document.getElementById('btn-reel-prev');
  const btnNext = document.getElementById('btn-reel-next');
  const viewport = document.getElementById('reel-3d-viewport');

  if (btnValidity) {
    btnValidity.addEventListener('click', () => {
      switchToolCategory('validity');
      setReelCategory('validity');
    });
  }

  if (btnDutyrest) {
    btnDutyrest.addEventListener('click', () => {
      switchToolCategory('dutyrest');
      setReelCategory('dutyrest');
    });
  }

  if (btnPrev) btnPrev.addEventListener('click', () => stepReel(-1));
  if (btnNext) btnNext.addEventListener('click', () => stepReel(1));

  // Attach Carousel Dots Click Listener
  document.querySelectorAll('.reel-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.dotIdx, 10);
      if (!isNaN(idx)) setReelIndex(reelState.activeCategory, idx);
    });
  });

  // Attach Touch & Drag Gesture Listeners
  if (viewport) {
    let startY = 0;
    let isDragging = false;
    let dragDeltaY = 0;

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        startY = e.touches[0].clientY;
        isDragging = true;
        dragDeltaY = 0;
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (!isDragging || !e.touches || e.touches.length === 0) return;
      dragDeltaY = e.touches[0].clientY - startY;
      update3DReelPosition(reelState.activeCategory, getActiveIndex(), dragDeltaY);
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      if (dragDeltaY < -35) {
        stepReel(1);
      } else if (dragDeltaY > 35) {
        stepReel(-1);
      } else {
        update3DReelPosition(reelState.activeCategory, getActiveIndex(), 0);
      }
      dragDeltaY = 0;
    });

    // Mouse Wheel / Trackpad Scroll Listener
    let wheelTimeout = null;
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (wheelTimeout) return;

      if (e.deltaY > 15) {
        stepReel(1);
      } else if (e.deltaY < -15) {
        stepReel(-1);
      }

      wheelTimeout = setTimeout(() => {
        wheelTimeout = null;
      }, 200);
    }, { passive: false });
  }

  // Initial 3D Position Pass
  update3DReelPosition(reelState.activeCategory, getActiveIndex());
}

export function setReelCategory(cat) {
  reelState.activeCategory = cat;
  const idx = cat === 'validity' ? reelState.validityIndex : reelState.dutyrestIndex;
  update3DReelPosition(cat, idx);
}

export function getActiveIndex() {
  return reelState.activeCategory === 'validity' ? reelState.validityIndex : reelState.dutyrestIndex;
}

export function setReelIndex(category, targetIndex) {
  const cards = CATEGORY_MAP[category] || [];
  if (cards.length === 0) return;

  const N = cards.length;
  const cleanIdx = (targetIndex + N) % N;

  if (category === 'validity') {
    reelState.validityIndex = cleanIdx;
  } else {
    reelState.dutyrestIndex = cleanIdx;
  }

  update3DReelPosition(category, cleanIdx);
}

export function stepReel(delta) {
  const cat = reelState.activeCategory;
  const currentIdx = getActiveIndex();
  setReelIndex(cat, currentIdx + delta);
}

export function update3DReelPosition(category = reelState.activeCategory, activeIndex = 0, dragOffset = 0) {
  const suiteId = category === 'validity' ? 'suite-validity' : 'suite-dutyrest';
  const suiteEl = document.getElementById(suiteId);
  if (!suiteEl) return;

  const cards = Array.from(suiteEl.querySelectorAll('.tool-card-3d-wrapper'));
  const N = cards.length;
  if (N === 0) return;

  cards.forEach((card, k) => {
    let diff = (k - activeIndex + N) % N;
    if (diff > N / 2) diff -= N;

    // Apply live drag offset fraction
    const effectiveDiff = diff - (dragOffset / 200);

    const translateY = effectiveDiff * 135;
    const translateZ = -Math.abs(effectiveDiff) * 110;
    const rotateX = -effectiveDiff * 22;
    const scale = Math.max(0.65, 1.0 - Math.abs(effectiveDiff) * 0.15);
    const opacity = diff === 0 ? 1 : Math.max(0.25, 1.0 - Math.abs(effectiveDiff) * 0.45);
    const zIndex = 30 - Math.round(Math.abs(effectiveDiff) * 10);

    card.style.transform = `translate3d(-50%, calc(-50% + ${translateY}px), ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`;
    card.style.opacity = String(opacity);
    card.style.zIndex = String(zIndex);

    // Bind card click to bring into focus if not active
    card.onclick = (e) => {
      if (diff !== 0 && !e.target.closest('button, input, select')) {
        setReelIndex(category, k);
      }
    };
  });

  // Update Page Indicator Dots
  document.querySelectorAll('.reel-dot').forEach((dot, idx) => {
    if (idx === activeIndex) {
      dot.className = 'reel-dot w-2.5 h-2.5 rounded-full bg-sky-500 scale-125 transition-all cursor-pointer shadow-sm shadow-sky-500/50';
    } else {
      dot.className = 'reel-dot w-2.5 h-2.5 rounded-full bg-slate-700 transition-all cursor-pointer hover:bg-slate-500';
    }
  });
}

// --------------------------------------------------------------------------
// Helper: 2-Faced Card Shell
// --------------------------------------------------------------------------
function renderCardShell(toolId, title, shortName, inputBodyHtml) {
  return `
    <div class="tool-card-3d-wrapper absolute top-1/2 left-1/2 w-full max-w-[340px] preserve-3d transition-all duration-500 ease-out cursor-pointer" id="tool-card-${toolId}" data-tool-id="${toolId}">
      <div class="card-3d-inner w-full relative transition-transform duration-500 preserve-3d shadow-2xl rounded-3xl border border-slate-800 bg-slate-900/95 text-white">
        
        <!-- FRONT FACE: INPUT FORM -->
        <div class="card-face card-front p-4 w-full flex flex-col justify-between backface-hidden">
          <div>
            <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 class="text-xs font-bold tracking-wider text-slate-200 uppercase">${title}</h3>
              <button type="button" onclick="resetToolInputs('${toolId}')" class="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer flex items-center gap-1">
                <span>↺</span> Reset
              </button>
            </div>
            
            <div class="card-inputs-body space-y-3">
              ${inputBodyHtml}
            </div>
          </div>

          <button type="button" onclick="executeAndFlipCard('${toolId}')" class="w-full mt-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5">
            <span>Compute ${shortName}</span>
            <span class="text-sm">➔</span>
          </button>
        </div>

        <!-- BACK FACE: 4-TIER RESULT VERDICT -->
        <div class="card-face card-back p-4 w-full flex flex-col justify-between backface-hidden rotate-y-180 absolute inset-0 bg-slate-900 rounded-3xl">
          <div id="output-back-content-${toolId}" class="w-full flex flex-col h-full justify-between">
            <!-- Rendered by renderNormalizedOutput -->
            <div class="text-center p-6 text-slate-500 text-xs">Awaiting calculation...</div>
          </div>
        </div>

      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// Input Form Renderers (Category A)
// --------------------------------------------------------------------------
function renderMedicalCard() {
  const inputs = `
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Last Exam Date</label>
      <button type="button" onclick="openEfbDatePicker('input-med-exam-date', 'LAST EXAM DATE')" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-left border border-slate-700 hover:border-sky-500/50 transition-all flex items-center justify-between cursor-pointer">
        <span id="input-med-exam-date-display" class="text-xs font-mono font-bold text-white">Select Date</span>
        <svg class="w-4 h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      </button>
      <input type="hidden" id="input-med-exam-date" value="">
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">License Type</label>
      <select id="input-med-license-type" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-medium">
        <option value="ATPL">ATPL (Airline Transport Pilot)</option>
        <option value="CPL">CPL (Commercial Pilot)</option>
        <option value="MPL">MPL (Multi-Crew Pilot)</option>
      </select>
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Age Bracket</label>
      <select id="input-med-age-bracket" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-medium">
        <option value="UNDER_40">Under 40 Years (12 Months)</option>
        <option value="40_TO_59" selected>40 to 59 Years (12 Months / 6 Months single-pilot)</option>
        <option value="60_PLUS">60+ Years (6 Months)</option>
      </select>
    </div>
  `;
  return renderCardShell('medical', 'Medical Validity', 'Medical', inputs);
}

function renderPpcCard() {
  const inputs = `
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Last Conduct Date</label>
      <button type="button" onclick="openEfbDatePicker('input-ppc-conduct-date', 'LAST CONDUCT DATE')" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-left border border-slate-700 hover:border-sky-500/50 transition-all flex items-center justify-between cursor-pointer">
        <span id="input-ppc-conduct-date-display" class="text-xs font-mono font-bold text-white">Select Date</span>
        <svg class="w-4 h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      </button>
      <input type="hidden" id="input-ppc-conduct-date" value="">
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Current Expiry Date (Optional)</label>
      <button type="button" onclick="openEfbDatePicker('input-ppc-expiry-date', 'CURRENT EXPIRY DATE')" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-left border border-slate-700 hover:border-sky-500/50 transition-all flex items-center justify-between cursor-pointer">
        <span id="input-ppc-expiry-date-display" class="text-xs font-mono font-bold text-white">Select Date</span>
        <svg class="w-4 h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      </button>
      <input type="hidden" id="input-ppc-expiry-date" value="">
    </div>
  `;
  return renderCardShell('ppc', 'PPC / LPC Validity', 'PPC', inputs);
}

function renderRecurrentCard() {
  const inputs = `
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Qualification Module</label>
      <input type="hidden" id="input-recurrent-course" value="LC">
      <button type="button" onclick="openRecurrentCourseModal()" class="w-full p-2.5 rounded-xl bg-slate-800 text-left border border-slate-700 hover:border-sky-500/50 transition-all flex items-center justify-between cursor-pointer">
        <div>
          <p id="recurrent-course-label" class="text-xs font-bold text-white">Line Check (LC)</p>
          <p id="recurrent-course-sublabel" class="text-[10px] text-slate-400">Annual (12 Calendar Months)</p>
        </div>
        <span class="text-sky-400 text-xs font-bold">Select ▾</span>
      </button>
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Completion Date</label>
      <button type="button" onclick="openEfbDatePicker('input-recurrent-conduct-date', 'COMPLETION DATE')" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-left border border-slate-700 hover:border-sky-500/50 transition-all flex items-center justify-between cursor-pointer">
        <span id="input-recurrent-conduct-date-display" class="text-xs font-mono font-bold text-white">Select Date</span>
        <svg class="w-4 h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      </button>
      <input type="hidden" id="input-recurrent-conduct-date" value="">
    </div>
  `;
  return renderCardShell('recurrent', 'Recurrent Module', 'Recurrent', inputs);
}

function renderRecencyCard() {
  const inputs = `
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Day Landings (90D)</label>
        <input type="number" id="input-recency-day" min="0" max="50" value="3" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center font-bold">
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Night Landings (90D)</label>
        <input type="number" id="input-recency-night" min="0" max="50" value="1" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center font-bold">
      </div>
    </div>
    <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 text-center leading-relaxed">
      Requires <strong class="text-sky-400">3 Take-offs & Landings</strong> (or 1 night landing for night passenger currency) within preceding 90 days.
    </div>
  `;
  return renderCardShell('recency', '90-Day Landing Recency', 'Recency', inputs);
}

// --------------------------------------------------------------------------
// Input Form Renderers (Category B)
// --------------------------------------------------------------------------
function renderStandbyCard() {
  const inputs = `
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Standby Start</label>
        <input type="time" id="input-stby-start-time" value="06:00" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center">
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Callout Report</label>
        <input type="time" id="input-stby-report-time" value="10:00" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center">
      </div>
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Standby Location</label>
      <div class="flex p-1 bg-slate-800 rounded-xl border border-slate-700">
        <button type="button" id="btn-stby-loc-home" onclick="setStandbyLocation('HOME')" class="flex-1 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-white shadow-sm transition-all cursor-pointer">Home Base</button>
        <button type="button" id="btn-stby-loc-airport" onclick="setStandbyLocation('AIRPORT')" class="flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer">Airport Standby</button>
      </div>
    </div>
  `;
  return renderCardShell('standby', 'Standby FDP', 'Standby', inputs);
}

function renderMaxFdpCard() {
  const inputs = `
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Report Time</label>
        <input type="time" id="input-fdp-report-time" value="06:00" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center">
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Sectors</label>
        <input type="number" id="input-fdp-sectors" min="1" max="10" value="2" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center font-bold">
      </div>
    </div>
    <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 border border-slate-700">
      <span class="text-xs font-semibold text-slate-300">Acclimatised State</span>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="input-fdp-acclimatised" checked class="sr-only peer">
        <div class="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
      </label>
    </div>
  `;
  return renderCardShell('max-fdp', 'Max Allowable FDP', 'Max FDP', inputs);
}

function renderPreflightCard() {
  const inputs = `
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Preceding Duty Hours</label>
      <input type="number" id="input-rest-preceding-duty" min="0" max="30" value="10" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center font-bold">
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">Rest Location</label>
      <select id="input-rest-location" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-medium">
        <option value="HOME">Home Base</option>
        <option value="OUTSTATION">Outstation / Layover</option>
      </select>
    </div>
  `;
  return renderCardShell('pre-flight-rest', 'Pre-Flight Rest', 'Rest', inputs);
}

function renderCumulativeCard() {
  const inputs = `
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">7-Day Cumulative Duty (HH:MM)</label>
      <input type="text" id="input-cum-duty-7d" placeholder="e.g. 32:15" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center">
    </div>
    <div>
      <label class="block text-[11px] font-semibold text-slate-400 mb-1">28-Day Cumulative Flight Time</label>
      <input type="text" id="input-cum-flight-28d" placeholder="e.g. 78:45" class="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center">
    </div>
  `;
  return renderCardShell('cumulative', 'Cumulative Hours', 'Cumulative', inputs);
}
