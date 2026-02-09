import {Link} from 'react-router-dom';

function Preferences() {
  return (
	<>
      <h1>Preferences</h1>
	  <div>
		<Link to="/">
		  <button>Back</button>
		</Link>
      </div>
	</>
  )
}

export default Preferences;