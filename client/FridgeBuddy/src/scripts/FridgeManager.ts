import * as CONSTS from './CONSTS';
import { open_db, close_db, save_yaml_to_db } from './DBManager';

// table should be tbody element!
async function write_table(db:IDBDatabase, table:HTMLTableSectionElement, table_name:string, cells:Array<string>) : Promise<HTMLTableSectionElement | boolean> {
	table.innerHTML = ""; // clear old rows

	return new Promise<HTMLTableSectionElement | boolean>(
		(resolve) => {
			const request = db.transaction(table_name, "readonly").objectStore(table_name).openCursor();
			request.onsuccess = function() { // runs once for each item in database
				// write updated rows to table
				const cursor = request.result;
				if(cursor) {
					const data:Record<string, any> = cursor.value;

					const row = table!.insertRow(-1); // insert row at last position in table
					for(let i = 0; i < cells.length; i++) { // write cell data
						const cell = row.insertCell(i);
						cell.innerHTML = data[cells[i]];
					}
					
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
	const db: IDBDatabase = await open_db(CONSTS.FRIDGE_DB, [CONSTS.FRIDGE_TABLE]);

	const old_table_innerHTML = (document.getElementById("fridgeTable") as HTMLTableElement).tBodies.item(0)!.innerHTML; // store in case load failure: restore old HTML
	const table = (document.getElementById("fridgeTable") as HTMLTableElement).tBodies.item(0) as HTMLTableSectionElement;

	const result = await write_table(db, table, CONSTS.FRIDGE_TABLE,
		[
			CONSTS.FRIDGE_ITEM_NAME_COLUMN,
			CONSTS.FRIDGE_ITEM_QTY_COLUMN,
			CONSTS.FRIDGE_ITEM_EXPIRY_COLUMN,
		]) as HTMLTableSectionElement | boolean;
	if (result !== false) {
		table.innerHTML = (result as HTMLTableSectionElement).innerHTML;
	} else { // failed
		console.log("failed load");
		table!.innerHTML = old_table_innerHTML;
	}

	close_db(db);
}

export async function load_fridge_data() {
	const db: IDBDatabase = await open_db(CONSTS.FRIDGE_DB, [CONSTS.FRIDGE_TABLE]);
	const ingredients = [] as Array<string>;

	return new Promise<Array<string> | boolean>(
		(resolve) => {
			const request = db.transaction(CONSTS.FRIDGE_TABLE, "readonly").objectStore(CONSTS.FRIDGE_TABLE).openCursor();

			request.onsuccess = function() { // runs once for each item in database
				// write updated rows to table
				const cursor = request.result;
				if(cursor) {
					const data:Record<string, any> = cursor.value;
					ingredients.push(data[CONSTS.FRIDGE_ITEM_NAME_COLUMN]);
					
					cursor.continue();
				} else {
					resolve(ingredients);
				}
			}

			request.onerror = function() {
				resolve(false);
			}
		}
	);
}

export async function T_save_and_load() {
	await save_yaml_to_db(`# TESTING PURPOSES ONLY!
items:
  - id: 1770614655810
    name: Raw Chicken
    quantity: 2 lbs
    expiry: '1970-01-01'
    addedAt: '2026-02-09T05:24:15.810Z'
  - id: 1770614722496
    name: Strawberries
    quantity: 1 qt
    expiry: '1970-01-01'
    addedAt: '2026-02-09T05:25:22.496Z'
  - id: 1770614722623
    name: Large Eggs
    quantity: 18
    expiry: '1970-01-01'
    addedAt: '2026-02-09T05:25:22.496Z'
  - id: 1770614722576
    name: Chocolate Cake
    quantity: 1 slice
    expiry: '1970-01-01'
    addedAt: '2026-02-09T05:25:22.496Z'`, CONSTS.FRIDGE_YAML_TABLE, CONSTS.FRIDGE_DB, CONSTS.FRIDGE_TABLE);
	await load_to_fridge();
}