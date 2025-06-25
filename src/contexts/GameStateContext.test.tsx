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
				expect(result.current.gameState).not.toBeNull();
				expect(result.current.gameState?.grid.radius).toBe(4);
				expect(result.current.gameState?.pieces).toHaveLength(5);
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
				// After restart, we should have a fresh game state
				expect(result.current.gameState).not.toBeNull();
				expect(result.current.gameState?.getMoveCount()).toBe(0);
				expect(result.current.gameState?.getHintCount()).toBe(0);
				expect(result.current.gameState?.grid.radius).toBe(4);
				expect(result.current.gameState?.pieces).toHaveLength(5);
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

			// Verify basic game state
			expect(result.current.game.gameState?.grid.radius).toBe(4);
			expect(result.current.game.gameState?.pieces).toHaveLength(5);
			expect(result.current.game.gameState?.getMoveCount()).toBe(0);
			expect(result.current.game.gameState?.getHintCount()).toBe(0);
		});
	});

	describe('Context error handling', () => {
		it('throws error when hooks are used outside provider', () => {
			// Mock console.error to avoid test output noise
			const originalError = console.error;
			console.error = vi.fn();

			expect(() => {
				renderHook(() => useGame());
			}).toThrow('useGameState must be used within a GameStateProvider');

			console.error = originalError;
		});
	});
});
