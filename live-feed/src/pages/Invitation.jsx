import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, ref, get, push, set, onValue, update } from "../firebase";

export default function Invitation() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [eventConfig, setEventConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // RSVP state
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [hasRsvped, setHasRsvped] = useState(false);
  const [isAttending, setIsAttending] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  
  // Wishlist state
  const [wishlist, setWishlist] = useState([]);

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

    const wishlistRef = ref(db, `livefeed/${eventId}/wishlist`);
    const unsubWishlist = onValue(wishlistRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setWishlist(Object.entries(data).map(([id, val]) => ({ id, ...val })));
      } else {
        setWishlist([]);
      }
    });

    return () => { unsub(); unsubWishlist(); };
  }, [eventId]);

  // ── Manejar RSVP ──────────────────────────────────────────────────────────
  const handleRSVP = async (attendingStatus) => {
    if (!rsvpName.trim() || !rsvpPhone.trim()) {
      alert("Por favor, completá tu nombre y teléfono.");
      return;
    }

    setRsvpLoading(true);
    const rsvpRef = ref(db, `livefeed/${eventId}/rsvps`);
    
    try {
      await set(push(rsvpRef), {
        name: rsvpName,
        phone: rsvpPhone,
        attending: attendingStatus,
        timestamp: Date.now()
      });
      setHasRsvped(true);
      setIsAttending(attendingStatus);
      localStorage.setItem(`livefeed_guest_name_${eventId}`, rsvpName);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al confirmar. Intentá de nuevo.");
    } finally {
      setRsvpLoading(false);
    }
  };

  // ── Reservar Regalo ───────────────────────────────────────────────────────
  const handleReserveGift = async (itemId) => {
    if (!hasRsvped) {
      alert("Por favor completá el formulario de asistencia arriba primero para poder reservar un regalo a tu nombre.");
      return;
    }
    
    try {
      const itemRef = ref(db, `livefeed/${eventId}/wishlist/${itemId}`);
      await update(itemRef, { reservedBy: rsvpName });
    } catch (err) {
      alert("No se pudo reservar el regalo.");
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

  const themeClass = eventConfig?.theme === 'light' ? 'theme-light' : 'theme-dark';
  const fontFamily = eventConfig?.font || 'Inter';

  // ── Helper para extraer iframe src ────────────────────────────────────────
  const getMapEmbedSrc = (urlOrIframe) => {
    if (!urlOrIframe) return null;
    if (urlOrIframe.includes('<iframe')) {
      const match = urlOrIframe.match(/src="([^"]+)"/);
      return match ? match[1] : null;
    }
    if (urlOrIframe.includes('/embed')) {
      return urlOrIframe;
    }
    // Fallback: intentar armar un link embebible con la query
    return `https://maps.google.com/maps?q=${encodeURIComponent(urlOrIframe)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const mapEmbedSrc = getMapEmbedSrc(eventConfig?.mapUrl);

  return (
    <div style={{ background: eventConfig?.theme === 'light' ? '#e9ecef' : '#000', minHeight: '100vh' }}>
      <div className={`invitation-screen ${themeClass}`} style={{ 
        "--accent": accentColor, 
        "--accent-rgb": hexToRgb(accentColor),
        fontFamily: `"${fontFamily}", sans-serif`,
        maxWidth: '500px',
        margin: '0 auto',
        minHeight: '100vh',
        position: 'relative',
        boxShadow: '0 0 50px rgba(0,0,0,0.2)'
      }}>
        
        {/* Hero Section */}
      <section className="invitation-hero">
        <div 
          className="invitation-hero-bg" 
          style={{ backgroundImage: `url(${eventConfig.heroUrl || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200'})` }}
        />
        <div className="invitation-hero-overlay" style={{
           background: eventConfig?.theme === 'light' ? `linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.9))` : `linear-gradient(to bottom, rgba(10,10,15,0.2), rgba(10,10,15,0.9))`
        }} />
        
        {/* SVG Wave */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0 }}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '80px', transform: 'rotate(180deg)' }}>
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                  fill={eventConfig?.theme === 'light' ? '#f4f4f6' : '#0a0a0f'}></path>
          </svg>
        </div>

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
          <div className="card-badge">NUEVA FUNCIÓN</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>📸 Live Feed</h2>
          <p>
            ¡Queremos ver el evento a través de tus ojos! Sacá fotos y compartilas 
            en tiempo real para que todos las vean en las pantallas del salón.
          </p>
          <button 
            className="btn-pill btn-pill-accent"
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Confirmar Asistencia</h2>
          {hasRsvped ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{isAttending ? '✨' : '🥺'}</div>
              <p style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '1.2rem', marginBottom: 0 }}>
                {isAttending ? '¡Confirmado! Te esperamos.' : 'Qué lástima, te vamos a extrañar.'}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Por favor, confirmanos si vas a poder acompañarnos.</p>
              <input 
                type="text" 
                className="rsvp-input-pill" 
                placeholder="Tu nombre y apellido" 
                value={rsvpName}
                onChange={e => setRsvpName(e.target.value)}
                required
              />
              <input 
                type="tel" 
                className="rsvp-input-pill" 
                placeholder="Tu WhatsApp / Teléfono" 
                value={rsvpPhone}
                onChange={e => setRsvpPhone(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-pill" onClick={() => handleRSVP(false)} disabled={rsvpLoading} style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }}>
                  {rsvpLoading ? '...' : 'No podré ir'}
                </button>
                <button type="button" className="btn-pill btn-pill-accent" onClick={() => handleRSVP(true)} disabled={rsvpLoading}>
                  {rsvpLoading ? 'Procesando...' : 'Sí, asistiré'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map Section */}
        {eventConfig?.mapUrl && (
          <div className="invitation-card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Ubicación</h2>
            <p style={{ color: 'var(--text-muted)' }}>Te esperamos para festejar a lo grande.</p>
            
            {mapEmbedSrc && (
              <div style={{ borderRadius: '20px', overflow: 'hidden', margin: '1.5rem 0', height: '250px', background: 'var(--bg-card)' }}>
                 <iframe 
                    src={mapEmbedSrc}
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy"
                 ></iframe>
              </div>
            )}

            <button 
              className="btn-pill" 
              onClick={() => {
                // Si pegaron todo el iframe, limpiamos para intentar sacar solo el src para abrirlo, 
                // o mejor, si no tiene 'http', no hacemos nada. Pero un iframe siempre tiene http en el src.
                const linkToOpen = mapEmbedSrc || eventConfig.mapUrl;
                window.open(linkToOpen, '_blank');
              }}
              style={{ marginTop: mapEmbedSrc ? '0' : '1.5rem' }}
            >
              📍 Ver en Google Maps
            </button>
          </div>
        )}

        {/* Bank / Regalos Section */}
        {eventConfig?.bankInfo && (
          <div className="invitation-card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Regalos 🎁</h2>
            <p style={{ color: 'var(--text-muted)' }}>El mejor regalo es tu presencia. Pero si deseás ayudarnos con un regalito, podés hacerlo acá:</p>
            
            <div style={{ background: 'rgba(0,0,0,0.05)', border: '1px dashed var(--accent)', padding: '1.5rem', borderRadius: '20px', textAlign: 'center', marginTop: '1.5rem' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '2px' }}>{eventConfig.bankInfo}</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>Alias / CVU / CBU</p>
            </div>
          </div>
        )}

        {/* Wishlist Section */}
        {(eventConfig?.tier === 'premium' || eventConfig?.tier === 'corporativo') && wishlist.length > 0 && (
          <div className="invitation-card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Lista de Regalos</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Elegí un regalo de la lista y marcalo para que no se repita. (Asegurate de confirmar asistencia primero).</p>
            
            <div className="wishlist-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {wishlist.map(item => (
                <div key={item.id} className={`wishlist-item ${item.reservedBy ? 'wishlist-item-reserved' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600', textDecoration: item.reservedBy ? 'line-through' : 'none', opacity: item.reservedBy ? 0.5 : 1 }}>
                      {item.name}
                    </span>
                    
                    {item.reservedBy ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        🎁 Reservado por {item.reservedBy}
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleReserveGift(item.id)}
                        style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Reservar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', padding: '1rem', paddingBottom: '3rem' }}>
          Realizado por <a href="https://estudioprecinto.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 'bold' }}>Estudio Precinto</a>
        </div>
      </main>
      </div>
    </div>
  );
}
