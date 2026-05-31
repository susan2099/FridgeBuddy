import './styles.css'
import {Link} from 'react-router-dom';

function Home() {
  return (
    <>
      <h1>FridgeBuddy</h1>

      <div style={{display:"flex"}} className="container">
        <Link to="/fridge" className='flexbox'>
          <button>Your Fridge</button>
        </Link>
        <Link to='/recipes' className='flexbox'>
              <button>Get Recipes</button>
        </Link>
        <Link to='/prefs' className='flexbox'>
              <button>Preferences</button>
        </Link>
      </div>
    </>
  )
}

export default Home;