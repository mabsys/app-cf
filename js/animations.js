// js/animations.js (2710_R251) - CertiFly™ Anime.js Universal Animation Engine & 3D Tools Controller

/**
 * Check if Anime.js library is loaded globally
 */
function isAnimeAvailable() {
  if (typeof anime === 'undefined' || !anime) return false;
  return typeof anime === 'function' || typeof anime.animate === 'function';
}

/**
 * Universal Anime.js Execution Helper (Compatible with both v3.x and v4.x)
 */
function runAnime(params = {}) {
  if (!isAnimeAvailable()) return null;

  if (typeof anime === 'function') {
    // Anime.js v3.x syntax: anime({...})
    return anime(params);
  } else if (typeof anime === 'object' && typeof anime.animate === 'function') {
    // Anime.js v4.x syntax: anime.animate(targets, parameters)
    const { targets, easing, ease, update, onUpdate, ...rest } = params;
    let v4Easing = easing || ease;
    if (v4Easing === 'easeOutQuad') v4Easing = 'outQuad';
    else if (v4Easing === 'easeOutCubic') v4Easing = 'outCubic';
    else if (v4Easing === 'easeOutExpo') v4Easing = 'outExpo';
    else if (typeof v4Easing === 'string' && v4Easing.startsWith('easeOutBack')) {
      const match = v4Easing.match(/easeOutBack\(([^)]+)\)/);
      v4Easing = match ? `outBack(${match[1]})` : 'outBack';
    }

    const animProps = { ...rest };
    if (v4Easing) animProps.ease = v4Easing;
    const updateCb = onUpdate || update;
    if (updateCb) {
      animProps.onUpdate = updateCb;
      animProps.update = updateCb;
    }

    if (targets) {
      return anime.animate(targets, animProps);
    }
    return anime.animate(animProps);
  }
  return null;
}

/**
 * Universal Stagger Helper (v3 & v4 compatible)
 */
function runStagger(value, options) {
  if (typeof anime !== 'undefined' && anime && typeof anime.stagger === 'function') {
    return anime.stagger(value, options);
  }
  return 0;
}

let isHeroFlipped = false;

/**
 * Interactive 3D Hero Card Flip Controller
 */
export function initHeroCardFlip() {
  const containerEl = document.getElementById('overview-hero-container');
  const cardEl = document.getElementById('overview-hero-card');
  if (!containerEl || !cardEl) return;

  if (containerEl.dataset.flipInitialized === 'true') return;
  containerEl.dataset.flipInitialized = 'true';

  containerEl.addEventListener('click', () => {
    isHeroFlipped = !isHeroFlipped;

    if (toBack) {
    innerEl.classList.add('rotate-y-180');
  } else {
    innerEl.classList.remove('rotate-y-180');
  }

  if (isAnimeAvailable()) {
      runAnime({
        targets: cardEl,
        rotateY: isHeroFlipped ? 180 : 0,
        duration: 480,
        easing: 'easeOutBack(1.1)'
      });
    } else {
      cardEl.style.transform = `rotateY(${isHeroFlipped ? 180 : 0}deg)`;
    }
  });
}

/**
 * 1. Bento Grid Entrance Cascade
 */
export function animateOverviewEntrance() {
  if (!isAnimeAvailable()) return;

  const cards = document.querySelectorAll('#tab-overview-content > div');
  if (!cards || cards.length === 0) return;

  runAnime({
    targets: cards,
    opacity: [0, 1],
    translateY: [16, 0],
    delay: runStagger(80, { start: 50 }),
    duration: 650,
    easing: 'easeOutQuad'
  });
}

/**
 * 2. Hero Legality Concentric Rings & Live Number Counter Animation
 * @param {Object} opts - { caamOffset, mabOffset, caamColor, mabColor, targetDays }
 */
export function animateLegalityRings(opts = {}) {
  if (!isAnimeAvailable()) return;

  const ringCaam = document.getElementById('ring-caam');
  const ringCaamBack = document.getElementById('ring-caam-back');
  const ringMab = document.getElementById('ring-mab');
  const ringMabBack = document.getElementById('ring-mab-back');
  const percentEl = document.getElementById('ov-ring-percent');
  const percentElBack = document.getElementById('ov-ring-percent-back');

  const {
    caamOffset = 0,
    mabOffset = 0,
    caamColor = '#3B82F6',
    mabColor = '#1D4ED8',
    targetDays = 0
  } = opts;

  // Inner Ring (CAAM, circumference = 188.50)
  const caamRings = [ringCaam, ringCaamBack].filter(Boolean);
  if (caamRings.length > 0) {
    caamRings.forEach(r => r.setAttribute('stroke', caamColor));
    runAnime({
      targets: caamRings,
      strokeDashoffset: [188.50, caamOffset],
      duration: 1100,
      easing: 'easeOutExpo'
    });
  }

  // Outer Ring (MAB, circumference = 263.89)
  const mabRings = [ringMab, ringMabBack].filter(Boolean);
  if (mabRings.length > 0) {
    mabRings.forEach(r => r.setAttribute('stroke', mabColor));
    runAnime({
      targets: mabRings,
      strokeDashoffset: [263.89, mabOffset],
      duration: 1300,
      easing: 'easeOutExpo'
    });
  }

  // Live Counter for Days Remaining in Ring Center (Front & Back)
  const targetElements = [percentEl, percentElBack].filter(Boolean);
  if (targetElements.length > 0 && typeof targetDays === 'number' && !isNaN(targetDays)) {
    const isOverHundred = targetDays > 100;
    const finalVal = Math.max(0, targetDays);
    const counterObj = { val: 0 };

    runAnime({
      targets: counterObj,
      val: finalVal,
      round: 1,
      duration: 1000,
      easing: 'easeOutCubic',
      update: () => {
        const displayVal = isOverHundred && counterObj.val >= 100 ? '100+' : String(Math.round(counterObj.val));
        targetElements.forEach(el => { el.innerText = displayVal; });
      }
    });
  }
}

/**
 * 3. LVO Recency Pointer Marker Glide
 * @param {number} targetPct - Position percentage (0 to 100)
 */
export function animateLvoMarker(targetPct = 0) {
  if (!isAnimeAvailable()) return;

  const markerEl = document.getElementById('ov-lvo-marker');
  if (!markerEl) return;

  const safePct = Math.min(100, Math.max(0, targetPct));

  runAnime({
    targets: markerEl,
    left: ['0%', safePct + '%'],
    duration: 1100,
    easing: 'easeOutBack(1.4)'
  });
}

/**
 * 4. Vertical Sparkline Histogram Bars Staggered Growth
 */
export function animateHistogramBars() {
  if (!isAnimeAvailable()) return;

  const vBars = document.querySelectorAll('#tab-overview-content [id^="vbar-drill-"]');
  if (!vBars || vBars.length === 0) return;

  vBars.forEach(bar => {
    const currentHeight = bar.style.height || '100%';
    bar.setAttribute('data-target-height', currentHeight);
  });

  runAnime({
    targets: vBars,
    height: [(el) => '0%', (el) => el.getAttribute('data-target-height') || '100%'],
    delay: runStagger(50, { start: 100 }),
    duration: 850,
    easing: 'easeOutCubic'
  });

  // Stagger legend dots pop-in
  const dots = document.querySelectorAll('#tab-overview-content [id^="dot-legend-"]');
  if (dots && dots.length > 0) {
    runAnime({
      targets: dots,
      scale: [0, 1],
      opacity: [0, 1],
      delay: runStagger(40, { start: 200 }),
      duration: 500,
      easing: 'easeOutBack(1.5)'
    });
  }
}

/**
 * 5. Passport & ELP Progress Bars Sweep
 */
export function animatePassportAndElpBars() {
  if (!isAnimeAvailable()) return;

  const passBar = document.getElementById('ov-passport-bar');
  const elpBar = document.getElementById('ov-elp-bar');

  if (passBar) {
    const targetW = passBar.style.width || '100%';
    runAnime({
      targets: passBar,
      width: ['0%', targetW],
      duration: 900,
      easing: 'easeOutCubic'
    });
  }

  if (elpBar) {
    const targetW = elpBar.style.width || '100%';
    runAnime({
      targets: elpBar,
      width: ['0%', targetW],
      duration: 900,
      easing: 'easeOutCubic'
    });
  }

  // Scale labels stagger
  const scaleSpans = document.querySelectorAll('#ov-elp-scale span');
  if (scaleSpans && scaleSpans.length > 0) {
    runAnime({
      targets: scaleSpans,
      opacity: [0, 1],
      translateY: [4, 0],
      delay: runStagger(40, { start: 300 }),
      duration: 500,
      easing: 'easeOutCubic'
    });
  }
}

/**
 * Master Orchestrator: Animate all Overview tab elements
 * @param {Object} animData - Data options for rings and marker
 */
export function animateOverviewDashboard(animData = {}) {
  if (!isAnimeAvailable()) return;

  // Execute entrance cascade
  animateOverviewEntrance();

  // Execute rings & counter
  animateLegalityRings(animData);

  // Execute LVO marker glide
  if (typeof animData.lvoPct === 'number') {
    animateLvoMarker(animData.lvoPct);
  }

  // Execute histogram bars growth
  animateHistogramBars();

  // Execute progress bars sweep
  animatePassportAndElpBars();
}

/* ==========================================================================
   3D TOOLS VIEW ANIME.JS ANIMATION ENGINE SUITE
   ========================================================================== */

/**
 * 6. 3D Card 180° Y-Axis Flip Controller
 * @param {string} toolId - Target tool ID (e.g. 'medical', 'ppc', 'max-fdp')
 * @param {boolean} toBack - True to reveal verdict back face, False for front input
 */
export function animate3DCardFlip(toolId, toBack = true) {
  const cardEl = document.getElementById(`tool-card-${toolId}`);
  if (!cardEl) return;

  const innerEl = cardEl.querySelector('.card-3d-inner');
  if (!innerEl) return;

  if (toBack) {
    innerEl.classList.add('rotate-y-180');
  } else {
    innerEl.classList.remove('rotate-y-180');
  }

  if (isAnimeAvailable()) {
    runAnime({
      targets: innerEl,
      rotateY: toBack ? 180 : 0,
      duration: 550,
      easing: 'easeOutBack(1.1)',
      complete: () => {
        if (toBack) {
          animateVerdictPop(toolId);
        }
      }
    });
  } else {
    innerEl.style.transform = `rotateY(${toBack ? 180 : 0}deg)`;
  }
}

/**
 * 7. 4-Tier Verdict Pop & Cascade Stagger
 * @param {string} toolId - Target tool ID
 */
export function animateVerdictPop(toolId) {
  if (!isAnimeAvailable()) return;

  const backContainer = document.getElementById(`output-back-content-${toolId}`);
  if (!backContainer) return;

  const tiers = backContainer.querySelectorAll('> div > div, > div > p');
  if (!tiers || tiers.length === 0) return;

  runAnime({
    targets: tiers,
    scale: [0.92, 1],
    opacity: [0, 1],
    translateY: [8, 0],
    delay: runStagger(60, { start: 20 }),
    duration: 400,
    easing: 'easeOutCubic'
  });
}

/**
 * 8. Card Input Reset Pulse Animation
 * @param {string} toolId - Target tool ID
 */
export function animateResetPulse(toolId) {
  const cardEl = document.getElementById(`tool-card-${toolId}`);
  if (!cardEl) return;

  if (toBack) {
    innerEl.classList.add('rotate-y-180');
  } else {
    innerEl.classList.remove('rotate-y-180');
  }

  if (isAnimeAvailable()) {
    runAnime({
      targets: cardEl,
      scale: [1, 0.96, 1.02, 1],
      duration: 320,
      easing: 'easeInOutQuad'
    });
  }
}

// Global window fallback for non-module usage
if (typeof window !== 'undefined') {
  window.CertiFlyAnimations = {
    initHeroCardFlip,
    animateOverviewEntrance,
    animateLegalityRings,
    animateLvoMarker,
    animateHistogramBars,
    animatePassportAndElpBars,
    animateOverviewDashboard,
    animate3DCardFlip,
    animateVerdictPop,
    animateResetPulse
  };
}
