import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home1';
import NavBar from './components/NavBar';
import RegisterPage from './pages/Register';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ShowDetail from './pages/Show';
import AdminResultsPage from './pages/AdminResult';

function App() {
  return (
    <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/main" element={<DashboardPage />} />
          <Route path="/admin/results" element={<AdminResultsPage />} />
          <Route path="/shows/:id" element={<ShowDetail />} />
        </Routes>
    </Router>
  );
}

export default App;
