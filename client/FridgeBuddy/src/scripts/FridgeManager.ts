import { load_firebase, add_firebase } from './DBManager';
// import { type UserPhoto } from '../hooks/usePhotoGallery';

// temp
import { type fridgeItem } from '../Fridge';

export async function load_fridge_data() {
	// change this to userID variable later
	return await load_firebase("test-user-1");
}

export async function save_to_fridge(items: Array<fridgeItem>) {
	for (const item of items) {
		add_firebase(
			"test-user-1",
			item.name,
			item.quantity,
			item.unit,
			item.expiry,
			item.allergens
		);
	}

	// trigger a 'reload' of the page to visually update?
}

export async function receipt_scan(photo: Record<string, any>) {
	console.log("requesting receipt scan backend");
	const response = await fetch(photo.webviewPath!);
	const blob = await response.blob();
	
	const formData = new FormData();
	formData.append("img", blob, "receipt.jpg");

	const result = await fetch("http://localhost:4000/api/scanner/receipt", {
		method: "POST",
		body: formData
	});

	const data = await result.json();
	console.log(data);
	return data;
}