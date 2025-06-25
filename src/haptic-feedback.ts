import {Capacitor} from '@capacitor/core';
import {Haptics, ImpactStyle, NotificationType} from '@capacitor/haptics';

/**
 * Haptic feedback handler for mobile game interactions
 */
export class HapticFeedback {
	private static isAvailable: boolean = false;
	private static isEnabled: boolean = true;

	/**
	 * Initialize haptic feedback system
	 */
	static async initialize(): Promise<void> {
		this.isAvailable = Capacitor.isNativePlatform();

		if (this.isAvailable) {
			try {
				// Test haptics availability with a simple impact
				await Haptics.impact({style: ImpactStyle.Light});
				console.log('Haptic feedback initialized and available');
			} catch (error) {
				console.warn('Haptic feedback not available on this device:', error);
				this.isAvailable = false;
			}
		}
	}

	/**
	 * Enable or disable haptic feedback
	 */
	static setEnabled(enabled: boolean): void {
		this.isEnabled = enabled;
	}

	/**
	 * Check if haptic feedback is enabled and available
	 */
	static canVibrate(): boolean {
		return this.isAvailable && this.isEnabled;
	}

	/**
	 * Light haptic feedback for UI interactions (button taps, menu selections)
	 */
	static async lightTap(): Promise<void> {
		if (!this.canVibrate()) return;

		try {
			await Haptics.impact({style: ImpactStyle.Light});
		} catch (error) {
			console.error('Haptic light tap failed:', error);
		}
	}

	/**
	 * Medium haptic feedback for piece selection and movement
	 */
	static async mediumTap(): Promise<void> {
		if (!this.canVibrate()) return;

		try {
			await Haptics.impact({style: ImpactStyle.Medium});
		} catch (error) {
			console.error('Haptic medium tap failed:', error);
		}
	}

	/**
	 * Heavy haptic feedback for piece placement
	 */
	static async heavyTap(): Promise<void> {
		if (!this.canVibrate()) return;

		try {
			await Haptics.impact({style: ImpactStyle.Heavy});
		} catch (error) {
			console.error('Haptic heavy tap failed:', error);
		}
	}

	/**
	 * Success notification haptic for valid moves
	 */
	static async successNotification(): Promise<void> {
		if (!this.canVibrate()) return;

		try {
			await Haptics.notification({type: NotificationType.Success});
		} catch (error) {
			console.error('Haptic success notification failed:', error);
		}
	}

	/**
	 * Warning notification haptic for invalid moves
	 */
	static async warningNotification(): Promise<void> {
		if (!this.canVibrate()) return;

		try {
			await Haptics.notification({type: NotificationType.Warning});
		} catch (error) {
			console.error('Haptic warning notification failed:', error);
		}
	}

	/**
	 * Error notification haptic for game errors
	 */
	static async errorNotification(): Promise<void> {
		if (!this.canVibrate()) return;

		try {
			await Haptics.notification({type: NotificationType.Error});
		} catch (error) {
			console.error('Haptic error notification failed:', error);
		}
	}

	/**
	 * Custom vibration pattern for game victory
	 */
	static async victoryPattern(): Promise<void> {
		if (!this.canVibrate()) return;

		try {
			// Create a celebratory pattern with multiple impacts
			await Haptics.impact({style: ImpactStyle.Light});
			await new Promise((resolve) => setTimeout(resolve, 100));
			await Haptics.impact({style: ImpactStyle.Medium});
			await new Promise((resolve) => setTimeout(resolve, 100));
			await Haptics.impact({style: ImpactStyle.Heavy});
			await new Promise((resolve) => setTimeout(resolve, 200));
			await Haptics.notification({type: NotificationType.Success});
		} catch (error) {
			console.error('Haptic victory pattern failed:', error);
		}
	}

	/**
	 * Soft selection feedback for hovering or highlighting
	 */
	static async selectionChanged(): Promise<void> {
		if (!this.canVibrate()) return;

		try {
			// Use the lightest possible feedback for selection changes
			await Haptics.impact({style: ImpactStyle.Light});
		} catch (error) {
			console.error('Haptic selection change failed:', error);
		}
	}
}
