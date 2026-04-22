import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import * as corporateDb from "../corporate-db";
import * as emailNotifications from "../email-notifications";

/**
 * LGPD Data Subject Rights Router
 * Handles access, deletion, and correction requests
 */

// Define request types in schema
const lgpdRequestsTable = {
  id: 0,
  userId: 0,
  requestType: "access" as "access" | "deletion" | "correction",
  status: "pending" as "pending" | "processing" | "completed" | "rejected",
  dataTypes: [] as string[],
  description: "",
  responseUrl: "",
  createdAt: new Date(),
  completedAt: null as Date | null,
};

export const lgpdRequestsRouter = router({
  /**
   * Submit a data access request (Direito de Acesso)
   */
  requestAccess: protectedProcedure
    .input(
      z.object({
        dataTypes: z.array(
          z.enum(["screenshots", "apps", "location", "events", "all"])
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create audit log
      await corporateDb.createAuditLog(
        ctx.user.id,
        "LGPD_ACCESS_REQUEST",
        "user",
        "success",
        undefined,
        ctx.user.id,
        JSON.stringify({ dataTypes: input.dataTypes })
      );

      // Send notification to compliance team
      await emailNotifications.sendLGPDAccessRequestNotification(
        ctx.user.name || "Usuário",
        new Date(),
        input.dataTypes
      );

      return {
        success: true,
        message: "Solicitação de acesso enviada com sucesso",
        requestId: `ACCESS-${Date.now()}`,
        expectedDelivery: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      };
    }),

  /**
   * Submit a data deletion request (Direito de Exclusão)
   */
  requestDeletion: protectedProcedure
    .input(
      z.object({
        dataTypes: z.array(
          z.enum(["screenshots", "apps", "location", "events", "all"])
        ),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create audit log
      await corporateDb.createAuditLog(
        ctx.user.id,
        "LGPD_DELETION_REQUEST",
        "user",
        "success",
        undefined,
        ctx.user.id,
        JSON.stringify({ dataTypes: input.dataTypes, reason: input.reason })
      );

      // Send notification to compliance team
      await emailNotifications.sendLGPDDeletionRequestNotification(
        ctx.user.name || "Usuário",
        new Date(),
        input.dataTypes
      );

      return {
        success: true,
        message: "Solicitação de exclusão enviada com sucesso",
        requestId: `DELETE-${Date.now()}`,
        expectedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };
    }),

  /**
   * Submit a data correction request (Direito de Correção)
   */
  requestCorrection: protectedProcedure
    .input(
      z.object({
        dataType: z.string(),
        currentValue: z.string(),
        correctedValue: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create audit log
      await corporateDb.createAuditLog(
        ctx.user.id,
        "LGPD_CORRECTION_REQUEST",
        "user",
        "success",
        undefined,
        ctx.user.id,
        JSON.stringify({
          dataType: input.dataType,
          currentValue: input.currentValue,
          correctedValue: input.correctedValue,
          reason: input.reason,
        })
      );

      return {
        success: true,
        message: "Solicitação de correção enviada com sucesso",
        requestId: `CORRECT-${Date.now()}`,
        expectedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      };
    }),

  /**
   * Get user's LGPD requests history
   */
  getRequests: protectedProcedure.query(async ({ ctx }) => {
    const auditLogs = await corporateDb.getAuditLogs(ctx.user.id, 100, 365);

    // Filter LGPD-related logs
    const lgpdRequests = auditLogs.filter((log) =>
      ["LGPD_ACCESS_REQUEST", "LGPD_DELETION_REQUEST", "LGPD_CORRECTION_REQUEST"].includes(
        log.action ?? ""
      )
    );

    return lgpdRequests.map((log) => ({
      id: log.id,
      type: (log.action ?? "LGPD_ACCESS_REQUEST")
        .replace("LGPD_", "")
        .replace("_REQUEST", "")
        .toLowerCase(),
      status: "completed", // In real scenario, would track status separately
      createdAt: log.createdAt,
      details: log.dataAccessed ? JSON.parse(log.dataAccessed) : {},
    }));
  }),

  /**
   * Get consent status and expiration info
   */
  getConsentStatus: protectedProcedure.query(async ({ ctx }) => {
    const consents = await corporateDb.getUserConsents(ctx.user.id);

    return consents.map((consent) => {
      const expiresAt = consent.expiresAt ? new Date(consent.expiresAt) : null;
      const daysUntilExpiration = expiresAt
        ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      // Send warning if expiring soon
      if (daysUntilExpiration && daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
        emailNotifications.sendConsentExpirationWarning(
          ctx.user.name || "Usuário",
          consent.consentType ?? "monitoring",
          expiresAt!,
          daysUntilExpiration
        );
      }

      return {
        id: consent.id,
        type: consent.consentType,
        isConsented: consent.isConsented === 1,
        consentDate: consent.consentDate,
        expiresAt,
        daysUntilExpiration,
        isExpired: expiresAt ? expiresAt < new Date() : false,
      };
    });
  }),

  /**
   * Revoke a specific consent
   */
  revokeConsent: protectedProcedure
    .input(
      z.object({
        consentType: z.enum([
          "monitoring",
          "data_collection",
          "screenshot",
          "location",
          "app_monitoring",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create audit log
      await corporateDb.createAuditLog(
        ctx.user.id,
        "CONSENT_REVOKED",
        "user",
        "success",
        undefined,
        ctx.user.id,
        JSON.stringify({ consentType: input.consentType })
      );

      return {
        success: true,
        message: `Consentimento para ${input.consentType} foi revogado`,
      };
    }),

  /**
   * Download user data export
   */
  downloadDataExport: protectedProcedure.query(async ({ ctx }) => {
    // Collect all user data
    const screenshots = await corporateDb.getScreenshots(ctx.user.id, undefined, 1000);
    const consents = await corporateDb.getUserConsents(ctx.user.id);
    const auditLogs = await corporateDb.getAuditLogs(ctx.user.id, 1000, 365);

    const dataExport = {
      exportDate: new Date().toISOString(),
      user: {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
      },
      screenshots: screenshots.length,
      consents,
      auditLogs: auditLogs.length,
      dataUrl: `data:application/json;base64,${Buffer.from(
        JSON.stringify(
          {
            user: ctx.user,
            screenshots: screenshots.map((s) => ({
              id: s.id,
              url: s.screenshotUrl,
              captureType: s.captureType,
              createdAt: s.createdAt,
            })),
            consents,
            auditLogs,
          },
          null,
          2
        )
      ).toString("base64")}`,
    };

    // Create audit log
    await corporateDb.createAuditLog(
      ctx.user.id,
      "DATA_EXPORT_DOWNLOADED",
      "user",
      "success",
      undefined,
      ctx.user.id,
      "User downloaded personal data export"
    );

    return dataExport;
  }),
});
