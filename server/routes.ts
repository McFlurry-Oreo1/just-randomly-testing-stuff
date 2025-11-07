import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { insertOrderSchema } from "@shared/schema";
import { purchaseSchema, adjustDiamondsSchema } from "@shared/validation";
import { fromZodError } from "zod-validation-error";

// WebSocket client tracking
const clients = new Map<string, Set<WebSocket>>();

function broadcastToUser(userId: string, message: any) {
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Purchase route
  app.post('/api/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body with Zod
      const parseResult = purchaseSchema.safeParse(req.body);
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { productId } = parseResult.data;

      const [user, product] = await Promise.all([
        storage.getUser(userId),
        storage.getProduct(productId),
      ]);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (user.diamondBalance < product.price) {
        return res.status(400).json({ message: "Insufficient diamonds" });
      }

      // Deduct diamonds and create order
      const updatedUser = await storage.adjustUserDiamonds(userId, -product.price);
      const order = await storage.createOrder({
        userId,
        productId,
        status: "pending",
      });

      // Broadcast balance update via WebSocket
      broadcastToUser(userId, {
        type: "balance_update",
        userId,
        newBalance: updatedUser.diamondBalance,
      });

      res.json({ order, user: updatedUser });
    } catch (error: any) {
      console.error("Error processing purchase:", error);
      res.status(500).json({ message: error.message || "Failed to process purchase" });
    }
  });

  // User orders route
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin: Get all users
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin: Delete user
  app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin: Adjust user diamonds
  app.post('/api/admin/adjust-diamonds', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Validate request body with Zod
      const parseResult = adjustDiamondsSchema.safeParse(req.body);
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { userId, amount } = parseResult.data;

      const user = await storage.adjustUserDiamonds(userId, amount);

      // Broadcast balance update via WebSocket
      broadcastToUser(userId, {
        type: "balance_update",
        userId,
        newBalance: user.diamondBalance,
      });

      res.json(user);
    } catch (error: any) {
      console.error("Error adjusting diamonds:", error);
      res.status(500).json({ message: error.message || "Failed to adjust diamonds" });
    }
  });

  // Admin: Get all orders
  app.get('/api/admin/orders', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin: Mark order as completed
  app.post('/api/admin/orders/:id/complete', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updatedOrder = await storage.updateOrderStatus(id, "completed");

      // Broadcast order update via WebSocket
      broadcastToUser(order.userId, {
        type: "order_update",
        orderId: id,
        status: "completed",
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error completing order:", error);
      res.status(500).json({ message: "Failed to complete order" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup (at /ws path to avoid conflicts with Vite HMR)
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'register' && message.userId) {
          userId = message.userId;
          
          if (!clients.has(userId)) {
            clients.set(userId, new Set());
          }
          clients.get(userId)!.add(ws);

          ws.send(JSON.stringify({ type: 'registered', userId }));
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

  return httpServer;
}
