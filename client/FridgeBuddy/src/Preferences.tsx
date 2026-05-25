import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { buildBackendUrl } from './utils/backend';

type Pref = {
	id: number
	text: string
}

const USER_ID = "test-user-1";

function buildPrefs(items: string[] = []) {
	return items.map((text, index) => ({
		id: index + 1,
		text,
	}));
}

async function savePreferenceItems(endpoint: "preference" | "allergen", items: Pref[]) {
	const response = await fetch(buildBackendUrl(`/api/user/${endpoint}`), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			userId: USER_ID,
			items: items.map((item) => item.text),
		}),
	});

	if(!response.ok) {
		throw new Error(`Failed to save ${endpoint} preferences`);
	}

	return await response.json();
}

async function saveAllPreferences(restrictions: Pref[], preferences: Pref[]) {
	await Promise.all([
		savePreferenceItems("allergen", restrictions),
		savePreferenceItems("preference", preferences),
	]);
}

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

		const nextRestrictions = pref_type == "restrictions"
			? restrictions.filter((pref) => pref.id !== original.id)
			: restrictions;
		const nextPreferences = pref_type == "preferences"
			? preferences.filter((pref) => pref.id !== original.id)
			: preferences;

		setRestrictions(nextRestrictions);
		setPreferences(nextPreferences);
		await saveAllPreferences(nextRestrictions, nextPreferences);
	}

	async function handleSubmit(event:any) {
		event.prevenetDefault();

		let nextRestrictions = restrictions;
		let nextPreferences = preferences;
		const prefData = {
			id: action == "add" ? Date.now() : modifyingPref!.id,
			text: formData.pref.trim(),
		};

		if(!prefData.text) {
			return;
		}

		if(action == "add") {
			if(selected == "restrictions") {
				nextRestrictions = [...restrictions, prefData];
			} else if(selected == "preferences") {
				nextPreferences = [...preferences, prefData];
			}
		} else {
			if(selected == "restrictions") {
				nextRestrictions = restrictions.map((pref) => pref.id == prefData.id ? prefData : pref);
			} else if(selected == "preferences") {
				nextPreferences = preferences.map((pref) => pref.id == prefData.id ? prefData : pref);
			}
		}

		setRestrictions(nextRestrictions);
		setPreferences(nextPreferences);
		await saveAllPreferences(nextRestrictions, nextPreferences);

		togglePanel(selected, action);
		setFormData({pref:""});
	}

	useEffect(
		() => {
			async function init() {
				const response = await fetch(buildBackendUrl(`/api/user/preferences?userId=${encodeURIComponent(USER_ID)}`));

				if(!response.ok) {
					console.log("Failed to load preferences");
					return;
				}

				const prefs = await response.json();
				setRestrictions(buildPrefs(prefs.data?.allergen));
				setPreferences(buildPrefs(prefs.data?.preference));
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
				<h4><i>FridgeBuddy will do its best to always abide by your listed restrictions.<br/>(Examples: Diet plans, allergies...)</i></h4>
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
				<h4><i>FridgeBuddy will take into mind your preferences when generating recipes.<br/>(Examples: Culinary preferences, spice tolerance, ease of preparation...)</i></h4>
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