import { load_firebase, add_firebase } from './DBManager';

// temp
import { type fridgeItem } from '../Fridge';

export async function load_fridge_data() {
	// change this to userID variable later
	return await load_firebase("test-user-1");
}

export async function save_to_fridge(items:Array<fridgeItem>) {
	for(const item of items) {
		add_firebase(
			"test-user-1",
			item.name,
			item.quantity,
			item.unit,
			item.expiry,
			item.allergens
		);
	}

	// trigger a 'reload' of the page to visually update?
}