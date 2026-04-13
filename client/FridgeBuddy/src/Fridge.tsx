import { useState, useEffect } from 'react';
import {Link} from 'react-router-dom';
// import {print_db} from './scripts/DBManager';
import {save_to_fridge, load_to_fridge, T_save_and_load as test} from './scripts/FridgeManager';
import { usePhotoGallery } from './hooks/usePhotoGallery';
// import * as CONSTS from './scripts/CONSTS.ts';

export type fridgeIngredient = {
	name: string,
	quantity: string,
	expiry: string,
	addedAt: string,
}



export default function Fridge() {
	const {photos, addNewToGallery} = usePhotoGallery();
	const [isVisible, setVisibility] = useState(false);
	const [manualInputVisible, setManualInputVisibility] = useState(false);

	const [formData, setFormData] = useState({name:"", quantity:0, unit:"", expiry:""});

	useEffect(
		() => {
			load_to_fridge();
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
			addedAt: JSON.stringify(formData.expiry)
		}] as unknown as Array<fridgeIngredient>;

		save_to_fridge(fridgeIng);
	}

	function handleManualInputFormChange(event:any) {
		const { name, value } = event.target;
		setFormData((prevFormData) => ({... prevFormData, [name]: value}));
	}


	return (
		<>
			<h1>Your Fridge</h1>
			<div>
				<table id="fridgeTable" style={{margin:"auto"}}>
					<thead>
						<tr>
							<th>Item</th>
							<th>Quantity</th>
							<th>Expiration Date</th>
						</tr>
					</thead>
					<tbody>

					</tbody>
				</table>
			</div>

			<hr></hr>

			<div>
				<button style={
							{
								display:"block", 
								margin:"2px auto"
							}
						} 
						onClick={() => {
							setManualInputVisibility(true);
						}
				}>Add (+) (Manual)</button><br/>
				<button style={
							{
								display:"block", 
								margin:"2px auto"
							}
						} 
						onClick={() => {
							addNewToGallery(); 
							toggleImagePanel();
						}
				}>Add (+) (Take a picture)</button><br/>
				<button style={
							{
								display:"block", 
								margin:"2px auto"
							}
				}>Add (+) (Upload from gallery)</button><br/>
				<button style={
							{
								display:"block", 
								margin:"2px auto"
							}
						} 
						onClick={test}>Add (+) (Test version)</button><br/>
				{/* <button onClick={() => {print_db(CONSTS.FRIDGE_DB, CONSTS.FRIDGE_TABLE);}}>DEBUG: print indexeddb content</button><br/> */}
				<Link to="/">
					<button style={{display:"block", margin:"auto"}}>Back</button>
				</Link>
    		</div>

			<div id="photoUploader" className="popup outline" style={{display:(isVisible) ? "flex" : "none"}}>
				{photos.map((photo) => (
					<img src={photo.webviewPath} style={{maxWidth:"90%", maxHeight:"70%", display:"block"}}></img>
				))}
				<br/>
				<div>
					<button onClick={toggleImagePanel} className="fit-content">Cancel</button>
					<button onClick={() => {
						console.log("WIP: send image to OCR"); 
						toggleImagePanel(); 
						console.log("WIP: get YAML string, send to save_to_db, load_to_fridge");
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

					<button type="button" onClick={() => {setManualInputVisibility(false);}}>Cancel</button>
					<button>Submit</button>
				</form>
			</div>
		</>
  	)
}