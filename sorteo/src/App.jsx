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

        <footer className="footer-banner" style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', opacity: 0.8, background: 'rgba(0,0,0,0.2)' }}>
          <img src={logoPrecinto} alt="Estudio Precinto" style={{ height: '16px', opacity: 0.6 }} />
          <div className="precinto-badge" style={{ fontSize: '0.7rem', letterSpacing: '4px', fontWeight: 'bold' }}>
            TECNOLOGÍA QUE RESUELVE
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
