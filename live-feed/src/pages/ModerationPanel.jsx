import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, ref, onValue, update, remove, get, set, storage, storageRef, deleteObject } from "../firebase";

const ADMIN_KEY = "livefeed_admin_auth";

export default function ModerationPanel() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Auth simple por contraseña
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(ADMIN_KEY) === eventId);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [eventConfig, setEventConfig] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "approved" | "hidden" | "rsvps"
  const [loadingAction, setLoadingAction] = useState(null); // photoId being acted on
  const [rsvps, setRsvps] = useState([]);

  // ── Auth ──────────────────────────────────────────────────────────────────
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

  // ── Cargar config ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authed || !eventId) return;
    const configRef = ref(db, `livefeed/${eventId}/config`);
    get(configRef).then((snap) => { if (snap.exists()) setEventConfig(snap.val()); });
  }, [authed, eventId]);

  // ── Escuchar todas las fotos ──────────────────────────────────────────────
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

  // ── Escuchar RSVPs ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authed || !eventId) return;
    const rsvpsRef = ref(db, `livefeed/${eventId}/rsvps`);
    const unsub = onValue(rsvpsRef, (snap) => {
      const data = snap.val();
      if (!data) { setRsvps([]); return; }
      const list = Object.entries(data)
        .map(([id, r]) => ({ id, ...r }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setRsvps(list);
    });
    return () => unsub();
  }, [authed, eventId]);

  // ── Acciones ───────────────────────────────────────────────────────────────
  const handleApprove = async (photo) => {
    setLoadingAction(photo.id);
    await update(ref(db, `livefeed/${eventId}/photos/${photo.id}`), {
      status: "approved",
      hidden: false,
    });
    setLoadingAction(null);
  };

  const handleHide = async (photo) => {
    setLoadingAction(photo.id);
    await update(ref(db, `livefeed/${eventId}/photos/${photo.id}`), { hidden: !photo.hidden });
    setLoadingAction(null);
  };

  const handleDelete = async (photo) => {
    if (!window.confirm(`¿Eliminar la foto de ${photo.authorName}? Esta acción no se puede deshacer.`)) return;
    setLoadingAction(photo.id);
    try {
      // Borrar de Storage
      if (photo.storagePath) {
        const fileRef = storageRef(storage, photo.storagePath);
        await deleteObject(fileRef).catch(() => {}); // si ya no existe, ignorar
      }
      // Borrar de Realtime DB
      await remove(ref(db, `livefeed/${eventId}/photos/${photo.id}`));
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
    setLoadingAction(null);
  };

  const toggleAutoApprove = async () => {
    const newVal = !eventConfig.autoApprove;
    await update(ref(db, `livefeed/${eventId}/config`), { autoApprove: newVal });
    setEventConfig((prev) => ({ ...prev, autoApprove: newVal }));
  };

  const toggleCamera = async () => {
    const currentEnabled = eventConfig.cameraEnabled !== false; // default true
    const newVal = !currentEnabled;
    await update(ref(db, `livefeed/${eventId}/config`), { cameraEnabled: newVal });
    setEventConfig((prev) => ({ ...prev, cameraEnabled: newVal }));
  };

  // ── Filtrar fotos ─────────────────────────────────────────────────────────
  const filteredPhotos = photos.filter((p) => {
    if (filter === "pending") return p.status === "pending";
    if (filter === "approved") return p.status === "approved" && !p.hidden;
    if (filter === "hidden") return p.hidden;
    return true;
  });

  const pendingCount = photos.filter((p) => p.status === "pending").length;
  const approvedCount = photos.filter((p) => p.status === "approved" && !p.hidden).length;
  const hiddenCount = photos.filter((p) => p.hidden).length;

  // ── Render: login ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="mod-screen mod-screen--login">
        <div className="mod-login-card">
          <h1 className="mod-login-title">🎛️ Panel de Moderación</h1>
          <p className="mod-login-event">Evento: <strong>{eventId}</strong></p>
          <form onSubmit={handleLogin} className="mod-login-form">
            <input
              type="password"
              placeholder="Contraseña del evento"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setAuthError(false); }}
              className={`mod-login-input ${authError ? "mod-login-input--error" : ""}`}
              autoFocus
            />
            {authError && <p className="mod-login-error">Contraseña incorrecta</p>}
            <button type="submit" className="btn-primary">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Render: panel ─────────────────────────────────────────────────────────
  return (
    <div className="mod-screen">
      {/* Header */}
      <header className="mod-header">
        <div className="mod-header-left">
          <h1 className="mod-title">🎛️ Moderación</h1>
          <span className="mod-event-badge">{eventConfig?.eventName || eventId}</span>
        </div>
        <div className="mod-header-right">
          <button
            className={`mod-toggle ${eventConfig?.cameraEnabled !== false ? "mod-toggle--on" : "mod-toggle--off"}`}
            onClick={toggleCamera}
          >
            {eventConfig?.cameraEnabled !== false ? "📸 Cámara: ON" : "⏸️ Cámara: OFF"}
          </button>
          <button
            className={`mod-toggle ${eventConfig?.autoApprove ? "mod-toggle--on" : "mod-toggle--off"}`}
            onClick={toggleAutoApprove}
          >
            {eventConfig?.autoApprove ? "✅ Auto-aprobar: ON" : "🔒 Auto-aprobar: OFF"}
          </button>
          <button
            className="mod-monitor-btn"
            onClick={() => navigate(`/monitor/${eventId}`)}
          >
            📺 Ver Monitor
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="mod-stats">
        <div className={`mod-stat mod-stat--pending ${pendingCount > 0 ? "mod-stat--alert" : ""}`}
          onClick={() => setFilter("pending")} >
          <span className="stat-num">{pendingCount}</span>
          <span className="stat-label">Pendientes</span>
        </div>
        <div className="mod-stat mod-stat--approved" onClick={() => setFilter("approved")}>
          <span className="stat-num">{approvedCount}</span>
          <span className="stat-label">En pantalla</span>
        </div>
        <div className="mod-stat mod-stat--hidden" onClick={() => setFilter("hidden")}>
          <span className="stat-num">{hiddenCount}</span>
          <span className="stat-label">Ocultas</span>
        </div>
        <div className="mod-stat" onClick={() => setFilter("rsvps")} style={{ borderColor: filter === "rsvps" ? "var(--accent)" : "" }}>
          <span className="stat-num">{rsvps.length}</span>
          <span className="stat-label">RSVPs Confirmados</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="mod-filters">
        {["all", "pending", "approved", "hidden", "rsvps"].map((f) => (
          <button
            key={f}
            className={`mod-filter-btn ${filter === f ? "mod-filter-btn--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {{ all: "Todas las Fotos", pending: "Pendientes", approved: "Aprobadas", hidden: "Ocultas", rsvps: "RSVPs Confirmados" }[f]}
          </button>
        ))}
      </div>

      {/* Grilla principal */}
      {filter === "rsvps" ? (
        <div style={{ padding: "0 1.5rem 2rem" }}>
          {rsvps.length === 0 ? (
             <div className="mod-empty"><p>No hay confirmaciones de asistencia todavía.</p></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
              {rsvps.map(rsvp => (
                <div key={rsvp.id} className="mod-card" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <strong>{rsvp.name}</strong>
                    <span style={{ fontSize: "1.5rem" }}>✅</span>
                  </div>
                  <span className="mod-card-time">
                    {new Date(rsvp.timestamp).toLocaleDateString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="mod-empty">
          <p>No hay fotos en esta categoría</p>
        </div>
      ) : (
        <div className="mod-grid">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`mod-card ${photo.status === "pending" ? "mod-card--pending" : ""} ${photo.hidden ? "mod-card--hidden" : ""}`}
            >
              <div className="mod-card-img-wrapper">
                <img src={photo.imageUrl} alt={`Foto de ${photo.authorName}`} className="mod-card-img" />
                {photo.hidden && <div className="mod-card-hidden-overlay">OCULTA</div>}
                {photo.status === "pending" && <div className="mod-card-pending-badge">PENDIENTE</div>}
              </div>

              <div className="mod-card-info">
                <strong>{photo.authorName}</strong>
                <span className="mod-card-time">
                  {new Date(photo.uploadedAt).toLocaleTimeString("es-AR", {
                    hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              </div>

              <div className="mod-card-actions">
                {photo.status === "pending" && (
                  <button
                    className="mod-btn mod-btn--approve"
                    onClick={() => handleApprove(photo)}
                    disabled={loadingAction === photo.id}
                  >
                    ✅ Aprobar
                  </button>
                )}
                <button
                  className="mod-btn mod-btn--hide"
                  onClick={() => handleHide(photo)}
                  disabled={loadingAction === photo.id}
                >
                  {photo.hidden ? "👁️ Mostrar" : "🙈 Ocultar"}
                </button>
                <button
                  className="mod-btn mod-btn--delete"
                  onClick={() => handleDelete(photo)}
                  disabled={loadingAction === photo.id}
                >
                  {loadingAction === photo.id ? "..." : "🗑️"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
