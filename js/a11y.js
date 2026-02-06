/**
 * Accessibility Utilities
 * Provides reusable accessibility helpers for WCAG 2.1 compliance
 */

/**
 * Focus trap management for modals
 * Traps keyboard focus within a container element
 */
export class FocusTrap {
  constructor(container) {
    this.container = container;
    this.previousActiveElement = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Get all focusable elements within the container
   */
  getFocusableElements() {
    const focusableSelectors = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(this.container.querySelectorAll(focusableSelectors))
      .filter(el => {
        // Check if element is visible
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               el.offsetParent !== null;
      });
  }

  /**
   * Handle keyboard navigation within the trap
   */
  handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift + Tab (backwards)
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } 
    // Tab (forwards)
    else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Activate the focus trap
   */
  activate() {
    this.previousActiveElement = document.activeElement;
    this.container.addEventListener('keydown', this.handleKeyDown);
    
    // Focus the first focusable element
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      // Small delay to ensure modal is visible
      requestAnimationFrame(() => {
        focusableElements[0].focus();
      });
    }
  }

  /**
   * Deactivate the focus trap
   */
  deactivate() {
    this.container.removeEventListener('keydown', this.handleKeyDown);
    
    // Restore focus to previously focused element
    if (this.previousActiveElement && this.previousActiveElement.focus) {
      this.previousActiveElement.focus();
    }
  }
}

/**
 * Announce messages to screen readers via ARIA live region
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  // Get or create the live region
  let liveRegion = document.getElementById('sr-announcer');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-announcer';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  } else {
    liveRegion.setAttribute('aria-live', priority);
  }

  // Clear and set message (must be done this way for screen readers to pick up)
  liveRegion.textContent = '';
  
  // Small delay before setting new content
  requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

/**
 * Make an element keyboard-clickable (Enter/Space activation)
 * @param {HTMLElement} element - Element to enhance
 * @param {Function} callback - Click handler
 */
export function makeKeyboardClickable(element, callback) {
  if (!element) return;

  // Add role button if not already a button or link
  if (element.tagName !== 'BUTTON' && element.tagName !== 'A') {
    if (!element.hasAttribute('role')) {
      element.setAttribute('role', 'button');
    }
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  }

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback(e);
    }
  });

  element.addEventListener('click', callback);
}

/**
 * Setup escape key handler for closing modals/dialogs
 * @param {HTMLElement} container - Modal container
 * @param {Function} closeCallback - Function to call when Escape is pressed
 * @returns {Function} Cleanup function to remove the handler
 */
export function setupEscapeHandler(container, closeCallback) {
  const handler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCallback();
    }
  };

  container.addEventListener('keydown', handler);
  
  return () => container.removeEventListener('keydown', handler);
}

/**
 * Enhanced modal management with full accessibility support
 */
export class AccessibleModal {
  constructor(modalElement, options = {}) {
    this.modal = modalElement;
    this.options = {
      closeOnEscape: true,
      closeOnBackdropClick: true,
      returnFocus: true,
      ...options
    };
    
    this.focusTrap = new FocusTrap(this.modal);
    this.isOpen = false;
    this.escapeHandler = null;
  }

  /**
   * Open the modal
   */
  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.modal.classList.remove('hidden');
    this.modal.setAttribute('aria-hidden', 'false');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Activate focus trap
    this.focusTrap.activate();
    
    // Setup escape handler
    if (this.options.closeOnEscape) {
      this.escapeHandler = setupEscapeHandler(this.modal, () => this.close());
    }
    
    // Announce modal to screen readers
    const title = this.modal.querySelector('[id$="-title"], h2, h3');
    if (title) {
      announceToScreenReader(`${title.textContent} dialog opened`);
    }
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.modal.classList.add('hidden');
    this.modal.setAttribute('aria-hidden', 'true');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Deactivate focus trap (restores previous focus)
    this.focusTrap.deactivate();
    
    // Remove escape handler
    if (this.escapeHandler) {
      this.escapeHandler();
      this.escapeHandler = null;
    }
    
    // Announce to screen readers
    announceToScreenReader('Dialog closed');
  }

  /**
   * Setup backdrop click handler
   */
  setupBackdropClick() {
    if (!this.options.closeOnBackdropClick) return;
    
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }
}

export default {
  FocusTrap,
  AccessibleModal,
  announceToScreenReader,
  makeKeyboardClickable,
  setupEscapeHandler
};
