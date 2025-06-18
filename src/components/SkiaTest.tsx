import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {Canvas, Circle, Group} from '@shopify/react-native-skia';

export const SkiaTest: React.FC = () => {
	const width = 256;
	const height = 256;
	const r = width * 0.33;

	return (
		<View style={styles.container}>
			<Text style={styles.title}>React Native Skia Test</Text>
			<Canvas style={styles.canvas}>
				<Group blendMode="multiply">
					<Circle
						cx={r}
						cy={r}
						r={r}
						color="cyan"
					/>
					<Circle
						cx={width - r}
						cy={r}
						r={r}
						color="magenta"
					/>
					<Circle
						cx={width / 2}
						cy={height - r}
						r={r}
						color="yellow"
					/>
				</Group>
			</Canvas>
			<Text style={styles.description}>If you see three overlapping circles above, Skia is working!</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	canvas: {
		width: 256,
		height: 256,
		backgroundColor: '#f0f0f0',
		borderRadius: 8,
	},
	description: {
		marginTop: 20,
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
		paddingHorizontal: 20,
	},
});
