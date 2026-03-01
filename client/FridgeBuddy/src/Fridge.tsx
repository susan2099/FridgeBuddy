// import * as React from 'react';
import { useEffect } from 'react';
import {Link} from 'react-router-dom';
import {print_db, load_to_fridge, T_save_and_load as test} from './scripts/FridgeManager';
import { usePhotoGallery, toggleImage } from './hooks/usePhotoGallery';

export default function Fridge() {
	const {photos, addNewToGallery} = usePhotoGallery();
	useEffect(
		() => {
			load_to_fridge();
		}, []);

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
				<button onClick={() => {addNewToGallery(); toggleImage();}}>Add (+) (Take a picture)</button>
				<button>Add (+) (Upload from gallery)</button>
				<button onClick={test}>Add (+) (Test version)</button>
				<button onClick={print_db}>DEBUG: print indexeddb content</button>
				<Link to="/">
					<button>Back</button>
				</Link>
    		</div>

			<div id="photoUploader" className="popup" style={{display:"none"}}>
				{photos.map((photo) => (
					<img src={photo.webviewPath} style={{maxWidth:"90%", maxHeight:"70%", display:"block"}}></img>
				))}
				<br/>
				<div>
					<button onClick={toggleImage} className="fit-content">Cancel</button>
					<button onClick={() => {console.log("WIP: send image to OCR"); toggleImage(); console.log("WIP: get YAML string, send to save_to_db, load_to_fridge");}} className="fit-content">Add</button>
				</div>
			</div>
		</>
  	)
}