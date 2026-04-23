import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, ref, set, get, onValue, remove, storage, storageRef, uploadBytes, getDownloadURL } from "../firebase";

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
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFiles, setBannerFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState("");

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
    setUploadProgress("Validando...");
    
    const eventRef = ref(db, `livefeed/${newEvent.id}/config`);
    const snap = await get(eventRef);
    if (snap.exists()) {
      alert("Ya existe un evento con ese ID.");
      setLoading(false);
      return;
    }

    try {
      let logoUrl = null;
      let bannerUrls = [];

      // 1. Subir Logo si existe
      if (logoFile) {
        setUploadProgress("Subiendo logo...");
        const logoRef = storageRef(storage, `livefeed/${newEvent.id}/logo_${Date.now()}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      // 2. Subir Banners si existen
      if (bannerFiles.length > 0) {
        setUploadProgress(`Subiendo ${bannerFiles.length} banners...`);
        for (let i = 0; i < bannerFiles.length; i++) {
          const bRef = storageRef(storage, `livefeed/${newEvent.id}/banner_${i}_${Date.now()}`);
          await uploadBytes(bRef, bannerFiles[i]);
          const bUrl = await getDownloadURL(bRef);
          bannerUrls.push(bUrl);
        }
      }

      const configData = {
        eventName: newEvent.name,
        date: newEvent.date,
        tier: newEvent.tier,
        adminPassword: newEvent.adminPassword,
        accentColor: newEvent.accentColor,
        cameraEnabled: true,
        autoApprove: true,
        logoUrl: logoUrl,
        bannerUrls: bannerUrls,
        createdAt: Date.now()
      };

      await set(eventRef, configData);
      setShowCreateModal(false);
      setNewEvent({ id: "", name: "", date: "", tier: "base", adminPassword: "", accentColor: "#a28a68" });
      setLogoFile(null);
      setBannerFiles([]);
      setUploadProgress("");
    } catch (err) {
      console.error(err);
      alert("Error al crear evento: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm(`¿Estás seguro de que querés borrar el evento "${eventId}"? Se perderán todas las fotos y configuración.`)) return;
    
    try {
      await remove(ref(db, `livefeed/${eventId}`));
      alert("Evento eliminado.");
    } catch (err) {
      alert("Error al eliminar: " + err.message);
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
      <div className="events-grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {events.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: '1rem', border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No hay eventos activos.</p>
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="mod-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', position: 'relative', borderTop: `4px solid ${ev.accentColor}` }}>
              <button 
                onClick={() => handleDeleteEvent(ev.id)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(224,92,92,0.1)', color: 'var(--danger)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}
                title="Eliminar Evento"
              >
                ✕
              </button>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {ev.logoUrl ? (
                  <img src={ev.logoUrl} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', background: 'var(--bg-glass)' }} />
                ) : (
                  <div style={{ width: '60px', height: '60px', background: 'var(--bg-glass)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📸</div>
                )}
                <div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{ev.eventName}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="mod-event-badge" style={{ fontSize: '0.7rem' }}>{ev.id}</span>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: '700', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '10px',
                      background: ev.tier === 'corporativo' ? 'var(--accent)' : (ev.tier === 'premium' ? '#c4a97a' : 'var(--bg-glass)'),
                      color: ev.tier === 'corporativo' ? '#000' : '#fff'
                    }}>
                      {ev.tier.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <p>📅 <strong>Fecha:</strong> {ev.date ? new Date(ev.date).toLocaleString('es-AR') : 'No definida'}</p>
                <p>🎥 <strong>Banners:</strong> {ev.bannerUrls?.length || 0} cargados</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="mod-btn" style={{ padding: '0.7rem' }} onClick={() => window.open(`${window.location.pathname}#/invitacion/${ev.id}`, '_blank')}>🎟️ Invitación</button>
                <button className="mod-btn" style={{ padding: '0.7rem' }} onClick={() => window.open(`${window.location.pathname}#/monitor/${ev.id}`, '_blank')}>📺 Monitor</button>
                <button className="mod-btn" style={{ padding: '0.7rem', gridColumn: '1 / -1' }} onClick={() => window.open(`${window.location.pathname}#/moderar/${ev.id}`, '_blank')}>🛠️ Gestionar Evento (Mod)</button>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Logo del Evento</label>
                  <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Color Acento</label>
                  <input type="color" value={newEvent.accentColor} onChange={e => setNewEvent({...newEvent, accentColor: e.target.value})} style={{ width: '100%', height: '35px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Banners Publicitarios (Imágenes o Video)</label>
                <input type="file" accept="image/*,video/*" multiple onChange={e => setBannerFiles(Array.from(e.target.files))} style={{ fontSize: '0.8rem' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>* Solo para planes Corporativo</p>
              </div>
              
              {uploadProgress && (
                <div style={{ padding: '0.8rem', background: 'var(--accent-glow)', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--accent)', fontWeight: '600' }}>
                  ⏳ {uploadProgress}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="mod-btn" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '0.8rem' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.8rem' }} disabled={loading}>
                  {loading ? 'Subiendo...' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
