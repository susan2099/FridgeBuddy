import { load_firebase, add_firebase } from './DBManager';
import { buildBackendUrl } from '../utils/backend';
// import { type UserPhoto } from '../hooks/usePhotoGallery';

// temp
import { type fridgeItem } from '../Fridge';

function normalizeExpiryDate(expiry: fridgeItem["expiry"]) {
	if(!expiry) {
		return null;
	}

	if(expiry instanceof Date) {
		return expiry;
	}

	if(typeof expiry === "string") {
		const date = new Date(expiry);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	if(typeof expiry["_seconds"] === "number") {
		return new Date(expiry["_seconds"] * 1000);
	}

	return null;
}

export async function load_fridge_data() {
	// change this to userID variable later
	return await load_firebase("test-user-1");
}

export async function save_to_fridge(items: Array<fridgeItem>) {
	for (const item of items) {
		await add_firebase(
			"test-user-1",
			item.name,
			item.quantity,
			item.unit,
			normalizeExpiryDate(item.expiry),
			item.allergens
		);
	}

	// trigger a 'reload' of the page to visually update?
}

export async function receipt_scan(photo: Record<string, any>) {
	console.log("requesting receipt scan backend");

	const base64 = photo.webviewPath!.split(",")[1]; // strip header from dataurl
	const byteCharacters = atob(base64); // decode base64 to binary string
	const byteArray = Uint8Array.from(byteCharacters, c => c.charCodeAt(0));
	
	const blob = new Blob([byteArray], { type: "image/jpeg" });
	// console.log(blob.size);
	// console.log(blob.type);

	const formData = new FormData();
	formData.append("img", blob, "receipt.jpg");

	const result = await fetch(buildBackendUrl("/api/scanner/receipt"), {
		method: "POST",
		body: formData
	});

	const data = await result.json();
	console.log(data.data.items);
	return data.data.items;
}
