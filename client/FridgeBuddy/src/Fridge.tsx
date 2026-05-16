import { useState, useEffect } from 'react';
import {Link} from 'react-router-dom';
import {load_fridge_data, save_to_fridge, receipt_scan } from './scripts/FridgeManager';
import { usePhotoGallery } from './hooks/usePhotoGallery';
import { seconds_to_string_date } from './scripts/Helpers.ts';

export type fridgeItem = {
	name: string,
	quantity: number,
	unit: string,
	expiry: Record<string, any>,
	allergens: Array<string>,
	createdAt: Date,
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

	const [fridgeData, setFridgeData] = useState(Array<fridgeItem>());
	const [formData, setFormData] = useState({
		name:"", 
		quantity:0, 
		unit:"", 
		expiry:"", 
		allergens:Array<string>()
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

	function onSubmitManualEntry() {
		const fridgeIng = [{
			name: formData.name,
			quantity: "" + formData.quantity + " " + formData.unit,
			expiry: JSON.stringify(formData.expiry),
			addedAt: JSON.stringify(formData.expiry) // TODO: or maybe Date.now()?
		}] as unknown as Array<fridgeItem>;

		save_to_fridge(fridgeIng);
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

	return (
		<>
		{
			// ********************************
			// MAIN FRIDGE TABLE
			// ********************************
		}
			<>
				<h1>Your Fridge</h1>
				<div>
					<table id="fridgeTable" style={{
						margin:"auto",
						minWidth: "40vw",
						maxWidth: "85vw",
						border: "1px solid",
						// borderCollapse: "collapse",
						borderRadius: "16px",
						borderSpacing: "0px",
						tableLayout: "auto",
					}}>
						<thead>
							<tr>
								<th style={{
									borderBottom: "1px solid",
									padding: "8px",
									minWidth: "15%",
								}}></th>
								<th style={{
									borderBottom: "1px solid",
									padding: "8px"
								}}>Item</th>
								<th style={{
									borderBottom: "1px solid",
									padding: "8px"
								}}>Quantity</th>
								<th style={{
									borderBottom: "1px solid",
									padding: "8px"
								}}>Allergen(s)</th>
								<th style={{
									borderBottom: "1px solid",
									padding: "8px"
								}}>Expiration Date</th>
							</tr>
						</thead>
						<tbody>
							{
								fridgeData.map((item:fridgeItem) => (
									<tr>
										<td style={{
										}}> { /* buttons, icons... */ }
											<button
												className="edit_button" 
												type="button"
											>
											</button>

											<button
												className="delete_button" 
												type="button"
											>
											</button>
										</td>
										<td>{item.name}</td>
										<td style={{textAlign: "center"}}>{item.quantity} {item.unit}</td>
										<td style={{textAlign: "center"}}>{item.allergens}</td>
										<td>{
											(item.expiry) ? seconds_to_string_date(item.expiry["_seconds"]) : ""
										}</td>
									</tr>
								))
							}
						</tbody>
					</table>
				</div>
			</>

			<hr></hr>

		{
			// *********************************************
			// BUTTONS
			// *********************************************
		}

			<div>
				<button style={{
							display:"block", 
							margin:"2px auto"
						}} 
						onClick={() => {
							setManualInputVisibility(true);
						}}
				>Add (+) (Manual)</button><br/>
				
				<button style={{
							display:"block", 
							margin:"2px auto"
						}} 
						onClick={async () => {
							const savedImage = await addNewToGallery();
							toggleImagePanel();
							await receipt_scan(savedImage);
						}}
				>Add (+) (Take a picture)</button><br/>
				
				<button style={{
							display:"block", 
							margin:"2px auto"
						}}
						onClick={() => {

						}}
				>Add (+) (Upload from gallery)</button><br/>

				<Link to="/">
					<button style={{display:"block", margin:"auto"}}>Back</button>
				</Link>
    		</div>

			<div 
				id="photoUploader" 
				className="popup outline" 
				style={{
					display:(isVisible) ? "flex" : "none"
				}}
			>
				<p style={{
					fontSize: "1.6em",
					margin: "0em 0.4em 0em 0em",
				}}><b>Adding Items</b></p>

				<div style={{
					display: "flex",
					flex: "1",
					overflow: "hidden",
					width: "100%",
					minHeight: "0",
					margin: "0.4em 0em 1.2em 0em",
					alignItems: "stretch",
				}}>
					{photos.map((photo) => (
						<div style={{
							height: "100%",
							maxWidth: "50%",
							overflow: "hidden",
							flexShrink: "0",
							alignSelf: "center",
							border: "1px solid red",

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
										onChange={(e) => {handleReceiptScanInputFormChange(index, "name", e.target.value);}}>
									</input>
									<input 
										type="text" name="unit" value={item.unit} 
										onChange={(e) => {handleReceiptScanInputFormChange(index, "name", e.target.value);}} placeholder="unit (eg: kg, lbs, L, cups, etc)">
									</input><br/>
									
									<label id="itemExpiryLabel">Expiration Date </label>
									<input 
										type="date" name="expiry" value={""} 
										onChange={(e) => {handleReceiptScanInputFormChange(index, "name", e.target.value);}}>
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

			<div id="manualInsert" className="popup outline" style={{ display: (manualInputVisible) ? "flex" : "none" }}>
				<form id="manualInsertForm" onSubmit={onSubmitManualEntry}>
					<label id="itemNameLabel">Item Name </label>
					<input type="text" id="itemName" name="name" value={formData.name} onChange={handleManualInputFormChange}></input><br/>

					<label id="itemQtyLabel">Quantity </label>
					<input type="number" id="itemQty" name="quantity" value={formData.quantity} onChange={handleManualInputFormChange}></input>
					<input type="text" name="unit" value={formData.unit} onChange={handleManualInputFormChange} placeholder="unit (eg: kg, lbs, L, cups, etc)"></input><br/>
					
					<label id="itemExpiryLabel">Expiration Date </label>
					<input type="date" name="expiry" value={formData.expiry} onChange={handleManualInputFormChange}></input><br/>

					<label id="itemAllergensLabel">Allergens </label>
					<input type=""></input><br/> <button type="button">+</button> { /* TODO: need to add a way to add many allergens, and a way to remove/edit them. */ }

					<button type="button" onClick={() => {setManualInputVisibility(false);}}>Cancel</button>
					<button>Submit</button>
				</form>
			</div>
		</>
  	)
}