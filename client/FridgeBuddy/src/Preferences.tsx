import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { type Pref, save_to_prefs, modify_pref, load_prefs, delete_pref } from './scripts/PrefManager';

function Preferences() {
	const [selected, setSelected] = useState(""); // restrictions or preferences
	const [action, setAction] = useState(""); // add or edit
	const [modifyingPref, setPref] = useState<Pref | null>(null); // for holding which pref we're editing

	const [isVisible, setVisibility] = useState(false);
	const [formLabel, setFormLabel] = useState("");
	const [formData, setFormData] = useState({pref:""});

	const [restrictions, setRestrictions] = useState<Pref[]>([]);
	const [preferences, setPreferences] = useState<Pref[]>([]);

	function handleChange(event:any) {
		const { name, value } = event.target;
		setFormData((prevFormData) => ({... prevFormData, [name]: value}));
	}

	function togglePanel(_selected:string, _action:string) {
		if(_action == "add" && _selected == "restrictions") {
			setFormLabel("Adding new restriction");
		} else if(_action == "add" && _selected == "preferences") {
			setFormLabel("Adding new preference");
		} else if(_action == "edit" && _selected == "restrictions") {
			setFormLabel("Editing restriction");
		} else if(_action == "edit" && _selected == "preferences") {
			setFormLabel("Editing preference");
		}

		setVisibility(prev => !prev);
	}

	function _edit_pref(original:Pref, pref_type:string) {
		setSelected(pref_type);
		setAction("edit");
		setFormData({pref: original["text"]});

		togglePanel(pref_type, "edit");
	}

	async function _delete_pref(original:Pref, pref_type:string) {
		setSelected(pref_type);
		delete_pref(original.id, pref_type);
		
		const prefs = await load_prefs() as Record<string, any>;
		setRestrictions(prefs["restrictions"]);
		setPreferences(prefs["preferences"]);
	}

	async function handleSubmit(event:any) {
		event.preventDefault();

		// push changes to database...
		if(action == "add") {
			await save_to_prefs(formData.pref, selected);
		} else {
			await modify_pref(modifyingPref!.id, formData.pref, selected);
		}
		const prefs = await load_prefs() as Record<string, any>;
		setRestrictions(prefs["restrictions"]);
		setPreferences(prefs["preferences"]);

		togglePanel(selected, action);
		setFormData({pref:""});
	}

	useEffect(
		() => {
			async function init() {
				const prefs = await load_prefs() as Record<string, any>;
				setRestrictions(prefs["restrictions"]);
				setPreferences(prefs["preferences"]);
			}
			init();
		}, []
	);

	return (
		<>
			<h1>Preferences</h1>
			<div>
				<h2 style={{ display: "inline" }}>Dietary Restrictions</h2>
				<button onClick={() => {
					setFormData({pref: ""});
					setSelected("restrictions");
					setAction("add");
					togglePanel("restrictions", "add");
				}}>(+)</button>
				<h4><i>FridgeBuddy will do its best to always abide by your listed restrictions.</i></h4>
				<div className="outline tag_container">
					{restrictions.length === 0 ?
						<p id="restrictions" style={{ 
							color: "gray",
							margin: "0px"
						}}>Examples: Diet plans, allergies...</p>
						: restrictions.map((tag, index) => (
							<div 
								key={index} 
								className="pref_tag"
								onClick={() => {
									setPref(tag);
									_edit_pref(tag, "restrictions");
								}}>
									<span>{tag.text}</span>
									<span className="small_button" 
									onClick={(e) => {
										e.stopPropagation();
										_delete_pref(tag, "restrictions");
									}}>X</span>
							</div>
						))
					}
				</div><br/>

				<h2 style={{display:"inline"}}>Dietary and Culinary Preferences</h2>
				<button onClick={() => {
					setFormData({pref: ""});
					setSelected("preferences");
					setAction("add");
					togglePanel("preferences", "add");
				}}>(+)</button>
				<h4><i>FridgeBuddy will take into mind your preferences when generating recipes.</i></h4>
				<div className="outline tag_container">
					{preferences.length === 0 ?
						<p id="preferences" style={{
							color: "gray",
							margin: "0px"
						}}>Examples: Culinary preferences, spice tolerance, ease of preparation...</p>
						: preferences.map((tag, index) => (
							<div 
								key={index} 
								className="pref_tag"
								onClick={() => {
									setPref(tag);
									_edit_pref(tag, "preferences");
								}}>
									<span>{tag.text}</span>
									<span className="small_button" 
									onClick={(e) => {
										e.stopPropagation();
										_delete_pref(tag, "preferences");
									}}>X</span>
							</div>
						))
					}
				</div>

				<Link to="/">
					<button>Back</button>
				</Link>
			</div>

			<div id="addPrefPanel" className="popup outline" style={{ display: (isVisible) ? "flex" : "none" }}>
				<form id="prefForm" onSubmit={handleSubmit}>
					<label id="prefFormLabel">{formLabel}</label><br/>
					<input 	type="text"
							id="prefFormInput"
							name="pref"
							value={formData.pref}
							onChange={handleChange}
					></input> <br/>

					<button type="button" className="button" onClick={() => {
						togglePanel("", "");
					}}>Cancel</button>
					<input type="submit" value="Save" className="button"></input>
				</form>
			</div>
		</>
	)
}

export default Preferences;