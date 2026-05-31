import { parse } from 'yaml' // https://eemeli.org/yaml/#parse-amp-stringify
import { buildBackendUrl } from '../utils/backend';

export async function print_db(db_name:string, table_name:string) {
	const db = await open_db(db_name, [table_name]);
	const tx = db.transaction(table_name, 'readonly');
	const store = tx.objectStore(table_name);

	const allItems = store.getAll();
	allItems.onsuccess = () => {
		const items = allItems.result;

		let string = `ObjectStore: ${table_name}\n`;

		for(const itemId in items) {
			let properties = "";

			const item = items[itemId];
			for(const property_key in item) {
				properties += `${property_key} : ${item[property_key]}, `;
			}

			string += `${itemId} : ${properties}\n`;
		}

		console.log(string);
	};

	close_db(db);
}

export async function open_db(db_name:string, table_names:string[]) : Promise<IDBDatabase> {
	return await new Promise((resolve, reject) => {
		const request = window.indexedDB.open(db_name, 1);

		request.onerror = function() {
			console.log("open_db: Failed to open database:", request.error);
			reject(request.error);
		};

		request.onsuccess = function() {
			console.log("open_db: Succeeded in opening database");
			resolve(request.result);
		};

		request.onupgradeneeded = function() {
			console.log("open_db: Upgrading database");
			const db = request.result;

			table_names.forEach(table_name => {
				if(!db.objectStoreNames.contains(table_name)) {
					db.createObjectStore(table_name, {keyPath: "id"});
				}				
			});
		};
	});
}

export function close_db(db:IDBDatabase):undefined {
	// console.log("close_db()");
	db!.close();
}

// note: YAML does not support tabs; convert them to spaces before parsing
export async function save_yaml_to_db(yaml:string, yaml_table_name:string, db_name:string, table_name:string) {
	yaml = yaml.replace("\t", "  "); // replace tabs w/ 2 spaces
	const data:Array<Record<string, any>> = parse(yaml)[yaml_table_name];

	save_to_db(db_name, table_name, data);
}

async function save_to_db(db_name:string, table_name:string, data:Array<Record<string, any>>) {
	const db:IDBDatabase = await open_db(db_name, [table_name]);
	const table:IDBObjectStore = db.transaction(table_name, "readwrite").objectStore(table_name);

	for(const entry of data) {
		// primary key included with data in 'entry'
		// updates if key already exists :)
		table.put(entry);
	}

	close_db(db);
}

export async function load_firebase(userId:string) : Promise<Record<string, any>|boolean> {
	const response = await fetch(buildBackendUrl("/api/fridge/get"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			"userId": userId
		})
	});

	if(response.ok) {
		const data = await response.json();
		console.log(JSON.stringify(data.data));
		return data.data;
	} else {
		console.log("fail load firebase");
		return false;
	}
}

// expiry must be a valid date string
export async function add_firebase(userId:string, name:string, quantity:number, unit:string, expiry:Record<string, any>|null, allergens:Array<string>) {
	const response = await fetch(buildBackendUrl("/api/fridge/add"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			"userId": userId,
			"name": name,
			"quantity": quantity,
			"unit": unit,
			"expiry": expiry,
			"allergens": allergens
		})
	});

	if(response.ok) {
		const data = await response.json();
		console.log(JSON.stringify(data));
	} else {
		console.log("fail add firebase");
	}
}

export async function remove_firebase(userId:string, itemId:string) {
	const response = await fetch(buildBackendUrl("api/fridge/delete"), {
		method: "POST",
		headers: {
			"Content-Type": "applications/json"
		},
		body: JSON.stringify({
			"userId": userId,
			"itemId": itemId
		})
	});

	if(response.ok) {
		const data = await response.json();
		console.log(JSON.stringify(data));
	} else {
		console.log("fail delete firebase");
	}
}