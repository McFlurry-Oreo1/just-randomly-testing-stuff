import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');

interface FileData {
  users: any[];
  products: any[];
  orders: any[];
}

class FileDatabase {
  private dataFile: string;
  private data: FileData;

  constructor() {
    this.dataFile = path.join(DATA_DIR, 'database.json');
    this.data = {
      users: [],
      products: [],
      orders: [],
    };
  }

  async init() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      
      try {
        const content = await fs.readFile(this.dataFile, 'utf-8');
        this.data = JSON.parse(content);
      } catch (error) {
        // File doesn't exist, initialize with default data
        await this.seedInitialData();
        await this.save();
      }
    } catch (error) {
      console.error('Error initializing file database:', error);
      throw error;
    }
  }

  private async seedInitialData() {
    // Create admin user
    const adminId = crypto.randomUUID();
    this.data.users.push({
      id: adminId,
      email: 'admin@example.com',
      password: this.hashPassword('admin123'),
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      diamondBalance: 10000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create a regular user
    const userId = crypto.randomUUID();
    this.data.users.push({
      id: userId,
      email: 'user@example.com',
      password: this.hashPassword('user123'),
      firstName: 'Regular',
      lastName: 'User',
      isAdmin: false,
      diamondBalance: 5000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create sample products
    const products = [
      {
        id: crypto.randomUUID(),
        name: 'Premium Diamond Package',
        description: 'Get 1000 bonus diamonds with this exclusive package',
        price: 500,
        imageUrl: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Elite Diamond Bundle',
        description: 'The ultimate diamond bundle with premium features',
        price: 1000,
        imageUrl: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Starter Diamond Pack',
        description: 'Perfect for beginners, includes 200 diamonds',
        price: 100,
        imageUrl: '',
        createdAt: new Date().toISOString(),
      },
    ];

    this.data.products = products;
  }

  private hashPassword(password: string): string {
    const saltRounds = 10;
    return bcrypt.hashSync(password, saltRounds);
  }

  async save() {
    await fs.writeFile(this.dataFile, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // User operations
  async getUsers() {
    return this.data.users;
  }

  async getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string) {
    return this.data.users.find(u => u.email === email);
  }

  async createUser(userData: any) {
    const user = {
      id: crypto.randomUUID(),
      ...userData,
      password: this.hashPassword(userData.password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.users.push(user);
    await this.save();
    return user;
  }

  async updateUser(id: string, updates: any) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.save();
    return this.data.users[index];
  }

  async deleteUser(id: string) {
    this.data.users = this.data.users.filter(u => u.id !== id);
    await this.save();
  }

  verifyPassword(password: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(password, hashedPassword);
  }

  // Product operations
  async getProducts() {
    return this.data.products;
  }

  async getProductById(id: string) {
    return this.data.products.find(p => p.id === id);
  }

  async createProduct(productData: any) {
    const product = {
      id: crypto.randomUUID(),
      ...productData,
      createdAt: new Date().toISOString(),
    };
    this.data.products.push(product);
    await this.save();
    return product;
  }

  // Order operations
  async getOrders() {
    return this.data.orders;
  }

  async getOrderById(id: string) {
    return this.data.orders.find(o => o.id === id);
  }

  async getOrdersByUserId(userId: string) {
    return this.data.orders.filter(o => o.userId === userId);
  }

  async createOrder(orderData: any) {
    const order = {
      id: crypto.randomUUID(),
      ...orderData,
      createdAt: new Date().toISOString(),
    };
    this.data.orders.push(order);
    await this.save();
    return order;
  }

  async updateOrder(id: string, updates: any) {
    const index = this.data.orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    
    this.data.orders[index] = {
      ...this.data.orders[index],
      ...updates,
    };
    await this.save();
    return this.data.orders[index];
  }
}

export const fileDb = new FileDatabase();
