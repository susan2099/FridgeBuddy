import {Link} from 'react-router-dom';
// import {save_to_db as save, load_to_fridge as load} from './scripts/loadfridge';
import {T_save_and_load as test} from './scripts/FridgeManager';

function Fridge() {
  return (
	<>
      <h1>Your Fridge</h1>
	  <div>
		<table id="fridgeTable">
			<tr>
				<th>Item</th>
				<th>Quantity</th>
				<th>Expiration Date</th>
			</tr>
		</table>
	  </div>

	  <div>
		<button onClick={test}>Add (+)</button>
		<Link to="/">
		  <button>Back</button>
		</Link>
      </div>
	</>
  )
}

export default Fridge;