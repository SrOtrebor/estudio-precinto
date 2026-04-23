import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import PhotoUpload from "./pages/PhotoUpload";
import LiveMonitor from "./pages/LiveMonitor";
import ModerationPanel from "./pages/ModerationPanel";
import Gallery from "./pages/Gallery";
import MasterDashboard from "./pages/MasterDashboard";
import Invitation from "./pages/Invitation";
import "./App.css";

function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Esta página no existe o el link del evento es incorrecto.</p>
    </div>
  );
}

function Home() {
  return (
    <div className="home-screen">
      <div className="home-card">
        <h1>📸 Social Live Feed</h1>
        <p>by Estudio Precinto</p>
        <p className="home-hint">
          Para acceder a un evento, usá el link que te dieron.
        </p>
        <div className="home-routes">
          <div className="home-route-item">
            <code>/foto/:eventoId</code>
            <span>App del invitado</span>
          </div>
          <div className="home-route-item">
            <code>/monitor/:eventoId</code>
            <span>Pantalla del salón</span>
          </div>
          <div className="home-route-item">
            <code>/moderar/:eventoId</code>
            <span>Panel de moderación</span>
          </div>
          <div className="home-route-item">
            <code>/galeria/:eventoId</code>
            <span>Galería post-evento</span>
          </div>
          <div className="home-route-item" style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <code>/admin-maestro</code>
            <span style={{ color: 'var(--accent)' }}>👑 Dashboard Maestro</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin-maestro" element={<MasterDashboard />} />
        <Route path="/invitacion/:eventId" element={<Invitation />} />
        <Route path="/foto/:eventId" element={<PhotoUpload />} />
        <Route path="/monitor/:eventId" element={<LiveMonitor />} />
        <Route path="/moderar/:eventId" element={<ModerationPanel />} />
        <Route path="/galeria/:eventId" element={<Gallery />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
