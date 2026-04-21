import { relations } from "drizzle-orm/relations";
import { users, alertConfigs, devices, alerts, events, installationTokens, websocketSessions } from "./schema";

export const alertConfigsRelations = relations(alertConfigs, ({one}) => ({
	user: one(users, {
		fields: [alertConfigs.userId],
		references: [users.id]
	}),
	device: one(devices, {
		fields: [alertConfigs.deviceId],
		references: [devices.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	alertConfigs: many(alertConfigs),
	alerts: many(alerts),
	devices: many(devices),
	events: many(events),
	installationTokens: many(installationTokens),
	websocketSessions: many(websocketSessions),
}));

export const devicesRelations = relations(devices, ({one, many}) => ({
	alertConfigs: many(alertConfigs),
	alerts: many(alerts),
	user: one(users, {
		fields: [devices.userId],
		references: [users.id]
	}),
	events: many(events),
	installationTokens: many(installationTokens),
}));

export const alertsRelations = relations(alerts, ({one}) => ({
	user: one(users, {
		fields: [alerts.userId],
		references: [users.id]
	}),
	device: one(devices, {
		fields: [alerts.deviceId],
		references: [devices.id]
	}),
}));

export const eventsRelations = relations(events, ({one}) => ({
	device: one(devices, {
		fields: [events.deviceId],
		references: [devices.id]
	}),
	user: one(users, {
		fields: [events.userId],
		references: [users.id]
	}),
}));

export const installationTokensRelations = relations(installationTokens, ({one}) => ({
	user: one(users, {
		fields: [installationTokens.userId],
		references: [users.id]
	}),
	device: one(devices, {
		fields: [installationTokens.deviceId],
		references: [devices.id]
	}),
}));

export const websocketSessionsRelations = relations(websocketSessions, ({one}) => ({
	user: one(users, {
		fields: [websocketSessions.userId],
		references: [users.id]
	}),
}));