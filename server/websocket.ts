import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { setBroadcastFunction } from "./routes";

export type WebSocketBroadcast = (userId: string, message: any) => void;

// WebSocket client tracking
const clients = new Map<string, Set<WebSocket>>();

export function broadcastToUser(userId: string, message: any) {
  const userClients = clients.get(userId);
  if (userClients) {
    const messageStr = JSON.stringify(message);
    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

export function setupWebSocketServer(server: Server) {
  // WebSocket server setup (at /ws path to avoid conflicts with Vite HMR)
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade requests manually to bypass Express middleware
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'register' && message.userId) {
          userId = message.userId as string;
          
          if (!clients.has(userId)) {
            clients.set(userId, new Set());
          }
          clients.get(userId)!.add(ws);

          ws.send(JSON.stringify({ type: 'registered', userId: userId }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        const userClients = clients.get(userId);
        if (userClients) {
          userClients.delete(ws);
          if (userClients.size === 0) {
            clients.delete(userId);
          }
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Set the broadcast function so routes.ts can use it
  setBroadcastFunction(broadcastToUser);
}
