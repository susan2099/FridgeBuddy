import { useState } from 'react';
import { Link } from 'react-router-dom';

function Recipes() {
	const [options, setOptions] = useState("");

	function handleChange(e:any) {
		setOptions(e.target.value);
	}

	function handleSubmit(e:any) {
		e.preventDefault(); // stop form submission from reloading page
	}

	return (
		<>
			<h1>Get Recipes</h1>

			<div>
				<form id="additionalOptionsForm" onSubmit={handleSubmit}>
					<label htmlFor="additionalOptions">Additional options</label>
					<input type="" id="additionalOptions" placeholder="What are you hungry for today?" onChange={handleChange}></input><br />

					<input type="submit">Get a recipe!</input>
				</form>

				<Link to="/">
					<button>Back</button>
				</Link>
			</div>
		</>
	)
}

export default Recipes;