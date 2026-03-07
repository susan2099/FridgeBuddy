import {Link} from 'react-router-dom';

function Preferences() {
  return (
	<>
      <h1>Preferences</h1>
	  <div>
		<h2>Dietary Restrictions</h2>
		<h6><i>FridgeBuddy will do its best to always abide by your listed restrictions.</i></h6>
		<div className="outline">
			<p style={{color:"gray"}}>Examples: Diet plans, allergies...</p>
		</div>

		<h2>Dietary and Culinary Preferences</h2>
		<h6><i>FridgeBuddy will take into mind your preferences when generating recipes.</i></h6>
		<div className="outline">
			<p style={{color:"gray"}}>Examples: Culinary preferences, spice tolerance, ease of preparation...</p>
		</div>

		<Link to="/">
		  <button>Back</button>
		</Link>
      </div>
	</>
  )
}

export default Preferences;