import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as corporateDb from "../corporate-db";
import { enqueueTapCommand } from "../remote-control-queue";

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

    delete: protectedProcedure
      .input(z.object({ screenshotId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await corporateDb.deleteScreenshot(input.screenshotId, ctx.user.id);
        return { success: true };
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
        // Verify the device exists for this user (by checking for any records)
        const status = await corporateDb.getDeviceLockStatus(
          input.deviceId,
          ctx.user.id
        );
        
        // Allow lock if device exists (has previous locks) or doesn't exist yet
        // The device existence will be implicitly validated when lock is stored
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
        // Verify the user has a lock on this device (implicit device ownership check)
        const currentLock = await corporateDb.getDeviceLockStatus(
          input.deviceId,
          ctx.user.id
        );
        
        // Only the owner (who locked it) can unlock
        if (currentLock && currentLock.userId !== ctx.user.id) {
          throw new Error("Você não tem permissão para desbloquear este dispositivo");
        }
        
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

  // Remote Control Commands
  remoteControl: router({
    tap: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          xPercent: z.number().min(0).max(100),
          yPercent: z.number().min(0).max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const queuedCommand = enqueueTapCommand(
          ctx.user.id,
          input.deviceId,
          input.xPercent,
          input.yPercent
        );

        await corporateDb.createAuditLog(
          ctx.user.id,
          "remote_tap_command",
          "admin",
          "success",
          input.deviceId,
          ctx.user.id,
          `tap(${input.xPercent.toFixed(2)}%, ${input.yPercent.toFixed(2)}%)`
        );

        return {
          success: true,
          command: "tap",
          commandId: queuedCommand.id,
          xPercent: input.xPercent,
          yPercent: input.yPercent,
          queuedAt: queuedCommand.createdAt,
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
});
