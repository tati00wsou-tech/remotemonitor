import { useEffect, useRef, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  deviceId?: number;
  data?: any;
  timestamp?: string;
  message?: string;
}

export function useWebSocket(userId: number | undefined, deviceId: number | undefined) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!userId || !deviceId) return;

    try {
      // Get the WebSocket URL from the current location
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("[WebSocket] Connected");
        reconnectAttempts.current = 0;

        // Subscribe to device updates
        ws.current?.send(
          JSON.stringify({
            type: "subscribe",
            userId,
            deviceId,
            sessionId: `session_${Date.now()}`,
          })
        );
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error("[WebSocket] Error parsing message:", error);
        }
      };

      ws.current.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
      };

      ws.current.onclose = () => {
        console.log("[WebSocket] Disconnected");
        attemptReconnect();
      };
    } catch (error) {
      console.error("[WebSocket] Connection error:", error);
      attemptReconnect();
    }
  }, [userId, deviceId]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      console.log(`[WebSocket] Attempting to reconnect in ${delay}ms...`);
      setTimeout(connect, delay);
    } else {
      console.error("[WebSocket] Max reconnection attempts reached");
    }
  }, [connect]);

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "ping":
        // Respond to ping
        ws.current?.send(JSON.stringify({ type: "pong" }));
        break;

      case "device-update":
        // Dispatch custom event for device updates
        window.dispatchEvent(
          new CustomEvent("device-update", {
            detail: message,
          })
        );
        break;

      case "event":
        // Dispatch custom event for new events
        window.dispatchEvent(
          new CustomEvent("device-event", {
            detail: message,
          })
        );
        break;

      case "alert":
        // Dispatch custom event for alerts
        window.dispatchEvent(
          new CustomEvent("device-alert", {
            detail: message,
          })
        );
        break;

      case "subscribed":
        console.log("[WebSocket] Subscribed to device updates");
        break;

      default:
        console.log("[WebSocket] Unknown message type:", message.type);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected: ws.current?.readyState === WebSocket.OPEN,
    send: (message: any) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(message));
      }
    },
  };
}
