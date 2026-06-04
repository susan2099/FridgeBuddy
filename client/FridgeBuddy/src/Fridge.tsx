import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { load_fridge_data, save_to_fridge, update_fridge, receipt_scan, barcode_scan, delete_fridge_item } from './scripts/FridgeManager';
import { usePhotoGallery } from './hooks/usePhotoGallery';
import { sendTestNotification } from './fcm.ts';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import './Fridge.css';

type ManualInputType = "Add" | "Update";

export type fridgeItem = {
	id: string | null,
	name: string,
	quantity: number,
	unit: string,
	expiry: Date | string | Record<string, any> | null,
	allergens: Array<string>,
	createdAt: Date,
}

const EXPIRY_ALERT_WINDOW_DAYS = 20;
const DEMO_NOTIFICATION_DELAY_MS = 5000;

function buildAllergenFields(allergens: Array<string> = []) {
	return [...allergens];
}

function sleep(ms: number) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function getExpiryDate(expiry: fridgeItem["expiry"] | string | null | undefined) {
	if (!expiry) {
		return null;
	}

	if (typeof expiry === "string") {
		const parsedDate = new Date(expiry);
		return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
	}

	if (expiry instanceof Date) {
		return Number.isNaN(expiry.getTime()) ? null : expiry;
	}

	if (typeof expiry["_seconds"] === "number") {
		return new Date(expiry["_seconds"] * 1000);
	}

	return null;
}

function formatExpiryDate(expiry: fridgeItem["expiry"]) {
	const expiryDate = getExpiryDate(expiry);
	if (!expiryDate) {
		return "";
	}

	const year = expiryDate.getUTCFullYear();
	const month = String(expiryDate.getUTCMonth() + 1).padStart(2, "0");
	const day = String(expiryDate.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

// type ReceiptScanFridgeItem = {
// 	name: string,
// 	quantity: number,
// 	unit: string,
// }

export default function Fridge() {
	const { photos, addPhotoFromGallery, clearPhotos } = usePhotoGallery();
	const [isVisible, setVisibility] = useState(false);
	const [manualInputVisible, setManualInputVisibility] = useState(false);
	const [manualInputType, setManualInputType] = useState<ManualInputType>("Add");
	const [loading, setLoading] = useState(false);

	const [fridgeData, setFridgeData] = useState(Array<fridgeItem>());
	const [formData, setFormData] = useState<fridgeItem>({
		id: null,
		name: "",
		quantity: 0,
		unit: "",
		expiry: "",
		allergens: Array<string>(),
		createdAt: new Date(),
	});
	const [allergenFields, setAllergenFields] = useState<Array<string>>([]);

	const [receiptScanResults, setReceiptScanResults] = useState(Array<fridgeItem>());

	useEffect(
		() => {
			async function init() {
				setLoading(true);
				setFridgeData(await load_fridge_data() as Array<fridgeItem>);
				setLoading(false);
			}
			init();
		}, []
	);

	function toggleImagePanel() {
		setVisibility(prev => !prev);
	}

	async function onSubmitManualEntry(event:any, itemId: string | null) {
		event.preventDefault();

		const allergens = allergenFields
			.map((field) => field.trim())
			.filter((value) => value !== "");

		const fridgeIng = [{
			id: itemId,
			name: formData.name,
			quantity: parseFloat(formData.quantity as unknown as string),
			unit: (formData.unit !== "") ? formData.unit : null,
			allergens,
			expiry: formData.expiry,
			createdAt: new Date(),
		}] as unknown as Array<fridgeItem>;

		try {
			if (manualInputType === ("Add" as ManualInputType)) {
				await save_to_fridge(fridgeIng);
			} else {
				await update_fridge(fridgeIng[0]);
			}
			setFridgeData(await load_fridge_data() as Array<fridgeItem>);
			setManualInputVisibility(false);

			// remove the old inputs
			setFormData({
				id: "",
				name: "",
				quantity: 0,
				unit: "",
				expiry: "",
				allergens: Array<string>(),
				createdAt: new Date(),
			});
			setAllergenFields([]);
		} catch (error) {
			console.error("Failed to save fridge item:", error);
		}
	}

	async function handleCancelManualEntry() {
		setManualInputVisibility(false);
		setFormData({
			id:"",
			name:"", 
			quantity:0,
			unit:"",
			expiry:"",
			allergens:Array<string>(),
			createdAt:new Date(),
		});
		setAllergenFields([]);
	}

	async function handleEditFridgeItem(itemId: string) {
		event?.preventDefault();

		// find item
		const item = fridgeData.filter((fridgeItem) => fridgeItem.id == itemId)[0];

		setManualInputType("Update" as ManualInputType);
		setFormData({
			"id": itemId,
			"name": item.name,
			"quantity":item.quantity,
			"unit":item.unit,
			"expiry":formatExpiryDate(item.expiry),
			"allergens":item.allergens,
		} as fridgeItem);
		setAllergenFields(buildAllergenFields(item.allergens));
		
		setManualInputVisibility(true);
	}

	async function handleDeleteFridgeItem(item: fridgeItem) {
		const confirmed = window.confirm(`Delete ${item.name} from your fridge?`);
		if (!confirmed) {
			return;
		}

		try {
			await delete_fridge_item(item.id as string);
			setFridgeData(await load_fridge_data() as Array<fridgeItem>);
		} catch (error) {
			console.error("Failed to delete fridge item:", error);
		}
	}

	function handleManualInputFormChange(event: any) {
		const { name, value } = event.target;
		const sanitizedValue = name === "unit" ? value.replace(/[^A-Za-z]/g, "") : value;
		setFormData((prevFormData) => ({... prevFormData, [name]: sanitizedValue}));
	}

	function handleAllergenFieldChange(index:number, value:string) {
		setAllergenFields(prev => prev.map((field, i) => 
			i === index ? value : field
		));
	}

	function handleAddAllergenField() {
		setAllergenFields(prev => [...prev, ""]);
	}

	function handleRemoveAllergenField(index:number) {
		setAllergenFields(prev => prev.filter((_, i) => i !== index));
	}

	function handleReceiptScanInputFormChange(index: number, field: keyof fridgeItem, value: any) {
		setReceiptScanResults(prev => prev.map((item, i) =>
			i === index ? { ...item, [field]: value } : item
		));
	}

	function handleReceiptScanAllergenFieldChange(itemIndex:number, allergenIndex:number, value:string) {
		setReceiptScanResults(prev => prev.map((item, i) => {
			if(i !== itemIndex) {
				return item;
			}

			const allergens = Array.isArray(item.allergens) ? item.allergens : [];
			return {
				...item,
				allergens: allergens.map((allergen, j) => 
					j === allergenIndex ? value : allergen
				),
			};
		}));
	}

	function handleAddReceiptScanAllergenField(itemIndex:number) {
		setReceiptScanResults(prev => prev.map((item, i) => {
			if(i !== itemIndex) {
				return item;
			}

			const allergens = Array.isArray(item.allergens) ? item.allergens : [];
			return {
				...item,
				allergens: [...allergens, ""],
			};
		}));
	}

	function handleRemoveReceiptScanAllergenField(itemIndex:number, allergenIndex:number) {
		setReceiptScanResults(prev => prev.map((item, i) => {
			if(i !== itemIndex) {
				return item;
			}

			const allergens = Array.isArray(item.allergens) ? item.allergens : [];
			return {
				...item,
				allergens: allergens.filter((_, j) => j !== allergenIndex),
			};
		}));
	}

	function handleReceiptScanResults(results: Array<Record<string, any>>) {
		// allergens: Array [], auto_applied: true, createdAt: null, expiry: null, id: null, name: "sugar", quantity: 1, raw_name: "ST # OP # SUGAR $", unit: "", userId: null
		const fridgeItemResults = results.map((result) => (
			{
				name: result.name,
				quantity: result.quantity,
				unit: result.unit,
				expiry: result.expiry,
				allergens: Array.isArray(result.allergens) ? result.allergens : [],
				createdAt: result.createdAt
			} as fridgeItem
		));

		setReceiptScanResults(fridgeItemResults);
	}

	function handleBarcodeScanResult(result: Record<string, any>) {
		handleReceiptScanResults([result]);
	}

	async function handleAddScanResults() {
		const items = receiptScanResults.map((item) => ({
			...item,
			quantity: parseFloat(item.quantity as unknown as string),
			unit: item.unit !== "" ? item.unit : null,
			allergens: item.allergens
				.map((allergen) => allergen.trim())
				.filter((allergen) => allergen !== ""),
		})) as Array<fridgeItem>;

		try {
			await save_to_fridge(items);
			setFridgeData(await load_fridge_data() as Array<fridgeItem>);
			toggleImagePanel();
			clearPhotos();
			setReceiptScanResults([]);
		} catch (error) {
			console.error("Failed to save scanned fridge items:", error);
			alert(error instanceof Error ? error.message : "Failed to save scanned fridge items.");
		}
	}

	async function handleGetExpiryAlert() {
		await sleep(DEMO_NOTIFICATION_DELAY_MS);

		const data = await load_fridge_data();

		if (!Array.isArray(data)) {
			alert("Could not load fridge items for expiry alerts.");
			return;
		}

		const now = Date.now();
		const alertWindowEnd = now + EXPIRY_ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
		const expiringItems = data.filter((item) => {
			const expiryDate = getExpiryDate(item.expiry);
			if (!expiryDate) {
				return false;
			}

			const expiryTime = expiryDate.getTime();
			return expiryTime >= now && expiryTime <= alertWindowEnd;
		});

		const body = expiringItems.length
			? `${expiringItems.map((item) => item.name).join(", ")} will expire within ${EXPIRY_ALERT_WINDOW_DAYS} days.`
			: `No fridge items will expire within ${EXPIRY_ALERT_WINDOW_DAYS} days.`;

		await sendTestNotification("FridgeBuddy Expiry Alert", body);
	}

	return (
		<div className="fridge-page">
			<div className="fridge-shell">
				<h1 className="fridge-title">Your Fridge</h1>
				<div className="fridge-table-frame">
					<div className="fridge-table-scroll">
						<table id="fridgeTable" className="fridge-table">
							<colgroup>
								<col className="fridge-col-actions" />
								<col className="fridge-col-item" />
								<col className="fridge-col-quantity" />
								<col className="fridge-col-allergens" />
								<col className="fridge-col-expiry" />
							</colgroup>
							<thead>
								<tr>
									<th aria-label="Actions"></th>
									<th>Item</th>
									<th>Quantity</th>
									<th>Allergen(s)</th>
									<th>Expiration Date</th>
								</tr>
							</thead>
							<tbody>
								{fridgeData.map((item: fridgeItem) => (
									<tr key={item.id as string}>
										<td className="fridge-actions-cell">
											<button
												className="fridge-icon-button fridge-edit-button"
												type="button"
												aria-label={`Edit ${item.name}`}
												onClick={() => { handleEditFridgeItem(item.id as string); }}
											></button>

											<button
												className="fridge-icon-button fridge-delete-button"
												type="button"
												aria-label={`Delete ${item.name}`}
												onClick={() => { handleDeleteFridgeItem(item); }}
											></button>
										</td>
										<td>{item.name}</td>
										<td className="fridge-centered-cell">{item.quantity} {item.unit}</td>
										<td className="fridge-centered-cell">
											{item.allergens.map((allergen, index) => (
												<div key={`${item.id}-allergen-${index}`}>{allergen}</div>
											))}
										</td>
										<td className="fridge-centered-cell">{formatExpiryDate(item.expiry)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<hr className="fridge-divider" />

				<div id="buttons" className="fridge-button-grid">
					<button
						className="fridge-button fridge-button-wide"
						type="button"
						onClick={() => {
							setManualInputType("Add" as ManualInputType);
							setAllergenFields([]);
							setManualInputVisibility(true);
						}}
					>Add (+) (Manual)</button>

					<button
						className="fridge-button"
						type="button"
						onClick={() => {

						}}
					>Scan receipt (+) (From camera)</button>

					<button
						className="fridge-button"
						type="button"
						onClick={async () => {
							const savedImage = await addPhotoFromGallery();
							toggleImagePanel();
							const results = await receipt_scan(savedImage);
							handleReceiptScanResults(results);
						}}
					>Scan receipt (+) (From gallery)</button>

					<button
						className="fridge-button"
						type="button"
						onClick={() => {

						}}
					>Scan barcode (+) (From camera)</button>

					<button
						className="fridge-button"
						type="button"
						onClick={async () => {
							const savedImage = await addPhotoFromGallery();
							toggleImagePanel();
							const result = await barcode_scan(savedImage);
							handleBarcodeScanResult(result);
						}}
					>Scan barcode (+) (From gallery)</button>

					<button
						className="fridge-button"
						type="button"
						onClick={handleGetExpiryAlert}
					>Get expiry alert (Demo only)</button>

					<Link to="/" className="fridge-button-link">
						<button className="fridge-button" type="button">Back</button>
					</Link>
				</div>
			</div>

			<div id="photoUploader" className={`fridge-modal fridge-photo-modal${isVisible ? "" : " fridge-hidden"}`}>
				<p className="fridge-modal-title"><b>Adding Items</b></p>

				<div id="photoAndResultHolder" className="fridge-photo-results">
					{photos.map((photo, index) => (
						<div id={`photo${index}`} className="fridge-photo-preview" key={`${photo.webviewPath}-${index}`}>
							<img src={photo.webviewPath} alt="Selected receipt or barcode" />
						</div>
					))}

					<div id="receiptScannerResults" className="fridge-scan-results">
						<form id="receiptScanResultsForm" className="fridge-form">
							{receiptScanResults.map((item, index) => (
								<div key={index} className="fridge-scan-item">
									<label>Item Name</label>
									<input
										type="text" name="name" value={item.name}
										onChange={(e) => { handleReceiptScanInputFormChange(index, "name", e.target.value); }}>
									</input>

									<label>Quantity</label>
									<div className="fridge-inline-fields">
										<input
											type="number" name="quantity" value={item.quantity}
											onChange={(e) => { handleReceiptScanInputFormChange(index, "quantity", e.target.value); }}>
										</input>
										<input
											type="text" name="unit" value={item.unit}
											onChange={(e) => { handleReceiptScanInputFormChange(index, "unit", e.target.value); }}
											placeholder="unit">
										</input>
									</div>

									<label>Expiration Date</label>
									<input
										type="date" name="expiry" value={formatExpiryDate(item.expiry)}
										onChange={(e) => { handleReceiptScanInputFormChange(index, "expiry", e.target.value); }}>
									</input>

									<div className="fridge-form-label-row">
										<label>Allergens</label>
										<button
											type="button"
											className="fridge-small-button"
											onClick={() => { handleAddReceiptScanAllergenField(index); }}
										>+</button>
									</div>
									{item.allergens.map((allergen, allergenIndex) => (
										<div className="fridge-inline-fields" key={allergenIndex}>
											<button
												type="button"
												className="fridge-small-button"
												onClick={() => { handleRemoveReceiptScanAllergenField(index, allergenIndex); }}
											>-</button>
											<input
												type="text"
												value={allergen}
												placeholder="none"
												onChange={(event) => { handleReceiptScanAllergenFieldChange(index, allergenIndex, event.target.value); }}
											></input>
										</div>
									))}
								</div>
							))}
						</form>
					</div>
				</div>

				<div className="fridge-modal-actions">
					<button
						type="button"
						onClick={() => {
							clearPhotos();
							toggleImagePanel();
							setReceiptScanResults([]);
						}}
					>Cancel</button>
					<button type="button" onClick={handleAddScanResults}>Add</button>
				</div>
			</div>

			<div id="loadingSpinner" className={`fridge-modal fridge-loading-modal${loading ? "" : " fridge-hidden"}`}>
				<LoadingSpinner visible={true}>
				</LoadingSpinner>
			</div>

			<div id="manualInsert" className={`fridge-modal fridge-manual-modal${manualInputVisible ? "" : " fridge-hidden"}`}>
				<form id="manualInsertForm" className="fridge-form" onSubmit={(event) => {onSubmitManualEntry(event, formData.id);}}>
					<h2>{(manualInputType == ("Add" as ManualInputType)) ? "Add New Item" : "Edit item"}</h2>

					<label>Item Name</label>
					<input type="text" name="name" value={formData.name} onChange={handleManualInputFormChange}></input>

					<label>Quantity</label>
					<div className="fridge-inline-fields">
						<input
							type="number"
							name="quantity"
							value={formData.quantity}
							onChange={handleManualInputFormChange}
						>
						</input>
						<input
							type="text" name="unit" value={formData.unit} onChange={handleManualInputFormChange}
							placeholder="unit"
						>
						</input>
					</div>

					<label>Expiration Date</label>
					<input type="date" name="expiry" value={formData.expiry as string} onChange={handleManualInputFormChange}></input>

					<div className="fridge-form-label-row">
						<label>Allergens</label>
						<button
							type="button"
							className="fridge-small-button"
							onClick={handleAddAllergenField}
						>+</button>
					</div>
					{allergenFields.map((field, index) => (
						<div className="fridge-inline-fields" key={index}>
							<button
								type="button"
								className="fridge-small-button"
								onClick={() => {handleRemoveAllergenField(index);}}
							>-</button>
							<input
								type="text"
								value={field}
								placeholder="none"
								onChange={(event) => {handleAllergenFieldChange(index, event.target.value);}}
							></input>
						</div>
					))}

					<div className="fridge-modal-actions">
						<button type="button" onClick={handleCancelManualEntry}>Cancel</button>
						<button>Submit</button>
					</div>
				</form>
			</div>
		</div>
	)
}
