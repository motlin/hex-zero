interface HexCoordinate {
	q: number;
	r: number;
}

interface Hex extends HexCoordinate {
	s: number;
	height: number;
}

export class HexGrid {
	public radius: number;
	public hexes: Map<string, Hex>;

	constructor(radius: number) {
		this.radius = radius;
		this.hexes = new Map<string, Hex>();

		for (let q = -radius; q <= radius; q++) {
			for (let r = -radius; r <= radius; r++) {
				const s = -q - r;
				if (Math.abs(s) <= radius) {
					const key = `${q},${r}`;
					this.hexes.set(key, {q, r, s, height: 0});
				}
			}
		}
	}

	getHex(q: number, r: number): Hex | undefined {
		return this.hexes.get(`${q},${r}`);
	}
}

export type {HexCoordinate};
