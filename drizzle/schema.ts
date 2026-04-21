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