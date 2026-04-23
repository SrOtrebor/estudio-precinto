import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, ref, set, get, onValue } from "../firebase";

const MASTER_KEY = "livefeed_master_auth";

export default function MasterDashboard() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(MASTER_KEY) === "true");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formulario nuevo evento
  const [newEvent, setNewEvent] = useState({
    id: "",
    name: "",
    date: "",
    tier: "base",
    adminPassword: "",
    accentColor: "#a28a68"
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = (e) => {
    e.preventDefault();
    // VITE_MASTER_PASSWORD from .env
    const masterPassword = import.meta.env.VITE_MASTER_PASSWORD || "precintomaster2026";
    if (passwordInput === masterPassword) {
      sessionStorage.setItem(MASTER_KEY, "true");
      setAuthed(true);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(MASTER_KEY);
    setAuthed(false);
  };

  // ── Cargar Eventos ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    const eventsRef = ref(db, "livefeed");
    const unsub = onValue(eventsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const eventList = Object.keys(data).map(key => ({
          id: key,
          ...data[key].config
        })).sort((a, b) => b.createdAt - a.createdAt);
        setEvents(eventList);
      } else {
        setEvents([]);
      }
    });
    return () => unsub();
  }, [authed]);

  // ── Crear Evento ──────────────────────────────────────────────────────────
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.id.match(/^[a-z0-9-]+$/)) {
      alert("El ID del evento solo puede contener letras minúsculas, números y guiones.");
      return;
    }
    
    setLoading(true);
    const eventRef = ref(db, `livefeed/${newEvent.id}/config`);
    
    const snap = await get(eventRef);
    if (snap.exists()) {
      alert("Ya existe un evento con ese ID.");
      setLoading(false);
      return;
    }

    const configData = {
      eventName: newEvent.name,
      date: newEvent.date,
      tier: newEvent.tier,
      adminPassword: newEvent.adminPassword,
      accentColor: newEvent.accentColor,
      cameraEnabled: true,
      autoApprove: true,
      watermarkUrl: null, // Para implementar subida de archivos después si se necesita
      bannerUrls: [],
      createdAt: Date.now()
    };

    try {
      await set(eventRef, configData);
      setShowCreateModal(false);
      setNewEvent({ id: "", name: "", date: "", tier: "base", adminPassword: "", accentColor: "#a28a68" });
    } catch (err) {
      console.error(err);
      alert("Error al crear evento");
    } finally {
      setLoading(false);
    }
  };

  // ── Render: Login ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="mod-screen mod-screen--login">
        <div className="mod-login-card">
          <h1 className="mod-login-title">👑 Dashboard Maestro</h1>
          <form onSubmit={handleLogin} className="mod-login-form">
            <input
              type="password"
              placeholder="Contraseña Maestra"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setAuthError(false); }}
              className={`mod-login-input ${authError ? "mod-login-input--error" : ""}`}
              autoFocus
            />
            {authError && <p className="mod-login-error">Contraseña incorrecta</p>}
            <button type="submit" className="btn-primary">Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Render: Dashboard ─────────────────────────────────────────────────────
  return (
    <div className="mod-screen" style={{ display: 'block', padding: '2rem' }}>
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--accent)', fontSize: '2rem' }}>Dashboard Maestro</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            + Nuevo Evento
          </button>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tabla de eventos */}
      <div className="events-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {events.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No hay eventos creados.</p>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="mod-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{ev.eventName}</h3>
                <span className="mod-event-badge">{ev.id}</span>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pack: {ev.tier.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Fecha: {ev.date ? new Date(ev.date).toLocaleString() : 'No definida'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="mod-btn" onClick={() => window.open(`/#/invitacion/${ev.id}`, '_blank')}>🎟️ Invitación</button>
                <button className="mod-btn" onClick={() => window.open(`/#/monitor/${ev.id}`, '_blank')}>📺 Monitor</button>
                <button className="mod-btn" onClick={() => window.open(`/#/moderar/${ev.id}`, '_blank')}>🎛️ Moderación</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Creación */}
      {showCreateModal && (
        <div className="lightbox" onClick={() => setShowCreateModal(false)}>
          <div className="mod-login-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'left' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Crear Nuevo Evento</h2>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>ID del Evento (URL, ej: xv-vale)</label>
                <input type="text" className="mod-login-input" style={{ width: '100%' }} value={newEvent.id} onChange={e => setNewEvent({...newEvent, id: e.target.value.toLowerCase()})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nombre Público (ej: Los XV de Vale)</label>
                <input type="text" className="mod-login-input" style={{ width: '100%' }} value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Fecha y Hora</label>
                <input type="datetime-local" className="mod-login-input" style={{ width: '100%' }} value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Pack</label>
                <select className="mod-login-input" style={{ width: '100%' }} value={newEvent.tier} onChange={e => setNewEvent({...newEvent, tier: e.target.value})}>
                  <option value="base">Pack Base</option>
                  <option value="premium">Pack Premium</option>
                  <option value="corporativo">Pack Corporativo</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contraseña de Moderación</label>
                <input type="text" className="mod-login-input" style={{ width: '100%' }} value={newEvent.adminPassword} onChange={e => setNewEvent({...newEvent, adminPassword: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Color de Acento</label>
                <input type="color" value={newEvent.accentColor} onChange={e => setNewEvent({...newEvent, accentColor: e.target.value})} style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="mod-btn" onClick={() => setShowCreateModal(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
