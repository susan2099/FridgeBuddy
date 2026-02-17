import { parse } from 'yaml' // https://eemeli.org/yaml/#parse-amp-stringify

const TABLE_NAME = "fridge";
const YAML_TABLE_NAME = "items";

// id, name, quantity, expiry, addedAt
// const PRIMARY_KEY = "id";
const NAME_COLUMN = "name";
const QTY_COLUMN = "quantity";
const EXPIRY_COLUMN = "expiry";

async function open_db() : Promise<IDBDatabase> {
	return await new Promise((resolve, reject) => {
		const request = window.indexedDB.open("FridgeDB", 1);

		request.onerror = function() {
			console.log("open_db: Failed to open database:", request.error);
			reject(request.error);
		};

		request.onsuccess = function() {
			console.log("open_db: Succeeded in opening database");

			const db = request.result;
			if(!db.objectStoreNames.contains(TABLE_NAME)) {
				console.log("open_db: table does not exist");
			}

			resolve(request.result);
		};

		request.onupgradeneeded = function() {
			console.log("open_db: Upgrading database");
			const db = request.result;

			if(!db.objectStoreNames.contains(TABLE_NAME)) {
				db.createObjectStore(TABLE_NAME, {keyPath: "id"});
			}
		};
	});
}

function close_db(db:IDBDatabase):undefined {
	console.log("close_db()");
	db!.close();
}

export async function save_to_db(yaml:string) {
	console.log("save_to_db()");

	const data:Array<Record<string, any>> = parse(yaml)[YAML_TABLE_NAME];
	console.log("save_to_db: received yaml:", data.toString);

	const db:IDBDatabase = await open_db();

	const table:IDBObjectStore = db.transaction(TABLE_NAME, "readwrite").objectStore(TABLE_NAME);

	for(const entry of data) {
		table.put(entry); // primary key included with data in 'entry'
	}

	close_db(db);
}

// https://www.w3schools.com/jsref/met_table_insertrow.asp
export async function load_to_fridge() {
	console.log("load_to_fridge()");
	const table = document.getElementById("fridgeTable") as HTMLTableElement;
	const db:IDBDatabase = await open_db();

	const request = db.transaction(TABLE_NAME, "readonly").objectStore(TABLE_NAME).openCursor();

	request.onsuccess = function() {
		console.log("load_to_fridge: loading");

		const cursor = request.result;
		if(cursor) {
			const data:Record<string, any> = cursor.value;

			const row = table!.insertRow(-1); // insert row at last position in table
		
			const name = row.insertCell(0);
			const qty = row.insertCell(1);
			const expiry = row.insertCell(2);
			// const allergens = row.insertCell(3);
		
			name.innerHTML = data[NAME_COLUMN];
			qty.innerHTML = data[QTY_COLUMN];
			expiry.innerHTML = data[EXPIRY_COLUMN];
			
			cursor.continue();
		} else {
			console.log("load_to_fridge: done iterating");
		}
	}

	request.onerror = function() {
		console.log("load_to_fridge: failed to load");
	}
}

export async function T_save_and_load() {
	await save_to_db(`# TESTING PURPOSES ONLY!
items:
  - id: 1770614655810
    name: Chicken
    quantity: 2
    expiry: '2026-02-20'
    addedAt: '2026-02-09T05:24:15.810Z'
  - id: 1770614722496
    name: Chicken
    quantity: 2
    expiry: 2026-2-20
    addedAt: '2026-02-09T05:25:22.496Z'`);
	await load_to_fridge();
}