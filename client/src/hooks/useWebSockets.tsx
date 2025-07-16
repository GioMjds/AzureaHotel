import { useEffect, useRef } from "react";
import { WebSocketEvent, WebSocketService } from "../services/websockets";

type EventHandler<T extends WebSocketEvent['type']> = (
    data: Extract<WebSocketEvent, { type: T }>
) => void;

type EventHandlers = {
    [K in WebSocketEvent['type']]?: EventHandler<K>;
}

const connectionCounts = new WeakMap<WebSocketService, number>();

/**
 * Custom Hook to manage WebSocket connections and events.
 * @params
 * - `wsService` - Instance of WebSocketService to manage the connection.
 * - `userId` - User ID to connect to the WebSocket.
 * - `eventHandlers` - Object containing event handlers for different WebSocket events.
 * @returns
 * - `send` - Function to send messages through the WebSocket.
 * - `isConnected` - Boolean indicating if the WebSocket is connected.
 */
const useWebSockets = (wsService: WebSocketService, userId: string | undefined, eventHandlers: EventHandlers) => {
    const userIdRef = useRef<string | undefined>(userId);

    // console.log("🔄 useWebSockets called with userId:", userId);
    // console.log("📋 Event handlers:", Object.keys(eventHandlers));

    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    useEffect(() => {
        // console.log("🔄 useWebSockets useEffect triggered");
        // console.log("👤 Current userId:", userId);
        // console.log("🔌 WebSocket connected:", wsService.isConnected);

        const count = connectionCounts.get(wsService) || 0;
        connectionCounts.set(wsService, count + 1);
        // console.log("📊 Connection count:", count + 1);

        if (count === 0) {
            // console.log("🔌 First connection, connecting to WebSocket");
            wsService.connect(userId);
        } else {
            if (wsService.isConnected && wsService.getCurrentUserId() !== userId) {
                // console.log("🔄 User changed, reconnecting");
                wsService.disconnect();
                wsService.connect(userId);
            }
        }

        (Object.entries(eventHandlers) as Array<[WebSocketEvent['type'], EventHandler<WebSocketEvent['type']>]>)
            .forEach(([eventType, handler]) => {
                // console.log("📝 Registering event handler for:", eventType);
                wsService.on(eventType, (data) => {
                    // console.log("📨 Event received:", eventType, data);
                    handler(data);
                });
            });

        return () => {
            // console.log("🧹 Cleaning up useWebSockets");

            const newCount = (connectionCounts.get(wsService) || 1) - 1;
            connectionCounts.set(wsService, newCount);
            // console.log("📊 New connection count:", newCount);

            (Object.keys(eventHandlers) as WebSocketEvent['type'][])
                .forEach(eventType => {
                    // console.log("🗑️ Removing event handler for:", eventType);
                    wsService.off(eventType);
                });

            if (newCount === 0) {
                // console.log("🔌 Last connection, disconnecting WebSocket");
                wsService.disconnect();
            }
        };
    }, [wsService, eventHandlers, userId]);

    return {
        send: (data: object) => {
            // console.log("📤 Sending message:", data);
            return wsService.send(data);
        },
        isConnected: wsService.isConnected,
    }
}

export default useWebSockets;