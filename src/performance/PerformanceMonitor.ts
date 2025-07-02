import {MobilePerformanceOptimizer} from './MobilePerformanceOptimizer';
import {OptimizedHexRenderer} from './OptimizedHexRenderer';

interface PerformanceMemory {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

function isPerformanceMemory(value: unknown): value is PerformanceMemory {
	if (typeof value !== 'object' || value === null) return false;

	return (
		typeof Reflect.get(value, 'usedJSHeapSize') === 'number' &&
		typeof Reflect.get(value, 'totalJSHeapSize') === 'number' &&
		typeof Reflect.get(value, 'jsHeapSizeLimit') === 'number'
	);
}

/**
 * 📊 Performance monitor for debugging and optimization
 */
export class PerformanceMonitor {
	private container: HTMLElement | null = null;
	private isVisible: boolean = false;
	private updateInterval: number | null = null;
	private readonly optimizer: MobilePerformanceOptimizer;
	private renderer: OptimizedHexRenderer | null = null;

	constructor() {
		this.optimizer = MobilePerformanceOptimizer.getInstance();
		this.createUI();
	}

	setRenderer(renderer: OptimizedHexRenderer): void {
		this.renderer = renderer;
	}

	private createUI(): void {
		// Only show in development or debug mode
		const isDebug = window.location.search.includes('debug') || window.location.hostname === 'localhost';
		if (!isDebug) {
			return;
		}

		this.container = document.createElement('div');
		this.container.id = 'performance-monitor';
		this.container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            display: none;
            min-width: 200px;
            line-height: 1.4;
        `;

		document.body.appendChild(this.container);

		// Toggle with keyboard shortcut
		document.addEventListener('keydown', (e) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'P') {
				this.toggle();
			}
		});
	}

	toggle(): void {
		this.isVisible = !this.isVisible;
		if (!this.container) return;

		if (this.isVisible) {
			this.container.style.display = 'block';
			this.startMonitoring();
		} else {
			this.container.style.display = 'none';
			this.stopMonitoring();
		}
	}

	private startMonitoring(): void {
		if (this.updateInterval !== null) return;

		this.update();
		this.updateInterval = window.setInterval(() => {
			this.update();
		}, 100);
	}

	private stopMonitoring(): void {
		if (this.updateInterval !== null) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
	}

	private update(): void {
		if (!this.container) return;

		const stats = {
			fps: this.optimizer.getCurrentFPS(),
			platform: this.optimizer.getPlatform(),
			reducedQuality: this.optimizer.isReducedQualityMode(),
			...this.renderer?.getPerformanceStats(),
		};

		const memoryValue: unknown = Reflect.get(performance, 'memory');
		const memory = isPerformanceMemory(memoryValue) ? memoryValue : undefined;
		const memoryInfo = memory
			? {
					used: (memory.usedJSHeapSize / 1048576).toFixed(1),
					total: (memory.totalJSHeapSize / 1048576).toFixed(1),
					limit: (memory.jsHeapSizeLimit / 1048576).toFixed(1),
				}
			: null;

		let html = `
            <strong>🎮 Performance Stats</strong><br>
            Platform: ${stats.platform}<br>
            FPS: ${stats.fps}<br>
            Quality: ${stats.reducedQuality ? '🔻 Reduced' : '✅ Full'}<br>
        `;

		if (stats.cacheSize !== undefined) {
			html += `
                <br><strong>🎨 Renderer</strong><br>
                Cache: ${stats.cacheSize} hexes<br>
                Dirty: ${stats.dirtyRegions} regions<br>
            `;
		}

		if (memoryInfo) {
			html += `
                <br><strong>💾 Memory</strong><br>
                Used: ${memoryInfo.used} MB<br>
                Total: ${memoryInfo.total} MB<br>
                Limit: ${memoryInfo.limit} MB<br>
            `;
		}

		const opts = this.optimizer.getRenderingOptimizations();
		html += `
            <br><strong>⚙️ Optimizations</strong><br>
            Shadows: ${opts.shadowsEnabled ? '✓' : '✗'}<br>
            Antialiasing: ${opts.antialiasEnabled ? '✓' : '✗'}<br>
            Pixel Perfect: ${opts.pixelPerfect ? '✓' : '✗'}<br>
        `;

		this.container.innerHTML = html;
	}

	destroy(): void {
		this.stopMonitoring();
		if (this.container?.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
	}
}
