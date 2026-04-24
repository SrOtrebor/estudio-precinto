import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Register from './components/Register';
import BidClient from './components/BidClient';
import Monitor from './components/Monitor';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('silent_auction_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/pujar" /> : <Register onRegister={setUser} />} 
        />
        <Route 
          path="/pujar" 
          element={user ? <BidClient user={user} /> : <Navigate to="/" />} 
        />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="/admin" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
