import { load_fridge_data } from "./FridgeManager";
import { type Pref, load_prefs } from "./PrefManager";
import { buildBackendUrl } from "../utils/backend";

export async function request_recipe(additionalInfo: string) {
	const ingredients = await load_fridge_data() as Array<string>;
	const prefs = await load_prefs() as Record<string, any>;

	prefs["restrictions"].forEach((key:Pref, index:number) => {
		prefs["restrictions"][index] = key.text;
	});
	prefs["preferences"].forEach((key:Pref, index:number) => {
		prefs["preferences"][index] = key.text;
	});

	console.log("generating a recipe...");

	// in-browser: localhost is OK
	// emulator: use a LAN IP
	const response = await fetch(buildBackendUrl("/api/recipe"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			"dish": additionalInfo,
			"servings": 1,
			"ingredients": ingredients,
			"avoidAllergens": prefs["restrictions"],
			"preferences": prefs["preferences"],
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

