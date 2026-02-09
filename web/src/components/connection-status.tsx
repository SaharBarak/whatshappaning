"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";
import type { ConnectionStatus as Status } from "@/lib/websocket";

const statusConfig: Record<Status, { label: string; color: string; dotColor: string; Icon: React.ElementType }> = {
  connected: {
    label: "Live",
    color: "text-green-400",
    dotColor: "bg-green-400",
    Icon: Wifi,
  },
  connecting: {
    label: "Connecting…",
    color: "text-yellow-400",
    dotColor: "bg-yellow-400",
    Icon: Loader2,
  },
  disconnected: {
    label: "Offline",
    color: "text-zinc-400",
    dotColor: "bg-zinc-400",
    Icon: WifiOff,
  },
  error: {
    label: "Connection error",
    color: "text-red-400",
    dotColor: "bg-red-400",
    Icon: WifiOff,
  },
};

export function ConnectionStatus() {
  const { status, reconnect, lastUpdate } = useWebSocket();
  const [expanded, setExpanded] = React.useState(false);
  const config = statusConfig[status];
  const { Icon } = config;

  const lastUpdateText = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          "border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm",
          config.color
        )}
        aria-label={`Connection status: ${config.label}`}
        aria-expanded={expanded}
      >
        {/* Pulsing dot for connected state */}
        <span className="relative flex h-2 w-2">
          {status === "connected" && (
            <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", config.dotColor)} />
          )}
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", config.dotColor)} />
        </span>

        <Icon className={cn("h-3.5 w-3.5", status === "connecting" && "animate-spin")} />
        <span>{config.label}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border p-3",
              "border-white/10 bg-zinc-900/95 backdrop-blur-md shadow-xl"
            )}
          >
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Status</span>
                <span className={config.color}>{config.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Last update</span>
                <span>{lastUpdateText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Mode</span>
                <span>{status === "connected" ? "WebSocket" : "Polling"}</span>
              </div>

              {(status === "disconnected" || status === "error") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reconnect();
                  }}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  Reconnect
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
