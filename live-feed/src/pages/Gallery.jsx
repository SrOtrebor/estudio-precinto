import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { db, ref, onValue, get } from "../firebase";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Gallery() {
  const { eventId } = useParams();
  const [eventConfig, setEventConfig] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [search, setSearch] = useState("");
  const [lightbox, setLightbox] = useState(null); // foto en lightbox
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // ── Cargar config ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return;
    get(ref(db, `livefeed/${eventId}/config`)).then((snap) => {
      if (snap.exists()) setEventConfig(snap.val());
    });
  }, [eventId]);

  // ── Escuchar fotos aprobadas ──────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return;
    const unsub = onValue(ref(db, `livefeed/${eventId}/photos`), (snap) => {
      const data = snap.val();
      if (!data) { setPhotos([]); return; }
      const approved = Object.entries(data)
        .map(([id, p]) => ({ id, ...p }))
        .filter((p) => p.status === "approved" && !p.hidden)
        .sort((a, b) => a.uploadedAt - b.uploadedAt);
      setPhotos(approved);
    });
    return () => unsub();
  }, [eventId]);

  // ── Filtrar por nombre ────────────────────────────────────────────────────
  const filtered = photos.filter((p) =>
    p.authorName.toLowerCase().includes(search.toLowerCase())
  );

  // ── Descargar ZIP ─────────────────────────────────────────────────────────
  const handleDownloadAll = useCallback(async () => {
    if (photos.length === 0) return;
    setDownloading(true);
    setDownloadProgress(0);

    const zip = new JSZip();
    const folder = zip.folder(eventConfig?.eventName || eventId);

    let done = 0;
    await Promise.all(
      photos.map(async (photo) => {
        try {
          const res = await fetch(photo.imageUrl);
          const blob = await res.blob();
          const ext = "jpg";
          const filename = `${photo.authorName.replace(/\s+/g, "_")}_${photo.uploadedAt}.${ext}`;
          folder.file(filename, blob);
        } catch {
          // Ignorar fotos que no se puedan descargar
        } finally {
          done++;
          setDownloadProgress(Math.round((done / photos.length) * 100));
        }
      })
    );

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${eventId}_fotos.zip`);
    setDownloading(false);
  }, [photos, eventId, eventConfig]);

  // ── Lightbox: navegación con flechas ─────────────────────────────────────
  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") {
        setLightbox((l) => {
          const idx = filtered.findIndex((p) => p.id === l.id);
          return filtered[(idx + 1) % filtered.length];
        });
      }
      if (e.key === "ArrowLeft") {
        setLightbox((l) => {
          const idx = filtered.findIndex((p) => p.id === l.id);
          return filtered[(idx - 1 + filtered.length) % filtered.length];
        });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, filtered]);

  const isPremium = eventConfig?.tier === "premium" || eventConfig?.tier === "corporativo";
  const accentColor = eventConfig?.accentColor || "#a28a68";

  return (
    <div className="gallery-screen">
      {/* Header */}
      <header className="gallery-header">
        <div className="gallery-header-top">
          {eventConfig?.logoUrl && (
            <img src={eventConfig.logoUrl} alt={eventConfig.eventName} className="gallery-event-logo" />
          )}
          <div>
            <h1 className="gallery-title" style={{ color: accentColor }}>
              {eventConfig?.eventName || "Galería del Evento"}
            </h1>
            <p className="gallery-subtitle">{photos.length} fotos compartidas</p>
          </div>
        </div>

        <div className="gallery-controls">
          <input
            type="search"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="gallery-search"
          />

          {isPremium ? (
            <button
              className="btn-download"
              onClick={handleDownloadAll}
              disabled={downloading || photos.length === 0}
              style={{ "--accent": accentColor }}
            >
              {downloading
                ? `Preparando... ${downloadProgress}%`
                : `⬇️ Descargar todas (${photos.length})`}
            </button>
          ) : (
            <span className="gallery-premium-hint">
              🔒 Descarga disponible en plan Premium
            </span>
          )}
        </div>
      </header>

      {/* Grid masonry */}
      {filtered.length === 0 ? (
        <div className="gallery-empty">
          <p>
            {search ? `No hay fotos de "${search}"` : "Todavía no hay fotos en esta galería"}
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
          {filtered.map((photo, idx) => (
            <div
              key={photo.id}
              className="gallery-item"
              onClick={() => setLightbox(photo)}
              style={{ animationDelay: `${(idx % 20) * 40}ms` }}
            >
              <img src={photo.imageUrl} alt={`Foto de ${photo.authorName}`} className="gallery-img" />
              <div className="gallery-item-overlay">
                <span>{photo.authorName}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          <button
            className="lightbox-nav lightbox-nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              const idx = filtered.findIndex((p) => p.id === lightbox.id);
              setLightbox(filtered[(idx - 1 + filtered.length) % filtered.length]);
            }}
          >
            ‹
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.imageUrl} alt={lightbox.authorName} className="lightbox-img" />
            <div className="lightbox-caption">
              <strong>{lightbox.authorName}</strong>
              <span>
                {new Date(lightbox.uploadedAt).toLocaleDateString("es-AR", {
                  day: "2-digit", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              </span>
            </div>
          </div>
          <button
            className="lightbox-nav lightbox-nav--next"
            onClick={(e) => {
              e.stopPropagation();
              const idx = filtered.findIndex((p) => p.id === lightbox.id);
              setLightbox(filtered[(idx + 1) % filtered.length]);
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
