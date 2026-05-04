import { useState } from 'react';
import { Link } from 'react-router-dom';

import { request_recipe } from './scripts/RecipeManager';

type Ingredient = {
	name: string,
	quantity: number,
	unit: string,
	allergens: Array<string>
};

const DEBUG = true;

const omeletTestRecipe = {
	name: "Simple Low-Sodium Omelet",
	servings: 1,
	description: "A simple and healthy omelet, prepared with minimal sodium for those with high blood pressure concerns.",
	time: 10,
	time_unit: "min",
	ingredients: [
		{
			name: "Large Eggs",
			quantity: 2,
			unit: "count",
			allergens: Array<string>(),
		} as Ingredient,
		{
			name: "Olive Oil",
			quantity: 0.5,
			unit: "tbsp",
			allergens: Array<string>(),
		}  as Ingredient,
		{
			name: "Black Pepper",
			quantity: 0.25,
			unit: "tsp",
			allergens: Array<string>(),
		} as Ingredient,
	] as Array<Ingredient>,
	instructions: [
		"Crack two large eggs into a small bowl. Whisk them thoroughly until the yolks and whites are well combined and slightly frothy.",
		"Heat a non-stick frying pan over medium heat. Add 0.5 tbsp of olive oil.",
		"Once the oil is shimmering, pour the whisked eggs into the pan.",
		"As the edges of the omelet begin to set, gently push the cooked egg from the edges towards the center of the pan with a spatula, tilting the pan to allow the uncooked egg to flow underneath.",
		"Continue cooking for 2-3 minutes, or until the omelet is mostly set but still appears moist on top.",
		"Sprinkle 0.25 tsp of black pepper evenly over the omelet.",
		"Carefully fold the omelet in half and slide it onto a plate. Serve immediately.",
	],
	isSuccess: true
};

function Recipes() {
	const [formData, setFormData] = useState({additionalOptions:""});
	const [recipeSuccessfullyGenerated, setSuccess] = useState(false);
	const [recipeData, setRecipeData] = useState({
		name:"",
		servings:-1.0,
		description:"",
		time:-1.0,
		time_unit:"",
		ingredients:Array<Ingredient>(),
		instructions:Array<string>(),
		isSuccess:false
	});
	const [recipePanelVisible, setRecipePanelVisibility] = useState(false);
	
	function handleChange(event:any) {
		const { name, value } = event.target;
		setFormData((prevFormData) => ({... prevFormData, [name]: value}));
	}

	async function handleSubmit(event:any) {
		event.preventDefault(); // stop form submission from reloading page

		const response = await request_recipe(formData.additionalOptions);

		setRecipeGenerationSuccess(true);
		if(response === false) { // recipe failed to generate, give the default recipe
			if(DEBUG) {
				setRecipeData(omeletTestRecipe);
			} else {
				setRecipeGenerationSuccess(false);
			}
		} else { // we got some recipe!!! probably.
			setRecipeData(response);
		}

		toggleRecipePanelVisibility();
	}

	function toggleRecipePanelVisibility() {
		setRecipePanelVisibility(prev => !prev);
	}

	function setRecipeGenerationSuccess(suce:boolean) { // the 4 keys to success: s, u, c, e
		setSuccess(suce);
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

			<div id="recipePanel" className="recipe_panel outline" style={{ display: (recipePanelVisible) ? "flex" : "none" }}>
				{
					recipeSuccessfullyGenerated ? 
					<div>
						<h1>{recipeData.name}</h1>
						<p>Makes {recipeData.servings} servings | Estimated preparation time: {recipeData.time} {recipeData.time_unit}</p>
						<p>{recipeData.description}</p>

						<hr></hr>

						<h2>Ingredients</h2>
						<ul>
							{
								recipeData.ingredients.map((item:Ingredient) => (
									<li>{item.name} - {item.quantity} {item.unit}</li>
								))
							}
						</ul>

						<h2>Instructions</h2>
						<ol>
							{
								recipeData.instructions.map((item) => (
									<li>{item}</li>
								))
							}
						</ol>
					</div>
					: <p>Failed to generate a recipe!</p>
				}
				<button onClick={toggleRecipePanelVisibility}>Back</button>
			</div>
		</>
	)
}

export default Recipes;