/**
 * Theme Manager Module
 * Handles dark/light/system theme switching with persistence
 */

const STORAGE_KEY = 'whatshappening-theme';
const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system'
};

class ThemeManager {
  constructor() {
    this.currentTheme = THEMES.SYSTEM;
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.listeners = new Set();

    // Bind methods
    this.handleSystemChange = this.handleSystemChange.bind(this);
  }

  /**
   * Initialize the theme manager
   * Should be called early to prevent flash of wrong theme
   */
  init() {
    // Load saved preference
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      this.currentTheme = savedTheme;
    }

    // Apply initial theme
    this.applyTheme(false);

    // Listen for system preference changes
    this.mediaQuery.addEventListener('change', this.handleSystemChange);

    return this;
  }

  /**
   * Get the effective theme (resolves 'system' to actual theme)
   */
  getEffectiveTheme() {
    if (this.currentTheme === THEMES.SYSTEM) {
      return this.mediaQuery.matches ? THEMES.DARK : THEMES.LIGHT;
    }
    return this.currentTheme;
  }

  /**
   * Get the current theme setting (including 'system')
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Set the theme
   * @param {string} theme - 'dark', 'light', or 'system'
   */
  setTheme(theme) {
    if (!Object.values(THEMES).includes(theme)) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }

    this.currentTheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    this.applyTheme(true);
    this.notifyListeners();
  }

  /**
   * Cycle through themes: dark -> light -> system -> dark
   */
  cycle() {
    const order = [THEMES.DARK, THEMES.LIGHT, THEMES.SYSTEM];
    const currentIndex = order.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % order.length;
    this.setTheme(order[nextIndex]);
  }

  /**
   * Toggle between dark and light (ignores system)
   */
  toggle() {
    const effective = this.getEffectiveTheme();
    this.setTheme(effective === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  }

  /**
   * Apply the theme to the document
   * @param {boolean} animate - Whether to animate the transition
   */
  applyTheme(animate = true) {
    const effective = this.getEffectiveTheme();
    const html = document.documentElement;

    if (animate) {
      // Add transition class
      html.classList.add('theme-transitioning');

      // Remove after transition completes
      setTimeout(() => {
        html.classList.remove('theme-transitioning');
      }, 300);
    }

    // Apply theme
    if (effective === THEMES.LIGHT) {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(effective);
  }

  /**
   * Update the meta theme-color tag
   */
  updateMetaThemeColor(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === THEMES.LIGHT ? '#ffffff' : '#0a0a0f');
    }
  }

  /**
   * Handle system preference change
   */
  handleSystemChange() {
    if (this.currentTheme === THEMES.SYSTEM) {
      this.applyTheme(true);
      this.notifyListeners();
    }
  }

  /**
   * Add a listener for theme changes
   * @param {Function} callback - Called with { theme, effective }
   */
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of theme change
   */
  notifyListeners() {
    const data = {
      theme: this.currentTheme,
      effective: this.getEffectiveTheme()
    };
    this.listeners.forEach(cb => cb(data));
  }

  /**
   * Get the icon for the current theme
   */
  getIcon() {
    switch (this.currentTheme) {
      case THEMES.DARK:
        return '\u{1F319}'; // moon
      case THEMES.LIGHT:
        return '\u{2600}\u{FE0F}'; // sun
      case THEMES.SYSTEM:
        return '\u{1F4BB}'; // laptop
      default:
        return '\u{1F319}';
    }
  }

  /**
   * Get accessible label for the current theme
   */
  getLabel() {
    switch (this.currentTheme) {
      case THEMES.DARK:
        return 'Dark theme (click for light)';
      case THEMES.LIGHT:
        return 'Light theme (click for system)';
      case THEMES.SYSTEM:
        return `System theme (currently ${this.getEffectiveTheme()}, click for dark)`;
      default:
        return 'Toggle theme';
    }
  }

  /**
   * Clean up listeners
   */
  destroy() {
    this.mediaQuery.removeEventListener('change', this.handleSystemChange);
    this.listeners.clear();
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Export for module usage
export { themeManager, THEMES };
export default themeManager;
