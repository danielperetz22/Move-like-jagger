import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import NavBar from './components/NavBar';
import RegisterPage from './pages/Register';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import MusicPage from './pages/MusicPage';
import ShowDetail from './pages/ShowDetail';

function App() {

  return (
    <BrowserRouter>
    <NavBar />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/music' element={<MusicPage />} />
        <Route path='/shows/:showId' element={<ShowDetail />} />
      </Routes>
    </BrowserRouter>
  )
   
}

export default App
