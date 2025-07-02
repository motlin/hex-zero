import {NotificationManager} from './NotificationManager';
import type {NotificationConfig} from './NotificationManager';
import {getRequiredDescendant} from '../dom-utils';

export class NotificationSettings {
	private readonly manager: NotificationManager;
	private container: HTMLElement | null = null;

	constructor() {
		this.manager = NotificationManager.getInstance();
	}

	createSettingsPanel(): HTMLElement {
		const panel = document.createElement('div');
		panel.className = 'notification-settings';
		panel.innerHTML = `
            <h3>📱 Notification Settings</h3>
            <div class="settings-section">
                <div class="setting-item">
                    <label class="setting-label">
                        <input type="checkbox" id="daily-reminder" class="setting-checkbox">
                        <span>Daily Reminder</span>
                    </label>
                    <div class="setting-time" id="daily-time-wrapper" style="display: none;">
                        <label for="daily-time">Time:</label>
                        <input type="time" id="daily-time" value="19:00">
                    </div>
                </div>

                <div class="setting-item">
                    <label class="setting-label">
                        <input type="checkbox" id="streak-reminder" class="setting-checkbox">
                        <span>Inactivity Reminder</span>
                    </label>
                    <div class="setting-days" id="inactivity-wrapper" style="display: none;">
                        <label for="inactivity-days">After days:</label>
                        <select id="inactivity-days">
                            <option value="1">1 day</option>
                            <option value="2">2 days</option>
                            <option value="3" selected>3 days</option>
                            <option value="5">5 days</option>
                            <option value="7">1 week</option>
                        </select>
                    </div>
                </div>

                <div class="setting-description">
                    <p>🔔 Get reminders to play Hex Zero and maintain your winning streak!</p>
                </div>
            </div>
        `;

		this.container = panel;
		this.attachEventListeners();
		this.loadCurrentSettings();

		return panel;
	}

	private attachEventListeners(): void {
		if (!this.container) return;

		const dailyCheckbox = getRequiredDescendant(this.container, '#daily-reminder', HTMLInputElement);
		const dailyTimeWrapper = getRequiredDescendant(this.container, '#daily-time-wrapper', HTMLElement);
		const dailyTime = getRequiredDescendant(this.container, '#daily-time', HTMLInputElement);

		const streakCheckbox = getRequiredDescendant(this.container, '#streak-reminder', HTMLInputElement);
		const inactivityWrapper = getRequiredDescendant(this.container, '#inactivity-wrapper', HTMLElement);
		const inactivityDays = getRequiredDescendant(this.container, '#inactivity-days', HTMLSelectElement);

		dailyCheckbox.addEventListener('change', () => {
			dailyTimeWrapper.style.display = dailyCheckbox.checked ? 'block' : 'none';
			void this.saveSettings();
		});

		streakCheckbox.addEventListener('change', () => {
			inactivityWrapper.style.display = streakCheckbox.checked ? 'block' : 'none';
			void this.saveSettings();
		});

		dailyTime.addEventListener('change', () => {
			void this.saveSettings();
		});
		inactivityDays.addEventListener('change', () => {
			void this.saveSettings();
		});
	}

	private loadCurrentSettings(): void {
		if (!this.container) return;

		const config = this.manager.getConfig();

		const dailyCheckbox = getRequiredDescendant(this.container, '#daily-reminder', HTMLInputElement);
		const dailyTime = getRequiredDescendant(this.container, '#daily-time', HTMLInputElement);
		const dailyTimeWrapper = getRequiredDescendant(this.container, '#daily-time-wrapper', HTMLElement);

		const streakCheckbox = getRequiredDescendant(this.container, '#streak-reminder', HTMLInputElement);
		const inactivityDays = getRequiredDescendant(this.container, '#inactivity-days', HTMLSelectElement);
		const inactivityWrapper = getRequiredDescendant(this.container, '#inactivity-wrapper', HTMLElement);

		dailyCheckbox.checked = config.dailyReminderEnabled;
		dailyTimeWrapper.style.display = config.dailyReminderEnabled ? 'block' : 'none';
		dailyTime.value = config.dailyReminderTime;
		streakCheckbox.checked = config.streakReminderEnabled;
		inactivityWrapper.style.display = config.streakReminderEnabled ? 'block' : 'none';
		inactivityDays.value = config.inactivityDays.toString();
	}

	private async saveSettings(): Promise<void> {
		if (!this.container) return;

		const dailyCheckbox = getRequiredDescendant(this.container, '#daily-reminder', HTMLInputElement);
		const dailyTime = getRequiredDescendant(this.container, '#daily-time', HTMLInputElement);
		const streakCheckbox = getRequiredDescendant(this.container, '#streak-reminder', HTMLInputElement);
		const inactivityDays = getRequiredDescendant(this.container, '#inactivity-days', HTMLSelectElement);

		const newConfig: NotificationConfig = {
			dailyReminderEnabled: dailyCheckbox.checked,
			dailyReminderTime: dailyTime.value,
			streakReminderEnabled: streakCheckbox.checked,
			inactivityDays: parseInt(inactivityDays.value),
		};

		await this.manager.updateConfig(newConfig);
	}

	static getStyles(): string {
		return `
            .notification-settings {
                padding: 20px;
                background: #f5f5f5;
                border-radius: 8px;
                margin: 10px 0;
            }

            .notification-settings h3 {
                margin: 0 0 15px 0;
                color: #333;
            }

            .settings-section {
                background: white;
                padding: 15px;
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .setting-item {
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }

            .setting-item:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }

            .setting-label {
                display: flex;
                align-items: center;
                cursor: pointer;
                font-size: 16px;
            }

            .setting-checkbox {
                margin-right: 10px;
                width: 20px;
                height: 20px;
                cursor: pointer;
            }

            .setting-time,
            .setting-days {
                margin-top: 10px;
                margin-left: 30px;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .setting-time input[type="time"],
            .setting-days select {
                padding: 5px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }

            .setting-description {
                margin-top: 15px;
                padding: 10px;
                background: #f0f8ff;
                border-radius: 4px;
                font-size: 14px;
                color: #666;
            }

            .setting-description p {
                margin: 0;
            }
        `;
	}
}
