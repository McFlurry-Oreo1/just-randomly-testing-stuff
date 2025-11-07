import {
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
} from "@shared/schema";
import { fileDb } from "./fileStorage";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser & { id?: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  adjustUserDiamonds(userId: string, amount: number): Promise<User>;
  verifyPassword(password: string, hashedPassword: string): boolean;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getUserOrders(userId: string): Promise<any[]>;
  getAllOrders(): Promise<any[]>;
  updateOrderStatus(orderId: string, status: string): Promise<Order>;
  getOrder(id: string): Promise<any | undefined>;
}

export class FileStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const user = await fileDb.getUserById(id);
    return user ? this.deserializeUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await fileDb.getUserByEmail(email);
    return user ? this.deserializeUser(user) : undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const user = await fileDb.createUser(userData);
    return this.deserializeUser(user);
  }

  async upsertUser(userData: UpsertUser & { id?: string }): Promise<User> {
    if (userData.id) {
      const existing = await fileDb.getUserById(userData.id);
      if (existing) {
        const updated = await fileDb.updateUser(userData.id, userData);
        return this.deserializeUser(updated);
      }
    }
    
    const user = await fileDb.createUser(userData);
    return this.deserializeUser(user);
  }

  async getAllUsers(): Promise<User[]> {
    const users = await fileDb.getUsers();
    return users.map(u => this.deserializeUser(u));
  }

  async deleteUser(id: string): Promise<void> {
    await fileDb.deleteUser(id);
  }

  async adjustUserDiamonds(userId: string, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newBalance = user.diamondBalance + amount;
    if (newBalance < 0) {
      throw new Error("Insufficient diamonds");
    }

    const updated = await fileDb.updateUser(userId, { diamondBalance: newBalance });
    return this.deserializeUser(updated);
  }

  verifyPassword(password: string, hashedPassword: string): boolean {
    return fileDb.verifyPassword(password, hashedPassword);
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    const products = await fileDb.getProducts();
    return products.map(p => this.deserializeProduct(p));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const product = await fileDb.getProductById(id);
    return product ? this.deserializeProduct(product) : undefined;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const product = await fileDb.createProduct(productData);
    return this.deserializeProduct(product);
  }

  // Order operations
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const order = await fileDb.createOrder(orderData);
    return this.deserializeOrder(order);
  }

  async getUserOrders(userId: string): Promise<any[]> {
    const orders = await fileDb.getOrdersByUserId(userId);
    return Promise.all(orders.map(async (order: any) => {
      const product = await fileDb.getProductById(order.productId);
      return {
        ...this.deserializeOrder(order),
        product: product ? this.deserializeProduct(product) : null,
      };
    }));
  }

  async getAllOrders(): Promise<any[]> {
    const orders = await fileDb.getOrders();
    return Promise.all(orders.map(async (order: any) => {
      const product = await fileDb.getProductById(order.productId);
      const user = await fileDb.getUserById(order.userId);
      return {
        ...this.deserializeOrder(order),
        product: product ? this.deserializeProduct(product) : null,
        user: user ? this.deserializeUser(user) : null,
      };
    }));
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const updateData: any = { status };
    if (status === "completed") {
      updateData.completedAt = new Date().toISOString();
    }

    const order = await fileDb.updateOrder(orderId, updateData);
    return this.deserializeOrder(order);
  }

  async getOrder(id: string): Promise<any | undefined> {
    const order = await fileDb.getOrderById(id);
    if (!order) return undefined;

    const product = await fileDb.getProductById(order.productId);
    const user = await fileDb.getUserById(order.userId);
    
    return {
      ...this.deserializeOrder(order),
      product: product ? this.deserializeProduct(product) : null,
      user: user ? this.deserializeUser(user) : null,
    };
  }

  // Helper methods to convert string dates back to Date objects
  private deserializeUser(user: any): User {
    return {
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  private deserializeProduct(product: any): Product {
    return {
      ...product,
      createdAt: new Date(product.createdAt),
    };
  }

  private deserializeOrder(order: any): Order {
    return {
      ...order,
      createdAt: new Date(order.createdAt),
      completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
    };
  }
}

export const storage = new FileStorage();
