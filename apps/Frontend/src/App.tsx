import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home';
import NavBar from './components/NavBar';
import RegisterPage from './pages/Register';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ShowDetail from './pages/Show';

function App() {
  return (
    <Router>
        <NavBar />
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/shows/:id" element={<ShowDetail />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </Router>
  );
}

export default App;
