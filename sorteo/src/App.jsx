import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Monitor from './pages/Monitor';
import Admin from './pages/Admin';

function App() {
  return (
    <Router basename="/sorteo">
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>

        <footer className="footer-banner">
          <div className="precinto-badge">
            TECNOLOGÍA DE ESTUDIO PRECINTO
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
