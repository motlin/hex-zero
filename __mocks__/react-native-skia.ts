import {vi} from 'vitest';

const createMockPath = () => ({
	moveTo: vi.fn().mockReturnThis(),
	lineTo: vi.fn().mockReturnThis(),
	close: vi.fn().mockReturnThis(),
	addPath: vi.fn().mockReturnThis(),
	reset: vi.fn().mockReturnThis(),
	copy: vi.fn(),
});

export const Skia = {
	Path: {
		Make: vi.fn(() => createMockPath()),
	},
	Paint: vi.fn(() => ({
		setColor: vi.fn(),
		setStyle: vi.fn(),
		setStrokeWidth: vi.fn(),
		setAntiAlias: vi.fn(),
	})),
	Color: vi.fn((color: string) => color),
};

export type SkPath = ReturnType<typeof createMockPath>;

export const Canvas = vi.fn();
export const Path = vi.fn();
export const Group = vi.fn();
export const useCanvasRef = vi.fn();
