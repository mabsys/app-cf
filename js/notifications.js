// js/notifications.js (1911_R388) - CertiFly Unified Notification Engine

/**
 * Helper to calculate dynamic top offset for persistent UI overlays
 * Stacks below status-bar-cover or persistent-topbar
 */
export function getSystemTopOffset() {
  const statusBarCover = document.getElementById('status-bar-cover');
  const topbar = document.getElementById('persistent-topbar');

  let coverBottom = 0;
  if (statusBarCover) {
    const rect = statusBarCover.getBoundingClientRect();
    coverBottom = Math.max(0, rect.bottom);
  }

  let topbarBottom = 0;
  if (topbar) {
    const style = window.getComputedStyle(topbar);
    if (style.display !== 'none' && style.visibility !== 'hidden') {
      const rect = topbar.getBoundingClientRect();
      if (rect.bottom > coverBottom) {
        topbarBottom = rect.bottom;
      }
    }
  }

  return Math.max(coverBottom, topbarBottom);
}

export function getToastTopOffset() {
  const baseOffset = getSystemTopOffset();
  const banner = document.getElementById('certifly-top-banner');
  if (banner && !banner.classList.contains('hidden') && !banner.classList.contains('-translate-y-full')) {
    const bannerRect = banner.getBoundingClientRect();
    if (bannerRect.bottom > baseOffset) {
      return bannerRect.bottom + 12;
    }
  }
  return baseOffset + 12;
}

/**
 * Real-time layout synchronizer for banners and toast containers.
 * Keeps notification elements dynamically stacked on scroll, resize, or view changes.
 */
export function updateSystemNotificationPositions() {
  const banner = document.getElementById('certifly-top-banner');
  if (banner && !banner.classList.contains('hidden')) {
    const topOffset = getSystemTopOffset();
    banner.style.top = `${topOffset}px`;
  }

  const container = document.getElementById('certifly-toast-container');
  if (container) {
    container.style.top = `${getToastTopOffset()}px`;
  }
}

// Global passive event listeners to maintain pixel-perfect position during scroll & resize
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', updateSystemNotificationPositions, { passive: true });
  window.addEventListener('resize', updateSystemNotificationPositions, { passive: true });
  window.updateSystemNotificationPositions = updateSystemNotificationPositions;
  window.getSystemTopOffset = getSystemTopOffset;
  window.getToastTopOffset = getToastTopOffset;
}

/**
 * 1. FLOATING TOAST NOTIFICATIONS (Auto-Dismiss Feedback)
 * @param {string} message - Text message to display
 * @param {'info'|'success'|'warning'|'error'|'offline'} type - Notification type styling
 * @param {number} duration - Auto-dismiss delay in ms (default: 3000ms)
 */
export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('certifly-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'certifly-toast-container';
    container.className = 'fixed left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-xs w-[90%] pointer-events-none transition-all duration-300';
    document.body.appendChild(container);
  }

  container.style.top = `${getToastTopOffset()}px`;

  const styles = {
    success: 'bg-slate-800 text-green-400 border border-slate-800 shadow-md',
    error: 'bg-slate-800 text-rose-400 border border-slate-800 shadow-md',
    warning: 'bg-slate-800 text-amber-500 border border-slate-800 shadow-md',
    info: 'bg-slate-800 text-white border border-slate-800 shadow-md',
    offline: 'bg-slate-800 text-white border border-slate-800 shadow-md'
  };

  const icons = {
    success: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    error: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.551c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l7.354 12.748zM12 15.75h.007v.008H12v-.008z" /></svg>`,
    warning: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874-1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`,
    info: `<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8-8 8"/></svg>`,
    offline: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.551c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l7.354 12.748zM12 15.75h.007v.008H12v-.008z" /></svg>`
  };

  const toast = document.createElement('div');
  toast.className = `px-4 py-2 rounded-lg shadow-md text-xs font-bold tracking-normal flex items-center justify-between gap-2 pointer-events-auto transition-all duration-300 opacity-0 -translate-y-3 ${styles[type] || styles.info}`;
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      ${icons[type] || icons.info}
      <span>${message}</span>
    </div>
    <button type="button" class="opacity-70 hover:opacity-100 focus:outline-none cursor-pointer p-0.5" aria-label="Close">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;

  toast.querySelector('button').onclick = () => toast.remove();
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', '-translate-y-3');
    toast.classList.add('opacity-100', 'translate-y-0');
  });

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', '-translate-y-3');
    setTimeout(() => {
      toast.remove();
      updateSystemNotificationPositions();
    }, 300);
  }, duration);
}

/**
 * 2. TOP SYSTEM BANNER (Offline Overlay & Portal Warnings - Behavior A: Sub-Header Stacked)
 * @param {string} message - Text message to display
 * @param {'offline'|'warning'|'info'} type - Styling type
 * @param {boolean} show - Controls visibility
 * @param {boolean} dismissible - Enables close button
 */
export function setTopBanner(message, type = 'warning', show = true, dismissible = true) {
  let banner = document.getElementById('certifly-top-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'certifly-top-banner';
    banner.className = 'fixed left-0 right-0 z-40 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 shadow-md flex items-center justify-between transition-transform duration-300 -translate-y-full hidden';
    document.body.appendChild(banner);
  }

  const topOffset = getSystemTopOffset();
  banner.style.top = `${topOffset}px`;

  if (!show || banner.getAttribute('data-dismissed') === 'true') {
    banner.classList.remove('translate-y-0');
    banner.classList.add('-translate-y-full', 'hidden');
    if (!show) {
      banner.removeAttribute('data-dismissed');
    }
    updateSystemNotificationPositions();
    return;
  }

  const styles = {
    offline: 'bg-rose-600 text-white border-b border-rose-700 animate-pulse',
    warning: 'bg-amber-500 text-slate-950 border-b border-amber-600',
    info: 'bg-blue-600 text-white border-b border-blue-700'
  };

  const icons = {
    offline: `<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.551c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l7.354 12.748zM12 15.75h.007v.008H12v-.008z" /></svg>`,
    warning: `<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874-1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`,
    info: `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8-8 8"/></svg>`
  };

  banner.className = `fixed left-0 right-0 z-40 text-[10px] font-black uppercase tracking-widest py-2.5 px-4 shadow-md flex items-center justify-between transition-transform duration-300 translate-y-0 ${styles[type] || styles.info}`;
  banner.classList.remove('-translate-y-full', 'hidden');
  banner.innerHTML = `
    <div class="flex items-center justify-center gap-2 mx-auto">
      ${icons[type] || icons.info}
      <span>${message}</span>
    </div>
    ${dismissible ? `<button type="button" class="opacity-80 hover:opacity-100 cursor-pointer p-0.5 ml-2 shrink-0" aria-label="Dismiss Banner" onclick="const b=document.getElementById('certifly-top-banner'); if(b){ b.classList.remove('translate-y-0'); b.classList.add('-translate-y-full', 'hidden'); b.setAttribute('data-dismissed','true'); if(window.updateSystemNotificationPositions) window.updateSystemNotificationPositions(); }"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>` : ''}
  `;

  updateSystemNotificationPositions();
}

/**
 * 3. DYNAMIC IN-CARD COMPLIANCE & SAFETY NOTICE BANNER
 * @param {string|HTMLElement} container - Target container element or ID
 * @param {Object} config - Configuration options (title, message, type, dismissible, id)
 */
export function renderNoticeCard(container, { title, message, type = 'warning', dismissible = false, id = null }) {
  const targetEl = typeof container === 'string' ? document.getElementById(container) : container;
  if (!targetEl) return;

  if (id && sessionStorage.getItem(`dismissed_notice_${id}`) === 'true') {
    return;
  }

  if (id) {
    const existing = targetEl.querySelector(`#${id}`);
    if (existing) existing.remove();
  }

  const themes = {
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-slate-700 dark:text-slate-300',
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-600 dark:text-amber-400',
      svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5.217 3.374 1.948 3.374H4.551c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l7.354 12.748zM12 15.75h.007v.008H12v-.008z" />`
    },
    danger: {
      bg: 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200',
      iconColor: 'text-rose-600 dark:text-rose-400',
      titleColor: 'text-rose-700 dark:text-rose-300',
      svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374 1.948 3.374H4.551c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l7.354 12.748zM12 15.75h.007v.008H12v-.008z" />`
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-slate-700 dark:text-slate-300',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-600 dark:text-blue-400',
      svg: `<path fill="currentColor" d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8-8 8"/>`
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-slate-700 dark:text-slate-300',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-600 dark:text-emerald-400',
      svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`
    }
  };

  const theme = themes[type] || themes.warning;
  const card = document.createElement('div');
  if (id) card.id = id;
  card.setAttribute('data-notice-card', 'true');
  card.className = `p-3.5 rounded-2xl border flex items-start gap-2.5 transition-all ${theme.bg}`;

  const svgAttrs = type === 'info' ? `fill="none" viewBox="0 0 24 24"` : `fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"`;

  card.innerHTML = `
    <svg class="w-4 h-4 ${theme.iconColor} shrink-0 mt-0.5" ${svgAttrs}>
      ${theme.svg}
    </svg>
    <div class="flex-1 text-[10px] leading-relaxed">
      ${title ? `<strong class="font-extrabold uppercase tracking-wide block ${theme.titleColor}">${title}</strong>` : ''}
      <span class="font-medium">${message}</span>
    </div>
    ${dismissible ? `<button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold leading-none p-1 transition-colors cursor-pointer" onclick="${id ? `sessionStorage.setItem('dismissed_notice_${id}', 'true'); ` : ''}this.closest('[data-notice-card]').remove()"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>` : ''}
  `;

  targetEl.prepend(card);
}

/**
 * 4. MODAL ALERT (Replaces browser alert())
 * @param {string} title - Modal title
 * @param {string} message - Message body text
 * @param {'warning'|'danger'|'info'} type - Styling theme
 * @returns {Promise<void>}
 */
export function showAlertModal(title, message, type = 'warning') {
  return showConfirmDialog({
    title,
    message,
    confirmText: 'OK',
    showCancel: false,
    type
  });
}

/**
 * 5. MODAL CONFIRM DIALOG (Replaces browser confirm())
 * @param {Object} config - Modal options (title, message, confirmText, cancelText, showCancel, type)
 * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
 */
export function showConfirmDialog({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', showCancel = true, type = 'danger' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in';

    const isDanger = type === 'danger';
    const confirmBtnClass = isDanger 
      ? 'bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer'
      : 'bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer';

    overlay.innerHTML = `
      <div class="w-full max-w-sm rounded-2xl bg-slate-800 dark:bg-slate-800 backdrop-blur-md border border-slate-800 dark:border-slate-800 shadow-2xl p-6 text-white dark:text-white flex flex-col gap-3 text-center">
        <h3 class="text-sm font-bold tracking-normal">${title}</h3>
        <p class="text-xs text-slate-300 dark:text-slate-300 font-medium leading-relaxed">${message}</p>
        <div class="grid ${showCancel ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-2">
          ${showCancel ? `<button id="dialog-cancel" type="button" class="bg-slate-600 hover:bg-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer">${cancelText}</button>` : ''}
          <button id="dialog-confirm" type="button" class="${confirmBtnClass}">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    if (showCancel) {
      overlay.querySelector('#dialog-cancel').onclick = () => {
        overlay.remove();
        resolve(false);
      };
    }

    overlay.querySelector('#dialog-confirm').onclick = () => {
      overlay.remove();
      resolve(true);
    };
  });
}
