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

	getNeighbors(q: number, r: number): HexCoordinate[] {
		const dirs: [number, number][] = [
			[1, 0],
			[1, -1],
			[0, -1],
			[-1, 0],
			[-1, 1],
			[0, 1],
		];
		return dirs.map(([dq, dr]) => ({q: q + dq, r: r + dr})).filter((pos) => this.getHex(pos.q, pos.r));
	}
}

export type {HexCoordinate, Hex};
