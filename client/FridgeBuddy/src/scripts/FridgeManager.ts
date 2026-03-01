import { parse } from 'yaml' // https://eemeli.org/yaml/#parse-amp-stringify

const DATABASE_NAME = "FridgeDB";
const TABLE_NAME = "fridge";
const YAML_TABLE_NAME = "items";

// id, name, quantity, expiry, addedAt
// const PRIMARY_KEY = "id";
const NAME_COLUMN = "name";
const QTY_COLUMN = "quantity";
const EXPIRY_COLUMN = "expiry";

export async function print_db() {
	const db = await open_db();
	const tx = db.transaction(TABLE_NAME, 'readonly');
	const store = tx.objectStore(TABLE_NAME);

	const allItems = store.getAll();
	allItems.onsuccess = () => {
		const items = allItems.result;

		let string = `ObjectStore: ${TABLE_NAME}\n`;

		for(const itemId in items) {
			let properties = "";

			const item = items[itemId]
			for(const property_key in item) {
				properties += `${property_key} : ${item[property_key]}, `;
			}

			string += `${itemId} : ${properties}\n`;
		}

		console.log(string);
	};

	close_db(db);
}

async function open_db() : Promise<IDBDatabase> {
	return await new Promise((resolve, reject) => {
		const request = window.indexedDB.open(DATABASE_NAME, 1);

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
	console.log("save_to_db: received yaml:", data.toString());

	const db:IDBDatabase = await open_db();

	const table:IDBObjectStore = db.transaction(TABLE_NAME, "readwrite").objectStore(TABLE_NAME);

	for(const entry of data) {
		// primary key included with data in 'entry'
		// updates if key already exists :)
		table.put(entry);
	}

	close_db(db);
}

// table should be tbody element!
async function write_table(db:IDBDatabase, table:HTMLTableSectionElement) : Promise<HTMLTableSectionElement | boolean> {
	table.innerHTML = ""; // clear old rows

	return new Promise<HTMLTableSectionElement | boolean>(
		(resolve) => {
			const request = db.transaction(TABLE_NAME, "readonly").objectStore(TABLE_NAME).openCursor();
			request.onsuccess = function() { // runs once for each item in database
				// write updated rows to table
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
					resolve(table);
				}
			}

			request.onerror = function() {
				resolve(false);
			}

		}
	);

}

// https://www.w3schools.com/jsref/met_table_insertrow.asp
export async function load_to_fridge() {
	console.log("load_to_fridge()");
	const db:IDBDatabase = await open_db();
	
	const old_table_innerHTML = (document.getElementById("fridgeTable") as HTMLTableElement).tBodies.item(0)!.innerHTML; // store in case load failure: restore old HTML
	const table = (document.getElementById("fridgeTable") as HTMLTableElement).tBodies.item(0) as HTMLTableSectionElement;
	
	const result = await write_table(db, table) as HTMLTableSectionElement | boolean;
	if(result !== false) {
		table.innerHTML = (result as HTMLTableSectionElement).innerHTML;
	} else { // failed
		console.log("failed load");
		table!.innerHTML = old_table_innerHTML;
	}
 
	close_db(db);
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