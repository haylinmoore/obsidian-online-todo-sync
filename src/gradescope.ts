import { requestUrl, RequestUrlParam } from "obsidian";
import { Todo } from "./todo";

export const fetchTodos = async (course: string, token: string): Promise<Todo[]> => {
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

// No clue why it doens't work, but it doesn't, always getting 200 response from /login
export async function loginAndGetSignedToken(
	email: string,
	password: string
): Promise<string | null> {
	const initialResponse = await requestUrl("https://www.gradescope.com/");
	const initialResponseText = await initialResponse.text;
    console.log(initialResponse);
	// Parse response as dom
    const parser = new DOMParser();
    const doc = parser.parseFromString(initialResponseText, "text/html");
    // Get authenticity token
    const authToken = doc.querySelector("form[action='/login'] input[name='authenticity_token']")?.getAttribute("value");
	// _gradescope_session from cookie
	const sessionToken = (initialResponse.headers["set-cookie"] as unknown as string[]).
        filter((x) => x.startsWith("_gradescope_session"))[0]
        .split(";")[0].split("=")[1];
	if (!sessionToken) {
		throw new Error("Session token not found");
	}
	if (!authToken) {
		throw new Error("Authenticity token not found");
	}

	const loginData = {
		"utf8": "✓",
        "authenticity_token": authToken,
		"session[email]": email,
		"session[password]": password,
		"session[remember_me]": "0",
		"commit": "Log In",
		"session[remember_me_sso]": "0",
	};

	const loginRequest: RequestUrlParam = {
		url: "https://www.gradescope.com/login",
		headers: {
			Referer: "https://www.gradescope.com/",
			Cookie: `_gradescope_session=${sessionToken};`,
            Origin: "https://www.gradescope.com",
            "Content-Type": "application/x-www-form-urlencoded",
		},
		method: "POST",
		contentType: "application/x-www-form-urlencoded",
		body: new URLSearchParams(loginData).toString(),
	};

	const loginResponse = await requestUrl(loginRequest);
	console.log(loginRequest, loginResponse);
	if (loginResponse.status === 302) {
		const setCookieHeader = loginResponse.headers["set-cookie"];
		if (setCookieHeader) {
			const signedTokenRegex = /signed_token=([^;]+)/;
			const signedTokenMatch = signedTokenRegex.exec(setCookieHeader);
			if (signedTokenMatch) {
				return signedTokenMatch[1];
			}
		}
	}

	return null;
}
