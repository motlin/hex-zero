type ElementConstructor<T extends Element> = new () => T;

export function getRequiredElementById<T extends Element>(id: string, type: ElementConstructor<T>): T {
	const element = document.getElementById(id);
	if (element === null) {
		throw new Error(`Element with id "${id}" not found`);
	}
	if (!(element instanceof type)) {
		throw new Error(`Element with id "${id}" is not a ${type.name}`);
	}
	return element;
}

export function getElementByIdOrNull<T extends Element>(id: string, type: ElementConstructor<T>): T | null {
	const element = document.getElementById(id);
	if (element === null) {
		return null;
	}
	if (!(element instanceof type)) {
		return null;
	}
	return element;
}
