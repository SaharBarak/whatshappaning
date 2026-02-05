/**
 * Theme Toggle Component
 * Creates and manages the theme toggle button in the UI
 */

import themeManager from '../theme.js';

/**
 * Create the theme toggle button element
 * @returns {HTMLButtonElement}
 */
function createToggleButton() {
  const button = document.createElement('button');
  button.className = 'theme-toggle';
  button.setAttribute('type', 'button');
  button.setAttribute('aria-live', 'polite');
  
  updateButtonState(button);
  
  // Handle click - cycle through themes
  button.addEventListener('click', () => {
    themeManager.cycle();
  });
  
  // Listen for theme changes to update button
  themeManager.onChange(() => {
    updateButtonState(button);
  });
  
  return button;
}

/**
 * Update button icon and accessibility label
 * @param {HTMLButtonElement} button 
 */
function updateButtonState(button) {
  const icon = themeManager.getIcon();
  const label = themeManager.getLabel();
  
  button.innerHTML = `<span class="theme-toggle-icon" aria-hidden="true">${icon}</span>`;
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
}

/**
 * Initialize theme toggle in the header
 * Wraps live indicator and toggle in a header-actions container
 */
export function initThemeToggle() {
  // Initialize theme manager first (handles localStorage + system preference)
  themeManager.init();
  
  const header = document.querySelector('.header');
  const liveIndicator = document.querySelector('.live-indicator');
  
  if (!header || !liveIndicator) {
    console.warn('Theme toggle: header or live indicator not found');
    return;
  }
  
  // Create container for header actions
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'header-actions';
  
  // Create toggle button
  const toggleButton = createToggleButton();
  
  // Move live indicator into actions container
  liveIndicator.parentNode.removeChild(liveIndicator);
  actionsContainer.appendChild(toggleButton);
  actionsContainer.appendChild(liveIndicator);
  
  // Add actions container to header
  header.appendChild(actionsContainer);
}

export default { initThemeToggle };
