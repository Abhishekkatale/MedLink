import express, { type Request, Response, NextFunction } from "express";
import path from "path"; // Import path
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Serve uploaded files statically
// Assuming __dirname is <project_root>/server when running with tsx, or <project_root>/dist/server after build
// The uploads directory is at <project_root>/uploads
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

app.use(express.json());
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
      const logObject = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path, // or path variable from above
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
        requestQuery: req.query,
        requestParams: req.params,
        responseBody: capturedJsonResponse, // Can be large, consider summarization/truncation if needed
      };
      log(JSON.stringify(logObject));
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
