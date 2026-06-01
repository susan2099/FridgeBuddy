import { useState, useEffect } from 'react';
import {Link} from 'react-router-dom';
import {load_fridge_data, save_to_fridge, update_fridge, receipt_scan, delete_fridge_item } from './scripts/FridgeManager';
import { usePhotoGallery } from './hooks/usePhotoGallery';
import { sendTestNotification } from './fcm.ts';

type ManualInputType = "Add" | "Update";

export type fridgeItem = {
	id: string|null,
	name: string,
	quantity: number,
	unit: string,
	expiry: Date | string | Record<string, any> | null,
	allergens: Array<string>,
	createdAt: Date,
}

const EXPIRY_ALERT_WINDOW_DAYS = 20;
const DEMO_NOTIFICATION_DELAY_MS = 5000;

function sleep(ms: number) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function getExpiryDate(expiry: fridgeItem["expiry"] | string | null | undefined) {
	if(!expiry) {
		return null;
	}

	if(typeof expiry === "string") {
		const parsedDate = new Date(expiry);
		return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
	}

	if(expiry instanceof Date) {
		return Number.isNaN(expiry.getTime()) ? null : expiry;
	}

	if(typeof expiry["_seconds"] === "number") {
		return new Date(expiry["_seconds"] * 1000);
	}

	return null;
}

function formatExpiryDate(expiry: fridgeItem["expiry"]) {
	const expiryDate = getExpiryDate(expiry);
	if(!expiryDate) {
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
	const {photos, addNewToGallery, clearPhotos} = usePhotoGallery();
	const [isVisible, setVisibility] = useState(false);
	const [manualInputVisible, setManualInputVisibility] = useState(false);
	const [manualInputType, setManualInputType] = useState<ManualInputType>("Add");

	const [fridgeData, setFridgeData] = useState(Array<fridgeItem>());
	const [formData, setFormData] = useState<fridgeItem>({
		id:null,
		name:"", 
		quantity:0, 
		unit:"", 
		expiry:"", 
		allergens:Array<string>(),
		createdAt:new Date(),
	});

	const [receiptScanResults, setReceiptScanResults] = useState(Array<fridgeItem>());

	useEffect(
		() => {
			async function init() {
				setFridgeData(await load_fridge_data() as Array<fridgeItem>);
			}
			init();
		}, []
	);

	function toggleImagePanel() {
		setVisibility(prev => !prev);
	}

	async function onSubmitManualEntry(itemId: string | null) {
		const fridgeIng = [{
			id: itemId,
			name: formData.name,
			quantity: formData.quantity,
			unit: (formData.unit !== "") ? formData.unit : null,
			allergens: formData.allergens,
			expiry: formData.expiry,
			createdAt: new Date(),
		}] as unknown as Array<fridgeItem>;

		try {
			if(manualInputType === ("Add" as ManualInputType)) {
				await save_to_fridge(fridgeIng);
			} else {
				await update_fridge(fridgeIng[0]);
			}
		} catch (error) {
			console.error("Failed to save fridge item:", error);
		}
	}

	async function handleEditFridgeItem(itemId: string) {
		// find item
		const item = fridgeData.filter((fridgeItem) => fridgeItem.id == itemId)[0];

		setManualInputType("Update" as ManualInputType);
		setFormData({
			"id": itemId,
			"name": item.name,
			"quantity":item.quantity,
			"unit":item.unit,
			"expiry":JSON.stringify(item.expiry),
			"allergens":item.allergens,
		} as fridgeItem);
		
		setManualInputVisibility(true);
	}

	async function handleDeleteFridgeItem(item: fridgeItem) {
		const confirmed = window.confirm(`Delete ${item.name} from your fridge?`);
		if(!confirmed) {
			return;
		}

		try {
			await delete_fridge_item(item.id as string);
			setFridgeData(await load_fridge_data() as Array<fridgeItem>);
		} catch (error) {
			console.error("Failed to delete fridge item:", error);
		}
	}

	function handleManualInputFormChange(event:any) {
		const { name, value } = event.target;
		setFormData((prevFormData) => ({... prevFormData, [name]: value}));
	}

	function handleReceiptScanInputFormChange(index:number, field: keyof fridgeItem, value: any) {
		setReceiptScanResults(prev => prev.map((item, i) => 
			i === index ? { ...item, [field]: value} : item
		));
	}

	function handleReceiptScanResults(results:Array<Record<string, any>>) {
		// allergens: Array [], auto_applied: true, createdAt: null, expiry: null, id: null, name: "sugar", quantity: 1, raw_name: "ST # OP # SUGAR $", unit: "", userId: null
		const fridgeItemResults = results.map((result) => (
			{
				name: result.name,
				quantity: result.quantity,
				unit: result.unit,
				expiry: result.expiry,
				allergens: result.allergens,
				createdAt: result.createdAt
			} as fridgeItem
		));

		setReceiptScanResults(fridgeItemResults);
	}

	async function handleGetExpiryAlert() {
		await sleep(DEMO_NOTIFICATION_DELAY_MS);

		const data = await load_fridge_data();

		if(!Array.isArray(data)) {
			alert("Could not load fridge items for expiry alerts.");
			return;
		}

		const now = Date.now();
		const alertWindowEnd = now + EXPIRY_ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
		const expiringItems = data.filter((item) => {
			const expiryDate = getExpiryDate(item.expiry);
			if(!expiryDate) {
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
			height: "calc(100dvh - 4rem)",
			display: "flex",
			flexDirection: "column",
			overflow: "hidden",
		}}>
		{
			// ********************************
			// MAIN FRIDGE TABLE
			// ********************************
		}
			<section style={{
				flex: "0 0 auto",
				display: "flex",
				flexDirection: "column",
				minHeight: "0",
			}}>
				<h1 style={{ margin: "0 0 16px"}}>Your Fridge</h1>
				<div style={{
					flex: "0 0 auto",
					width: "min(85vw, 95%)",
					margin: "0 auto",
					border: "1px solid",
					borderRadius: "16px",
					overflow: "hidden",
				}}>
					<div style={{
						maxHeight: "100%",
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
										minWidth: "15%",
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
										padding: "8px",
										position: "sticky",
										top: "0",
										background: "var(--bg-color)",
										zIndex: 1,
									}}>Expiration Date</th>
								</tr>
							</thead>
							<tbody>
								{
									fridgeData.map((item:fridgeItem) => (
										<tr key={item.id as string}>
											<td style={{}}> { /* buttons, icons... */ }
												<button
													className="edit_button" 
													type="button"
													onClick={() => {handleEditFridgeItem(item.id as string);}}
												>
												</button>

												<button
													className="delete_button" 
													type="button"
													onClick={() => {handleDeleteFridgeItem(item); }}
												>
												</button>
											</td>
											<td>{item.name}</td>
											<td style={{textAlign: "center"}}>{item.quantity} {item.unit}</td>
											<td style={{textAlign: "center"}}>{item.allergens}</td>
											<td>{formatExpiryDate(item.expiry)}</td>
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

			<div style={{
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
							setManualInputVisibility(true);
						}}
				>Add (+) (Manual)</button>
				
				<button style={{
							display:"block", 
							margin:"0 auto"
						}} 
						onClick={async () => {
							const savedImage = await addNewToGallery();
							toggleImagePanel();
							const results = await receipt_scan(savedImage);
							handleReceiptScanResults(results);
						}}
				>Add (+) (Take a picture)</button>
				
				<button style={{
							display:"block", 
							margin:"0 auto"
						}}
						onClick={() => {

						}}
				>Add (+) (Upload from gallery)</button>

				<button style={{
							display:"block", 
							margin:"0 auto"
						}}
						onClick={handleGetExpiryAlert}
				>Get expiry alert (Demo only)</button>

				<Link to="/">
					<button style={{display:"block", margin:"auto"}}>Back</button>
				</Link>
    		</div>

			<div 
				id="photoUploader" 
				className="popup outline" 
				style={{
					minWidth: "85%",
					display:(isVisible) ? "flex" : "none"
				}}
			>
				<p style={{
					fontSize: "1.6em",
					margin: "0em 0.4em 0em 0em",
				}}><b>Adding Items</b></p>
				<hr></hr>

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
								display:"block",
								objectFit:"contain",
							}}></img>
						</div>
					))}

					<div id = "receiptScannerResults" style={{
						flex:1,
						minHeight: "0",
						overflowY: "auto",
					}}>
						<form id="receiptScanResultsForm">
						{
							receiptScanResults.map((item, index) => (
								<div key={index}>
									<label id="itemNameLabel">Item Name </label>
									<input 
										type="text" id="itemName" name="name" value={item.name} 
										onChange={(e) => {handleReceiptScanInputFormChange(index, "name", e.target.value);}}>
									</input><br/>

									<label id="itemQtyLabel">Quantity </label>
									<input 
										type="number" id="itemQty" name="quantity" value={item.quantity} 
										onChange={(e) => {handleReceiptScanInputFormChange(index, "quantity", e.target.value);}}>
									</input>
									<input 
										type="text" name="unit" value={item.unit} 
										onChange={(e) => {handleReceiptScanInputFormChange(index, "unit", e.target.value);}} 
										placeholder="unit (eg: kg, lbs, L, cups, etc)">
									</input><br/>
									
									<label id="itemExpiryLabel">Expiration Date </label>
									<input 
										type="date" name="expiry" value={""} /* receiptScanResults[index].expiry */
										onChange={(e) => {handleReceiptScanInputFormChange(index, "expiry", e.target.value);}}>
									</input><br/>

									<label id="itemAllergensLabel">Allergens </label>
									<input type=""></input><br/> <button type="button">+</button> { }
								</div>
							))
						}
						</form>
					</div>
				</div>

				<br/>

				<div>
					<button onClick={
						() => {
							clearPhotos();
							toggleImagePanel();
						}
					} className="fit-content">Cancel</button>
					<button onClick={() => {
						console.log("WIP: send image to OCR"); 
						toggleImagePanel();
						console.log("WIP: get YAML string, send to save_to_db, load_to_fridge");
						clearPhotos();
					}} className="fit-content">Add</button>
				</div>
			</div>

			<div	id="manualInsert" 
					className="popup outline" 
					style={{ 
						display: (manualInputVisible) ? "flex" : "none",
						// width: "50vw",
					}}
			>
				<form id="manualInsertForm" onSubmit={() => {onSubmitManualEntry(formData.id);}}>
					<label id="itemNameLabel">Item Name </label>
					<input type="text" id="itemName" name="name" value={formData.name} onChange={handleManualInputFormChange}></input><br/>

					<label id="itemQtyLabel">Quantity </label>
					<input	type="number" 
							id="itemQty" 
							name="quantity" 
							value={formData.quantity} 
							onChange={handleManualInputFormChange}
							style={{
								width:"15%",
							}}
					>
					</input>
					<input 
						type="text" name="unit" value={formData.unit} onChange={handleManualInputFormChange} 
						placeholder="unit (eg: kg, lbs, L, cups, etc)"
						style={{
							width:"50%",
						}}
					>	
					</input><br/>
					
					<label id="itemExpiryLabel">Expiration Date </label>
					<input type="date" name="expiry" value={formData.expiry as string} onChange={handleManualInputFormChange}></input><br/>

					<label id="itemAllergensLabel">Allergens </label>
					<input type="" placeholder="none"></input><br/> <button type="button">+</button> { /* TODO: need to add a way to add many allergens, and a way to remove/edit them. */ }

					<br/>
					<button type="button" onClick={() => {setManualInputVisibility(false);}}>Cancel</button>
					<button>Submit</button>
				</form>
			</div>
		</div>
  	)
}
