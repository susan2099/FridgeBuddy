import { load_firebase, add_firebase, update_firebase, remove_firebase } from './DBManager';
import { buildBackendUrl } from '../utils/backend';
// import { type UserPhoto } from '../hooks/usePhotoGallery';
import { TEST_USER } from './CONSTS';

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
	return await load_firebase(TEST_USER);
}

export async function delete_fridge_item(id:string) {
	return await remove_firebase(TEST_USER, id);
}

// delete ALL
export async function delete_fridge_data() {
	
}

export async function save_to_fridge(items: Array<fridgeItem>) {
	for (const item of items) {
		await add_firebase(
			TEST_USER,
			item.name,
			item.quantity,
			item.unit,
			normalizeExpiryDate(item.expiry),
			item.allergens
		);
	}
}

export async function update_fridge(item: fridgeItem) {
	await update_firebase(
		TEST_USER,
		item.id as string,
		item.name,
		item.quantity,
		item.unit,
		normalizeExpiryDate(item.expiry),
		item.allergens,
	);
}

export async function receipt_scan(photo: Record<string, any>) {
	console.log("requesting receipt scan backend");

	const base64 = photo.webviewPath!.split(",")[1]; // strip header from dataurl
	const byteCharacters = atob(base64); // decode base64 to binary string
	const byteArray = Uint8Array.from(byteCharacters, c => c.charCodeAt(0));
	
	const blob = new Blob([byteArray], { type: "image/jpeg" });

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

export async function barcode_scan(photo: Record<string, any>) {
	console.log("requesting barcode scan backend");

	const barcode = await detectBarcodeFromPhoto(photo);
	const result = await fetch(buildBackendUrl(`/api/scanner/barcode/${encodeURIComponent(barcode)}`));
	
	if(!result.ok) {
		const error = await result.json().catch(() => null);
		throw new Error(error?.error?.message || "Failed to fetch barcode product data.");
	}
	
	const data = await result.json();
	console.log("barcode: ", barcode);
	console.log("barcode scan result:", data.data);
	return data.data;
}

async function detectBarcodeFromPhoto(photo: Record<string, any>) {
	const BarcodeDetectorClass = (window as any).BarcodeDetector;
	if(!BarcodeDetectorClass) {
		throw new Error("Barcode scanning is not supported in this browser.");
	}

	const imageSrc = photo.webviewPath;
	if(!imageSrc) {
		throw new Error("Selected image is missing.");
	}

	const detector = new BarcodeDetectorClass({
		formats: [
			"ean_13",
			"ean_8",
			"upc_a",
			"upc_e",
			"code_128",
			"code_39",
			"codabar",
			"itf",
		],
	});
	const image = await loadImage(imageSrc);
	const barcodes = await detector.detect(image);
	const barcode = barcodes.find((result: Record<string, any>) => result.rawValue)?.rawValue;

	if(!barcode) {
		throw new Error("No barcode found in the selected image.");
	}

	return barcode;
}

function loadImage(src: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Failed to load selected image."));
		image.src = src;
	});
}
