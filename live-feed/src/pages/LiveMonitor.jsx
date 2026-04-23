import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { db, ref, onValue, get } from "../firebase";

const BUFFER_SIZE = 20;
const TRANSITION_DURATION = 1500; // ms

export default function LiveMonitor() {
  const { eventId } = useParams();
  const [eventConfig, setEventConfig] = useState(null);
  const [photos, setPhotos] = useState([]); // buffer circular
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [photoCounter, setPhotoCounter] = useState(0); 
  const [collageMode, setCollageMode] = useState(false);
  const [collagePhotos, setCollagePhotos] = useState([]);

  const intervalRef = useRef(null);
  const photoBufferRef = useRef([]); // cache en memoria

  // ── Detectar conexión ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // ── Cargar configuración del evento ──────────────────────────────────────
  useEffect(() => {
    if (!eventId) return;
    const configRef = ref(db, `livefeed/${eventId}/config`);
    get(configRef).then((snap) => {
      if (snap.exists()) setEventConfig(snap.val());
    });
  }, [eventId]);

  // ── Escuchar fotos en tiempo real ─────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return;
    const photosRef = ref(db, `livefeed/${eventId}/photos`);

    const unsub = onValue(photosRef, (snap) => {
      const data = snap.val();
      if (!data) return;

      const approved = Object.entries(data)
        .map(([id, photo]) => ({ id, ...photo }))
        .filter((p) => p.status === "approved" && !p.hidden)
        .sort((a, b) => a.uploadedAt - b.uploadedAt);

      const buffered = approved.slice(-BUFFER_SIZE);
      photoBufferRef.current = buffered;
      setPhotos(buffered);
    });

    return () => unsub();
  }, [eventId]);

  // ── Función para avanzar slide ────────────────────────────────────────────
  const advanceSlide = useCallback(() => {
    const buf = photoBufferRef.current;
    if (buf.length === 0 || collageMode) return;

    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % buf.length;
        const newCount = photoCounter + 1;
        setPhotoCounter(newCount);

        // Lógica de COLLAGE (cada 8 fotos)
        if (newCount > 0 && newCount % 8 === 0 && buf.length >= 4) {
          const shuffled = [...buf].sort(() => 0.5 - Math.random());
          setCollagePhotos(shuffled.slice(0, 4));
          setCollageMode(true);
          setTimeout(() => setCollageMode(false), 12000); 
        }
        
        // Lógica de banners corporativos cada N fotos
        else if (eventConfig?.tier === "corporativo" && eventConfig?.bannerUrls?.length > 0) {
          const bannerEvery = eventConfig.bannerIntervalPhotos || 5;
          if (newCount % bannerEvery === 0) {
            setShowBanner(true);
            setCurrentBannerIndex((bi) => (bi + 1) % eventConfig.bannerUrls.length);
            setTimeout(() => setShowBanner(false), (eventConfig.bannerDurationSeconds || 10) * 1000);
          }
        }

        return next;
      });
      setTransitioning(false);
    }, TRANSITION_DURATION);
  }, [eventConfig, photoCounter, collageMode]);

  // ── Rotación automática ────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || photos.length === 0) return;

    const interval = (eventConfig?.slideIntervalSeconds || 7) * 1000;
    intervalRef.current = setInterval(advanceSlide, interval);

    return () => clearInterval(intervalRef.current);
  }, [isPaused, photos.length, eventConfig, advanceSlide]);

  // ── Pausa con barra espaciadora ────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const currentPhoto = photos[currentIndex];
  const accentColor = eventConfig?.accentColor || "#a28a68";

  if (photos.length === 0) {
    return (
      <div className="monitor-screen monitor-screen--empty" style={{ "--accent": accentColor }}>
        <div className="monitor-waiting">
          {eventConfig?.logoUrl && (
            <img src={eventConfig.logoUrl} alt={eventConfig?.eventName} className="monitor-event-logo" />
          )}
          <h1 className="monitor-event-name">
            {eventConfig?.eventName || "Live Feed"}
          </h1>
          <div className="monitor-pulse">
            <div className="pulse-ring" style={{ borderColor: accentColor }} />
            <p>Esperando fotos de los invitados...</p>
          </div>
          <p className="monitor-hint">📱 Escaneá el QR para subir tu foto</p>
        </div>
        <div className="monitor-footer">
          <div className="monitor-footer-brand">
            <span className="tech-by">TECNOLOGÍA DE</span>
            <span className="studio-name">ESTUDIO PRECINTO</span>
          </div>
        </div>
        <style>{`
          .monitor-screen--empty { background: #000; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: 'Inter', sans-serif; }
          .monitor-waiting { text-align: center; }
          .monitor-event-logo { height: 120px; margin-bottom: 2rem; }
          .monitor-event-name { font-size: 4rem; font-weight: 900; margin-bottom: 3rem; color: var(--accent); }
          .monitor-pulse { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
          .pulse-ring { width: 80px; height: 80px; border: 4px solid; border-radius: 50%; animation: pulse 2s infinite; }
          @keyframes pulse { 0% { transform: scale(0.8); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
          .monitor-footer { position: absolute; bottom: 30px; right: 40px; opacity: 0.6; }
          .monitor-footer-brand { display: flex; flex-direction: column; align-items: flex-end; }
          .tech-by { font-size: 0.7rem; letter-spacing: 4px; }
          .studio-name { font-size: 1.2rem; font-weight: 900; color: var(--accent); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="monitor-screen" style={{ "--accent": accentColor }} onClick={() => setIsPaused((p) => !p)}>
      {/* Fondo dinámico desenfocado */}
      {currentPhoto && !showBanner && (
        <div 
          className="monitor-bg-blur" 
          style={{ backgroundImage: `url(${currentPhoto.imageUrl})` }} 
        />
      )}

      {/* Main Content */}
      <div className={`monitor-main ${transitioning ? "fade-out" : "fade-in"}`}>
        {collageMode ? (
          <div className="collage-container">
            {collagePhotos.map((p, i) => (
              <div key={p.id} className={`collage-item item-${i}`}>
                <img src={p.imageUrl} alt="Collage" />
                <div className="collage-author">{p.authorName}</div>
              </div>
            ))}
            <div className="collage-title">Momentos del Evento ✨</div>
          </div>
        ) : showBanner ? (
          <div className="banner-display">
             {eventConfig.bannerUrls[currentBannerIndex]?.toLowerCase().includes('.mp4') || 
              eventConfig.bannerUrls[currentBannerIndex]?.toLowerCase().includes('.mov') ||
              eventConfig.bannerUrls[currentBannerIndex]?.includes('video') ? (
              <video src={eventConfig.bannerUrls[currentBannerIndex]} autoPlay loop muted className="banner-media" />
            ) : (
              <img src={eventConfig.bannerUrls[currentBannerIndex]} alt="Banner" className="banner-media" />
            )}
          </div>
        ) : currentPhoto ? (
          <div className="photo-display">
            <div className="polaroid-frame-modern">
              <div className="polaroid-photo-area">
                <img src={currentPhoto.imageUrl} alt="Live Feed" className="photo-main" />
              </div>
              <div className="polaroid-info-area">
                <div className="polaroid-info-left">
                  <div className="polaroid-label">ENVIADO POR</div>
                  <div className="polaroid-name">{currentPhoto.authorName}</div>
                </div>
                <div className="polaroid-info-right">
                  <span className="polaroid-event-name-mini">{eventConfig?.eventName}</span>
                  {eventConfig?.logoUrl && (
                    <img src={eventConfig.logoUrl} alt="Logo" className="polaroid-mini-logo" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Branding Footer */}
      <div className="monitor-footer">
        <div className="monitor-footer-brand">
          <span className="tech-by">TECNOLOGÍA DE</span>
          <span className="studio-name">ESTUDIO PRECINTO</span>
        </div>
      </div>

      {isPaused && <div className="pause-overlay">⏸️ PAUSA</div>}
      {isOffline && <div className="offline-toast">⚠️ Sin conexión. Reintentando...</div>}

      <style>{`
        .monitor-screen {
          width: 100vw; height: 100vh;
          background: #000; overflow: hidden;
          position: relative; color: white;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
        }
        .monitor-bg-blur {
          position: absolute; top: -10%; left: -10%;
          width: 120%; height: 120%;
          background-size: cover; background-position: center;
          filter: blur(80px) brightness(0.4);
          z-index: 1; transition: background-image 2s ease-in-out;
        }
        .monitor-main {
          position: relative; z-index: 10;
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 1.5s ease-in-out;
        }
        .fade-in { opacity: 1; }
        .fade-out { opacity: 0; }
        .photo-display { width: 90%; height: 85%; display: flex; align-items: center; justify-content: center; }
        
        /* Single Photo Styles - MODERN POLAROID */
        .photo-display { width: 90%; height: 90%; display: flex; align-items: center; justify-content: center; }
        .polaroid-frame-modern { 
          background: white; 
          padding: 15px 15px 50px 15px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6);
          transform: rotate(-1deg);
          max-width: 95%; max-height: 95%;
          display: flex; flex-direction: column;
          animation: polaroid-in 1.2s cubic-bezier(0.23, 1, 0.32, 1);
        }
        @keyframes polaroid-in {
          from { opacity: 0; transform: translateY(50px) rotate(-5deg) scale(0.9); }
          to { opacity: 1; transform: translateY(0) rotate(-1deg) scale(1); }
        }
        .polaroid-photo-area { width: 100%; flex-grow: 1; overflow: hidden; background: #000; }
        .photo-main { max-width: 100%; max-height: 70vh; display: block; object-fit: contain; }
        .polaroid-info-area { 
          margin-top: 15px; text-align: left; padding: 0 10px;
          display: flex; justify-content: space-between; align-items: flex-end;
        }
        .polaroid-info-left { display: flex; flex-direction: column; }
        .polaroid-label { font-size: 0.7rem; color: #999; letter-spacing: 2px; font-weight: 700; }
        .polaroid-name { font-size: 2rem; color: #222; font-weight: 900; line-height: 1.1; }
        
        .polaroid-info-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .polaroid-event-name-mini { font-size: 0.8rem; font-weight: 700; color: var(--accent); text-transform: uppercase; }
        .polaroid-mini-logo { height: 35px; width: auto; object-fit: contain; }

        /* Collage Styles */
        .collage-container {
          width: 95%; height: 90%; display: grid;
          grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;
          gap: 40px; position: relative;
          align-items: center; justify-items: center;
        }
        .collage-item { 
          position: relative; border-radius: 4px; 
          box-shadow: 0 15px 40px rgba(0,0,0,0.4); 
          background: white; padding: 10px 10px 30px 10px;
          transform: rotate(var(--rot));
          max-width: 90%; max-height: 90%;
          display: flex; flex-direction: column;
        }
        .collage-item.item-0 { --rot: -3deg; }
        .collage-item.item-1 { --rot: 2deg; }
        .collage-item.item-2 { --rot: 4deg; }
        .collage-item.item-3 { --rot: -2.5deg; }
        
        .collage-item img { 
          max-width: 100%; max-height: 35vh; 
          object-fit: contain; /* Respetar encuadre original */
          display: block;
        }
        .collage-author { 
          margin-top: 10px;
          color: #444; font-size: 0.8rem; font-weight: 900; 
          text-transform: uppercase; text-align: left;
        }
        .collage-title {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: var(--accent); color: #000; padding: 1.5rem 3rem; border-radius: 100px;
          font-weight: 900; font-size: 3rem; box-shadow: 0 15px 50px rgba(0,0,0,0.6);
          animation: pop-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          white-space: nowrap; z-index: 50;
        }
        @keyframes pop-in { from { transform: translate(-50%, -50%) scale(0); } to { transform: translate(-50%, -50%) scale(1); } }
        .banner-display { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; }
        .banner-media { width: 100%; height: 100%; object-fit: contain; }
        .monitor-footer { position: absolute; bottom: 30px; right: 40px; z-index: 100; opacity: 0.5; }
        .monitor-footer-brand { display: flex; flex-direction: column; align-items: flex-end; }
        .tech-by { font-size: 0.6rem; letter-spacing: 4px; }
        .studio-name { font-size: 1.1rem; font-weight: 900; color: var(--accent); }
        .pause-overlay { position: absolute; top: 30px; right: 40px; background: rgba(0,0,0,0.5); padding: 0.5rem 1.5rem; border-radius: 10px; color: var(--accent); font-weight: bold; z-index: 1000; }
        .offline-toast { position: absolute; top: 30px; left: 50%; transform: translateX(-50%); background: rgba(224,92,92,0.9); padding: 0.8rem 2rem; border-radius: 50px; z-index: 1000; font-weight: bold; }
      `}</style>
    </div>
  );
}
