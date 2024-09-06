import { requestUrl, RequestUrlParam } from "obsidian";
import { Todo } from "../todo";

export const fetchTodos = async (course: string, settings: {[key: string]: string}): Promise<Todo[]> => {
	if (!settings["token"]) {
		throw new Error("Gradescope token is not set in plugin config.");
	}
	
	const token = settings["token"];
	const params: RequestUrlParam = {
		url: `https://www.gradescope.com/courses/${course}`,
		method: "GET",
		headers: {
			accept: "text/html",
			cookie: `signed_token=${token}`,
		},
	};

	const response = await requestUrl(params);
    // If body contains "Log In | Gradescope", then we are not logged in
    if (response.text.includes("Log In | Gradescope")) {
        throw new Error("Not logged in to Gradescope.");
    }
	// take response text and parse it into a DOM
	const parser = new DOMParser();
	const doc = parser.parseFromString(response.text, "text/html");

	const todos = Array.from(
		doc.querySelectorAll("#assignments-student-table > tbody > tr")
	).map((e) => {
		const name = e.children[0].getText().trim();
		const dueElm = e.children[2].querySelector(
			".submissionTimeChart--dueDate"
		);
		if (dueElm == null) {
			return "";
		}
		const status =
			e.querySelector(".submissionStatus-complete") != null
				? "x"
				: e.querySelector(".submissionStatus--score") != null
				? "x"
				: " ";
		const due = dueElm.getAttribute("datetime")?.split(" ")[0];
		return dueElm == null ? null : { name, status, due, finish: "" };
	});
	return todos.filter((x) => x != null).filter((x) => x != "") as Todo[];
};

export const settings = () => {
	return {
		"token": {
			name: "Gradescope Token",
			placeholder: "Enter your Gradescope token",
		}
	}
}