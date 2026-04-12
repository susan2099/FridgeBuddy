import { useState } from 'react';
import { Link } from 'react-router-dom';

import { request_recipe } from './scripts/RecipeManager';

function Recipes() {
	const [formData, setFormData] = useState({additionalOptions:""});

	function handleChange(event:any) {
		const { name, value } = event.target;
		setFormData((prevFormData) => ({... prevFormData, [name]: value}));
	}

	function handleSubmit(event:any) {
		event.preventDefault(); // stop form submission from reloading page
		request_recipe(formData.additionalOptions);
	}

	return (
		<>
			<h1>Get Recipes</h1>

			<div>
				<form id="additionalOptionsForm" onSubmit={handleSubmit}>
					<label htmlFor="additionalOptions" style={{textAlign:"left"}}>Additional options</label><br/>
					<textarea 	id="additionalOptions" 
								name="additionalOptions" 
								value={formData.additionalOptions}
								placeholder="What are you hungry for today?" 
								onChange={handleChange}
								style={{width:"80vw", height:"20vh"}}>
					</textarea><br />

					<input type="submit" value="Get a recipe!" className="button"></input>
					{/* <button type="submit">Get a recipe!</button> */}
				</form>

				<Link to="/">
					<button>Back</button>
				</Link>
			</div>
		</>
	)
}

export default Recipes;