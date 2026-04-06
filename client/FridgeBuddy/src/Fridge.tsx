import { useState, useEffect } from 'react';
import {Link} from 'react-router-dom';
import {print_db} from './scripts/DBManager';
import {load_to_fridge, T_save_and_load as test} from './scripts/FridgeManager';
import { usePhotoGallery } from './hooks/usePhotoGallery';
import * as CONSTS from './scripts/CONSTS.ts';

export default function Fridge() {
	const {photos, addNewToGallery} = usePhotoGallery();
	const [isVisible, setVisibility] = useState(false);

	useEffect(
		() => {
			load_to_fridge();
		}, []
	);

	function toggleImagePanel() {
		setVisibility(prev => !prev);
	}

	return (
		<>
			<h1>Your Fridge</h1>
			<div>
				<table id="fridgeTable">
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

			<div>
				<button onClick={() => {addNewToGallery(); toggleImagePanel();}}>Add (+) (Take a picture)</button>
				<button>Add (+) (Upload from gallery)</button>
				<button onClick={test}>Add (+) (Test version)</button>
				<button onClick={() => {print_db(CONSTS.FRIDGE_DB, CONSTS.FRIDGE_TABLE);}}>DEBUG: print indexeddb content</button>
				<Link to="/">
					<button>Back</button>
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
		</>
  	)
}