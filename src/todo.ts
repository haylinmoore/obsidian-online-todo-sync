export type Todo = {
	name: string;
	status: string;
	due: string;
	finish: string;
};

export const stringToTodo = (todo: string): Todo => {
	const statusMatch = todo.match(/^\s*-\s*\[(.)\]\s*/);
	const status = statusMatch ? statusMatch[1] : "";

	const dueMatch = todo.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
	const due = dueMatch ? dueMatch[1] : "";

	const finishMatch = todo.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
	const finish = finishMatch ? finishMatch[1] : "";

	const name = todo
		.replace(/^\s*-\s*\[.?\]\s*/, "")
		.replace(/📅\s*\d{4}-\d{2}-\d{2}/, "")
		.replace(/✅\s*\d{4}-\d{2}-\d{2}/, "")
		.trim();

	return {
		name,
		status,
		due,
		finish,
	};
};

export const todoToString = (todo: Todo): string => {
	return (
		`- [${todo.status}] ${todo.name}` +
		(todo.due ? ` 📅 ${todo.due}` : "") +
		(todo.finish ? ` ✅ ${todo.finish}` : "")
	);
};

export const sortByDueDate = (todos: Todo[]): Todo[] => {
	return todos.sort((a, b) => {
		// If the due dates are equal, the order remains unchanged
		if (a.due === b.due) {
			return 0;
		}

		// If one of the due dates is missing, the item with a due date comes first
		if (!a.due) {
			return 1;
		}
		if (!b.due) {
			return -1;
		}

		// Compare the due dates as strings
		return a.due.localeCompare(b.due);
	});
};