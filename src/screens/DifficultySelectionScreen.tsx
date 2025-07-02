import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal, SafeAreaView} from 'react-native';

interface DifficultyOption {
	name: string;
	radius: number;
	numPieces: number;
	description: string;
	recommended?: boolean;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
	{
		name: 'Easy',
		radius: 3,
		numPieces: 4,
		description: 'Small board (radius 3) with 4 pieces',
	},
	{
		name: 'Medium',
		radius: 3,
		numPieces: 6,
		description: 'Standard board (radius 3) with 6 pieces',
		recommended: true,
	},
	{
		name: 'Hard',
		radius: 3,
		numPieces: 8,
		description: 'Standard board (radius 3) with 8 pieces',
	},
	{
		name: 'Extreme',
		radius: 4,
		numPieces: 10,
		description: 'Large board (radius 4) with 10 pieces',
	},
	{
		name: 'Impossible',
		radius: 4,
		numPieces: 14,
		description: 'Large board (radius 4) with 14 pieces',
	},
];

interface DifficultySelectionScreenProps {
	onSelectDifficulty: (radius: number, numPieces: number) => void;
	onBackToMenu?: () => void;
}

export const DifficultySelectionScreen: React.FC<DifficultySelectionScreenProps> = ({
	onSelectDifficulty,
	onBackToMenu,
}) => {
	const [showCustom, setShowCustom] = useState(false);
	const [customRadius, setCustomRadius] = useState('4');
	const [customPieces, setCustomPieces] = useState('8');
	const [radiusError, setRadiusError] = useState('');
	const [piecesError, setPiecesError] = useState('');

	const validateCustomGame = () => {
		const radius = parseInt(customRadius);
		const pieces = parseInt(customPieces);
		let valid = true;

		if (isNaN(radius) || radius < 2 || radius > 8) {
			setRadiusError('Radius must be between 2 and 8');
			valid = false;
		} else {
			setRadiusError('');
		}

		if (isNaN(pieces) || pieces < 3 || pieces > 15) {
			setPiecesError('Pieces must be between 3 and 15');
			valid = false;
		} else {
			setPiecesError('');
		}

		if (valid) {
			onSelectDifficulty(radius, pieces);
			setShowCustom(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>HEX ZERO</Text>
				<Text style={styles.subtitle}>Select Difficulty</Text>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.difficultyGrid}>
					{DIFFICULTY_OPTIONS.map((option) => (
						<TouchableOpacity
							key={option.name}
							style={[styles.difficultyCard, option.recommended && styles.recommendedCard]}
							onPress={() => onSelectDifficulty(option.radius, option.numPieces)}
							activeOpacity={0.8}
						>
							{option.recommended && (
								<View style={styles.recommendedBadge}>
									<Text style={styles.recommendedText}>Recommended</Text>
								</View>
							)}
							<Text style={styles.difficultyName}>{option.name}</Text>
							<Text style={styles.difficultyDescription}>{option.description}</Text>
						</TouchableOpacity>
					))}
				</View>

				<View style={styles.customSection}>
					<TouchableOpacity
						style={styles.customButton}
						onPress={() => setShowCustom(true)}
						activeOpacity={0.8}
					>
						<Text style={styles.customButtonText}>Custom Game</Text>
					</TouchableOpacity>
				</View>

				{onBackToMenu && (
					<TouchableOpacity
						style={styles.backButton}
						onPress={onBackToMenu}
						activeOpacity={0.8}
					>
						<Text style={styles.backButtonText}>Back to Menu</Text>
					</TouchableOpacity>
				)}
			</ScrollView>

			<Modal
				visible={showCustom}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setShowCustom(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Custom Game</Text>

						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>Board Radius</Text>
							<TextInput
								style={[styles.input, radiusError ? styles.inputError : null]}
								value={customRadius}
								onChangeText={setCustomRadius}
								keyboardType="numeric"
								placeholder="2-8"
								placeholderTextColor="#666"
							/>
							{radiusError ? <Text style={styles.errorText}>{radiusError}</Text> : null}
						</View>

						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>Number of Pieces</Text>
							<TextInput
								style={[styles.input, piecesError ? styles.inputError : null]}
								value={customPieces}
								onChangeText={setCustomPieces}
								keyboardType="numeric"
								placeholder="3-15"
								placeholderTextColor="#666"
							/>
							{piecesError ? <Text style={styles.errorText}>{piecesError}</Text> : null}
						</View>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setShowCustom(false)}
							>
								<Text style={styles.cancelButtonText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButton, styles.startButton]}
								onPress={validateCustomGame}
							>
								<Text style={styles.startButtonText}>Start</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#1a3a52',
	},
	header: {
		alignItems: 'center',
		paddingVertical: 30,
	},
	title: {
		fontSize: 48,
		fontWeight: 'bold',
		color: '#f39c12',
		letterSpacing: 3,
		textShadowColor: 'rgba(0, 0, 0, 0.5)',
		textShadowOffset: {width: 2, height: 2},
		textShadowRadius: 5,
	},
	subtitle: {
		fontSize: 20,
		color: '#bdc3c7',
		marginTop: 10,
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 20,
	},
	difficultyGrid: {
		gap: 15,
	},
	difficultyCard: {
		backgroundColor: '#2c5282',
		borderRadius: 10,
		padding: 20,
		marginBottom: 15,
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 2},
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	recommendedCard: {
		borderWidth: 2,
		borderColor: '#f39c12',
	},
	recommendedBadge: {
		position: 'absolute',
		top: -10,
		right: 20,
		backgroundColor: '#f39c12',
		paddingHorizontal: 15,
		paddingVertical: 5,
		borderRadius: 12,
	},
	recommendedText: {
		color: '#1a3a52',
		fontSize: 12,
		fontWeight: 'bold',
	},
	difficultyName: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#ecf0f1',
		marginBottom: 5,
	},
	difficultyDescription: {
		fontSize: 14,
		color: '#bdc3c7',
	},
	customSection: {
		marginTop: 20,
		paddingTop: 20,
		borderTopWidth: 1,
		borderTopColor: '#2a5080',
	},
	customButton: {
		backgroundColor: '#e67e22',
		borderRadius: 10,
		padding: 15,
		alignItems: 'center',
	},
	customButtonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
	backButton: {
		marginTop: 20,
		padding: 15,
		alignItems: 'center',
	},
	backButtonText: {
		color: '#bdc3c7',
		fontSize: 16,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#2c5282',
		borderRadius: 15,
		padding: 30,
		width: '90%',
		maxWidth: 400,
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#f39c12',
		marginBottom: 20,
		textAlign: 'center',
	},
	inputGroup: {
		marginBottom: 20,
	},
	inputLabel: {
		fontSize: 16,
		color: '#ecf0f1',
		marginBottom: 8,
	},
	input: {
		backgroundColor: '#1a3a52',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		color: '#ecf0f1',
		borderWidth: 1,
		borderColor: '#3a5f8a',
	},
	inputError: {
		borderColor: '#e74c3c',
	},
	errorText: {
		color: '#e74c3c',
		fontSize: 12,
		marginTop: 5,
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 20,
	},
	modalButton: {
		flex: 1,
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
	},
	cancelButton: {
		backgroundColor: '#7f8c8d',
		marginRight: 10,
	},
	startButton: {
		backgroundColor: '#27ae60',
		marginLeft: 10,
	},
	cancelButtonText: {
		color: '#ecf0f1',
		fontSize: 16,
		fontWeight: 'bold',
	},
	startButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
