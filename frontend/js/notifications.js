/**
 * Push Notification Manager
 *
 * Handles subscription, preferences, and notification permission management.
 */

const NotificationManager = (() => {
  let vapidPublicKey = null;
  let currentSubscription = null;

  /**
   * Check if push notifications are supported
   */
  function isSupported() {
    return 'serviceWorker' in navigator &&
           'PushManager' in window &&
           'Notification' in window;
  }

  /**
   * Get the VAPID public key from the server
   */
  async function fetchVapidKey() {
    if (vapidPublicKey) return vapidPublicKey;

    const res = await fetch('/api/notifications/vapid-key');
    if (!res.ok) return null;

    const data = await res.json();
    vapidPublicKey = data.publicKey;
    return vapidPublicKey;
  }

  /**
   * Convert URL-safe base64 to Uint8Array for applicationServerKey
   */
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Subscribe to push notifications
   */
  async function subscribe(preferences = {}) {
    if (!isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const key = await fetchVapidKey();
    if (!key) {
      throw new Error('Push notifications not configured on server');
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });

    // Send to server
    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON(), preferences }),
    });

    if (!res.ok) {
      throw new Error('Failed to save subscription on server');
    }

    currentSubscription = subscription;
    return await res.json();
  }

  /**
   * Unsubscribe from push notifications
   */
  async function unsubscribe() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await fetch('/api/notifications/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }

    currentSubscription = null;
  }

  /**
   * Check if currently subscribed
   */
  async function getSubscriptionStatus() {
    if (!isSupported()) return { subscribed: false, supported: false };

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return { subscribed: false, supported: true };

    // Check server status too
    try {
      const res = await fetch(`/api/notifications/status?endpoint=${encodeURIComponent(subscription.endpoint)}`);
      if (res.ok) {
        const data = await res.json();
        currentSubscription = subscription;
        return { subscribed: data.subscribed, supported: true, preferences: data.preferences };
      }
    } catch (e) {
      // Server check failed, use local state
    }

    return { subscribed: true, supported: true };
  }

  /**
   * Update notification preferences
   */
  async function updatePreferences(preferences) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) throw new Error('Not subscribed');

    const res = await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint, preferences }),
    });

    if (!res.ok) throw new Error('Failed to update preferences');
    return await res.json();
  }

  return {
    isSupported,
    subscribe,
    unsubscribe,
    getSubscriptionStatus,
    updatePreferences,
  };
})();

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
}
