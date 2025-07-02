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
	} catch (error) {
		console.error('Failed to configure status bar:', error);
	}
}
