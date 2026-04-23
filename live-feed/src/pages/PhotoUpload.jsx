import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { db, ref, onValue, get, push, set, storage, storageRef, uploadBytes, getDownloadURL } from "../firebase";
import CameraCapture from "../components/CameraCapture";

const GUEST_NAME_KEY = "livefeed_guest_name";

export default function PhotoUpload() {
  const { eventId } = useParams();
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

  // Cola offline: fotos pendientes de subir guardadas en localStorage
  const offlineQueueRef = useRef([]);

  // ── Cargar configuración del evento ──────────────────────────────────────
  useEffect(() => {
    if (!eventId) {
      setEventError("Evento no encontrado");
      setLoadingEvent(false);
      return;
    }

    const configRef = ref(db, `livefeed/${eventId}/config`);
    get(configRef)
      .then((snap) => {
        if (!snap.exists()) {
          setEventError("Este evento no existe o el link es incorrecto.");
        } else {
          setEventConfig(snap.val());
        }
      })
      .catch(() => setEventError("Error al cargar el evento. Revisá tu conexión."))
      .finally(() => setLoadingEvent(false));
  }, [eventId]);

  // ── Confirmar nombre ──────────────────────────────────────────────────────
  const handleConfirmName = (e) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem(GUEST_NAME_KEY, name);
    setGuestName(name);
    setNameConfirmed(true);
  };

  // ── Callback cuando la foto está lista (comprimida + watermark) ───────────
  const handlePhotoReady = useCallback((blob) => {
    setPendingBlob(blob);
    setUploadSuccess(false);
    setUploadError(null);
  }, []);

  // ── Subir foto a Firebase ─────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!pendingBlob || !guestName || !eventId) return;

    setUploading(true);
    setUploadError(null);

    try {
      const timestamp = Date.now();
      const filename = `${timestamp}_${guestName.replace(/\s+/g, "-")}.jpg`;
      const photoRef = storageRef(storage, `events/${eventId}/photos/${filename}`);

      // Subir imagen
      await uploadBytes(photoRef, pendingBlob, { contentType: "image/jpeg" });
      const imageUrl = await getDownloadURL(photoRef);

      // Guardar metadata en Realtime DB
      const autoApprove = eventConfig?.autoApprove !== false; // default true
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
      // Guardar en cola offline
      if (pendingBlob) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const queue = JSON.parse(localStorage.getItem("livefeed_offline_queue") || "[]");
          queue.push({ dataUrl: ev.target.result, guestName, eventId, ts: Date.now() });
          localStorage.setItem("livefeed_offline_queue", JSON.stringify(queue));
          offlineQueueRef.current = queue;
        };
        reader.readAsDataURL(pendingBlob);
      }
      setUploadError("Sin conexión. La foto se guardó localmente y se subirá cuando vuelva la señal.");
    } finally {
      setUploading(false);
    }
  };

  // ── Reintentar cola offline cuando vuelve la conexión ────────────────────
  useEffect(() => {
    const retryOfflineQueue = async () => {
      const queue = JSON.parse(localStorage.getItem("livefeed_offline_queue") || "[]");
      if (!queue.length) return;

      const remaining = [];
      for (const item of queue) {
        try {
          const res = await fetch(item.dataUrl);
          const blob = await res.blob();
          const filename = `${item.ts}_offline_${item.guestName.replace(/\s+/g, "-")}.jpg`;
          const photoRef = storageRef(storage, `events/${item.eventId}/photos/${filename}`);
          await uploadBytes(photoRef, blob, { contentType: "image/jpeg" });
          const imageUrl = await getDownloadURL(photoRef);
          const newPhotoRef = ref(db, `livefeed/${item.eventId}/photos`);
          await set(push(newPhotoRef), {
            authorName: item.guestName,
            imageUrl,
            status: "approved",
            hidden: false,
            uploadedAt: item.ts,
            storagePath: `events/${item.eventId}/photos/${filename}`,
          });
        } catch {
          remaining.push(item);
        }
      }
      localStorage.setItem("livefeed_offline_queue", JSON.stringify(remaining));
    };

    window.addEventListener("online", retryOfflineQueue);
    return () => window.removeEventListener("online", retryOfflineQueue);
  }, []);

  // ── Render: loading ───────────────────────────────────────────────────────
  if (loadingEvent) {
    return (
      <div className="upload-screen upload-screen--loading">
        <div className="spinner spinner--large" />
        <p>Cargando evento...</p>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="upload-screen upload-screen--error">
        <div className="error-icon">⚠️</div>
        <h2>Algo salió mal</h2>
        <p>{eventError}</p>
      </div>
    );
  }

  if (eventConfig && eventConfig.cameraEnabled === false) {
    return (
      <div className="upload-screen">
        <div className="error-icon">⏸️</div>
        <h2>Cámara Pausada</h2>
        <p>El organizador ha pausado la subida de fotos por el momento. Intentá de nuevo en un rato.</p>
      </div>
    );
  }

  // ── Render: pantalla de nombre ────────────────────────────────────────────
  if (!nameConfirmed) {
    return (
      <div className="upload-screen">
        <div className="event-header">
          {eventConfig.logoUrl && (
            <img src={eventConfig.logoUrl} alt={eventConfig.eventName} className="event-logo" />
          )}
          <h1 className="event-name">{eventConfig.eventName || "¡Bienvenido!"}</h1>
          <p className="event-tagline">{eventConfig.tagline || "Compartí tus fotos del evento"}</p>
        </div>

        <form className="name-form" onSubmit={handleConfirmName}>
          <label htmlFor="name-input" className="name-label">
            ¿Cómo te llamás?
          </label>
          <input
            id="name-input"
            type="text"
            className="name-input"
            placeholder="Tu nombre..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={40}
            autoFocus
            required
          />
          <button type="submit" className="btn-primary" disabled={!nameInput.trim()}>
            ¡Listo, quiero sacar fotos!
          </button>
        </form>
      </div>
    );
  }

  // ── Render: pantalla principal ────────────────────────────────────────────
  return (
    <div className="upload-screen">
      <div className="event-header event-header--compact">
        {eventConfig.logoUrl && (
          <img src={eventConfig.logoUrl} alt={eventConfig.eventName} className="event-logo event-logo--small" />
        )}
        <div>
          <h1 className="event-name event-name--small">{eventConfig.eventName}</h1>
          <p className="guest-greeting">
            Hola, <strong>{guestName}</strong>!
            <button
              className="btn-change-name"
              onClick={() => {
                localStorage.removeItem(GUEST_NAME_KEY);
                setNameConfirmed(false);
                setNameInput("");
                setGuestName("");
              }}
            >
              (cambiar)
            </button>
          </p>
        </div>
      </div>

      {/* Éxito de upload */}
      {uploadSuccess && (
        <div className="upload-success">
          <div className="success-icon">🎉</div>
          <h2>¡Foto enviada!</h2>
          <p>Ya está apareciendo en la pantalla del salón</p>
          {photoCount > 1 && <p className="photo-count">Mandaste {photoCount} fotos</p>}
        </div>
      )}

      {/* Captura de cámara */}
      {!uploadSuccess && (
        <CameraCapture
          watermarkUrl={["premium", "corporativo"].includes(eventConfig.tier) ? eventConfig.watermarkUrl : null}
          onPhotoReady={handlePhotoReady}
          disabled={uploading}
        />
      )}

      {/* Botón de enviar */}
      {pendingBlob && !uploading && !uploadSuccess && (
        <button className="btn-upload" onClick={handleUpload}>
          📤 Enviar foto al salón
        </button>
      )}

      {uploading && (
        <div className="uploading-indicator">
          <div className="spinner" />
          <p>Enviando al salón...</p>
        </div>
      )}

      {uploadError && (
        <div className="upload-error">
          <p>{uploadError}</p>
        </div>
      )}

      {/* Botón para sacar otra */}
      {uploadSuccess && (
        <button
          className="btn-primary btn-another"
          onClick={() => {
            setUploadSuccess(false);
            setPendingBlob(null);
          }}
        >
          📷 Sacar otra foto
        </button>
      )}

      {/* Modo moderación info */}
      {eventConfig.autoApprove === false && !uploadSuccess && (
        <p className="moderation-notice">
          📋 Tus fotos serán revisadas antes de aparecer en pantalla
        </p>
      )}
    </div>
  );
}
