import { notifyOwner } from "./_core/notification";
import * as db from "./db";

export interface NotificationPayload {
  userId: number;
  deviceId: number;
  type: "offline" | "location_change" | "critical_event" | "battery_low";
  title: string;
  message: string;
  data?: any;
}

export async function sendNotification(payload: NotificationPayload) {
  try {
    // Get alert config for this user/device
    const configs = await db.getAlertConfigsByUserId(payload.userId);
    const deviceConfig = configs.find(
      (c: any) => c.deviceId === payload.deviceId && c.alertType === payload.type
    );

    if (!deviceConfig || !deviceConfig.isEnabled) {
      console.log(`[Notifications] Alert disabled for user ${payload.userId}, device ${payload.deviceId}`);
      return;
    }

    // Create alert record
    const alert = await db.createAlert(payload.userId, payload.deviceId, {
      alertType: payload.type,
      title: payload.title,
      message: payload.message,
    });

    // Send email notification if configured
    if (deviceConfig.notificationMethod === "email" || deviceConfig.notificationMethod === "both") {
      await sendEmailNotification(payload);
    }

    // Send push notification if configured
    if (deviceConfig.notificationMethod === "push" || deviceConfig.notificationMethod === "both") {
      await sendPushNotification(payload);
    }

    console.log(`[Notifications] Sent notification for user ${payload.userId}`);
  } catch (error) {
    console.error("[Notifications] Error sending notification:", error);
  }
}

async function sendEmailNotification(payload: NotificationPayload) {
  try {
    // Use the built-in owner notification system
    await notifyOwner({
      title: `[${payload.type.toUpperCase()}] ${payload.title}`,
      content: `Dispositivo: ${payload.deviceId}\n\n${payload.message}`,
    });

    console.log(`[Notifications] Email sent for user ${payload.userId}`);
  } catch (error) {
    console.error("[Notifications] Error sending email:", error);
  }
}

async function sendPushNotification(payload: NotificationPayload) {
  try {
    // Push notifications would be sent to a push service like Firebase Cloud Messaging
    // For now, we'll just log it
    console.log(`[Notifications] Push notification queued for user ${payload.userId}`);

    // In a production environment, you would:
    // 1. Get user's push subscription tokens from database
    // 2. Send to push service (Firebase, OneSignal, etc.)
    // 3. Handle failures and retries
  } catch (error) {
    console.error("[Notifications] Error sending push notification:", error);
  }
}

export async function checkDeviceOffline(userId: number, deviceId: number, timeoutSeconds: number = 300) {
  try {
    const device = await db.getDeviceById(deviceId);

    if (!device) {
      console.log(`[Notifications] Device ${deviceId} not found`);
      return;
    }

    if (device.status === "offline") {
      console.log(`[Notifications] Device ${deviceId} already offline`);
      return;
    }

    const lastSeen = device.lastSeen ? new Date(device.lastSeen).getTime() : 0;
    const now = Date.now();
    const secondsSinceLastSeen = (now - lastSeen) / 1000;

    if (secondsSinceLastSeen > timeoutSeconds) {
      // Device is offline
      await db.updateDeviceStatus(deviceId, "offline");

      // Send notification
      await sendNotification({
        userId,
        deviceId,
        type: "offline",
        title: `Dispositivo Offline`,
        message: `${device.deviceName} ficou offline há ${Math.round(secondsSinceLastSeen / 60)} minutos`,
        data: {
          lastSeen: device.lastSeen,
          secondsSinceLastSeen,
        },
      });
    }
  } catch (error) {
    console.error("[Notifications] Error checking device offline:", error);
  }
}

export async function checkLocationChange(
  userId: number,
  deviceId: number,
  newLocation: { latitude: number; longitude: number },
  thresholdMeters: number = 1000
) {
  try {
    const device = await db.getDeviceById(deviceId);

    if (!device || !device.lastLocation) {
      console.log(`[Notifications] No previous location for device ${deviceId}`);
      return;
    }

    const distance = calculateDistance(
      (device.lastLocation as any).latitude,
      (device.lastLocation as any).longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    if (distance > thresholdMeters) {
      // Location changed significantly
      await sendNotification({
        userId,
        deviceId,
        type: "location_change",
        title: `Mudança de Localização`,
        message: `${device.deviceName} se moveu ${Math.round(distance / 1000)}km`,
        data: {
          previousLocation: device.lastLocation,
          newLocation,
          distance,
        },
      });
    }
  } catch (error) {
    console.error("[Notifications] Error checking location change:", error);
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function checkBatteryLow(userId: number, deviceId: number, batteryLevel: number, threshold: number = 20) {
  try {
    if (batteryLevel <= threshold) {
      await sendNotification({
        userId,
        deviceId,
        type: "battery_low",
        title: `Bateria Baixa`,
        message: `Bateria do dispositivo em ${batteryLevel}%`,
        data: {
          batteryLevel,
          threshold,
        },
      });
    }
  } catch (error) {
    console.error("[Notifications] Error checking battery:", error);
  }
}
