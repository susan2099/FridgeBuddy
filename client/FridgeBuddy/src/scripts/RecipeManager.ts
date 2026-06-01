import { load_fridge_data } from "./FridgeManager";
import { buildBackendUrl } from "../utils/backend";

const USER_ID = "test-user-1";

async function load_recipe_preferences() {
	const response = await fetch(buildBackendUrl(`/api/user/preferences?userId=${encodeURIComponent(USER_ID)}`));

	if(!response.ok) {
		console.error("couldn't load preferences");
		return {
			avoidAllergens: Array<string>(),
			preferences: Array<string>(),
		};
	}

	const result = await response.json();
	return {
		avoidAllergens: Array.isArray(result.data?.allergen) ? result.data.allergen : [],
		preferences: Array.isArray(result.data?.preference) ? result.data.preference : [],
	};
}

export async function request_recipe(additionalInfo: string) {
	const ingredients = await load_fridge_data() as Array<string>;
	const prefs = await load_recipe_preferences();

	console.log("generating a recipe...");

	// in-browser: localhost is OK
	// emulator: use a LAN IP
	const response = await fetch(buildBackendUrl("/api/recipe"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			"dish": additionalInfo.trim() == "" ? "anything" : additionalInfo.trim(),
			"servings": 1,
			"ingredients": ingredients,
			"avoidAllergens": prefs.avoidAllergens,
			"preferences": prefs.preferences,
		})
	});

	if(response.ok) {
		const data = await response.json();
		console.log(JSON.stringify(data.data));
		return data.data;
	} else {
		console.error("couldn't get a recipe");
		return false;
	}
}
