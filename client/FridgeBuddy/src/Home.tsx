import './styles.css'
import { Link } from 'react-router-dom';

function Home() {
	return (
		<div style={{
			display:"flex",
			flexDirection:"column",
			height:"calc(100dvh - 4rem)",
			justifyContent:"center",
		}}>
			<h1>FridgeBuddy</h1>

			<div style={{ display: "flex" }} className="container">
				<Link to="/fridge" className='flexbox'>
					<button>Your Fridge</button>
				</Link>
				<Link to='/recipes' className='flexbox'>
					<button>Get Recipes</button>
				</Link>
				<Link to='/prefs' className='flexbox'>
					<button>Preferences</button>
				</Link>
				{/* <Link to='/settings' className='flexbox'>
					<button>Settings</button>
				</Link> */}
			</div>
		</div>
	)
}

export default Home;