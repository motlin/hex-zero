import {beforeEach} from 'vite-plus/test';

function createLocalStorageMock(): Storage {
	const store = new Map<string, string>();

	return {
		get length(): number {
			return store.size;
		},
		getItem: (key: string): string | null => {
			return store.get(key) ?? null;
		},
		setItem: (key: string, value: string): void => {
			store.set(key, value);
		},
		removeItem: (key: string): void => {
			store.delete(key);
		},
		clear: (): void => {
			store.clear();
		},
		key: (index: number): string | null => {
			return [...store.keys()][index] ?? null;
		},
	};
}

beforeEach(() => {
	Object.defineProperty(globalThis, 'localStorage', {
		value: createLocalStorageMock(),
		writable: true,
	});
});
