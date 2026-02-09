import {Link} from 'react-router-dom';

function Recipes() {
  return (
	<>
      <h1>Get Recipes</h1>
	  <div>
		<Link to="/">
		  <button>Back</button>
		</Link>
      </div>
	</>
  )
}

export default Recipes;