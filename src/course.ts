export type Course = {
	name: string;
	id: string;
	filters: string[];
    toString: () => string;
};

export const extract = (s: string): Course => {
	const parts = s.split(";");
	if (parts.length < 4) {
		throw new Error("Invalid input string for course extraction.");
	}

	const name = parts[1];
	const id = parts[2];

	let filters: string[] = [];
	try {
		filters = JSON.parse(parts[3]);
	} catch (error) {
		console.error("Error parsing filters array:", error);
	}

	return {
		name,
		id,
		filters,
        toString: function() {
            return `GSImport;${this.name};${this.id};${JSON.stringify(this.filters)};`
        }

	};
};