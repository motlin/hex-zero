declare module 'hamsterjs' {
	export interface HamsterInstance {
		wheel: (callback: (event: Event, delta: number, deltaX: number, deltaY: number) => void) => void;
		unwheel: () => void;
	}

	function Hamster(element: HTMLElement): HamsterInstance;
	export default Hamster;
}
