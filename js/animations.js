// js/animations.js (2010_R185) - CertiFly™ Anime.js Animation Engine Controller

/**
 * Check if Anime.js library is loaded globally
 */
function isAnimeAvailable() {
  return typeof anime !== 'undefined';
}

/**
 * 1. Bento Grid Entrance Cascade
 * Staggers entrance fade-in and slide-up for Overview tab Bento cards
 */
export function animateOverviewEntrance() {
  if (!isAnimeAvailable()) return;

  const cards = document.querySelectorAll('#tab-overview-content > div');
  if (!cards || cards.length === 0) return;

  anime({
    targets: cards,
    opacity: [0, 1],
    translateY: [16, 0],
    delay: anime.stagger(80, { start: 50 }),
    duration: 650,
    easing: 'easeOutQuad'
  });
}

/**
 * 2. Hero Legality Concentric Rings & Live Number Counter Animation
 * @param {Object} opts - { caamOffset, mabOffset, caamColor, mabColor, targetDays }
 */
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

    if (isAnimeAvailable()) {
      anime({
        targets: cardEl,
        rotateY: isHeroFlipped ? 180 : 0,
        duration: 650,
        easing: 'easeOutBack(1.2)'
      });
    } else {
      cardEl.style.transform = `rotateY(${isHeroFlipped ? 180 : 0}deg)`;
    }
  });
}

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
  [ringCaam, ringCaamBack].forEach(r => {
    if (r) {
      r.setAttribute('stroke', caamColor);
      anime({
        targets: r,
        strokeDashoffset: [188.50, caamOffset],
        duration: 1100,
        easing: 'easeOutExpo'
      });
    }
  });

  // Outer Ring (MAB, circumference = 263.89)
  [ringMab, ringMabBack].forEach(r => {
    if (r) {
      r.setAttribute('stroke', mabColor);
      anime({
        targets: r,
        strokeDashoffset: [263.89, mabOffset],
        duration: 1300,
        easing: 'easeOutExpo'
      });
    }
  });

  // Live Counter for Days Remaining in Ring Center
  if (percentEl && typeof targetDays === 'number' && !isNaN(targetDays)) {
    const isOverHundred = targetDays > 100;
    const finalVal = Math.max(0, targetDays);
    const counterObj = { val: 0 };

    anime({
      targets: counterObj,
      val: finalVal,
      round: 1,
      duration: 1000,
      easing: 'easeOutCubic',
      update: () => {
        const txt = (isOverHundred && counterObj.val >= 100) ? '100+' : String(Math.round(counterObj.val));
        if (percentEl) percentEl.innerText = txt;
        if (percentElBack) percentElBack.innerText = txt;
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

  anime({
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

  anime({
    targets: vBars,
    height: [(el) => '0%', (el) => el.getAttribute('data-target-height') || '100%'],
    delay: anime.stagger(50, { start: 100 }),
    duration: 850,
    easing: 'easeOutCubic'
  });

  // Stagger legend dots pop-in
  const dots = document.querySelectorAll('#tab-overview-content [id^="dot-legend-"]');
  if (dots && dots.length > 0) {
    anime({
      targets: dots,
      scale: [0, 1],
      opacity: [0, 1],
      delay: anime.stagger(40, { start: 200 }),
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
    anime({
      targets: passBar,
      width: ['0%', targetW],
      duration: 900,
      easing: 'easeOutCubic'
    });
  }

  if (elpBar) {
    const targetW = elpBar.style.width || '100%';
    anime({
      targets: elpBar,
      width: ['0%', targetW],
      duration: 900,
      easing: 'easeOutCubic'
    });
  }

  // Scale labels stagger
  const scaleSpans = document.querySelectorAll('#ov-elp-scale span');
  if (scaleSpans && scaleSpans.length > 0) {
    anime({
      targets: scaleSpans,
      opacity: [0, 1],
      translateY: [4, 0],
      delay: anime.stagger(40, { start: 300 }),
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

// Global window fallback for non-module usage
if (typeof window !== 'undefined') {
  window.CertiFlyAnimations = {
    initHeroCardFlip,
    animateOverviewEntrance,
    animateLegalityRings,
    animateLvoMarker,
    animateHistogramBars,
    animatePassportAndElpBars,
    animateOverviewDashboard
  };
}
