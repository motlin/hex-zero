import {LocalNotifications} from '@capacitor/local-notifications';
import type {LocalNotificationSchema, ScheduleOptions} from '@capacitor/local-notifications';
import {Capacitor} from '@capacitor/core';

export interface NotificationConfig {
	dailyReminderEnabled: boolean;
	dailyReminderTime: string;
	streakReminderEnabled: boolean;
	inactivityDays: number;
}

export class NotificationManager {
	private static instance: NotificationManager;
	private config: NotificationConfig = {
		dailyReminderEnabled: false,
		dailyReminderTime: '19:00',
		streakReminderEnabled: false,
		inactivityDays: 3,
	};
	private lastPlayedDate: Date | null = null;

	private constructor() {}

	static getInstance(): NotificationManager {
		if (!NotificationManager.instance) {
			NotificationManager.instance = new NotificationManager();
		}
		return NotificationManager.instance;
	}

	async initialize(): Promise<void> {
		if (!Capacitor.isNativePlatform()) {
			return;
		}

		await LocalNotifications.requestPermissions();
		this.loadConfig();
		this.setupListeners();
		await this.scheduleNotifications();
	}

	private setupListeners(): void {
		LocalNotifications.addListener('localNotificationReceived', (_notification) => {});

		LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
			if (notification.notification.id === 1 || notification.notification.id === 2) {
				window.location.href = '/';
			}
		});
	}

	async scheduleNotifications(): Promise<void> {
		if (!Capacitor.isNativePlatform()) return;

		await this.cancelAllNotifications();

		const notifications: LocalNotificationSchema[] = [];

		if (this.config.dailyReminderEnabled) {
			const [hours = 19, minutes = 0] = this.config.dailyReminderTime.split(':').map(Number);
			const scheduleDate = new Date();
			scheduleDate.setHours(hours, minutes, 0, 0);

			if (scheduleDate <= new Date()) {
				scheduleDate.setDate(scheduleDate.getDate() + 1);
			}

			notifications.push({
				id: 1,
				title: '🎯 Hex Zero',
				body: "Ready for today's puzzle challenge?",
				schedule: {
					at: scheduleDate,
					every: 'day',
					allowWhileIdle: true,
				},
				actionTypeId: 'OPEN_GAME',
				extra: {
					type: 'daily_reminder',
				},
			});
		}

		if (this.config.streakReminderEnabled && this.lastPlayedDate) {
			const inactivityDate = new Date(this.lastPlayedDate);
			inactivityDate.setDate(inactivityDate.getDate() + this.config.inactivityDays);

			if (inactivityDate > new Date()) {
				notifications.push({
					id: 2,
					title: '🎮 Miss playing Hex Zero?',
					body: 'Your hex puzzle skills are getting rusty! Come back and play.',
					schedule: {
						at: inactivityDate,
						allowWhileIdle: true,
					},
					actionTypeId: 'OPEN_GAME',
					extra: {
						type: 'inactivity_reminder',
					},
				});
			}
		}

		if (notifications.length > 0) {
			const options: ScheduleOptions = {
				notifications,
			};

			try {
				await LocalNotifications.schedule(options);
			} catch (error) {
				console.error('Error scheduling notifications:', error);
			}
		}
	}

	async cancelAllNotifications(): Promise<void> {
		if (!Capacitor.isNativePlatform()) return;

		try {
			const pending = await LocalNotifications.getPending();
			if (pending.notifications.length > 0) {
				await LocalNotifications.cancel({
					notifications: pending.notifications,
				});
			}
		} catch (error) {
			console.error('Error canceling notifications:', error);
		}
	}

	updateLastPlayed(): void {
		this.lastPlayedDate = new Date();
		this.saveConfig();
		this.scheduleNotifications();
	}

	async updateConfig(newConfig: Partial<NotificationConfig>): Promise<void> {
		this.config = {...this.config, ...newConfig};
		this.saveConfig();
		await this.scheduleNotifications();
	}

	getConfig(): NotificationConfig {
		return {...this.config};
	}

	private loadConfig(): void {
		const saved = localStorage.getItem('notificationConfig');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				this.config = {...this.config, ...parsed.config};
				if (parsed.lastPlayedDate) {
					this.lastPlayedDate = new Date(parsed.lastPlayedDate);
				}
			} catch (error) {
				console.error('Error loading notification config:', error);
			}
		}
	}

	private saveConfig(): void {
		const data = {
			config: this.config,
			lastPlayedDate: this.lastPlayedDate?.toISOString(),
		};
		localStorage.setItem('notificationConfig', JSON.stringify(data));
	}

	async showVictoryNotification(message: string): Promise<void> {
		if (!Capacitor.isNativePlatform()) return;

		try {
			await LocalNotifications.schedule({
				notifications: [
					{
						id: 999,
						title: '🏆 Achievement Unlocked!',
						body: message,
						schedule: {at: new Date(Date.now() + 1000)},
						extra: {
							type: 'achievement',
						},
					},
				],
			});
		} catch (error) {
			console.error('Error showing victory notification:', error);
		}
	}
}
