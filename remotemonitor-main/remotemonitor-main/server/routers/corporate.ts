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
});
