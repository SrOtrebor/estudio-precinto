import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, ref, onValue, update, remove, get, set, storage, storageRef, deleteObject } from "../firebase";

const ADMIN_KEY = "livefeed_admin_auth";

export default function ModerationPanel() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [authed, setAuthed] = useState(() => sessionStorage.getItem(ADMIN_KEY) === eventId);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [eventConfig, setEventConfig] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loadingAction, setLoadingAction] = useState(null);
  const [rsvps, setRsvps] = useState([]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const configRef = ref(db, `livefeed/${eventId}/config`);
    const snap = await get(configRef);
    if (!snap.exists()) { setAuthError(true); return; }
    const config = snap.val();
    if (passwordInput === config.adminPassword) {
      sessionStorage.setItem(ADMIN_KEY, eventId);
      setAuthed(true);
      setEventConfig(config);
    } else {
      setAuthError(true);
    }
  };

  useEffect(() => {
    if (!authed || !eventId) return;
    const configRef = ref(db, `livefeed/${eventId}/config`);
    const unsub = onValue(configRef, (snap) => {
      if (snap.exists()) setEventConfig(snap.val());
    });
    return () => unsub();
  }, [authed, eventId]);

  useEffect(() => {
    if (!authed || !eventId) return;
    const photosRef = ref(db, `livefeed/${eventId}/photos`);
    const unsub = onValue(photosRef, (snap) => {
      const data = snap.val();
      if (!data) { setPhotos([]); return; }
      const list = Object.entries(data)
        .map(([id, p]) => ({ id, ...p }))
        .sort((a, b) => b.uploadedAt - a.uploadedAt);
      setPhotos(list);
    });
    return () => unsub();
  }, [authed, eventId]);

  useEffect(() => {
    if (!authed || !eventId) return;
    const rsvpsRef = ref(db, `livefeed/${eventId}/rsvps`);
    const unsub = onValue(rsvpsRef, (snap) => {
      const data = snap.val();
      if (!data) { setRsvps([]); return; }
      const list = Object.entries(data).map(([id, r]) => ({ id, ...r }));
      setRsvps(list.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsub();
  }, [authed, eventId]);

  const handleApprove = async (photo) => {
    setLoadingAction(photo.id);
    await update(ref(db, `livefeed/${eventId}/photos/${photo.id}`), { status: "approved", hidden: false });
    setLoadingAction(null);
  };

  const handleHide = async (photo) => {
    setLoadingAction(photo.id);
    await update(ref(db, `livefeed/${eventId}/photos/${photo.id}`), { hidden: !photo.hidden });
    setLoadingAction(null);
  };

  const handleDelete = async (photo) => {
    if (!window.confirm(`¿Borrar definitivamente?`)) return;
    setLoadingAction(photo.id);
    try {
      if (photo.storagePath) await deleteObject(storageRef(storage, photo.storagePath)).catch(() => {});
      await remove(ref(db, `livefeed/${eventId}/photos/${photo.id}`));
    } catch (err) { console.error(err); }
    setLoadingAction(null);
  };

  const toggleAutoApprove = async () => {
    await update(ref(db, `livefeed/${eventId}/config`), { autoApprove: !eventConfig.autoApprove });
  };

  const toggleCamera = async () => {
    const newVal = !(eventConfig.cameraEnabled !== false);
    await update(ref(db, `livefeed/${eventId}/config`), { cameraEnabled: newVal });
  };

  const filteredPhotos = photos.filter((p) => {
    if (filter === "pending") return p.status === "pending";
    if (filter === "approved") return p.status === "approved" && !p.hidden;
    if (filter === "hidden") return p.hidden;
    return true;
  });

  const stats = {
    pending: photos.filter(p => p.status === "pending").length,
    approved: photos.filter(p => p.status === "approved" && !p.hidden).length,
    rsvps: rsvps.length
  };

  if (!authed) {
    return (
      <div className="mod-screen mod-screen--login">
        <div className="mod-login-card">
          <h1 className="mod-login-title">🎛️ Moderación</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Evento: {eventId}</p>
          <form onSubmit={handleLogin} className="mod-login-form">
            <input
              type="password"
              placeholder="Contraseña del evento"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setAuthError(false); }}
              className={`mod-login-input ${authError ? "mod-login-input--error" : ""}`}
              autoFocus
            />
            {authError && <p className="mod-login-error">Acceso denegado</p>}
            <button type="submit" className="btn-primary">Ingresar al Panel</button>
          </form>
        </div>
      </div>
    );
  }

  const accentColor = eventConfig?.accentColor || "#a28a68";
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "162, 138, 104";
  };

  return (
    <div className="mod-screen" style={{ "--accent": accentColor, "--accent-rgb": hexToRgb(accentColor) }}>
      <header className="mod-header-premium">
        <div className="mod-header-title">
          <p>Moderación</p>
          <h1>{eventConfig?.eventName || eventId}</h1>
        </div>
        
        <div className="mod-controls">
          <button 
            className={`mod-toggle-btn ${eventConfig?.cameraEnabled !== false ? 'mod-toggle-btn--active' : ''}`}
            onClick={toggleCamera}
          >
            {eventConfig?.cameraEnabled !== false ? '📸 Cámara ON' : '⏸️ Cámara OFF'}
          </button>
          <button 
            className={`mod-toggle-btn ${eventConfig?.autoApprove ? 'mod-toggle-btn--active' : ''}`}
            onClick={toggleAutoApprove}
          >
            {eventConfig?.autoApprove ? '✅ Auto-Aprobar' : '🔒 Manual'}
          </button>
          <button className="mod-btn" onClick={() => navigate(`/monitor/${eventId}`)}>📺 Monitor</button>
          <button className="mod-btn" style={{ background: 'transparent', border: '1px solid #444' }} onClick={() => { sessionStorage.removeItem(ADMIN_KEY); setAuthed(false); }}>Cerrar</button>
        </div>
      </header>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', background: 'rgba(255,255,255,0.02)' }}>
        {[
          { id: 'all', label: 'Todas', count: photos.length },
          { id: 'pending', label: 'Pendientes', count: stats.pending, color: 'var(--warning)' },
          { id: 'approved', label: 'En Pantalla', count: stats.approved, color: 'var(--success)' },
          { id: 'rsvps', label: 'RSVPs', count: stats.rsvps }
        ].map(s => (
          <button 
            key={s.id}
            onClick={() => setFilter(s.id)}
            style={{ 
              background: filter === s.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: filter === s.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              padding: '0.5rem 1.2rem', borderRadius: '12px', color: s.color || '#fff', cursor: 'pointer'
            }}
          >
            <strong>{s.count}</strong> {s.label}
          </button>
        ))}
      </div>

      <main className="mod-grid-premium">
        {filter === 'rsvps' ? (
          rsvps.map(r => (
            <div key={r.id} className="photo-card-premium" style={{ padding: '1.5rem' }}>
              <span className="photo-author">{r.name}</span>
              <span className="photo-time">{new Date(r.timestamp).toLocaleString()}</span>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--accent)' }}>Confirmado ✓</div>
            </div>
          ))
        ) : filteredPhotos.length === 0 ? (
          <div className="mod-empty-state">
            <i>📂</i>
            <p>No hay fotos para mostrar</p>
          </div>
        ) : (
          filteredPhotos.map(photo => (
            <div key={photo.id} className="photo-card-premium">
              {photo.status === 'pending' && <div className="status-badge-pending">PENDIENTE</div>}
              <img src={photo.imageUrl} className="photo-card-img" alt="Guest" />
              
              <div className="photo-card-footer">
                <span className="photo-author">{photo.authorName}</span>
                <span className="photo-time">{new Date(photo.uploadedAt).toLocaleTimeString()}</span>
              </div>

              <div className="photo-actions-bar">
                {photo.status === 'pending' && (
                  <button className="action-btn btn-approve" onClick={() => handleApprove(photo)}>Aprobar</button>
                )}
                <button className="action-btn btn-hide" onClick={() => handleHide(photo)}>
                  {photo.hidden ? 'Mostrar' : 'Ocultar'}
                </button>
                <button className="action-btn btn-delete" onClick={() => handleDelete(photo)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
