import { requestUrl } from "obsidian";
import { Todo } from "../todo";

export const fetchTodos = async (course: string, settings: { [key: string]: string }): Promise<Todo[]> => {
    if (!settings["token"]) {
        throw new Error("Canvas token is not set in plugin config.");
    }

    const token = settings["token"];
    const baseUrl = settings["baseUrl"];
    if (!baseUrl) {
        throw new Error("Canvas base URL is not set in plugin config.");
    }

    // Fetch modules and include items in the response
    const courseModulesUrl = `${baseUrl}/api/v1/courses/${course}/modules?include[]=items&access_token=${token}`;
    const modulesResponse = await requestUrl({ url: courseModulesUrl, method: "GET" });
    const modules = modulesResponse.json;

    const todos: Todo[] = [];

    // Loop through each module to process assignments
    for (const module of modules) {
        if (!module.items) continue; // Skip modules without items

        // Loop through module items directly
        for (const item of module.items) {
            if (item.type !== "Assignment") continue;
            
            // Fetch assignment details (use item.url to get full details)
            const assignmentDetailsUrl = `${item.url}?access_token=${token}`;
            const assignmentDetailsResponse = await requestUrl({ url: assignmentDetailsUrl, method: "GET" });
            const assignmentDetails = assignmentDetailsResponse.json;

            if (!assignmentDetails.due_at) continue;  // Skip if no due date

            const name = assignmentDetails.name;
            const status = assignmentDetails.submission ? "x" : " ";
            const due = assignmentDetails.due_at.split("T")[0];  // Format date as YYYY-MM-DD

            todos.push({ name, status, due, finish: "" });
        }
    }

    return todos;
};

export const settings = () => {
    return {
        "token": {
            name: "Canvas Token",
            placeholder: "Enter your Canvas token",
        },
        "baseUrl": {
            name: "Canvas Base URL",
            placeholder: "Enter your Canvas base URL (e.g., https://canvas.institution.edu)",
        }
    };
};
