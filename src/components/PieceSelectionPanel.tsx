/**
 * Piece selection panel component
 * Displays available pieces for the player to choose and drag
 */

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
	View,
	ScrollView,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	Text,
	LayoutAnimation,
	Platform,
	UIManager,
	Animated,
} from 'react-native';
import {GestureDetector, Gesture} from 'react-native-gesture-handler';
import type {Piece} from '../state/SeptominoGenerator';
import {DraggablePiece, type DraggablePieceRef} from './DraggablePiece';
import {useThemeContext} from '../context/ThemeContext';
import {usePieces} from '../hooks/usePieces';
import {useAdvancedGestures} from '../hooks/useAdvancedGestures';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PieceSelectionPanelProps {
	pieces: Piece[];
	currentPage: number;
	piecesPerPage: number;
	onPieceSelect?: (piece: Piece, index: number) => void;
	onPieceDragStart?: (piece: Piece, index: number) => void;
	onPieceDragMove?: (piece: Piece, x: number, y: number) => void;
	onPieceDragEnd?: (piece: Piece, x: number, y: number) => void;
	onInvalidPlacement?: (piece: Piece, index: number) => void;
	onPageChange?: (page: number) => void;
	selectedPieceIndex?: number | null;
	hexSize?: number;
}

const {width: screenWidth} = Dimensions.get('window');

export const PieceSelectionPanel: React.FC<PieceSelectionPanelProps> = ({
	pieces,
	currentPage,
	piecesPerPage,
	onPieceSelect,
	onPieceDragStart,
	onPieceDragMove,
	onPieceDragEnd,
	onInvalidPlacement,
	onPageChange,
	selectedPieceIndex,
	hexSize = 20,
}) => {
	const {theme} = useThemeContext();
	const scrollViewRef = useRef<ScrollView>(null);
	const [isDragging, setIsDragging] = useState(false);
	const {isPiecePlaced} = usePieces();
	const pieceRefs = useRef<Map<number, DraggablePieceRef>>(new Map());
	const [currentlySelectedIndex, setCurrentlySelectedIndex] = useState<number | null>(selectedPieceIndex ?? null);
	const longPressProgressBar = useRef(new Animated.Value(0)).current;

	// Calculate page data
	const totalPages = Math.ceil(pieces.length / piecesPerPage);
	const startIndex = currentPage * piecesPerPage;
	const endIndex = Math.min(startIndex + piecesPerPage, pieces.length);
	const currentPieces = pieces.slice(startIndex, endIndex);

	// Check if all pieces on current page are placed
	const allCurrentPiecesPlaced = currentPieces.every((_, index) => isPiecePlaced(startIndex + index));

	const handlePiecePress = useCallback(
		(piece: Piece, index: number) => {
			if (!isDragging && onPieceSelect && !isPiecePlaced(startIndex + index)) {
				LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
				onPieceSelect(piece, startIndex + index);
			}
		},
		[isDragging, onPieceSelect, isPiecePlaced, startIndex],
	);

	// Auto-advance to next page when all current pieces are placed
	useEffect(() => {
		if (allCurrentPiecesPlaced && currentPage < totalPages - 1 && onPageChange) {
			setTimeout(() => {
				LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
				onPageChange(currentPage + 1);
			}, 1000);
			// 1 second delay for user to see completion
		}
	}, [allCurrentPiecesPlaced, currentPage, totalPages, onPageChange]);

	const handleNextPage = useCallback(() => {
		if (currentPage < totalPages - 1 && onPageChange) {
			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
			onPageChange(currentPage + 1);
		}
	}, [currentPage, totalPages, onPageChange]);

	const handlePrevPage = useCallback(() => {
		if (currentPage > 0 && onPageChange) {
			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
			onPageChange(currentPage - 1);
		}
	}, [currentPage, onPageChange]);

	// Cycle through available pieces on long press
	const cycleThroughPieces = useCallback(() => {
		const availablePieces = currentPieces
			.map((_, index) => startIndex + index)
			.filter((index) => !isPiecePlaced(index));

		if (availablePieces.length === 0) return;

		let nextIndex;
		if (currentlySelectedIndex === null || !availablePieces.includes(currentlySelectedIndex)) {
			nextIndex = availablePieces[0];
		} else {
			const currentIndexInAvailable = availablePieces.indexOf(currentlySelectedIndex);
			nextIndex = availablePieces[(currentIndexInAvailable + 1) % availablePieces.length];
		}

		setCurrentlySelectedIndex(nextIndex);
		if (onPieceSelect && pieces[nextIndex]) {
			onPieceSelect(pieces[nextIndex], nextIndex);
		}
	}, [currentPieces, startIndex, isPiecePlaced, currentlySelectedIndex, onPieceSelect, pieces]);

	// Advanced gestures setup
	const {setDragState, twoFingerSwipeGesture, longPressCycleGesture} = useAdvancedGestures({
		onTwoFingerSwipeLeft: handleNextPage,
		onTwoFingerSwipeRight: handlePrevPage,
		onLongPressCycle: cycleThroughPieces,
		onLongPressHold: (progress) => {
			// Animate progress bar
			Animated.timing(longPressProgressBar, {
				toValue: progress,
				duration: 50,
				useNativeDriver: false,
			}).start();
		},
		enablePanWhileDragging: false,
	});

	// Update drag state when dragging starts/ends
	useEffect(() => {
		setDragState(isDragging);
	}, [isDragging, setDragState]);

	// Sync selected index with parent
	useEffect(() => {
		if (selectedPieceIndex !== undefined) {
			setCurrentlySelectedIndex(selectedPieceIndex);
		}
	}, [selectedPieceIndex]);

	const handleDragStart = useCallback(
		(piece: Piece, index: number) => {
			setIsDragging(true);
			if (onPieceDragStart) {
				onPieceDragStart(piece, startIndex + index);
			}
		},
		[onPieceDragStart, startIndex],
	);

	const handleDragEnd = useCallback(
		(piece: Piece, x: number, y: number) => {
			setIsDragging(false);
			if (onPieceDragEnd) {
				onPieceDragEnd(piece, x, y);
			}
		},
		[onPieceDragEnd],
	);

	const handleInvalidPlacement = useCallback(
		(piece: Piece) => {
			if (onInvalidPlacement) {
				const pieceIndex = pieces.findIndex((p) => p === piece);
				if (pieceIndex !== -1) {
					onInvalidPlacement(piece, pieceIndex);
				}
			}
		},
		[onInvalidPlacement, pieces],
	);

	// Handle swipe gestures for page navigation
	const handleSwipeGesture = useCallback(
		(event: any) => {
			if (!isDragging) {
				const {translationX, velocityX} = event;
				const threshold = 50;
				const velocityThreshold = 500;

				// Swipe right (show previous page)
				if ((translationX > threshold || velocityX > velocityThreshold) && currentPage > 0) {
					handlePrevPage();
				}
				// Swipe left (show next page)
				else if (
					(translationX < -threshold || velocityX < -velocityThreshold) &&
					currentPage < totalPages - 1
				) {
					handleNextPage();
				}
			}
		},
		[isDragging, currentPage, totalPages, handlePrevPage, handleNextPage],
	);

	// Function to trigger shake animation for a specific piece
	// This will be used when we integrate with invalid placement feedback
	// @ts-expect-error - will be used later for shake animation integration
	const _triggerPieceShake = useCallback((pieceIndex: number) => {
		const pieceRef = pieceRefs.current.get(pieceIndex);
		if (pieceRef) {
			pieceRef.triggerShakeAnimation();
		}
	}, []);

	const pieceSize = Math.min(screenWidth / (piecesPerPage + 1), 80);

	// Combine gestures
	const singleFingerSwipeGesture = Gesture.Pan().onEnd(handleSwipeGesture).enabled(!isDragging);

	const combinedGesture = Gesture.Race(twoFingerSwipeGesture, longPressCycleGesture, singleFingerSwipeGesture);

	return (
		<View style={[styles.container, {backgroundColor: theme.colors.surface}]}>
			{/* Page Navigation */}
			{currentPage > 0 && (
				<TouchableOpacity
					style={[styles.navButton, styles.prevButton]}
					onPress={handlePrevPage}
					activeOpacity={0.7}
				>
					<Text style={[styles.navButtonText, {color: theme.colors.text}]}>‹</Text>
				</TouchableOpacity>
			)}

			{/* Swipeable Pieces Container with Advanced Gestures */}
			<GestureDetector gesture={combinedGesture}>
				<View style={styles.swipeableContainer}>
					{/* Long Press Progress Indicator */}
					<Animated.View
						style={[
							styles.longPressProgressBar,
							{
								backgroundColor: theme.colors.burstColor,
								width: longPressProgressBar.interpolate({
									inputRange: [0, 1],
									outputRange: ['0%', '100%'],
								}),
							},
						]}
					/>

					{/* Pieces ScrollView */}
					<ScrollView
						ref={scrollViewRef}
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.scrollContent}
						scrollEnabled={!isDragging}
					>
						{currentPieces.map((piece, index) => {
							const globalIndex = startIndex + index;
							const isPlaced = isPiecePlaced(globalIndex);
							const isSelected = currentlySelectedIndex === globalIndex;

							return (
								<TouchableOpacity
									key={globalIndex}
									style={[
										styles.pieceWrapper,
										isSelected && styles.selectedPiece,
										isPlaced && styles.placedPiece,
										{
											width: pieceSize,
											height: pieceSize,
											borderColor: isSelected ? theme.colors.selectionColor : 'transparent',
										},
									]}
									onPress={() => handlePiecePress(piece, index)}
									activeOpacity={0.8}
									disabled={isPlaced}
								>
									<DraggablePiece
										ref={(ref) => {
											if (ref) {
												pieceRefs.current.set(globalIndex, ref);
											} else {
												pieceRefs.current.delete(globalIndex);
											}
										}}
										piece={piece}
										index={globalIndex}
										hexSize={hexSize}
										onDragStart={handleDragStart}
										onDragMove={onPieceDragMove}
										onDragEnd={handleDragEnd}
										onInvalidPlacement={handleInvalidPlacement}
										isPlaced={isPlaced}
										disabled={isDragging && !isSelected}
									/>
								</TouchableOpacity>
							);
						})}
					</ScrollView>

					{/* Page Indicator */}
					{totalPages > 1 && (
						<View style={styles.pageIndicator}>
							{Array.from({length: totalPages}, (_, index) => (
								<View
									key={index}
									style={[
										styles.pageIndicatorDot,
										{
											backgroundColor:
												index === currentPage ? theme.colors.text : theme.colors.textSecondary,
										},
									]}
								/>
							))}
						</View>
					)}
				</View>
			</GestureDetector>

			{/* Next Page or More Pieces Button */}
			{(currentPage < totalPages - 1 || allCurrentPiecesPlaced) && (
				<TouchableOpacity
					style={[
						styles.navButton,
						styles.nextButton,
						allCurrentPiecesPlaced && styles.morePiecesButton,
						{backgroundColor: allCurrentPiecesPlaced ? theme.colors.burstColor : 'transparent'},
					]}
					onPress={handleNextPage}
					activeOpacity={0.7}
				>
					<Text
						style={[
							styles.navButtonText,
							allCurrentPiecesPlaced && styles.morePiecesText,
							{color: allCurrentPiecesPlaced ? theme.colors.surface : theme.colors.text},
						]}
					>
						{allCurrentPiecesPlaced ? 'More' : '›'}
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 5,
	},
	swipeableContainer: {
		flex: 1,
		alignItems: 'center',
		position: 'relative',
	},
	longPressProgressBar: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: 2,
		zIndex: 10,
	},
	scrollContent: {
		alignItems: 'center',
		paddingHorizontal: 10,
	},
	pieceWrapper: {
		marginHorizontal: 5,
		borderRadius: 8,
		borderWidth: 2,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
	},
	selectedPiece: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	placedPiece: {
		opacity: 0.3,
	},
	pageIndicator: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 8,
		gap: 6,
	},
	pageIndicatorDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		opacity: 0.6,
	},
	navButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 20,
		marginHorizontal: 5,
	},
	prevButton: {
		marginRight: 5,
	},
	nextButton: {
		marginLeft: 5,
	},
	morePiecesButton: {
		width: 60,
		paddingHorizontal: 10,
		borderRadius: 15,
	},
	navButtonText: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	morePiecesText: {
		fontSize: 14,
		fontWeight: 'bold',
	},
});
