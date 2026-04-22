import { desc, eq, sql } from "drizzle-orm";
import { apkRuntimeConfigs } from "../drizzle/schema";
import { getDb } from "./db";

export interface PersistedRuntimeApkConfig {
  buildId: string;
  panelUrl: string;
  appName: string;
  packageName: string;
  logoUrl?: string;
  bankId?: string;
  bankCountry?: string;
  bankName?: string;
  artifactSource?: string;
  createdAt: string;
  updatedAt: string;
}

let tableEnsured = false;

async function ensureRuntimeConfigTable() {
  if (tableEnsured) return;

  const db = await getDb();
  if (!db) return;

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS \`apkRuntimeConfigs\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`packageName\` varchar(255) NOT NULL,
      \`panelUrl\` text NOT NULL,
      \`appName\` varchar(80) NOT NULL,
      \`logoUrl\` text NULL,
      \`bankId\` varchar(80) NULL,
      \`bankCountry\` varchar(80) NULL,
      \`bankName\` varchar(255) NULL,
      \`artifactSource\` varchar(20) NULL,
      \`buildId\` varchar(64) NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`apkRuntimeConfigs_packageName_unique\` (\`packageName\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `));

  tableEnsured = true;
}

function toPersistedConfig(row: typeof apkRuntimeConfigs.$inferSelect): PersistedRuntimeApkConfig {
  return {
    buildId: row.buildId,
    panelUrl: row.panelUrl,
    appName: row.appName,
    packageName: row.packageName,
    logoUrl: row.logoUrl ?? undefined,
    bankId: row.bankId ?? undefined,
    bankCountry: row.bankCountry ?? undefined,
    bankName: row.bankName ?? undefined,
    artifactSource: row.artifactSource ?? undefined,
    createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export async function saveRuntimeApkConfig(config: {
  buildId: string;
  panelUrl: string;
  appName: string;
  packageName: string;
  logoUrl?: string;
  bankId?: string;
  bankCountry?: string;
  bankName?: string;
  artifactSource?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  await ensureRuntimeConfigTable();

  const values = {
    buildId: config.buildId,
    panelUrl: config.panelUrl,
    appName: config.appName,
    packageName: config.packageName,
    logoUrl: config.logoUrl ?? null,
    bankId: config.bankId ?? null,
    bankCountry: config.bankCountry ?? null,
    bankName: config.bankName ?? null,
    artifactSource: config.artifactSource ?? null,
  };

  await db.insert(apkRuntimeConfigs).values(values).onDuplicateKeyUpdate({
    set: {
      buildId: values.buildId,
      panelUrl: values.panelUrl,
      appName: values.appName,
      logoUrl: values.logoUrl,
      bankId: values.bankId,
      bankCountry: values.bankCountry,
      bankName: values.bankName,
      artifactSource: values.artifactSource,
      updatedAt: new Date(),
    },
  });
}

export async function getRuntimeApkConfigFromDb(packageName?: string): Promise<PersistedRuntimeApkConfig | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  await ensureRuntimeConfigTable();

  if (packageName) {
    const exact = await db
      .select()
      .from(apkRuntimeConfigs)
      .where(eq(apkRuntimeConfigs.packageName, packageName))
      .limit(1);

    if (exact.length > 0) {
      return toPersistedConfig(exact[0]);
    }
  }

  const latest = await db
    .select()
    .from(apkRuntimeConfigs)
    .orderBy(desc(apkRuntimeConfigs.updatedAt))
    .limit(1);

  if (latest.length === 0) {
    return null;
  }

  return toPersistedConfig(latest[0]);
}
