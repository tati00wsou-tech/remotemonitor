import { eq, and, desc, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  screenshots,
  appsData,
  screenLocks,
  bankAccessAlerts,
  lgpdConsents,
  auditLogs,
  dataRetentionPolicies,
  apkBuilds, // ✅ ADICIONADO: Importar tabela de APK builds
} from "../drizzle/schema";

export type UserDeviceSummary = {
  id: number;
  deviceName: string;
  deviceType: string;
  status: "online" | "offline";
  lastSeen: string;
  location: string;
  bankName?: string;
};

/**
 * ✅ ADICIONADO: APK Password Management
 */
export async function saveAPKPassword(
  apkId: string,
  password: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(apkBuilds)
    .set({ unlockPassword: password })
    .where(eq(apkBuilds.id, apkId));
}

export async function getAPKPassword(apkId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select()
    .from(apkBuilds)
    .where(eq(apkBuilds.id, apkId))
    .limit(1);

  return result.length > 0 ? result[0].unlockPassword : null;
}

export async function getAPKPasswordByPackageName(packageName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select()
    .from(apkBuilds)
    .where(eq(apkBuilds.packageName, packageName))
    .orderBy(desc(apkBuilds.createdAt))
    .limit(1);

  return result.length > 0 ? result[0].unlockPassword : null;
}

/**
 * Screenshots Management
 */
export async function createScreenshot(
  deviceId: number,
  userId: number,
  screenshotUrl: string,
  fileSize?: number,
  captureType: "manual" | "automatic" | "alert" = "automatic",
  description?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(screenshots).values({
    deviceId,
    userId,
    screenshotUrl,
    fileSize,
    captureType,
    description,
    createdAt: new Date(),
  });

  return result;
}

export async function getScreenshots(
  userId: number,
  deviceId?: number,
  limit = 50
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(screenshots.userId, userId)];
  if (deviceId) conditions.push(eq(screenshots.deviceId, deviceId));

  return await db
    .select()
    .from(screenshots)
    .where(and(...conditions))
    .orderBy(desc(screenshots.createdAt))
    .limit(limit);
}

/**
 * Apps Data Management
 */
export async function createOrUpdateApp(
  deviceId: number,
  userId: number,
  appName: string,
  appPackage: string,
  appType: "system" | "user" | "corporate",
  isInstalled = true,
  timeUsed = 0
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(appsData)
    .where(
      and(
        eq(appsData.deviceId, deviceId),
        eq(appsData.appPackage, appPackage)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(appsData)
      .set({
        appName,
        isInstalled: isInstalled ? 1 : 0,
        timeUsed: timeUsed || existing[0].timeUsed || 0,
        lastUsed: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(appsData.id, existing[0].id));
  }

  return await db.insert(appsData).values({
    deviceId,
    userId,
    appName,
    appPackage,
    appType,
    isInstalled: isInstalled ? 1 : 0,
    timeUsed,
    lastUsed: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function getDeviceApps(deviceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(appsData)
    .where(
      and(
        eq(appsData.deviceId, deviceId),
        eq(appsData.userId, userId)
      )
    )
    .orderBy(desc(appsData.lastUsed));
}

/**
 * Screen Locks Management
 */
export async function createScreenLock(
  deviceId: number,
  userId: number,
  lockType: "remote_lock" | "automatic_lock" | "unlock",
  reason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(screenLocks).values({
    deviceId,
    userId,
    lockType,
    reason,
    isLocked: lockType !== "unlock" ? 1 : 0,
    unlockedAt: lockType === "unlock" ? new Date() : undefined,
    createdAt: new Date(),
  });
}

export async function getDeviceLockStatus(deviceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const locks = await db
    .select()
    .from(screenLocks)
    .where(
      and(
        eq(screenLocks.deviceId, deviceId),
        eq(screenLocks.userId, userId)
      )
    )
    .orderBy(desc(screenLocks.createdAt))
    .limit(1);

  return locks.length > 0 ? locks[0] : null;
}

/**
 * Bank Access Alerts
 */
export async function createBankAccessAlert(
  deviceId: number,
  userId: number,
  bankName: string,
  bankApp: string,
  duration?: number,
  location?: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(bankAccessAlerts).values({
    deviceId,
    userId,
    bankName,
    bankApp,
    accessTime: new Date(),
    duration,
    location,
    alertSent: 1,
    createdAt: new Date(),
  });
}

export async function getBankAccessAlerts(
  userId: number,
  deviceId?: number,
  hoursBack = 24
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const conditions = [
    eq(bankAccessAlerts.userId, userId),
    gte(bankAccessAlerts.accessTime, cutoffTime),
  ];

  if (deviceId) conditions.push(eq(bankAccessAlerts.deviceId, deviceId));

  return await db
    .select()
    .from(bankAccessAlerts)
    .where(and(...conditions))
    .orderBy(desc(bankAccessAlerts.accessTime));
}

/**
 * LGPD Consents Management
 */
export async function createConsent(
  userId: number,
  consentType:
    | "monitoring"
    | "data_collection"
    | "screenshot"
    | "location"
    | "app_monitoring",
  isConsented = true,
  deviceId?: number,
  documentVersion?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(lgpdConsents).values({
    userId,
    deviceId: deviceId || undefined,
    consentType,
    isConsented: isConsented ? 1 : 0,
    consentDate: isConsented ? new Date() : undefined,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    documentVersion,
    createdAt: new Date(),
  });
}

export async function getUserConsents(userId: number, deviceId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(lgpdConsents.userId, userId)];
  if (deviceId) conditions.push(eq(lgpdConsents.deviceId, deviceId));

  return await db
    .select()
    .from(lgpdConsents)
    .where(and(...conditions));
}

/**
 * Audit Logs
 */
export async function createAuditLog(
  userId: number,
  action: string,
  actorType: "admin" | "user" | "system",
  status: "success" | "failure",
  deviceId?: number,
  actorId?: number,
  dataAccessed?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(auditLogs).values({
    userId,
    deviceId,
    action,
    actorType,
    actorId,
    dataAccessed,
    ipAddress,
    userAgent,
    status,
    createdAt: new Date(),
  });
}

export async function getAuditLogs(
  userId: number,
  limit = 100,
  daysBack = 30
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cutoffTime = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  return await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.userId, userId),
        gte(auditLogs.createdAt, cutoffTime)
      )
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

/**
 * Data Retention Policies
 */
export async function createRetentionPolicy(
  userId: number,
  dataType: "screenshots" | "events" | "location" | "apps" | "all",
  retentionDays = 365,
  autoDelete = true
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(dataRetentionPolicies).values({
    userId,
    dataType,
    retentionDays,
    autoDelete: autoDelete ? 1 : 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function getRetentionPolicy(
  userId: number,
  dataType: "screenshots" | "events" | "location" | "apps" | "all"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const policies = await db
    .select()
    .from(dataRetentionPolicies)
    .where(
      and(
        eq(dataRetentionPolicies.userId, userId),
        eq(dataRetentionPolicies.dataType, dataType)
      )
    )
    .limit(1);

  return policies.length > 0 ? policies[0] : null;
}

/**
 * Auto-delete expired data based on retention policies
 */
export async function cleanupExpiredData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const policies = await db
    .select()
    .from(dataRetentionPolicies)
    .where(
      and(
        eq(dataRetentionPolicies.userId, userId),
        eq(dataRetentionPolicies.autoDelete, 1)
      )
    );

  for (const policy of policies) {
    const retentionDays = policy.retentionDays ?? policy.daysToRetain ?? 365;
    const cutoffDate = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000
    );

    if (policy.dataType === "screenshots" || policy.dataType === "all") {
      await db
        .delete(screenshots)
        .where(
          and(
            eq(screenshots.userId, userId),
            lte(screenshots.createdAt, cutoffDate)
          )
        );
    }

    if (policy.dataType === "apps" || policy.dataType === "all") {
      await db
        .delete(appsData)
        .where(
          and(
            eq(appsData.userId, userId),
            lte(appsData.createdAt, cutoffDate)
          )
        );
    }

    await db
      .update(dataRetentionPolicies)
      .set({
        lastDeletedAt: new Date(),
      })
      .where(eq(dataRetentionPolicies.id, policy.id));
  }
}

export async function getUserDevicesSummary(userId: number): Promise<UserDeviceSummary[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list devices: database not available");
    return [];
  }

  const [screenshotRows, appRows, lockRows, bankRows] = await Promise.all([
    db
      .select({
        deviceId: screenshots.deviceId,
        timestamp: screenshots.createdAt,
      })
      .from(screenshots)
      .where(eq(screenshots.userId, userId)),
    db
      .select({
        deviceId: appsData.deviceId,
        timestamp: appsData.updatedAt,
      })
      .from(appsData)
      .where(eq(appsData.userId, userId)),
    db
      .select({
        deviceId: screenLocks.deviceId,
        timestamp: screenLocks.createdAt,
      })
      .from(screenLocks)
      .where(eq(screenLocks.userId, userId)),
    db
      .select({
        deviceId: bankAccessAlerts.deviceId,
        timestamp: bankAccessAlerts.accessTime,
        location: bankAccessAlerts.location,
        bankName: bankAccessAlerts.bankName,
      })
      .from(bankAccessAlerts)
      .where(eq(bankAccessAlerts.userId, userId)),
  ]);

  const deviceMap = new Map<
    number,
    { lastSeenAt: Date; location: string; bankName?: string }
  >();

  const upsertSeen = (
    deviceId: number,
    timestamp: Date | null,
    location?: string | null,
    bankName?: string | null
  ) => {
    if (!timestamp) return;

    const current = deviceMap.get(deviceId);

    if (!current || timestamp.getTime() > current.lastSeenAt.getTime()) {
      deviceMap.set(deviceId, {
        lastSeenAt: timestamp,
        location: location || current?.location || "Localizacao indisponivel",
        bankName: bankName || current?.bankName || undefined,
      });
      return;
    }

    if (!current.bankName && bankName) {
      current.bankName = bankName;
    }
    if (current.location === "Localizacao indisponivel" && location) {
      current.location = location;
    }
  };

  screenshotRows.forEach((row) => upsertSeen(row.deviceId, row.timestamp));
  appRows.forEach((row) => upsertSeen(row.deviceId, row.timestamp));
  lockRows.forEach((row) => upsertSeen(row.deviceId, row.timestamp));
  bankRows.forEach((row) =>
    upsertSeen(
      row.deviceId,
      row.timestamp,
      typeof row.location === "string" ? row.location : undefined,
      row.bankName
    )
  );

  const now = Date.now();

  return Array.from(deviceMap.entries())
    .map(([deviceId, data]): UserDeviceSummary => {
      const minutesSinceLastSeen = (now - data.lastSeenAt.getTime()) / (1000 * 60);

      return {
        id: deviceId,
        deviceName: `Dispositivo ${deviceId}`,
        deviceType: "android",
        status: minutesSinceLastSeen <= 10 ? "online" : "offline",
        lastSeen: data.lastSeenAt.toISOString(),
        location: data.location,
        bankName: data.bankName,
      };
    })
    .sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1));
}
