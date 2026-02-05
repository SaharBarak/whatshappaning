/**
 * PWA Module
 * Handles service worker registration, install prompts, and app updates
 */

// Store the install prompt event
let deferredInstallPrompt = null;
let isAppInstalled = false;

/**
 * Initialize PWA functionality
 */
export function initPWA() {
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    isAppInstalled = true;
    console.log('[PWA] App is running in standalone mode');
  }

  // Register service worker
  registerServiceWorker();

  // Listen for install prompt
  listenForInstallPrompt();

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    isAppInstalled = true;
    deferredInstallPrompt = null;
    console.log('[PWA] App was installed');
    hideInstallBanner();
  });

  // Check for updates periodically
  setInterval(checkForUpdates, 60 * 60 * 1000); // Every hour
}

/**
 * Register the service worker
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[PWA] Service worker registered:', registration.scope);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content available, show update notification
          showUpdateNotification();
        }
      });
    });

    // Handle controller change (when new SW takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] New service worker active');
    });

  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
  }
}

/**
 * Listen for the beforeinstallprompt event
 */
function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent the default browser install prompt
    event.preventDefault();
    
    // Store the event for later use
    deferredInstallPrompt = event;
    
    console.log('[PWA] Install prompt available');
    
    // Show our custom install banner after a delay
    if (!isAppInstalled) {
      setTimeout(showInstallBanner, 30000); // Show after 30 seconds of engagement
    }
  });
}

/**
 * Show a custom install banner
 */
function showInstallBanner() {
  if (!deferredInstallPrompt || isAppInstalled) {
    return;
  }

  // Check if user has dismissed before (stored in localStorage)
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed) {
    const dismissedTime = parseInt(dismissed, 10);
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) {
      return; // Don't show for a week after dismissal
    }
  }

  // Create and show the install banner
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.className = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-install-content">
      <div class="pwa-install-icon">📊</div>
      <div class="pwa-install-text">
        <strong>Install What's Happening</strong>
        <span>Quick access from your home screen</span>
      </div>
    </div>
    <div class="pwa-install-actions">
      <button class="pwa-install-btn" id="pwa-install-btn">Install</button>
      <button class="pwa-dismiss-btn" id="pwa-dismiss-btn">Not now</button>
    </div>
  `;

  document.body.appendChild(banner);

  // Animate in
  requestAnimationFrame(() => {
    banner.classList.add('visible');
  });

  // Handle install click
  document.getElementById('pwa-install-btn').addEventListener('click', promptInstall);
  
  // Handle dismiss click
  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    hideInstallBanner();
  });
}

/**
 * Hide the install banner
 */
function hideInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 300);
  }
}

/**
 * Prompt the user to install the app
 */
export async function promptInstall() {
  if (!deferredInstallPrompt) {
    console.log('[PWA] No install prompt available');
    return false;
  }

  // Show the browser's install prompt
  deferredInstallPrompt.prompt();

  // Wait for the user's response
  const { outcome } = await deferredInstallPrompt.userChoice;
  
  console.log('[PWA] Install prompt outcome:', outcome);

  // Clear the prompt reference
  deferredInstallPrompt = null;
  hideInstallBanner();

  return outcome === 'accepted';
}

/**
 * Check if install is available
 */
export function canInstall() {
  return deferredInstallPrompt !== null && !isAppInstalled;
}

/**
 * Check if app is installed
 */
export function isInstalled() {
  return isAppInstalled;
}

/**
 * Show update notification
 */
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.id = 'pwa-update-notification';
  notification.className = 'pwa-update-notification';
  notification.innerHTML = `
    <span>New version available!</span>
    <button id="pwa-update-btn">Update</button>
  `;

  document.body.appendChild(notification);

  requestAnimationFrame(() => {
    notification.classList.add('visible');
  });

  document.getElementById('pwa-update-btn').addEventListener('click', () => {
    // Tell the service worker to skip waiting
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
    
    // Reload the page
    window.location.reload();
  });
}

/**
 * Check for service worker updates
 */
async function checkForUpdates() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    registration.update();
    console.log('[PWA] Checked for updates');
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
  }
}

/**
 * Clear all caches (useful for debugging)
 */
export async function clearCaches() {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({ type: 'CLEAR_CACHE' });
  console.log('[PWA] Cache clear requested');
}

// Auto-initialize when module loads
initPWA();
