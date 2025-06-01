import type {HexCoordinate} from '../state/HexGrid';

interface Point {
	x: number;
	y: number;
}

export class HexRenderer {
	public hexSize: number;

	constructor(hexSize: number) {
		this.hexSize = hexSize;
	}

	hexToPixel(q: number, r: number): Point {
		const x = this.hexSize * ((3 / 2) * q);
		const y = this.hexSize * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
		return {x, y};
	}

	pixelToHex(x: number, y: number): HexCoordinate {
		const q = ((2 / 3) * x) / this.hexSize;
		const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / this.hexSize;
		return this.roundHex(q, r);
	}

	roundHex(q: number, r: number): HexCoordinate {
		const s = -q - r;
		let rq = Math.round(q);
		let rr = Math.round(r);
		const rs = Math.round(s);

		const q_diff = Math.abs(rq - q);
		const r_diff = Math.abs(rr - r);
		const s_diff = Math.abs(rs - s);

		if (q_diff > r_diff && q_diff > s_diff) {
			rq = -rr - rs;
		} else if (r_diff > s_diff) {
			rr = -rq - rs;
		}

		return {q: rq, r: rr};
	}
}

export type {Point};
