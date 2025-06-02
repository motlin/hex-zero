export function validateCustomInputs(): boolean {
	const radiusInput = document.getElementById('customRadius') as HTMLInputElement;
	const piecesInput = document.getElementById('customPieces') as HTMLInputElement;
	const errorDiv = document.getElementById('validationError') as HTMLElement;
	const startBtn = document.getElementById('customStartBtn') as HTMLButtonElement;

	const radius = parseInt(radiusInput.value);
	const pieces = parseInt(piecesInput.value);

	const errors: string[] = [];
	let isValid = true;

	if (isNaN(radius) || radius < 2 || radius > 8) {
		radiusInput.classList.add('invalid');
		if (isNaN(radius) || radiusInput.value === '') {
			errors.push('Radius must be a number between 2 and 8');
		} else if (radius < 2) {
			errors.push('Radius must be at least 2');
		} else if (radius > 8) {
			errors.push('Radius must be at most 8');
		}
		isValid = false;
	} else {
		radiusInput.classList.remove('invalid');
	}

	if (isNaN(pieces) || pieces < 3 || pieces > 15) {
		piecesInput.classList.add('invalid');
		if (isNaN(pieces) || piecesInput.value === '') {
			errors.push('Pieces must be a number between 3 and 15');
		} else if (pieces < 3) {
			errors.push('Pieces must be at least 3');
		} else if (pieces > 15) {
			errors.push('Pieces must be at most 15');
		}
		isValid = false;
	} else {
		piecesInput.classList.remove('invalid');
	}

	errorDiv.textContent = errors.join('. ');
	startBtn.disabled = !isValid;

	return isValid;
}
