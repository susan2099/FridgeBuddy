import './App.css'
import {Route, Routes} from 'react-router-dom';
import Home from './Home.tsx'
import Fridge from './Fridge.tsx'
import Recipes from './Recipes.tsx'
import Preferences from './Preferences.tsx'
// import Settings from './Settings.tsx'
import { useEffect } from 'react';
import { registerPushNotifications } from './registerPushNotifications.ts';

function App() {
  useEffect(() => {
    return registerPushNotifications();
  }, []);

  return (
    <div style={{
      width:"100%",
    }}>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/fridge" element={<Fridge />}/>
          <Route path="/recipes" element={<Recipes />}/>
          <Route path="/prefs" element={<Preferences />}/>
          {/* <Route path="/settings" element={<Settings />}/> */}
        </Routes>
    </div>
  )
}

export default App;