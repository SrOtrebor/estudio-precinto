import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, ref, onValue, get, push, set, storage, storageRef, uploadBytes, getDownloadURL } from "../firebase";
import CameraCapture from "../components/CameraCapture";

const GUEST_NAME_KEY = "livefeed_guest_name";

export default function PhotoUpload() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [eventConfig, setEventConfig] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState(null);

  const [guestName, setGuestName] = useState(() => localStorage.getItem(GUEST_NAME_KEY) || "");
  const [nameConfirmed, setNameConfirmed] = useState(() => !!localStorage.getItem(GUEST_NAME_KEY));
  const [nameInput, setNameInput] = useState("");

  const [pendingBlob, setPendingBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [photoCount, setPhotoCount] = useState(0);

  // ── Cargar configuración del evento ──────────────────────────────────────
  useEffect(() => {
    if (!eventId) {
      setEventError("Evento no encontrado");
      setLoadingEvent(false);
      return;
    }

    const configRef = ref(db, `livefeed/${eventId}/config`);
    const unsub = onValue(configRef, (snap) => {
      if (snap.exists()) {
        setEventConfig(snap.val());
        setLoadingEvent(false);
      } else {
        setEventError("Este evento no existe o el link es incorrecto.");
        setLoadingEvent(false);
      }
    }, (err) => {
      setEventError("Error de conexión con Firebase.");
      setLoadingEvent(false);
    });

    return () => unsub();
  }, [eventId]);

  const handleConfirmName = (e) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem(GUEST_NAME_KEY, name);
    setGuestName(name);
    setNameConfirmed(true);
  };

  const handlePhotoReady = useCallback((blob) => {
    setPendingBlob(blob);
    setUploadSuccess(false);
    setUploadError(null);
  }, []);

  // ── Utilidad de Compresión ────────────────────────────────────────────────
  const compressImage = (fileOrBlob, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileOrBlob);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', quality);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleUpload = async () => {
    if (!pendingBlob || !guestName || !eventId) return;

    setUploading(true);
    setUploadError(null);

    try {
      const timestamp = Date.now();
      const filename = `${timestamp}_${guestName.replace(/\s+/g, "-")}.jpg`;
      const photoRef = storageRef(storage, `events/${eventId}/photos/${filename}`);

      // Comprimir antes de subir (Max 1200px) para ahorrar datos y acelerar Live Monitor
      const compressedBlob = await compressImage(pendingBlob, 1200, 0.75);

      await uploadBytes(photoRef, compressedBlob, { contentType: "image/jpeg" });
      const imageUrl = await getDownloadURL(photoRef);

      const autoApprove = eventConfig?.autoApprove !== false;
      const newPhotoRef = ref(db, `livefeed/${eventId}/photos`);
      await set(push(newPhotoRef), {
        authorName: guestName,
        imageUrl,
        status: autoApprove ? "approved" : "pending",
        hidden: false,
        uploadedAt: timestamp,
        storagePath: `events/${eventId}/photos/${filename}`,
      });

      setUploadSuccess(true);
      setPhotoCount((c) => c + 1);
      setPendingBlob(null);
    } catch (err) {
      console.error(err);
      setUploadError("Error al subir. Revisá tu conexión.");
    } finally {
      setUploading(false);
    }
  };

  if (loadingEvent) return <div className="monitor-screen"><div className="pulse-ring" /></div>;
  
  if (eventError) return (
    <div className="not-found">
      <h1>⚠️</h1>
      <p>{eventError}</p>
      <button className="mod-btn" onClick={() => navigate('/')}>Volver al inicio</button>
    </div>
  );

  const accentColor = eventConfig?.accentColor || "#a28a68";
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "162, 138, 104";
  };

  return (
    <div className="guest-app" style={{ "--accent": accentColor, "--accent-rgb": hexToRgb(accentColor) }}>
      
      <header className="guest-nav">
        <div className="guest-logo-circle" onClick={() => navigate(`/invitacion/${eventId}`)}>
          {eventConfig.logoUrl ? (
            <img src={eventConfig.logoUrl} alt="Logo" />
          ) : (
            <span>📸</span>
          )}
        </div>
        <div className="guest-nav-info">
          <h1>{eventConfig.eventName}</h1>
          <p>{nameConfirmed ? `Hola, ${guestName}` : 'Cámara del evento'}</p>
        </div>
      </header>

      <main className="guest-container">
        {!nameConfirmed ? (
          <div className="welcome-card">
            <span className="welcome-icon">👋</span>
            <h2>¡Hola!</h2>
            <p>Para que sepamos quién saca la foto, por favor ingresá tu nombre.</p>
            <form onSubmit={handleConfirmName}>
              <input 
                type="text" 
                className="guest-input" 
                placeholder="Tu nombre..."
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" className="btn-premium">
                Comenzar a sacar fotos
              </button>
            </form>
          </div>
        ) : (
          <>
            {uploadSuccess ? (
              <div className="success-overlay">
                <div className="success-check">✨</div>
                <h2>¡Foto enviada!</h2>
                <p>Tu foto ya está volando hacia la pantalla principal.</p>
                <button className="btn-premium" style={{ marginTop: '2rem' }} onClick={() => setUploadSuccess(false)}>
                  Sacar otra foto
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <CameraCapture 
                  disabled={uploading}
                  onPhotoReady={handlePhotoReady}
                />
                
                {pendingBlob && !uploading && (
                  <button className="btn-floating-send" onClick={handleUpload}>
                    📤 ENVIAR AL SALÓN
                  </button>
                )}

                {uploading && (
                  <div className="uploading-indicator" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', borderRadius: '20px', zIndex: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="pulse-ring" />
                    <p style={{ marginTop: '1rem', fontWeight: '700' }}>Subiendo...</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {uploadError && (
        <div style={{ position: 'fixed', top: '5rem', left: '1rem', right: '1rem', background: 'var(--danger)', color: '#fff', padding: '1rem', borderRadius: '12px', textAlign: 'center', zIndex: 1000 }}>
          {uploadError}
        </div>
      )}
    </div>
  );
}
