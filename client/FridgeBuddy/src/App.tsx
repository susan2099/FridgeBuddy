import './App.css'
import {Route, Routes} from 'react-router-dom';
import Home from './Home.tsx'
import Fridge from './Fridge.tsx'
import Recipes from './Recipes.tsx'
import Preferences from './Preferences.tsx'

function App() {
  return (
    <>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/fridge" element={<Fridge />}/>
          <Route path="/recipes" element={<Recipes />}/>
          <Route path="/prefs" element={<Preferences />}/>
        </Routes>
    </>
  )
}

export default App;