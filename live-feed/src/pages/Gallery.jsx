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

      {/* Grid masonry con estilo Polaroid */}
      {filtered.length === 0 ? (
        <div className="gallery-empty">
          <p>
            {search ? `No hay fotos de "${search}"` : "Todavía no hay fotos en esta galería"}
          </p>
        </div>
      ) : (
        <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem', padding: '2rem' }}>
          {filtered.map((photo, idx) => (
            <div
              key={photo.id}
              className="gallery-item-polaroid"
              onClick={() => setLightbox(photo)}
              style={{ 
                background: '#fff', 
                padding: '12px 12px 25px 12px', 
                borderRadius: '4px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                animationDelay: `${(idx % 20) * 40}ms`
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '260px', background: '#000', borderRadius: '2px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={photo.imageUrl} alt="" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px) brightness(0.5)', zIndex: 0 }} />
                <img src={photo.imageUrl} alt={`Foto de ${photo.authorName}`} style={{ relative: 'relative', zIndex: 1, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                {eventConfig?.logoUrl && (
                  <img src={eventConfig.logoUrl} alt="Watermark" style={{ position: 'absolute', bottom: '10px', right: '10px', height: '24px', opacity: 0.5, zIndex: 2 }} />
                )}
              </div>
              
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 4px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '700', letterSpacing: '1px' }}>ENVIADO POR</div>
                  <div style={{ fontSize: '1.2rem', color: '#111', fontWeight: '900', fontFamily: 'serif', lineHeight: 1.1 }}>{photo.authorName}</div>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '900', color: accentColor, textTransform: 'uppercase' }}>
                  {eventConfig?.eventName}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox con diseño Polaroid Gigante */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)} style={{ background: 'rgba(0,0,0,0.92)' }}>
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
          
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()} style={{ background: 'transparent', boxShadow: 'none' }}>
            <div className="polaroid-frame-modern" style={{ background: '#fff', padding: '15px 15px 40px 15px', borderRadius: '4px', boxShadow: '0 30px 70px rgba(0,0,0,0.8)', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div className="polaroid-photo-area" style={{ position: 'relative', width: '100%', height: '60vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={lightbox.imageUrl} alt="" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) brightness(0.4)' }} />
                <img src={lightbox.imageUrl} alt={lightbox.authorName} style={{ position: 'relative', zIndex: 1, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                {eventConfig?.logoUrl && (
                  <img src={eventConfig.logoUrl} alt="Watermark" style={{ position: 'absolute', bottom: '15px', right: '15px', height: '35px', opacity: 0.4, zIndex: 2 }} />
                )}
              </div>
              
              <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 8px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#999', fontWeight: '700', letterSpacing: '2px' }}>ENVIADO POR</div>
                  <div style={{ fontSize: '1.8rem', color: '#111', fontWeight: '900', fontFamily: 'serif' }}>{lightbox.authorName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                    📅 {new Date(lightbox.uploadedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', color: accentColor, textTransform: 'uppercase' }}>
                    {eventConfig?.eventName}
                  </span>
                  
                  <a 
                    href={lightbox.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download
                    style={{ background: accentColor, color: '#000', padding: '0.4rem 1.2rem', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.85rem', textDecoration: 'none' }}
                  >
                    ⬇️ Descargar Foto
                  </a>
                </div>
              </div>
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
