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
    
    const configRef = ref(db, `livefeed/${eventId}/config`);
    const unsub = onValue(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setEventConfig(data);
        setCameraEnabled(data.cameraEnabled !== false);
        setLoading(false);
      } else {
        setError("El evento no existe o la URL es incorrecta.");
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
      localStorage.setItem("livefeed_guest_name", rsvpName);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al confirmar. Intentá de nuevo.");
    } finally {
      setRsvpLoading(false);
    }
  };

  // ── Cuenta Regresiva ──────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState({ dias: 0, hs: 0, min: 0, seg: 0 });

  useEffect(() => {
    if (!eventConfig?.date) return;

    const targetDate = new Date(eventConfig.date).getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ dias: 0, hs: 0, min: 0, seg: 0 });
        return;
      }

      setTimeLeft({
        dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hs: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        min: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seg: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [eventConfig?.date]);

  if (loading) return <div className="monitor-screen"><div className="pulse-ring" /></div>;
  if (error) return <div className="not-found"><h1>Oops</h1><p>{error}</p></div>;

  const accentColor = eventConfig?.accentColor || "#a28a68";
  
  // Convertir Hex a RGB para variables CSS
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "162, 138, 104";
  };

  return (
    <div className="invitation-screen" style={{ "--accent": accentColor, "--accent-rgb": hexToRgb(accentColor) }}>
      
      {/* Hero Section */}
      <section className="invitation-hero">
        <div 
          className="invitation-hero-bg" 
          style={{ backgroundImage: `url(${eventConfig.heroUrl || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200'})` }}
        />
        <div className="invitation-hero-overlay" />
        
        <div className="invitation-header-content">
          <span className="invitation-subtitle">Estás invitado</span>
          <h1 className="invitation-title">{eventConfig.eventName}</h1>
          <div className="invitation-date-pill">
            📅 {new Date(eventConfig.date).toLocaleDateString("es-AR", { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </section>

      {/* Countdown */}
      {new Date(eventConfig.date).getTime() > Date.now() && (
        <div className="invitation-countdown">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} className="countdown-box">
              <span className="countdown-num">{value}</span>
              <span className="countdown-label">{unit}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="invitation-main">
        
        {/* Photo Section */}
        <div className="invitation-card invitation-card--accent">
          <h2>📸 Social Live Feed</h2>
          <p>
            ¡Queremos ver el evento a través de tus ojos! Sacá fotos y compartilas 
            en tiempo real para que todos las vean en las pantallas del salón.
          </p>
          <button 
            className="btn-premium"
            onClick={() => cameraEnabled && navigate(`/foto/${eventId}`)}
            disabled={!cameraEnabled}
          >
            {cameraEnabled ? (
              <><span>📷</span> Abrir Cámara del Evento</>
            ) : (
              <><span>⏸️</span> Subida pausada</>
            )}
          </button>
        </div>

        {/* RSVP Section */}
        <div className="invitation-card">
          <h2>Confirmar Asistencia</h2>
          {hasRsvped ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
              <p style={{ color: 'var(--accent)', fontWeight: '700', marginBottom: 0 }}>¡Confirmado! Te esperamos.</p>
            </div>
          ) : (
            <form onSubmit={handleRSVP}>
              <p>Por favor, confirmanos si vas a poder acompañarnos en este momento tan especial.</p>
              <input 
                type="text" 
                className="rsvp-input" 
                placeholder="Tu nombre y apellido" 
                value={rsvpName}
                onChange={e => setRsvpName(e.target.value)}
                required
              />
              <button type="submit" className="btn-premium" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', boxShadow: 'none' }} disabled={rsvpLoading}>
                {rsvpLoading ? 'Procesando...' : 'Sí, asistiré'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', padding: '1rem' }}>
          Realizado por Estudio Precinto
        </div>
      </main>
    </div>
  );
}
