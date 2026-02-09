/**
 * UI Shell — Sidebar, Command Palette, Mobile Nav
 * Pure vanilla JS, no framework dependencies
 */

// ============================================
// DATE DISPLAY
// ============================================
function updatePageDate() {
  const el = document.getElementById('page-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

// ============================================
// SIDEBAR
// ============================================
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarToggle = document.getElementById('sidebar-toggle');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

// Restore collapsed state
if (localStorage.getItem('wh-sidebar-collapsed') === 'true') {
  sidebar?.classList.add('collapsed');
}

// Desktop collapse toggle
sidebarToggle?.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  localStorage.setItem('wh-sidebar-collapsed', sidebar.classList.contains('collapsed'));
});

// Mobile menu open
mobileMenuToggle?.addEventListener('click', () => {
  sidebar.classList.add('mobile-open');
  sidebarOverlay.classList.add('visible');
});

// Close mobile sidebar
function closeMobileSidebar() {
  sidebar?.classList.remove('mobile-open');
  sidebarOverlay?.classList.remove('visible');
}

sidebarOverlay?.addEventListener('click', closeMobileSidebar);

// Sidebar nav — scroll to section & highlight
document.querySelectorAll('[data-section]').forEach((item) => {
  item.addEventListener('click', (e) => {
    const section = item.dataset.section;
    const targetMap = {
      dashboard: 'main-content',
      predictions: 'predictions-panel',
      modules: 'data-grid',
      patterns: 'pattern-alert',
      suggestions: 'suggestions-footer',
    };
    const targetId = targetMap[section];
    if (targetId) {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Update active states
    document.querySelectorAll('.sidebar-nav-item').forEach((n) => n.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-item').forEach((n) => n.classList.remove('active'));
    document.querySelectorAll(`[data-section="${section}"]`).forEach((n) => n.classList.add('active'));

    closeMobileSidebar();
    closeMobileMore();
  });
});

// ============================================
// COMMAND PALETTE
// ============================================
const paletteOverlay = document.getElementById('command-palette-overlay');
const paletteInput = document.getElementById('command-palette-input');
const paletteResults = document.getElementById('command-palette-results');
const paletteTrigger = document.getElementById('command-palette-trigger');

function openCommandPalette() {
  paletteOverlay?.classList.remove('hidden');
  paletteInput?.focus();
  paletteInput.value = '';
  filterCommandResults('');
}

function closeCommandPalette() {
  paletteOverlay?.classList.add('hidden');
}

// ⌘K shortcut
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (paletteOverlay?.classList.contains('hidden')) {
      openCommandPalette();
    } else {
      closeCommandPalette();
    }
  }
  if (e.key === 'Escape') {
    closeCommandPalette();
    closeMobileMore();
  }
});

paletteTrigger?.addEventListener('click', openCommandPalette);

// Close on overlay click
paletteOverlay?.addEventListener('click', (e) => {
  if (e.target === paletteOverlay) closeCommandPalette();
});

// Filter results
function filterCommandResults(query) {
  const items = paletteResults?.querySelectorAll('.command-palette-item');
  const labels = paletteResults?.querySelectorAll('.command-palette-group-label');
  const q = query.toLowerCase().trim();

  items?.forEach((item) => {
    const text = item.querySelector('.command-palette-item-label')?.textContent.toLowerCase() || '';
    item.style.display = text.includes(q) ? '' : 'none';
  });

  // Hide empty group labels
  labels?.forEach((label) => {
    let next = label.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains('command-palette-group-label')) {
      if (next.style.display !== 'none') hasVisible = true;
      next = next.nextElementSibling;
    }
    label.style.display = hasVisible ? '' : 'none';
  });

  // Highlight first visible
  const visible = [...(items || [])].filter((i) => i.style.display !== 'none');
  items?.forEach((i) => i.classList.remove('active'));
  if (visible.length > 0) visible[0].classList.add('active');
}

paletteInput?.addEventListener('input', () => {
  filterCommandResults(paletteInput.value);
});

// Keyboard navigation in palette
paletteInput?.addEventListener('keydown', (e) => {
  const items = [...paletteResults.querySelectorAll('.command-palette-item')].filter(
    (i) => i.style.display !== 'none'
  );
  const active = items.findIndex((i) => i.classList.contains('active'));

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    items.forEach((i) => i.classList.remove('active'));
    const next = (active + 1) % items.length;
    items[next]?.classList.add('active');
    items[next]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    items.forEach((i) => i.classList.remove('active'));
    const prev = (active - 1 + items.length) % items.length;
    items[prev]?.classList.add('active');
    items[prev]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const current = items.find((i) => i.classList.contains('active'));
    if (current) executeCommandAction(current);
  }
});

// Click on command item
paletteResults?.addEventListener('click', (e) => {
  const item = e.target.closest('.command-palette-item');
  if (item) executeCommandAction(item);
});

function executeCommandAction(item) {
  const action = item.dataset.action;
  closeCommandPalette();

  const scrollTargets = {
    'scroll-dashboard': 'main-content',
    'scroll-predictions': 'predictions-panel',
    'scroll-modules': 'data-grid',
    'scroll-patterns': 'pattern-alert',
    'scroll-suggestions': 'suggestions-footer',
  };

  if (scrollTargets[action]) {
    document.getElementById(scrollTargets[action])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (action === 'open-analytics') {
    window.location.href = 'analytics.html';
  } else if (action === 'open-share') {
    document.getElementById('share-btn')?.click();
  } else if (action === 'toggle-theme') {
    // Trigger theme toggle if it exists
    document.querySelector('.theme-toggle')?.click();
    // Fallback: dispatch a custom event
    document.dispatchEvent(new CustomEvent('wh:toggle-theme'));
  } else if (action === 'open-comparison') {
    document.getElementById('comparison-toggle')?.click();
  }
}

// ============================================
// MOBILE BOTTOM NAV — "MORE" MENU
// ============================================
const mobileMoreBtn = document.getElementById('mobile-more-btn');
const mobileMoreMenu = document.getElementById('mobile-more-menu');

function closeMobileMore() {
  mobileMoreMenu?.classList.add('hidden');
}

mobileMoreBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  mobileMoreMenu?.classList.toggle('hidden');
});

// Close more menu on outside click
document.addEventListener('click', (e) => {
  if (!mobileMoreBtn?.contains(e.target) && !mobileMoreMenu?.contains(e.target)) {
    closeMobileMore();
  }
});

// More menu actions
mobileMoreMenu?.querySelectorAll('[data-action]').forEach((item) => {
  item.addEventListener('click', () => {
    const action = item.dataset.action;
    closeMobileMore();
    if (action === 'toggle-theme') {
      document.querySelector('.theme-toggle')?.click();
      document.dispatchEvent(new CustomEvent('wh:toggle-theme'));
    } else if (action === 'open-share') {
      document.getElementById('share-btn')?.click();
    }
  });
});

// ============================================
// INIT
// ============================================
updatePageDate();
