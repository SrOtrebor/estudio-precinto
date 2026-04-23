import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, ref, get, push, set, onValue } from "../firebase";

export default function Invitation() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [eventConfig, setEventConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // RSVP state
  const [rsvpName, setRsvpName] = useState("");
  const [hasRsvped, setHasRsvped] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  // Camera Status
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // ── Cargar Config y Escuchar Estado Cámara ────────────────────────────────
  useEffect(() => {
    if (!eventId) return;
    
    // Escuchar la config en tiempo real para el estado de la cámara
    const configRef = ref(db, `livefeed/${eventId}/config`);
    const unsub = onValue(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setEventConfig(data);
        setCameraEnabled(data.cameraEnabled !== false); // default a true si no existe
        setLoading(false);
      } else {
        setError("El evento no existe.");
        setLoading(false);
      }
    });

    return () => unsub();
  }, [eventId]);

  // ── Manejar RSVP ──────────────────────────────────────────────────────────
  const handleRSVP = async (e) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;

    setRsvpLoading(true);
    const rsvpRef = ref(db, `livefeed/${eventId}/rsvps`);
    
    try {
      await set(push(rsvpRef), {
        name: rsvpName,
        attending: true,
        timestamp: Date.now()
      });
      setHasRsvped(true);
      // Guardar nombre para que PhotoUpload no lo vuelva a pedir
      localStorage.setItem("livefeed_guest_name", rsvpName);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al confirmar. Intentá de nuevo.");
    } finally {
      setRsvpLoading(false);
    }
  };

  // ── Cuenta Regresiva ──────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!eventConfig?.date) return;

    const targetDate = new Date(eventConfig.date).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [eventConfig?.date]);

  // ── Render: Loading / Error ───────────────────────────────────────────────
  if (loading) return <div className="upload-screen"><div className="spinner" /></div>;
  if (error) return <div className="upload-screen"><h2>{error}</h2></div>;

  const accentColor = eventConfig?.accentColor || "#a28a68";

  return (
    <div className="invitation-screen" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-deep)' }}>
      {/* Hero Header */}
      <div style={{ width: '100%', padding: '4rem 2rem', textAlign: 'center', background: `linear-gradient(to bottom, ${accentColor}40, transparent)` }}>
        <h3 style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Estás invitado a</h3>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', color: accentColor, marginBottom: '1rem', lineHeight: '1.1' }}>
          {eventConfig.eventName}
        </h1>
        {eventConfig.date && (
          <p style={{ fontSize: '1.2rem', color: 'var(--text)' }}>
            {new Date(eventConfig.date).toLocaleDateString("es-AR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Countdown */}
      {eventConfig.date && new Date(eventConfig.date).getTime() > Date.now() && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', marginTop: '-1rem' }}>
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center', minWidth: '80px' }}>
              <span style={{ display: 'block', fontSize: '2rem', fontWeight: '700', color: accentColor }}>{value}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{unit}</span>
            </div>
          ))}
        </div>
      )}

      {/* Acciones principales */}
      <div style={{ width: '100%', maxWidth: '480px', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Módulo de Cámara */}
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: `1px solid ${accentColor}50`, textAlign: 'center', boxShadow: `0 8px 32px ${accentColor}15` }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📸 Social Live Feed</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Compartí tus fotos durante el evento y míralas en pantalla gigante.</p>
          
          <button 
            className={`btn-primary ${!cameraEnabled ? 'btn-camera--disabled' : ''}`}
            onClick={() => cameraEnabled && navigate(`/foto/${eventId}`)}
            disabled={!cameraEnabled}
            style={{ padding: '1.2rem', fontSize: '1.1rem', background: cameraEnabled ? `linear-gradient(135deg, ${accentColor}, #c4a97a)` : 'var(--bg-glass)' }}
          >
            {cameraEnabled ? '📷 Abrir Cámara del Evento' : '⏸️ Cámara pausada'}
          </button>
          {!cameraEnabled && (
            <p style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: '1rem' }}>El organizador ha pausado la subida de fotos por el momento.</p>
          )}
        </div>

        {/* Módulo RSVP */}
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', textAlign: 'center' }}>Confirmar Asistencia</h2>
          
          {hasRsvped ? (
            <div style={{ textAlign: 'center', color: 'var(--success)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
              <p style={{ fontWeight: '600' }}>¡Gracias por confirmar!</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Te esperamos.</p>
            </div>
          ) : (
            <form onSubmit={handleRSVP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                className="name-input" 
                placeholder="Nombre y Apellido" 
                value={rsvpName}
                onChange={e => setRsvpName(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" disabled={rsvpLoading} style={{ background: 'var(--text-muted)' }}>
                {rsvpLoading ? 'Enviando...' : 'Sí, asistiré'}
              </button>
            </form>
          )}
        </div>
      </div>
      
      <div style={{ padding: '3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Desarrollado por Estudio Precinto
      </div>
    </div>
  );
}
