import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { load_fridge_data, save_to_fridge, update_fridge, receipt_scan, delete_fridge_item } from './scripts/FridgeManager';
import { usePhotoGallery } from './hooks/usePhotoGallery';
import { sendTestNotification } from './fcm.ts';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';

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
	const { photos, addNewToGallery, clearPhotos } = usePhotoGallery();
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
		<div style={{
			// height: "calc(100dvh - 4rem)",
			width: "100%",
			// minWidth: "0",
			// alignSelf: "stretch",
			display: "flex",
			// flex: "1",
			flexDirection: "column",
			overflow: "hidden",
		}}>
			{
				// ********************************
				// MAIN FRIDGE TABLE
				// ********************************
			}
			<section style={{
				flex: "0 1 auto",
				display: "flex",
				flexDirection: "column",
				minHeight: "0",
			}}>
				<h1 style={{ margin: "0 0 16px" }}>Your Fridge</h1>
				<div style={{
					flex: "0 1 auto",
					minHeight: "0",
					maxHeight: "100%",
					width: "min(85vw, 95%)",
					margin: "0 auto",
					border: "1px solid",
					borderRadius: "16px",
					overflow: "hidden",
				}}>
					<div style={{
						maxHeight: "100%",
						minHeight: "0",
						overflow: "auto",
					}}>
						<table id="fridgeTable" style={{
							width: "100%",
							minWidth: "40vw",
							// borderCollapse: "collapse",
							borderRadius: "10px",
							borderSpacing: "0px",
							tableLayout: "auto",
						}}>
							<thead>
								<tr>
									<th style={{
										borderBottom: "1px solid",
										padding: "8px",
										width: "1%",
										whiteSpace: "nowrap",
										// minWidth: "15%",
										position: "sticky",
										top: "0",
										background: "var(--bg-color)",
										zIndex: 1,
									}}></th>
									<th style={{
										borderBottom: "1px solid",
										padding: "8px",
										position: "sticky",
										top: "0",
										background: "var(--bg-color)",
										zIndex: 1,
									}}>Item</th>
									<th style={{
										borderBottom: "1px solid",
										width:"1%",
										whiteSpace:"nowrap",
										padding: "8px",
										position: "sticky",
										top: "0",
										background: "var(--bg-color)",
										zIndex: 1,
									}}>Quantity</th>
									<th style={{
										borderBottom: "1px solid",
										padding: "8px",
										position: "sticky",
										top: "0",
										background: "var(--bg-color)",
										zIndex: 1,
									}}>Allergen(s)</th>
									<th style={{
										borderBottom: "1px solid",
										width:"1%",
										whiteSpace:"nowrap",
										padding: "8px 16px",
										position: "sticky",
										top: "0",
										background: "var(--bg-color)",
										zIndex: 1,
									}}>Expiration Date</th>
								</tr>
							</thead>
							<tbody>
								{
									fridgeData.map((item: fridgeItem) => (
										<tr key={item.id as string}>
											<td style={{
												whiteSpace: "nowrap",
												// borderRight: "1px solid"
											}}> { /* buttons, icons... */}
												<button
													className="edit_button"
													type="button"
													onClick={() => { handleEditFridgeItem(item.id as string); }}
												>
												</button>

												<button
													className="delete_button"
													type="button"
													onClick={() => { handleDeleteFridgeItem(item); }}
												>
												</button>
											</td>
											<td style={{paddingLeft:"16px"}}>{item.name}</td>
											<td style={{ textAlign: "center" }}>{item.quantity} {item.unit}</td>
											<td style={{textAlign: "center"}}>
												{item.allergens.map((allergen, index) => (
													<div key={`${item.id}-allergen-${index}`}>{allergen}</div>
												))}
											</td>
											<td style={{ textAlign: "center" }}>{formatExpiryDate(item.expiry)}</td>
										</tr>
									))
								}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<hr style={{
				width: "min(85vw, 100%)",
				flex: "0 0 auto",
				margin: "16px auto 12px",
			}}></hr>

			{
				// *********************************************
				// BUTTONS
				// *********************************************
			}

			<div id="buttons" style={{
				flex: "0 0 auto",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "8px",
			}}>
				<button style={{
							display:"block", 
							margin:"0 auto"
						}}
							onClick={() => {
								setManualInputType("Add" as ManualInputType);
								setAllergenFields([]);
								setManualInputVisibility(true);
							}}
				>Add (+) (Manual)</button>
				
				<div style={{
					display: "flex",
					justifyContent: "center",
					gap: "8px",
					flexWrap: "wrap",
				}}>
					<button 
							onClick={() => {
								
							}}
					>Scan receipt (+) (From camera)</button>
					
					<button
							onClick={async () => {
								const savedImage = await addNewToGallery();
								toggleImagePanel();
								const results = await receipt_scan(savedImage);
								handleReceiptScanResults(results);
							}}
					>Scan receipt (+) (From gallery)</button>
				</div>
				<div style={{
					display: "flex",
					justifyContent: "center",
					gap: "8px",
					flexWrap: "wrap",
				}}>
					<button 
							onClick={() => {
								
							}}
					>Scan barcode (+) (From camera)</button>
					
					<button
							onClick={async () => {
								const savedImage = await addNewToGallery();
								toggleImagePanel();
								const results = await receipt_scan(savedImage);
								handleReceiptScanResults(results);
							}}
					>Scan barcode (+) (From gallery)</button>
				</div>

				<button style={{
					display: "block",
					margin: "0 auto"
				}}
					onClick={handleGetExpiryAlert}
				>Get expiry alert (Demo only)</button>

				<Link to="/">
					<button style={{ display: "block", margin: "auto" }}>Back</button>
				</Link>
			</div>

			<div id="photoUploader"
				className="popup outline"
				style={{
					minWidth: "85%",
					display: (isVisible) ? "flex" : "none"
				}}
			>
				<p style={{
					fontSize: "1.6em",
					margin: "0em 0.4em 0em 0em",
				}}><b>Adding Items</b></p>

				<div id="photoAndResultHolder" style={{
					display: "flex",
					flex: "1",
					overflow: "hidden",
					width: "100%",
					minHeight: "0",
					maxHeight: "100%",
					margin: "0.4em 0em 1.2em 0em",
					alignItems: "stretch",
				}}>
					{photos.map((photo, index) => (
						<div id={`photo${index}`} style={{
							maxHeight: "60vh",
							minWidth: "0",
							maxWidth: "50%",
							overflow: "hidden",
						}}>
							<img src={photo.webviewPath} style={{
								height: "100%",
								width: "100%",
								display: "block",
								objectFit: "contain",
							}}></img>
						</div>
					))}

					<div id="receiptScannerResults" style={{
						flex: 1,
						minHeight: "0",
						overflowY: "auto",
					}}>
						<form id="receiptScanResultsForm">
							{
								receiptScanResults.map((item, index) => (
									<div key={index} style={{
										marginBottom: "1em",
										paddingBottom: "1em",
										borderBottom: index === receiptScanResults.length - 1 ? "none" : "1px solid #ddd",
									}}>
										<label id="itemNameLabel">Item Name </label>
										<input
											type="text" id="itemName" name="name" value={item.name}
											onChange={(e) => { handleReceiptScanInputFormChange(index, "name", e.target.value); }}>
										</input><br />

										<label id="itemQtyLabel">Quantity </label>
										<input
											type="number" id="itemQty" name="quantity" value={item.quantity}
											onChange={(e) => { handleReceiptScanInputFormChange(index, "quantity", e.target.value); }}>
										</input>
										<input
											type="text" name="unit" value={item.unit}
											onChange={(e) => { handleReceiptScanInputFormChange(index, "unit", e.target.value); }}
											placeholder="unit (eg: kg, lbs, L, cups, etc)">
										</input><br />

										<label id="itemExpiryLabel">Expiration Date </label>
										<input
											type="date" name="expiry" value={formatExpiryDate(item.expiry)}
											onChange={(e) => { handleReceiptScanInputFormChange(index, "expiry", e.target.value); }}>
										</input><br />

										<label id="itemAllergensLabel">Allergens </label>
										<button
											type="button"
											style={{ height: "1.5em", width: "1.5em", padding: "0", margin: "0 0.5em" }}
											onClick={() => { handleAddReceiptScanAllergenField(index); }}
										>+</button>
										<br />
										{
											item.allergens.map((allergen, allergenIndex) => (
												<div key={allergenIndex}>
													<button
														type="button"
														style={{ height: "1.5em", width: "1.5em", padding: "0", margin: "0 0.5em" }}
														onClick={() => { handleRemoveReceiptScanAllergenField(index, allergenIndex); }}
													>-</button>
													<input
														type="text"
														value={allergen}
														placeholder="none"
														onChange={(event) => { handleReceiptScanAllergenFieldChange(index, allergenIndex, event.target.value); }}
													></input>
												</div>
											))
										}
									</div>
								))
							}
						</form>
					</div>
				</div>

				<br />

				<div>
					<button onClick={
						() => {
							clearPhotos();
							toggleImagePanel();
							setReceiptScanResults([]);
						}
					} className="fit-content">Cancel</button>
					<button onClick={() => {
						console.log("WIP: send image to OCR");
						toggleImagePanel();
						console.log("WIP: get YAML string, send to save_to_db, load_to_fridge");
						clearPhotos();
						setReceiptScanResults([]);
					}} className="fit-content">Add</button>
				</div>
			</div>

			<div id="loadingSpinner"
				className="popup outline"
				style={{
					display: loading ? "flex" : "none",
					padding: "0px",
				}}
			>
				<LoadingSpinner visible={true}>
				</LoadingSpinner>
			</div>

			<div id="manualInsert"
				className="popup outline"
				style={{
					display: (manualInputVisible) ? "flex" : "none",
					// width: "50vw",
				}}
			>
				<form id="manualInsertForm" onSubmit={(event) => {onSubmitManualEntry(event, formData.id);}}>
					<h2>{(manualInputType == ("Add" as ManualInputType)) ? "Add New Item" : "Edit item"}</h2>
					<label id="itemNameLabel">Item Name </label>
					<input type="text" id="itemName" name="name" value={formData.name} onChange={handleManualInputFormChange}></input><br />

					<label id="itemQtyLabel">Quantity </label>
					<input type="number"
						id="itemQty"
						name="quantity"
						value={formData.quantity}
						onChange={handleManualInputFormChange}
						style={{
							width: "15%",
						}}
					>
					</input>
					<input
						type="text" name="unit" value={formData.unit} onChange={handleManualInputFormChange}
						placeholder="unit (eg: kg, lbs, L, cups, etc)"
						style={{
							width: "50%",
						}}
					>
					</input><br />

					<label id="itemExpiryLabel">Expiration Date </label>
					<input type="date" name="expiry" value={formData.expiry as string} onChange={handleManualInputFormChange}></input><br />

					<label id="itemAllergensLabel">Allergens </label>
					<button 
						type="button"
						style={{height:"1.5em", width: "1.5em", padding: "0", margin: "0 0.5em"}}
						onClick={handleAddAllergenField}
					>+</button>
					<br/>
					{
						allergenFields.map((field, index) => (
							<div key={index}>
								<button 
									type="button"
									style={{height:"1.5em", width: "1.5em", padding: "0", margin: "0 0.5em"}}
									onClick={() => {handleRemoveAllergenField(index);}}
								>-</button>
								<input 
									type="text"
									value={field}
									placeholder="none"
									onChange={(event) => {handleAllergenFieldChange(index, event.target.value);}}
								></input>
							</div>
						))
					}

					<br/>
					<button type="button" onClick={handleCancelManualEntry}>Cancel</button>
					<button>Submit</button>
				</form>
			</div>
		</div>
	)
}
