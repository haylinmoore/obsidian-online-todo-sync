export type Course = {
	source: string;
	name: string;
	id: string;
	filters: string[];
    toString: () => string;
};

export const extract = (s: string): Course => {
	const parts = s.split(";");
	if (parts.length < 5) {
		throw new Error("Invalid input string for course extraction.");
	}

	const source = parts[1];
	const name = parts[2];
	const id = parts[3];

	let filters: string[] = [];
	try {
		filters = JSON.parse(parts[4]);
	} catch (error) {
		console.error("Error parsing filters array:", error);
	}

	return {
		name,
		source,
		id,
		filters,
        toString: function() {
            return `Import;${this.source};${this.name};${this.id};${JSON.stringify(this.filters)};`
        }

	};
};