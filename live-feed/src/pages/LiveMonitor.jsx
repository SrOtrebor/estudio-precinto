import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { db, ref, onValue, get } from "../firebase";

const SLIDE_INTERVAL_DEFAULT = 7000; // ms
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
  const [photoCounter, setPhotoCounter] = useState(0); // para trigger de banners

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

      // Actualizar buffer manteniendo las últimas BUFFER_SIZE
      const buffered = approved.slice(-BUFFER_SIZE);
      photoBufferRef.current = buffered;
      setPhotos(buffered);
    });

    return () => unsub();
  }, [eventId]);

  // ── Función para avanzar slide ────────────────────────────────────────────
  const advanceSlide = useCallback(() => {
    const buf = photoBufferRef.current;
    if (buf.length === 0) return;

    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % buf.length;

        // Lógica de banners corporativos cada N fotos
        if (eventConfig?.tier === "corporativo" && eventConfig?.bannerUrls?.length > 0) {
          setPhotoCounter((c) => {
            const newCount = c + 1;
            const bannerEvery = eventConfig.bannerIntervalPhotos || 5;
            if (newCount % bannerEvery === 0) {
              setShowBanner(true);
              setCurrentBannerIndex((bi) => (bi + 1) % eventConfig.bannerUrls.length);
              setTimeout(() => setShowBanner(false), (eventConfig.bannerDurationSeconds || 10) * 1000);
            }
            return newCount;
          });
        }

        return next;
      });
      setTransitioning(false);
    }, TRANSITION_DURATION);
  }, [eventConfig]);

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
      <div className="monitor-screen monitor-screen--empty">
        <div className="monitor-waiting">
          {eventConfig?.logoUrl && (
            <img src={eventConfig.logoUrl} alt={eventConfig?.eventName} className="monitor-event-logo" />
          )}
          <h1 className="monitor-event-name" style={{ color: accentColor }}>
            {eventConfig?.eventName || "Live Feed"}
          </h1>
          <div className="monitor-pulse">
            <div className="pulse-ring" style={{ borderColor: accentColor }} />
            <p>Esperando fotos de los invitados...</p>
          </div>
          <p className="monitor-hint">
            📱 Escaneá el QR o ingresá a la web para subir tu foto
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="monitor-screen" onClick={() => setIsPaused((p) => !p)}>
      {/* Banner corporativo (superpuesto) */}
      {showBanner && eventConfig?.bannerUrls?.length > 0 && (
        <div className="monitor-banner-overlay">
          {eventConfig.bannerUrls[currentBannerIndex]?.toLowerCase().includes('.mp4') ? (
            <video
              src={eventConfig.bannerUrls[currentBannerIndex]}
              className="monitor-banner-img"
              autoPlay
              muted
              loop
            />
          ) : (
            <img
              src={eventConfig.bannerUrls[currentBannerIndex]}
              alt="Banner"
              className="monitor-banner-img"
            />
          )}
        </div>
      )}

      {/* Foto principal Estilo Polaroid */}
      {currentPhoto && (
        <div
          className={`monitor-photo-container ${transitioning ? "monitor-photo--out" : "monitor-photo--in"}`}
        >
          <div className="polaroid-frame">
            <div className="polaroid-photo-wrapper">
              <img
                src={currentPhoto.imageUrl}
                alt={`Foto de ${currentPhoto.authorName}`}
                className="monitor-photo"
              />
              <div className="polaroid-author-badge">
                Foto de: {currentPhoto.authorName}
              </div>
            </div>
            <div className="polaroid-footer">
              <span className="polaroid-event-name">
                {eventConfig?.eventName}
              </span>
            </div>
          </div>
        </div>
      )}


      {/* Indicadores de estado */}
      <div className="monitor-status">
        {isPaused && (
          <div className="monitor-badge monitor-badge--paused">⏸ PAUSADO</div>
        )}
        {isOffline && (
          <div className="monitor-badge monitor-badge--offline">📵 Modo sin señal — buffer local</div>
        )}
      </div>

      {/* Contador de fotos */}
      <div className="monitor-counter">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}
