"use client";

import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import {
  createWebSocketClient,
  type ConnectionStatus,
  type WebSocketMessage,
} from "@/lib/websocket";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
    : "ws://localhost:3001/ws");

// Polling fallback interval when WebSocket is unavailable
const POLL_INTERVAL = 15000;
const POLL_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api";

type Listener = () => void;

interface Store {
  status: ConnectionStatus;
  predictions: unknown | null;
  schumann: unknown | null;
  solar: unknown | null;
  geomagnetic: unknown | null;
  lastUpdate: string | null;
}

let store: Store = {
  status: "disconnected",
  predictions: null,
  schumann: null,
  solar: null,
  geomagnetic: null,
  lastUpdate: null,
};

const listeners = new Set<Listener>();

function emitChange() {
  store = { ...store };
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Store {
  return store;
}

let clientRef: ReturnType<typeof createWebSocketClient> | null = null;
let refCount = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(async () => {
    try {
      const res = await fetch(`${POLL_URL}/predictions`);
      if (res.ok) {
        const data = await res.json();
        store = { ...store, predictions: data, lastUpdate: new Date().toISOString() };
        emitChange();
      }
    } catch {
      // Silently fail — will retry next interval
    }
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function initClient() {
  if (clientRef) return;

  clientRef = createWebSocketClient({
    url: WS_URL,
    onStatusChange(status) {
      store = { ...store, status };
      emitChange();

      // Fallback: start polling when disconnected, stop when connected
      if (status === "connected") {
        stopPolling();
      } else if (status === "disconnected" || status === "error") {
        startPolling();
      }
    },
    onMessage(message: WebSocketMessage) {
      const key = message.type as keyof Pick<Store, "predictions" | "schumann" | "solar" | "geomagnetic">;
      if (["predictions", "schumann", "solar", "geomagnetic"].includes(key)) {
        store = { ...store, [key]: message.data, lastUpdate: message.timestamp };
        emitChange();
      }
    },
  });

  clientRef.connect();
}

function teardownClient() {
  clientRef?.disconnect();
  clientRef = null;
  stopPolling();
  store = { ...store, status: "disconnected" };
  emitChange();
}

/**
 * Hook for consuming real-time WebSocket data.
 * Manages a single shared connection across all mounted consumers.
 * Falls back to HTTP polling when WebSocket is unavailable.
 */
export function useWebSocket() {
  useEffect(() => {
    refCount++;
    if (refCount === 1) initClient();
    return () => {
      refCount--;
      if (refCount === 0) teardownClient();
    };
  }, []);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const reconnect = useCallback(() => {
    clientRef?.reconnect();
  }, []);

  return { ...state, reconnect };
}
