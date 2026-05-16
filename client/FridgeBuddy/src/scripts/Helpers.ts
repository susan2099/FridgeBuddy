/* Firestore stores timestamps as an object: 
	{
		_seconds: int
		_nanoseconds: int
	}
*/

export function seconds_to_string_date(seconds:number) {
	const date = new Date(seconds * 1000);
	return date.toLocaleDateString();
}