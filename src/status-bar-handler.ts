import {Capacitor} from '@capacitor/core';
import {StatusBar, Style} from '@capacitor/status-bar';

export async function setupStatusBar(): Promise<void> {
	if (!Capacitor.isNativePlatform()) {
		return;
	}

	try {
		// Configure status bar for dark theme to match the game's color scheme
		await StatusBar.setStyle({style: Style.Dark});

		// Set background color to match the game's dark background
		// Using the same dark blue from the game's theme
		await StatusBar.setBackgroundColor({color: '#0a0e27'});

		// Show the status bar (in case it was hidden)
		await StatusBar.show();

		// Platform-specific configurations
		const platform = Capacitor.getPlatform();

		if (platform === 'ios') {
			// iOS: Don't overlay the web view to prevent content overlap
			await StatusBar.setOverlaysWebView({overlay: false});
			document.body.classList.add('ios');
		} else if (platform === 'android') {
			// Android: Use translucent status bar for modern look
			await StatusBar.setOverlaysWebView({overlay: true});
			// For Android, we might want a slightly transparent status bar
			await StatusBar.setBackgroundColor({color: '#0a0e27ee'});
			document.body.classList.add('android');
		}

		console.log(`Status bar configured for ${platform} platform`);
	} catch (error) {
		console.error('Failed to configure status bar:', error);
	}
}

export async function hideStatusBar(): Promise<void> {
	if (!Capacitor.isNativePlatform()) {
		return;
	}

	try {
		await StatusBar.hide();
		console.log('Status bar hidden');
	} catch (error) {
		console.error('Could not hide status bar:', error);
	}
}

export async function showStatusBar(): Promise<void> {
	if (!Capacitor.isNativePlatform()) {
		return;
	}

	try {
		await StatusBar.show();
		console.log('Status bar shown');
	} catch (error) {
		console.error('Could not show status bar:', error);
	}
}

export async function toggleStatusBar(): Promise<void> {
	if (!Capacitor.isNativePlatform()) {
		return;
	}

	try {
		const {visible} = await StatusBar.getInfo();
		if (visible) {
			await hideStatusBar();
		} else {
			await showStatusBar();
		}
	} catch (error) {
		console.error('Could not toggle status bar:', error);
	}
}

/**
 * Set status bar style dynamically based on current screen
 * @param isDarkBackground - Whether the current screen has a dark background
 */
export async function updateStatusBarStyle(isDarkBackground: boolean): Promise<void> {
	if (!Capacitor.isNativePlatform()) {
		return;
	}

	try {
		if (isDarkBackground) {
			await StatusBar.setStyle({style: Style.Dark});
		} else {
			await StatusBar.setStyle({style: Style.Light});
		}
	} catch (error) {
		console.error('Could not update status bar style:', error);
	}
}

/**
 * Enter immersive mode (hide status bar for gameplay)
 */
export async function enterImmersiveMode(): Promise<void> {
	if (!Capacitor.isNativePlatform()) {
		return;
	}

	try {
		await hideStatusBar();
		document.body.classList.add('immersive-mode');
	} catch (error) {
		console.error('Could not enter immersive mode:', error);
	}
}

/**
 * Exit immersive mode (show status bar)
 */
export async function exitImmersiveMode(): Promise<void> {
	if (!Capacitor.isNativePlatform()) {
		return;
	}

	try {
		await showStatusBar();
		document.body.classList.remove('immersive-mode');
	} catch (error) {
		console.error('Could not exit immersive mode:', error);
	}
}
