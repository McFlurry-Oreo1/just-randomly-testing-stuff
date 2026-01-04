import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { fileDb } from "./fileStorage";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize file database
  await fileDb.init();
  log("File database initialized");

  // Create HTTP server first
  const server = createServer(app);

  // Setup Socket.IO for WebRTC signaling
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // WebRTC signaling logic
  const streams = new Map<string, string>(); // userId -> socketId mapping
  const adminSockets = new Set<string>();

  io.on("connection", (socket) => {
    log(`Socket connected: ${socket.id}`);

    socket.on("register-streamer", (userId: string) => {
      streams.set(userId, socket.id);
      socket.userId = userId;
      log(`Streamer registered: ${userId}`);
      
      // Notify all admins about new stream
      adminSockets.forEach(adminId => {
        io.to(adminId).emit("stream-available", userId);
      });
    });

    socket.on("register-admin", () => {
      adminSockets.add(socket.id);
      log(`Admin registered: ${socket.id}`);
      
      // Send list of active streams
      const activeStreams = Array.from(streams.keys());
      socket.emit("active-streams", activeStreams);
    });

    socket.on("request-stream", (userId: string) => {
      const streamerSocketId = streams.get(userId);
      if (streamerSocketId) {
        io.to(streamerSocketId).emit("stream-requested", socket.id);
      }
    });

    socket.on("signal", (data: { to: string; signal: any }) => {
      io.to(data.to).emit("signal", {
        from: socket.id,
        signal: data.signal
      });
    });

    socket.on("disconnect", () => {
      log(`Socket disconnected: ${socket.id}`);
      
      // Remove from streams if streamer
      if (socket.userId) {
        streams.delete(socket.userId);
        adminSockets.forEach(adminId => {
          io.to(adminId).emit("stream-unavailable", socket.userId);
        });
      }
      
      // Remove from admins
      adminSockets.delete(socket.id);
    });
  });

  // Register API routes
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.HOST || 'localhost';
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
  });
})();
