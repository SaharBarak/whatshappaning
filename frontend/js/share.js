/**
 * Share Module
 * Handles data export and social sharing functionality
 * Per EPIC-007: Data Export & Social Sharing
 */

import { config } from './config.js';
import { AccessibleModal, announceToScreenReader } from './a11y.js';

/**
 * Share modal state
 */
let modalOpen = false;
let shareModal = null;

/**
 * Get API base URL
 */
function getApiUrl() {
  return config.apiUrl;
}

/**
 * Download a file from a URL
 * @param {string} url - URL to download
 * @param {string} filename - Suggested filename
 */
async function downloadFile(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    return true;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Download share image
 * @param {string} format - Image format (square, story, wide, compact)
 */
export async function downloadImage(format = 'square') {
  const url = `${getApiUrl()}/api/export/image?format=${format}`;
  const date = new Date().toISOString().split('T')[0];
  const filename = `whatshappening-${date}-${format}.png`;

  try {
    await downloadFile(url, filename);
    showToast('Image downloaded successfully');
  } catch (error) {
    showToast('Failed to download image', 'error');
  }
}

/**
 * Download PDF report
 */
export async function downloadPDF() {
  const url = `${getApiUrl()}/api/export/pdf`;
  const date = new Date().toISOString().split('T')[0];
  const filename = `whatshappening-report-${date}.pdf`;

  try {
    await downloadFile(url, filename);
    showToast('PDF downloaded successfully');
  } catch (error) {
    showToast('Failed to download PDF', 'error');
  }
}

/**
 * Download JSON data
 */
export async function downloadJSON() {
  const url = `${getApiUrl()}/api/export/json`;
  const date = new Date().toISOString().split('T')[0];
  const filename = `whatshappening-${date}.json`;

  try {
    await downloadFile(url, filename);
    showToast('JSON downloaded successfully');
  } catch (error) {
    showToast('Failed to download JSON', 'error');
  }
}

/**
 * Download CSV data
 */
export async function downloadCSV() {
  const url = `${getApiUrl()}/api/export/csv`;
  const date = new Date().toISOString().split('T')[0];
  const filename = `whatshappening-${date}.csv`;

  try {
    await downloadFile(url, filename);
    showToast('CSV downloaded successfully');
  } catch (error) {
    showToast('Failed to download CSV', 'error');
  }
}

/**
 * Copy link to clipboard
 */
export async function copyLink() {
  const url = window.location.href;

  try {
    await navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard');
  } catch (error) {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Link copied to clipboard');
  }
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter() {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent("Check out today's predictions on What's Happening!");
  const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  window.open(shareUrl, '_blank', 'width=550,height=420');
}

/**
 * Share to Facebook
 */
export function shareToFacebook() {
  const url = encodeURIComponent(window.location.href);
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  window.open(shareUrl, '_blank', 'width=550,height=420');
}

/**
 * Share to WhatsApp
 */
export function shareToWhatsApp() {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent("Check out today's predictions: ");
  const shareUrl = `https://wa.me/?text=${text}${url}`;
  window.open(shareUrl, '_blank');
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn() {
  const url = encodeURIComponent(window.location.href);
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  window.open(shareUrl, '_blank', 'width=550,height=420');
}

/**
 * Use native Web Share API (mobile)
 */
export async function nativeShare() {
  if (!navigator.share) {
    // Fall back to modal if Web Share API not supported
    openShareModal();
    return;
  }

  try {
    await navigator.share({
      title: "What's Happening - Today's Predictions",
      text: "Check out today's predictions and data correlations",
      url: window.location.href
    });
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Share failed:', error);
      openShareModal();
    }
  }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error)
 */
function showToast(message, type = 'success') {
  // Remove existing toasts
  const existing = document.querySelector('.share-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.className = `share-toast share-toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);

  // Announce to screen readers
  announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite');

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Open share modal
 */
export function openShareModal() {
  if (modalOpen) return;

  const modalElement = document.getElementById('share-modal');
  if (modalElement) {
    // Initialize accessible modal if not already done
    if (!shareModal) {
      shareModal = new AccessibleModal(modalElement, {
        closeOnEscape: true,
        closeOnBackdropClick: true,
        returnFocus: true
      });
      shareModal.setupBackdropClick();
    }
    
    shareModal.open();
    modalOpen = true;
  }
}

/**
 * Close share modal
 */
export function closeShareModal() {
  if (shareModal) {
    shareModal.close();
    modalOpen = false;
  }
}

/**
 * Initialize share functionality
 */
export function initShare() {
  // Share button click handler
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Try native share on mobile, modal on desktop
      if (navigator.share && 'ontouchstart' in window) {
        nativeShare();
      } else {
        openShareModal();
      }
    });
  }

  // Modal close handlers
  const closeBtn = document.getElementById('share-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeShareModal);
  }

  const modalOverlay = document.getElementById('share-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeShareModal();
      }
    });
  }

  // Social share buttons
  document.getElementById('share-twitter')?.addEventListener('click', shareToTwitter);
  document.getElementById('share-facebook')?.addEventListener('click', shareToFacebook);
  document.getElementById('share-whatsapp')?.addEventListener('click', shareToWhatsApp);
  document.getElementById('share-linkedin')?.addEventListener('click', shareToLinkedIn);
  document.getElementById('share-copy-link')?.addEventListener('click', copyLink);

  // Export buttons
  document.getElementById('export-image-square')?.addEventListener('click', () => downloadImage('square'));
  document.getElementById('export-image-story')?.addEventListener('click', () => downloadImage('story'));
  document.getElementById('export-image-wide')?.addEventListener('click', () => downloadImage('wide'));
  document.getElementById('export-pdf')?.addEventListener('click', downloadPDF);
  document.getElementById('export-json')?.addEventListener('click', downloadJSON);
  document.getElementById('export-csv')?.addEventListener('click', downloadCSV);
}

// Export for global access
window.shareModule = {
  downloadImage,
  downloadPDF,
  downloadJSON,
  downloadCSV,
  copyLink,
  shareToTwitter,
  shareToFacebook,
  shareToWhatsApp,
  shareToLinkedIn,
  nativeShare,
  openShareModal,
  closeShareModal
};

export default {
  initShare,
  downloadImage,
  downloadPDF,
  downloadJSON,
  downloadCSV,
  copyLink,
  shareToTwitter,
  shareToFacebook,
  shareToWhatsApp,
  shareToLinkedIn,
  nativeShare,
  openShareModal,
  closeShareModal
};
