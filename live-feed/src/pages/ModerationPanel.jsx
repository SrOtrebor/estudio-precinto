import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, ref, onValue, update, remove, get, set, storage, storageRef, deleteObject, uploadBytes, getDownloadURL } from "../firebase";

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
  const [wishlist, setWishlist] = useState([]);

  // Nuevos estados para Sorteo y Pantalla
  const [monitorState, setMonitorState] = useState({ mode: 'feed', drawStatus: 'waiting', winnerId: null });
  const [ads, setAds] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [adUploadFile, setAdUploadFile] = useState(null);
  const [showSorteoModal, setShowSorteoModal] = useState(false);

  // States para config tiempos locales (para no re-renderizar todo el config a cada tecla)
  const [localSlideInterval, setLocalSlideInterval] = useState(7);
  const [localAdInterval, setLocalAdInterval] = useState(8);
  const [localBannerInterval, setLocalBannerInterval] = useState(5);

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
      if (snap.exists()) {
        const conf = snap.val();
        setEventConfig(conf);
        if (conf.slideIntervalSeconds) setLocalSlideInterval(conf.slideIntervalSeconds);
        if (conf.adIntervalSeconds) setLocalAdInterval(conf.adIntervalSeconds);
        if (conf.bannerIntervalPhotos) setLocalBannerInterval(conf.bannerIntervalPhotos);
      }
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

  useEffect(() => {
    if (!authed || !eventId) return;
    const wishlistRef = ref(db, `livefeed/${eventId}/wishlist`);
    const unsub = onValue(wishlistRef, (snap) => {
      const data = snap.val();
      if (!data) { setWishlist([]); return; }
      const list = Object.entries(data).map(([id, w]) => ({ id, ...w }));
      setWishlist(list);
    });
    return () => unsub();
  }, [authed, eventId]);

  useEffect(() => {
    if (!authed || !eventId) return;
    const monitorRef = ref(db, `livefeed/${eventId}/monitorState`);
    const unsub = onValue(monitorRef, (snap) => {
      if (snap.exists()) setMonitorState(snap.val());
    });
    return () => unsub();
  }, [authed, eventId]);

  useEffect(() => {
    if (!authed || !eventId) return;
    const adsRef = ref(db, `livefeed/${eventId}/ads`);
    const unsub = onValue(adsRef, (snap) => {
      const data = snap.val();
      if (!data) { setAds([]); return; }
      const list = Object.entries(data).map(([id, a]) => ({ id, ...a }));
      setAds(list);
    });
    return () => unsub();
  }, [authed, eventId]);

  useEffect(() => {
    if (!authed || !eventId) return;
    const participantsRef = ref(db, `livefeed/${eventId}/participants`);
    const unsub = onValue(participantsRef, (snap) => {
      const data = snap.val();
      if (!data) { setParticipants([]); return; }
      const list = Object.entries(data).map(([id, p]) => ({ id, ...p }));
      setParticipants(list);
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

  const exportToCSV = () => {
    // Combinar RSVPs y Participantes de Check-in
    const allGuestsMap = new Map();

    rsvps.forEach(r => {
      if (r.dni) {
        allGuestsMap.set(r.dni, {
          dni: r.dni,
          name: r.name,
          phone: r.phone || 'N/A',
          email: r.email || 'N/A',
          marca: r.emprendimiento || 'N/A',
          attendingRSVP: r.attending ? "Sí" : "No",
          checkedIn: "No",
          raffleNumber: "-",
          isWinner: "No",
          prizeOrder: "-"
        });
      }
    });

    participants.forEach(p => {
      const dni = p.id || p.dni;
      const existing = allGuestsMap.get(dni) || {};
      allGuestsMap.set(dni, {
        dni: dni,
        name: p.name || existing.name || 'Sin nombre',
        phone: p.phone || existing.phone || 'N/A',
        email: p.email || existing.email || 'N/A',
        marca: p.emprendimiento || existing.marca || 'N/A',
        attendingRSVP: existing.attendingRSVP || "Sí",
        checkedIn: p.checkedIn ? "Sí" : "Sí (Presencial)",
        raffleNumber: p.raffleNumber || "-",
        isWinner: p.isWinner ? "🏆 GANADOR" : "No",
        prizeOrder: p.prizeNumber ? `Premio #${p.prizeNumber}` : "-"
      });
    });

    const guestsList = Array.from(allGuestsMap.values());

    if (guestsList.length === 0) {
      alert("No hay registros de asistentes o confirmaciones para exportar.");
      return;
    }
    
    const headers = ["DNI", "Nombre", "Teléfono", "Email", "Marca / Emprendimiento", "RSVP Asistirá", "Check-in Puerta", "N° Sorteo", "Ganador", "Orden Premio"];
    const rows = guestsList.map(g => [
      `"${g.dni}"`,
      `"${g.name}"`,
      `"${g.phone}"`,
      `"${g.email}"`,
      `"${g.marca}"`,
      `"${g.attendingRSVP}"`,
      `"${g.checkedIn}"`,
      `"${g.raffleNumber}"`,
      `"${g.isWinner}"`,
      `"${g.prizeOrder}"`
    ]);
    
    // Agregar BOM UTF-8 (\uFEFF) para apertura perfecta en Excel
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Asistentes_Ganadores_${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWishlistCSV = () => {
    if (wishlist.length === 0) {
      alert("No hay regalos en la lista.");
      return;
    }
    
    const headers = ["Regalo", "Reservado por"];
    const rows = wishlist.map(w => [
      `"${w.name}"`,
      `"${w.reservedBy || 'Sin reservar'}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wishlist_${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const setMonitorMode = async (mode) => {
    await update(ref(db, `livefeed/${eventId}/monitorState`), { mode });
  };

  const handleLaunchGiveaway = async () => {
    const elegibles = participants.filter(p => !p.isWinner);
    if (elegibles.length === 0) {
      alert("No hay participantes elegibles para el sorteo.");
      return;
    }
    const ganador = elegibles[Math.floor(Math.random() * elegibles.length)];
    
    // Contar premios anteriores
    const premiosEntregados = participants.filter(p => p.isWinner).length;
    const nuevoPremioNumero = premiosEntregados + 1;

    // Actualizar estado del monitor a 'drawing'
    await update(ref(db, `livefeed/${eventId}/monitorState`), { 
      mode: 'sorteo', 
      drawStatus: 'drawing',
      winnerId: null 
    });

    // Esperar unos segundos de suspenso (animación ruleta) y luego setear ganador
    setTimeout(async () => {
      await update(ref(db, `livefeed/${eventId}/monitorState`), { 
        drawStatus: 'finished',
        winnerId: ganador.id 
      });
      // Marcar participante como ganador
      await update(ref(db, `livefeed/${eventId}/participants/${ganador.id}`), {
        isWinner: true,
        prizeNumber: nuevoPremioNumero
      });
    }, 4000);
  };

  const saveTimings = async () => {
    await update(ref(db, `livefeed/${eventId}/config`), {
      slideIntervalSeconds: Number(localSlideInterval),
      adIntervalSeconds: Number(localAdInterval),
      bannerIntervalPhotos: Number(localBannerInterval)
    });
    alert("¡Tiempos guardados con éxito!");
  };

  const handleUploadAd = async () => {
    if (!adUploadFile) return;
    const adId = Date.now().toString();
    const sRef = storageRef(storage, `livefeed/${eventId}/ads/${adId}_${adUploadFile.name}`);
    setLoadingAction("uploadAd");
    try {
      await uploadBytes(sRef, adUploadFile);
      const url = await getDownloadURL(sRef);
      await set(ref(db, `livefeed/${eventId}/ads/${adId}`), {
        imageUrl: url,
        storagePath: sRef.fullPath,
        createdAt: Date.now()
      });
      setAdUploadFile(null);
    } catch (e) {
      console.error(e);
      alert("Error al subir publicidad");
    }
    setLoadingAction(null);
  };

  const handleDeleteAd = async (ad) => {
    if (!window.confirm("¿Borrar esta publicidad?")) return;
    setLoadingAction(ad.id);
    try {
      if (ad.storagePath) await deleteObject(storageRef(storage, ad.storagePath)).catch(() => {});
      await remove(ref(db, `livefeed/${eventId}/ads/${ad.id}`));
    } catch (err) { console.error(err); }
    setLoadingAction(null);
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
          
          {(eventConfig?.tier === 'premium' || eventConfig?.tier === 'corporativo') && (
            <button 
              className="mod-btn" 
              style={{ background: 'var(--accent)', color: '#000' }} 
              onClick={() => window.open(`#/album/${eventId}`, '_blank')}
            >
              📖 Álbum PDF
            </button>
          )}

          <button 
            className="mod-btn" 
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--accent)', color: '#fff' }} 
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}#/galeria/${eventId}`;
              navigator.clipboard.writeText(url);
              alert("¡Link de Galería Post-Evento copiado al portapapeles!\n" + url);
            }}
          >
            🖼️ Link Galería
          </button>

          <button className="mod-btn" style={{ background: 'transparent', border: '1px solid #444' }} onClick={() => { sessionStorage.removeItem(ADMIN_KEY); setAuthed(false); }}>Cerrar</button>
        </div>
      </header>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', background: 'rgba(255,255,255,0.02)' }}>
        {[
          { id: 'all', label: 'Todas', count: photos.length },
          { id: 'pending', label: 'Pendientes', count: stats.pending, color: 'var(--warning)' },
          { id: 'approved', label: 'En Pantalla', count: stats.approved, color: 'var(--success)' },
          { id: 'rsvps', label: 'Asistencia', count: stats.rsvps },
          { id: 'wishlist', label: 'Regalos', count: wishlist.filter(w => w.reservedBy).length },
          { id: 'screen', label: 'Pantalla & Sorteo', count: '📺', color: 'var(--accent)' }
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
        {filter === 'screen' ? (
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="photo-card-premium" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: 'var(--accent)' }}>Control Maestro de Pantalla</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setMonitorMode('feed')}
                  className="btn-primary" 
                  style={{ flex: 1, background: monitorState.mode === 'feed' ? 'var(--success)' : '#444' }}>
                  📸 MODO FEED (FOTOS)
                </button>
                <button 
                  onClick={() => setMonitorMode('ad')}
                  className="btn-primary" 
                  style={{ flex: 1, background: monitorState.mode === 'ad' ? 'var(--warning)' : '#444' }}>
                  💸 MODO PUBLICIDAD (CARRUSEL)
                </button>
                <button 
                  onClick={() => {
                    const elegibles = participants.filter(p => !p.isWinner);
                    if (elegibles.length === 0) {
                      alert("No hay participantes elegibles para el sorteo.");
                      return;
                    }
                    setShowSorteoModal(true);
                  }}
                  className="btn-primary" 
                  style={{ flex: 1, background: monitorState.mode === 'sorteo' ? 'var(--primary)' : 'linear-gradient(45deg, #008e45, #00b0e5)' }}>
                  🎰 MODO SORTEO (CONFIGURAR / LANZAR)
                </button>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Estado actual: <strong>{monitorState.mode.toUpperCase()}</strong> 
                {monitorState.mode === 'sorteo' && ` - Fase: ${monitorState.drawStatus}`}
              </p>
            </div>

            <div className="photo-card-premium" style={{ padding: '2rem' }}>
              <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Configuración de Tiempos ⏱️</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Segundos por Foto</label>
                  <input type="number" min="3" max="60" value={localSlideInterval} onChange={e => setLocalSlideInterval(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #444', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Segundos por Publicidad (Carrusel)</label>
                  <input type="number" min="3" max="60" value={localAdInterval} onChange={e => setLocalAdInterval(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #444', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Automático: 1 Ad cada X Fotos</label>
                  <input type="number" min="1" max="100" value={localBannerInterval} onChange={e => setLocalBannerInterval(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #444', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                </div>
              </div>
              <button onClick={saveTimings} className="btn-approve" style={{ padding: '0.8rem 2rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Guardar Tiempos
              </button>
            </div>

            <div className="photo-card-premium" style={{ padding: '2rem' }}>
              <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Sorteo & Participantes</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                  <h3>Total Participantes: {participants.length}</h3>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                  <h3>Elegibles: {participants.filter(p => !p.isWinner).length}</h3>
                </div>
                <div style={{ flex: 1, background: 'rgba(0,142,69,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--success)' }}>
                  <h3 style={{ color: 'var(--success)' }}>Ganadores Anteriores: {participants.filter(p => p.isWinner).length}</h3>
                </div>
              </div>
            </div>

            <div className="photo-card-premium" style={{ padding: '2rem' }}>
              <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Publicidades (Ads)</h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input 
                  type="file" 
                  accept="image/*,video/mp4,video/quicktime" 
                  onChange={(e) => setAdUploadFile(e.target.files[0])} 
                  style={{ flex: 1 }}
                />
                <button onClick={handleUploadAd} disabled={!adUploadFile || loadingAction === "uploadAd"} className="btn-approve" style={{ padding: '0.8rem 2rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {loadingAction === "uploadAd" ? "Subiendo..." : "Subir Publicidad"}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {ads.map(ad => (
                  <div key={ad.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {ad.imageUrl?.toLowerCase().includes('.mp4') || ad.imageUrl?.toLowerCase().includes('.mov') || ad.imageUrl?.includes('video') ? (
                      <video src={ad.imageUrl} autoPlay loop muted style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <img src={ad.imageUrl} alt="Ad" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                    )}
                    <button 
                      onClick={() => handleDeleteAd(ad)}
                      style={{ position: 'absolute', top: '5px', right: '5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>
                      X
                    </button>
                  </div>
                ))}
                {ads.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No hay publicidades cargadas.</p>}
              </div>
            </div>
          </div>
        ) : filter === 'rsvps' ? (
          <>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingBottom: '1rem' }}>
              <button onClick={exportToCSV} className="btn-approve" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                📥 Exportar Excel (CSV)
              </button>
            </div>
            {rsvps.map(r => (
              <div key={r.id} className="photo-card-premium" style={{ padding: '1.5rem' }}>
                <span className="photo-author">{r.name}</span>
                <span className="photo-time" style={{ display: 'block', margin: '0.5rem 0' }}>📱 {r.phone || 'N/A'}</span>
                <span className="photo-time">{new Date(r.timestamp).toLocaleString()}</span>
                <div style={{ 
                  marginTop: '1rem', 
                  fontSize: '0.9rem', 
                  fontWeight: '700',
                  color: r.attending ? 'var(--success)' : 'var(--text-muted)' 
                }}>
                  {r.attending ? '✅ Asiste' : '❌ No asiste'}
                </div>
              </div>
            ))}
          </>
        ) : filter === 'wishlist' ? (
          <>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingBottom: '1rem' }}>
              <button onClick={exportWishlistCSV} className="btn-approve" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                📥 Exportar Regalos (CSV)
              </button>
            </div>
            {wishlist.map(w => (
              <div key={w.id} className="photo-card-premium" style={{ padding: '1.5rem', borderLeft: w.reservedBy ? '4px solid var(--success)' : '4px solid #333' }}>
                <span className="photo-author">{w.name}</span>
                <div style={{ 
                  marginTop: '1rem', 
                  fontSize: '0.9rem', 
                  fontWeight: '700',
                  color: w.reservedBy ? 'var(--success)' : 'var(--text-muted)' 
                }}>
                  {w.reservedBy ? `🎁 Reservado por: ${w.reservedBy}` : '⌛ Disponible'}
                </div>
              </div>
            ))}
          </>
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

      {/* Modal Dedicado de Sorteo */}
      {showSorteoModal && (
        <div className="lightbox" onClick={() => setShowSorteoModal(false)}>
          <div className="mod-login-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: '0.5rem' }}>🎰 Panel de Sorteo</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Este control activará la ruleta de sorteo en la pantalla gigante del salón.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.04)', padding: '1.5rem', borderRadius: '15px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <span>👥 Participantes Registrados:</span>
                <strong>{participants.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <span>🎯 Elegibles para este sorteo:</span>
                <strong style={{ color: 'var(--accent)' }}>{participants.filter(p => !p.isWinner).length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🏆 Ganadores Anteriores:</span>
                <strong style={{ color: 'var(--success)' }}>{participants.filter(p => p.isWinner).length}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button 
                className="btn-primary" 
                style={{ 
                  background: 'linear-gradient(45deg, #008e45, #00b0e5)', 
                  padding: '1rem', 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  boxShadow: '0 5px 20px rgba(0,176,229,0.3)' 
                }}
                onClick={() => {
                  setShowSorteoModal(false);
                  handleLaunchGiveaway();
                }}
              >
                🚀 ¡DISPARAR SORTEO EN PANTALLA!
              </button>
              
              <button 
                className="mod-btn" 
                onClick={() => setShowSorteoModal(false)}
                style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', padding: '0.7rem' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
