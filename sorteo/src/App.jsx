import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Monitor from './pages/Monitor';
import Admin from './pages/Admin';
import Roulette from './pages/Roulette';
import LandingBanner from './pages/LandingBanner';
import logoPrecinto from './assets/logo-precinto.svg';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ height: '100dvh', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main className="main-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/monitor" element={<Monitor />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/ruleta" element={<Roulette />} />
            <Route path="/diagnostico" element={<LandingBanner />} />
          </Routes>
        </main>

        <footer className="footer-banner" style={{ 
          padding: '1.2rem', 
          borderTop: '1px solid var(--glass-border)', 
          background: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(10px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.8rem', 
          zIndex: 100, 
          flexShrink: 0 
        }}>
          <a href="https://estudioprecinto.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '1px' }}>Estudio Precinto</span>
            <img src={logoPrecinto} alt="Estudio Precinto" style={{ height: '20px', opacity: 0.8 }} />
            <div className="precinto-badge" style={{ fontSize: '0.75rem', letterSpacing: '4px', fontWeight: 'bold', color: 'var(--accent)', textShadow: '0 0 10px rgba(162, 138, 104, 0.2)' }}>
              TECNOLOGÍA QUE RESUELVE
            </div>
          </a>
        </footer>
      </div>
    </Router>
  );
}

export default App;
