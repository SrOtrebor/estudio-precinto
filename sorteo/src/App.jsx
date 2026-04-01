import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Monitor from './pages/Monitor';
import Admin from './pages/Admin';
import logoPrecinto from './assets/logo-precinto.svg';

function App() {
  return (
    <Router basename="/sorteo">
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>

        <footer className="footer-banner" style={{ padding: '2.5rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem', opacity: 0.95, background: 'rgba(0,0,0,0.4)', transition: 'all 0.3s ease' }}>
          <img src={logoPrecinto} alt="Estudio Precinto" style={{ height: '28px', opacity: 0.8 }} />
          <div className="precinto-badge" style={{ fontSize: '1rem', letterSpacing: '6px', fontWeight: 'bold', color: 'var(--accent)', textShadow: '0 0 15px rgba(162, 138, 104, 0.3)' }}>
            TECNOLOGÍA QUE RESUELVE
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
