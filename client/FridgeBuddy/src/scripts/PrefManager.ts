import { /*print_db,*/ open_db, close_db, save_yaml_to_db } from './DBManager';
import * as CONSTS from './CONSTS';

export type Pref = {
	id: number
	text: string
}

export async function save_to_prefs(data:string, pref_type:string) {
	const yaml = `pref:\n  - id: ${Date.now()}\n    text: '${data}'`; // make new pref YAML-like
	save(yaml, pref_type);
}

export async function modify_pref(id:number, data:string, pref_type:string) {
	const yaml = `pref:\n  - id: ${id}\n    text: '${data}'`;
	console.log(`received id ${id} and new data ${data}`);
	save(yaml, pref_type);
}

async function save(yaml:string, pref_type:string) {
	if(pref_type == "restrictions") {
		save_yaml_to_db(yaml, CONSTS.PREFS_YAML_TABLE, CONSTS.PREFS_DB, CONSTS.RESTRICTIONS_TABLE);
	} else if(pref_type == "preferences") {
		save_yaml_to_db(yaml, CONSTS.PREFS_YAML_TABLE, CONSTS.PREFS_DB, CONSTS.PREFERENCES_TABLE);
	} else {
		console.log("PrefManager: expecting either which == 'restrictions' or which == 'preferences'");
	}
}

export async function delete_pref(id:number, pref_type:string) {
	const db = await open_db(CONSTS.PREFS_DB, [CONSTS.RESTRICTIONS_TABLE, CONSTS.PREFERENCES_TABLE]);

	if(pref_type == "restrictions") {
		const transaction = db.transaction(CONSTS.RESTRICTIONS_TABLE, "readwrite");
		transaction.objectStore(CONSTS.RESTRICTIONS_TABLE).delete(id);
	} else if(pref_type == "preferences") {
		const transaction = db.transaction(CONSTS.PREFERENCES_TABLE, "readwrite");
		transaction.objectStore(CONSTS.PREFERENCES_TABLE).delete(id);
	}
}

export async function load_prefs() {
	const db = await open_db(CONSTS.PREFS_DB, [CONSTS.RESTRICTIONS_TABLE, CONSTS.PREFERENCES_TABLE]);
	const restrictions = await load_prefs_data(db, CONSTS.RESTRICTIONS_TABLE) as Array<Pref>;
	const preferences = await load_prefs_data(db, CONSTS.PREFERENCES_TABLE) as Array<Pref>;
	close_db(db);

	// console.log(restrictions);

	return {
		"restrictions": restrictions, 
		"preferences": preferences
	};
}

async function load_prefs_data(db:IDBDatabase, table_name:string): Promise<Array<Pref>|boolean> {
	const request = db.transaction(table_name, "readonly").objectStore(table_name).openCursor();

	return new Promise<Array<Pref>|boolean>(
		(resolve) => {
			const prefs = [] as Array<Pref>;
			
			request.onsuccess = () => {
				const cursor = request.result;
				if(cursor) {
					const data:Record<string, any> = cursor.value;
					prefs.push({ "id": data["id"], "text": data["text"]});
					cursor.continue();
				} else {
					resolve(prefs);
				}
			}

			request.onerror = () => {
				resolve(false);
			}
		}
	);
}