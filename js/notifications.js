// ./js/notifications.js (0511_R370) - CertiFly Unified Notification Engine

/**
 * 1. FLOATING TOAST NOTIFICATIONS (Auto-Dismiss Feedback)
 * @param {string} message - Message text to display
 * @param {'success'|'error'|'warning'|'info'} type - Toast theme
 * @param {number} duration - Auto-dismiss timeout in ms (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('certifly-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'certifly-toast-container';
    container.className = 'fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-xs w-[90%] pointer-events-none';
    document.body.appendChild(container);
  }

  const styles = {
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-rose-600 text-white border-rose-500',
    warning: 'bg-amber-500 text-slate-950 font-black border-amber-400',
    info: 'bg-slate-900 dark:bg-slate-800 text-slate-100 border-slate-700'
  };

  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold uppercase tracking-wide flex items-center justify-between pointer-events-auto transition-all duration-300 opacity-0 -translate-y-3 ${styles[type] || styles.info}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button type="button" class="ml-3 opacity-70 hover:opacity-100 focus:outline-none">&times;</button>
  `;

  const closeBtn = toast.querySelector('button');
  if (closeBtn) {
    closeBtn.onclick = () => toast.remove();
  }
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', '-translate-y-3');
    toast.classList.add('opacity-100', 'translate-y-0');
  });

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', '-translate-y-3');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 2. TOP SYSTEM BANNER (Offline Overlay & Portal Warnings)
 * @param {string} message - Banner text/HTML
 * @param {'offline'|'warning'|'info'} type - Banner theme
 * @param {boolean} show - Toggle visibility
 */
export function setTopBanner(message, type = 'warning', show = true) {
  let banner = document.getElementById('certifly-top-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'certifly-top-banner';
    banner.className = 'fixed top-0 left-0 right-0 z-50 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 shadow-md flex items-center justify-center gap-2 transition-transform duration-300 -translate-y-full';
    document.body.appendChild(banner);
  }

  if (!show) {
    banner.classList.add('-translate-y-full');
    return;
  }

  const styles = {
    offline: 'bg-rose-600 text-white border-b border-rose-700 animate-pulse',
    warning: 'bg-amber-500 text-slate-950 border-b border-amber-600',
    info: 'bg-blue-600 text-white border-b border-blue-700'
  };

  banner.className = `fixed top-0 left-0 right-0 z-50 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 shadow-md flex items-center justify-center gap-2 transition-transform duration-300 translate-y-0 ${styles[type] || styles.info}`;
  banner.innerHTML = message;
}

/**
 * 3. IN-CARD COMPLIANCE & SAFETY NOTICE BANNER
 * @param {string|HTMLElement} container - Target container element or ID
 * @param {Object} config - Card configuration options
 */
export function renderNoticeCard(container, { title, message, type = 'warning', dismissible = false, id = null }) {
  const targetEl = typeof container === 'string' ? document.getElementById(container) : container;
  if (!targetEl) return;

  if (id) {
    const existing = targetEl.querySelector(`#${id}`);
    if (existing) existing.remove();
  }

  const themes = {
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-slate-700 dark:text-slate-300',
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-600 dark:text-amber-400'
    },
    danger: {
      bg: 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200',
      iconColor: 'text-rose-600 dark:text-rose-400',
      titleColor: 'text-rose-700 dark:text-rose-300'
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-slate-700 dark:text-slate-300',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-600 dark:text-blue-400'
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-600 dark:text-emerald-400'
    }
  };

  const theme = themes[type] || themes.warning;
  const card = document.createElement('div');
  if (id) card.id = id;
  card.className = `p-3.5 rounded-2xl border flex items-start gap-2.5 transition-all ${theme.bg}`;

  card.innerHTML = `
    <svg class="w-4 h-4 ${theme.iconColor} shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
    <div class="flex-1 text-[10px] leading-relaxed">
      ${title ? `<strong class="font-extrabold uppercase tracking-wide block ${theme.titleColor}">${title}</strong>` : ''}
      <span class="font-medium">${message}</span>
    </div>
    ${dismissible ? `<button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold leading-none p-1 transition-colors" onclick="this.closest('.rounded-2xl').remove()">&times;</button>` : ''}
  `;

  targetEl.prepend(card);
}

/**
 * 4. MODAL ALERT (Replaces browser alert())
 * @param {string} title - Modal header title
 * @param {string} message - Modal body message
 * @param {'warning'|'danger'|'info'} type - Modal theme
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
 * @param {Object} config - Dialog configuration options
 * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
 */
export function showConfirmDialog({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', showCancel = true, type = 'danger' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in';

    const isDanger = type === 'danger';
    const btnBg = isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700';

    overlay.innerHTML = `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-xs w-full shadow-2xl flex flex-col gap-3 text-center">
        <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">${title}</h3>
        <p class="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">${message}</p>
        <div class="grid ${showCancel ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-2">
          ${showCancel ? `<button id="dialog-cancel" type="button" class="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer">${cancelText}</button>` : ''}
          <button id="dialog-confirm" type="button" class="py-2.5 px-3 rounded-xl ${btnBg} text-white font-bold text-xs uppercase shadow-md transition-all cursor-pointer">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    if (showCancel) {
      const cancelBtn = overlay.querySelector('#dialog-cancel');
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          overlay.remove();
          resolve(false);
        };
      }
    }

    const confirmBtn = overlay.querySelector('#dialog-confirm');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        overlay.remove();
        resolve(true);
      };
    }
  });
}
