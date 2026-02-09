import {Link} from 'react-router-dom';

function Fridge() {
  return (
	<>
      <h1>Your Fridge</h1>
	  <div>
		<Link to="/">
		  <button>Back</button>
		</Link>
      </div>
	</>
  )
}

export default Fridge;