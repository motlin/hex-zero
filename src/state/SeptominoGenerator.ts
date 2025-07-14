import type {HexCoordinate} from './HexGrid';

interface PieceData {
	tiles: HexCoordinate[];
	center: HexCoordinate;
}

type Piece = PieceData;

export class SeptominoGenerator {
	static generatePiece(): Piece {
		const tiles: HexCoordinate[] = [{q: 0, r: 0}];
		// The starting tile is our center
		const center: HexCoordinate = {q: 0, r: 0};

		const numTiles = 2 + Math.floor(Math.random() * 5);

		for (let i = 0; i < numTiles; i++) {
			const neighbors: HexCoordinate[] = [
				{q: 1, r: 0},
				{q: 1, r: -1},
				{q: 0, r: -1},
				{q: -1, r: 0},
				{q: -1, r: 1},
				{q: 0, r: 1},
			];

			const available = neighbors.filter((n) => !tiles.some((t) => t.q === n.q && t.r === n.r));

			if (available.length > 0) {
				const next = available[Math.floor(Math.random() * available.length)];
				if (next) {
					tiles.push(next);
				}
			}
		}

		return {tiles, center};
	}

	static generateSet(count: number): Piece[] {
		const pieces: Piece[] = [];
		for (let i = 0; i < count; i++) {
			pieces.push(this.generatePiece());
		}
		return pieces;
	}
}

export type {Piece};
