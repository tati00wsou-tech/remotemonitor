import { notifyOwner } from "./_core/notification";

/**
 * Email Notification Service for Corporate Monitoring
 * Sends alerts to managers and compliance team
 */

interface AlertNotification {
  deviceId: number;
  deviceName: string;
  userId: number;
  employeeName: string;
  alertType: "bank_access" | "offline" | "location_change" | "app_blocked" | "screenshot";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * Send alert notification to manager
 */
export async function sendAlertToManager(alert: AlertNotification) {
  const severityEmoji = {
    low: "ℹ️",
    medium: "⚠️",
    high: "🔴",
    critical: "🚨",
  };

  const title = `${severityEmoji[alert.severity]} ${alert.alertType.toUpperCase()} - ${alert.deviceName}`;

  const content = `
**Funcionário:** ${alert.employeeName}
**Dispositivo:** ${alert.deviceName}
**Tipo de Alerta:** ${alert.alertType}
**Severidade:** ${alert.severity}
**Horário:** ${alert.timestamp.toLocaleString("pt-BR")}

**Mensagem:**
${alert.message}

${
  alert.details
    ? `**Detalhes:**
${Object.entries(alert.details)
  .map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`)
  .join("\n")}`
    : ""
}

---
*Alerta automático do Sistema de Monitoramento Corporativo*
`;

  return await notifyOwner({ title, content });
}

/**
 * Send bank access alert
 */
export async function sendBankAccessAlert(
  deviceId: number,
  deviceName: string,
  userId: number,
  employeeName: string,
  bankName: string,
  bankApp: string,
  duration?: number
) {
  const alert: AlertNotification = {
    deviceId,
    deviceName,
    userId,
    employeeName,
    alertType: "bank_access",
    severity: "high",
    message: `${employeeName} acessou ${bankName} (${bankApp}) durante expediente`,
    details: {
      bankName,
      bankApp,
      duration: duration ? `${duration} minutos` : "desconhecido",
    },
    timestamp: new Date(),
  };

  return await sendAlertToManager(alert);
}

/**
 * Send device offline alert
 */
export async function sendDeviceOfflineAlert(
  deviceId: number,
  deviceName: string,
  userId: number,
  employeeName: string,
  lastSeenAt: Date
) {
  const alert: AlertNotification = {
    deviceId,
    deviceName,
    userId,
    employeeName,
    alertType: "offline",
    severity: "medium",
    message: `Dispositivo ${deviceName} ficou offline`,
    details: {
      lastSeenAt: lastSeenAt.toLocaleString("pt-BR"),
      offlineFor: `${Math.round((Date.now() - lastSeenAt.getTime()) / 60000)} minutos`,
    },
    timestamp: new Date(),
  };

  return await sendAlertToManager(alert);
}

/**
 * Send location change alert
 */
export async function sendLocationChangeAlert(
  deviceId: number,
  deviceName: string,
  userId: number,
  employeeName: string,
  previousLocation: { latitude: number; longitude: number },
  currentLocation: { latitude: number; longitude: number },
  distance: number
) {
  const alert: AlertNotification = {
    deviceId,
    deviceName,
    userId,
    employeeName,
    alertType: "location_change",
    severity: "medium",
    message: `${employeeName} mudou de localização (${distance.toFixed(2)} km)`,
    details: {
      previousLocation: `${previousLocation.latitude.toFixed(4)}, ${previousLocation.longitude.toFixed(4)}`,
      currentLocation: `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`,
      distance: `${distance.toFixed(2)} km`,
    },
    timestamp: new Date(),
  };

  return await sendAlertToManager(alert);
}

/**
 * Send blocked app alert
 */
export async function sendBlockedAppAlert(
  deviceId: number,
  deviceName: string,
  userId: number,
  employeeName: string,
  appName: string,
  appPackage: string
) {
  const alert: AlertNotification = {
    deviceId,
    deviceName,
    userId,
    employeeName,
    alertType: "app_blocked",
    severity: "low",
    message: `${employeeName} tentou acessar ${appName} (bloqueado)`,
    details: {
      appName,
      appPackage,
    },
    timestamp: new Date(),
  };

  return await sendAlertToManager(alert);
}

/**
 * Send screenshot capture alert
 */
export async function sendScreenshotAlert(
  deviceId: number,
  deviceName: string,
  userId: number,
  employeeName: string,
  screenshotUrl: string,
  reason: string
) {
  const alert: AlertNotification = {
    deviceId,
    deviceName,
    userId,
    employeeName,
    alertType: "screenshot",
    severity: "low",
    message: `Screenshot capturado de ${employeeName}`,
    details: {
      reason,
      screenshotUrl,
    },
    timestamp: new Date(),
  };

  return await sendAlertToManager(alert);
}

/**
 * Send daily compliance report
 */
export async function sendDailyComplianceReport(
  date: Date,
  stats: {
    totalDevices: number;
    activeDevices: number;
    offlineDevices: number;
    alertsGenerated: number;
    bankAccessAlerts: number;
    screenshotsCapturado: number;
    consentsPending: number;
  }
) {
  const title = `📊 Relatório Diário de Conformidade - ${date.toLocaleDateString("pt-BR")}`;

  const content = `
**Data:** ${date.toLocaleDateString("pt-BR")}

**Dispositivos:**
- Total: ${stats.totalDevices}
- Ativos: ${stats.activeDevices}
- Offline: ${stats.offlineDevices}

**Alertas:**
- Total: ${stats.alertsGenerated}
- Acesso a Bancos: ${stats.bankAccessAlerts}
- Screenshots: ${stats.screenshotsCapturado}

**Conformidade:**
- Consentimentos Pendentes: ${stats.consentsPending}

---
*Relatório automático do Sistema de Monitoramento Corporativo*
`;

  return await notifyOwner({ title, content });
}

/**
 * Send LGPD data access request notification
 */
export async function sendLGPDAccessRequestNotification(
  employeeName: string,
  requestDate: Date,
  dataTypes: string[]
) {
  const title = `📋 Solicitação de Acesso LGPD - ${employeeName}`;

  const content = `
**Funcionário:** ${employeeName}
**Data da Solicitação:** ${requestDate.toLocaleString("pt-BR")}

**Tipos de Dados Solicitados:**
${dataTypes.map((type) => `- ${type}`).join("\n")}

**Ação Necessária:**
1. Revisar solicitação
2. Preparar pacote de dados
3. Enviar ao funcionário em até 15 dias úteis

---
*Notificação automática do Sistema de Conformidade LGPD*
`;

  return await notifyOwner({ title, content });
}

/**
 * Send LGPD deletion request notification
 */
export async function sendLGPDDeletionRequestNotification(
  employeeName: string,
  requestDate: Date,
  dataTypes: string[]
) {
  const title = `🗑️ Solicitação de Exclusão LGPD - ${employeeName}`;

  const content = `
**Funcionário:** ${employeeName}
**Data da Solicitação:** ${requestDate.toLocaleString("pt-BR")}

**Tipos de Dados a Excluir:**
${dataTypes.map((type) => `- ${type}`).join("\n")}

**Ação Necessária:**
1. Revisar solicitação
2. Validar conformidade
3. Executar exclusão em até 30 dias
4. Confirmar ao funcionário

---
*Notificação automática do Sistema de Conformidade LGPD*
`;

  return await notifyOwner({ title, content });
}

/**
 * Send consent expiration warning
 */
export async function sendConsentExpirationWarning(
  employeeName: string,
  consentType: string,
  expirationDate: Date,
  daysUntilExpiration: number
) {
  const title = `⏰ Consentimento Expirando - ${employeeName}`;

  const content = `
**Funcionário:** ${employeeName}
**Tipo de Consentimento:** ${consentType}
**Data de Expiração:** ${expirationDate.toLocaleDateString("pt-BR")}
**Dias Restantes:** ${daysUntilExpiration}

**Ação Necessária:**
Solicitar renovação do consentimento ao funcionário antes da expiração.

---
*Notificação automática do Sistema de Conformidade LGPD*
`;

  return await notifyOwner({ title, content });
}
