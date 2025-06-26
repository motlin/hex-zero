/**
 * Piece selection panel component
 * Displays available pieces for the player to choose and drag
 */

import React, {useState, useCallback, useRef} from 'react';
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
} from 'react-native';
import type {Piece} from '../state/SeptominoGenerator';
import {DraggablePiece} from './DraggablePiece';
import {useThemeContext} from '../context/ThemeContext';
import {usePieces} from '../hooks/usePieces';

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
	onPageChange,
	selectedPieceIndex,
	hexSize = 20,
}) => {
	const {theme} = useThemeContext();
	const scrollViewRef = useRef<ScrollView>(null);
	const [isDragging, setIsDragging] = useState(false);
	const {isPiecePlaced} = usePieces();

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

	const pieceSize = Math.min(screenWidth / (piecesPerPage + 1), 80);

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
					const isSelected = selectedPieceIndex === globalIndex;

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
								piece={piece}
								index={globalIndex}
								hexSize={hexSize}
								onDragStart={handleDragStart}
								onDragMove={onPieceDragMove}
								onDragEnd={handleDragEnd}
								isPlaced={isPlaced}
								disabled={isDragging && !isSelected}
							/>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

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
