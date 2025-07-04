import React from 'react';
import {describe, it, expect, vi} from 'vitest';
import {renderHook, act, waitFor} from '@testing-library/react';
import {GameStateProvider} from './GameStateContext';
import {useGame} from '../hooks';

describe('GameStateContext and Hooks', () => {
	describe('useGame hook', () => {
		it('initializes with null game state', () => {
			const wrapper = ({children}: {children: React.ReactNode}) => (
				<GameStateProvider>{children}</GameStateProvider>
			);

			const {result} = renderHook(() => useGame(), {wrapper});

			expect(result.current.gameState).toBeNull();
			expect(result.current.isLoading).toBe(false);
		});

		it('initializes game with specified parameters', async () => {
			const wrapper = ({children}: {children: React.ReactNode}) => (
				<GameStateProvider>{children}</GameStateProvider>
			);

			const {result} = renderHook(() => useGame(), {wrapper});

			act(() => {
				result.current.initializeGame(4, 5);
			});

			await waitFor(() => {
				expect({
					radius: result.current.gameState?.getGrid().radius,
					pieceCount: result.current.gameState?.getPieces().length,
				}).toStrictEqual({radius: 4, pieceCount: 5});
			});
		});

		it('detects game won state', async () => {
			const wrapper = ({children}: {children: React.ReactNode}) => (
				<GameStateProvider>{children}</GameStateProvider>
			);

			const {result} = renderHook(() => useGame(), {wrapper});

			act(() => {
				result.current.initializeGame(4, 5);
			});

			await waitFor(() => {
				expect(result.current.gameState).not.toBeNull();
			});

			// Initially not won
			expect(result.current.isGameWon()).toBe(false);
		});

		it('restarts game creates new game state', async () => {
			const wrapper = ({children}: {children: React.ReactNode}) => (
				<GameStateProvider>{children}</GameStateProvider>
			);

			const {result} = renderHook(() => useGame(), {wrapper});

			act(() => {
				result.current.initializeGame(4, 5);
			});

			await waitFor(() => {
				expect(result.current.gameState).not.toBeNull();
			});

			act(() => {
				result.current.restart();
			});

			await waitFor(() => {
				expect({
					moveCount: result.current.gameState?.getMoveCount(),
					hintCount: result.current.gameState?.getHintCount(),
					radius: result.current.gameState?.getGrid().radius,
					pieceCount: result.current.gameState?.getPieces().length,
				}).toStrictEqual({moveCount: 0, hintCount: 0, radius: 4, pieceCount: 5});
			});
		});
	});

	describe('Integration test with all hooks', () => {
		it('initializes game and provides access through all hooks', async () => {
			const wrapper = ({children}: {children: React.ReactNode}) => (
				<GameStateProvider>{children}</GameStateProvider>
			);

			const {result} = renderHook(
				() => ({
					game: useGame(),
				}),
				{wrapper},
			);

			// Initially null
			expect(result.current.game.gameState).toBeNull();

			// Initialize game
			act(() => {
				result.current.game.initializeGame(4, 5);
			});

			await waitFor(() => {
				expect(result.current.game.gameState).not.toBeNull();
			});

			expect({
				radius: result.current.game.gameState?.getGrid().radius,
				pieceCount: result.current.game.gameState?.getPieces().length,
				moveCount: result.current.game.gameState?.getMoveCount(),
				hintCount: result.current.game.gameState?.getHintCount(),
			}).toStrictEqual({radius: 4, pieceCount: 5, moveCount: 0, hintCount: 0});
		});
	});

	describe('Context error handling', () => {
		it('throws error when hooks are used outside provider', () => {
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

			expect(() => {
				renderHook(() => useGame());
			}).toThrow('useGameState must be used within a GameStateProvider');

			consoleError.mockRestore();
		});
	});
});
