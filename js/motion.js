/* ========================================
   GitPulse — Motion System
   Reduced-motion gating, ripple, view crossfade,
   staggered reveal helpers shared by app.js/renderer.js
   ======================================== */

const Motion = (() => {
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function prefersReduced() {
    return reduceQuery.matches;
  }

  /**
   * Attach a tactile ripple to a button. No-op (but harmless) if the
   * element already has one bound. Skipped entirely under
   * prefers-reduced-motion so no motion is introduced for those users.
   */
  function attachRipple(el) {
    if (!el || el.dataset.rippleBound) return;
    el.dataset.rippleBound = 'true';

    el.addEventListener('click', (e) => {
      if (prefersReduced()) return;

      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const originX = typeof e.clientX === 'number' ? e.clientX : rect.left + rect.width / 2;
      const originY = typeof e.clientY === 'number' ? e.clientY : rect.top + rect.height / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${originX - rect.left - size / 2}px`;
      ripple.style.top = `${originY - rect.top - size / 2}px`;

      el.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
  }

  /**
   * Crossfade between two top-level views (e.g. #input-view -> #profile-view).
   * Both views are briefly overlapped (see .crossfade-out/.crossfade-in in
   * main.css) so the transition reads as a smooth dissolve rather than a
   * hard cut. Fully skipped under prefers-reduced-motion — the views just
   * swap instantly.
   */
  function crossfadeViews(fromEl, toEl) {
    if (!fromEl || !toEl || fromEl === toEl) return;

    // Clear any in-flight crossfade state from a previous call so rapid
    // consecutive transitions (e.g. an instant fetch failure right after
    // the initial crossfade) can't leave both fade-in and fade-out classes
    // on the same element at once.
    fromEl.classList.remove('crossfade-in', 'crossfade-out');
    toEl.classList.remove('crossfade-in', 'crossfade-out');

    if (prefersReduced()) {
      fromEl.classList.remove('active', 'crossfade-out');
      toEl.classList.remove('crossfade-in');
      toEl.classList.add('active');
      return;
    }

    fromEl.classList.add('crossfade-out');
    const cleanupOut = () => {
      fromEl.classList.remove('active', 'crossfade-out');
      fromEl.removeEventListener('animationend', cleanupOut);
    };
    fromEl.addEventListener('animationend', cleanupOut, { once: true });

    toEl.classList.add('active', 'crossfade-in');
    const cleanupIn = () => {
      toEl.classList.remove('crossfade-in');
      toEl.removeEventListener('animationend', cleanupIn);
    };
    toEl.addEventListener('animationend', cleanupIn, { once: true });
  }

  /**
   * Stagger-reveal a NodeList/array of elements by toggling `className`
   * on each with an increasing delay. Instant (no stagger) under
   * prefers-reduced-motion.
   */
  function staggerReveal(elements, opts = {}) {
    const { baseDelay = 80, className = 'visible' } = opts;
    const reduced = prefersReduced();

    elements.forEach((el, i) => {
      if (reduced) {
        el.classList.add(className);
        return;
      }
      setTimeout(() => el.classList.add(className), i * baseDelay);
    });
  }

  return { prefersReduced, attachRipple, crossfadeViews, staggerReveal };
})();
