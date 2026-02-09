/**
 * WebSocket client with auto-reconnect and exponential backoff.
 * Provides real-time data streaming for dashboard components.
 */

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WebSocketMessage {
  type: "predictions" | "schumann" | "solar" | "geomagnetic" | "heartbeat" | "error";
  data: unknown;
  timestamp: string;
}

export interface WebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

const DEFAULT_BASE_DELAY = 1000;
const DEFAULT_MAX_DELAY = 30000;
const DEFAULT_MAX_RETRIES = Infinity;
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 10000;

export function createWebSocketClient(options: WebSocketOptions) {
  const {
    url,
    onMessage,
    onStatusChange,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelay = DEFAULT_BASE_DELAY,
    maxDelay = DEFAULT_MAX_DELAY,
  } = options;

  let ws: WebSocket | null = null;
  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  let intentionallyClosed = false;
  let status: ConnectionStatus = "disconnected";

  function setStatus(newStatus: ConnectionStatus) {
    if (status !== newStatus) {
      status = newStatus;
      onStatusChange?.(newStatus);
    }
  }

  function getBackoffDelay(): number {
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    // Add jitter: ±25%
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  function clearTimers() {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (heartbeatTimeout) { clearTimeout(heartbeatTimeout); heartbeatTimeout = null; }
  }

  function startHeartbeat() {
    heartbeatTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
        heartbeatTimeout = setTimeout(() => {
          // No pong received — connection is stale
          ws?.close();
        }, HEARTBEAT_TIMEOUT);
      }
    }, HEARTBEAT_INTERVAL);
  }

  function handlePong() {
    if (heartbeatTimeout) {
      clearTimeout(heartbeatTimeout);
      heartbeatTimeout = null;
    }
  }

  function connect() {
    if (intentionallyClosed) return;

    clearTimers();
    setStatus("connecting");

    try {
      ws = new WebSocket(url);
    } catch {
      setStatus("error");
      scheduleRetry();
      return;
    }

    ws.onopen = () => {
      retryCount = 0;
      setStatus("connected");
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        if (message.type === "heartbeat") {
          handlePong();
          return;
        }
        onMessage?.(message);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = () => {
      clearTimers();
      if (!intentionallyClosed) {
        setStatus("disconnected");
        scheduleRetry();
      }
    };
  }

  function scheduleRetry() {
    if (intentionallyClosed || retryCount >= maxRetries) return;
    const delay = getBackoffDelay();
    retryCount++;
    retryTimer = setTimeout(connect, delay);
  }

  function disconnect() {
    intentionallyClosed = true;
    clearTimers();
    if (ws) {
      ws.close();
      ws = null;
    }
    setStatus("disconnected");
  }

  function reconnect() {
    intentionallyClosed = false;
    retryCount = 0;
    if (ws) {
      ws.close();
      ws = null;
    }
    connect();
  }

  function getStatus(): ConnectionStatus {
    return status;
  }

  return { connect, disconnect, reconnect, getStatus };
}
