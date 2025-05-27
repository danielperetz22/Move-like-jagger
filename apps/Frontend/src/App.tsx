import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import NavBar from './components/NavBar';
import RegisterPage from './pages/Register';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';


function App() {

  return (
    <BrowserRouter>
    <NavBar />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/dashboard' element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
   
}

export default App
