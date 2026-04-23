import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db, ref, onValue } from "../firebase";

export default function AlbumPrint() {
  const { eventId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [eventConfig, setEventConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const configRef = ref(db, `livefeed/${eventId}/config`);
    onValue(configRef, (snap) => {
      setEventConfig(snap.val());
    });

    const photosRef = ref(db, `livefeed/${eventId}/photos`);
    const unsub = onValue(photosRef, (snap) => {
      const data = snap.val();
      if (!data) { setPhotos([]); setLoading(false); return; }
      const list = Object.entries(data)
        .map(([id, p]) => ({ id, ...p }))
        .filter(p => p.status === 'approved' && !p.hidden)
        .sort((a, b) => a.uploadedAt - b.uploadedAt);
      setPhotos(list);
      setLoading(false);
    });

    return () => unsub();
  }, [eventId]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Generando Álbum Digital...</div>;

  const accentColor = eventConfig?.accentColor || "#a28a68";

  return (
    <div className="album-print-page">
      <header className="no-print">
        <div className="header-inner">
          <div className="header-info">
            <h2>Álbum Final: {eventConfig?.eventName}</h2>
            <p>Vista optimizada para guardar como PDF (A4).</p>
          </div>
          <button onClick={() => window.print()} className="print-btn">
            🖨️ Imprimir / Guardar PDF
          </button>
        </div>
      </header>

      {/* PORTADA */}
      <section className="album-cover">
        <div className="cover-content">
          {eventConfig?.logoUrl && <img src={eventConfig.logoUrl} alt="Logo" className="cover-logo" />}
          <h1 style={{ color: accentColor }}>{eventConfig?.eventName}</h1>
          <div className="cover-line" style={{ background: accentColor }}></div>
          <p className="cover-date">{eventConfig?.date ? new Date(eventConfig.date).toLocaleDateString('es-AR', { dateStyle: 'long' }) : ''}</p>
          <div className="cover-footer">
            <p>Álbum de Fotos Digital</p>
            <p className="studio-brand">by ESTUDIO PRECINTO</p>
          </div>
        </div>
      </section>

      {/* GRILLA DE FOTOS */}
      <section className="album-body">
        <div className="album-grid">
          {photos.map((photo, index) => (
            <div key={photo.id} className="album-polaroid-card">
              <div className="photo-inner">
                <img src={photo.imageUrl} alt={`Foto ${index + 1}`} />
              </div>
              <div className="photo-footer">
                <div className="footer-left">
                  <p className="author">{photo.authorName}</p>
                  <p className="time">{new Date(photo.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs</p>
                </div>
                <div className="footer-right">
                  <span className="event-label">{eventConfig?.eventName}</span>
                  {eventConfig?.logoUrl && <img src={eventConfig.logoUrl} alt="Logo" className="mini-logo" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="album-footer-all">
        <p>Generado por Social Live Feed - {eventConfig?.eventName} - Página oficial del evento</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        body { background: #f5f5f5; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        
        .no-print { 
          position: sticky; top: 0; z-index: 1000;
          background: #1a1a1a; color: white; padding: 1rem 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .header-inner { max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; }
        .header-info h2 { margin: 0; font-size: 1.2rem; }
        .header-info p { margin: 0; font-size: 0.8rem; opacity: 0.7; }
        .print-btn { 
          background: #a28a68; color: white; border: none; padding: 0.8rem 1.5rem; 
          border-radius: 8px; cursor: pointer; font-weight: bold; transition: transform 0.2s;
        }
        .print-btn:hover { transform: scale(1.05); }

        /* PORTADA */
        .album-cover { 
          background: white; width: 210mm; min-height: 297mm; 
          margin: 40px auto; display: flex; align-items: center; justify-content: center;
          position: relative; box-shadow: 0 0 40px rgba(0,0,0,0.1);
          page-break-after: always;
        }
        .cover-content { text-align: center; max-width: 80%; }
        .cover-logo { height: 150px; margin-bottom: 3rem; }
        .album-cover h1 { font-family: 'Playfair Display', serif; font-size: 4.5rem; margin: 0; line-height: 1.1; }
        .cover-line { height: 4px; width: 100px; margin: 2rem auto; }
        .cover-date { font-size: 1.5rem; letter-spacing: 2px; text-transform: uppercase; color: #666; }
        .cover-footer { position: absolute; bottom: 3rem; width: 100%; left: 0; color: #999; }
        .studio-brand { font-weight: 900; letter-spacing: 3px; color: #333; margin-top: 0.5rem; }

        /* BODY */
        .album-body { width: 210mm; margin: 0 auto; background: white; padding: 20mm; box-shadow: 0 0 40px rgba(0,0,0,0.1); }
        .album-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15mm; }
        .album-polaroid-card { 
          page-break-inside: avoid; 
          background: #fff;
          padding: 10mm 10mm 20mm 10mm;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          border: 1px solid #eee;
          display: flex; flex-direction: column;
          transform: rotate(var(--r));
        }
        .album-polaroid-card:nth-child(even) { --r: 1deg; }
        .album-polaroid-card:nth-child(odd) { --r: -1deg; }

        .photo-inner { width: 100%; display: flex; justify-content: center; background: #000; }
        .photo-inner img { max-width: 100%; height: auto; max-height: 180mm; object-fit: contain; }
        
        .photo-footer { margin-top: 5mm; display: flex; justify-content: space-between; align-items: flex-end; }
        .footer-left { display: flex; flex-direction: column; }
        .photo-footer .author { font-weight: 900; font-size: 1.1rem; margin: 0; color: #111; font-family: 'Playfair Display', serif; line-height: 1.2; }
        .photo-footer .time { font-size: 0.6rem; margin: 0; color: #999; text-transform: uppercase; letter-spacing: 1px; }
        
        .footer-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2mm; }
        .event-label { font-size: 0.6rem; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .mini-logo { height: 25px; width: auto; object-fit: contain; opacity: 0.8; }

        .album-footer-all { text-align: center; padding: 2rem; color: #999; font-size: 0.7rem; }

        @media print {
          body { background: white; }
          .no-print, .album-footer-all { display: none; }
          .album-cover, .album-body { margin: 0; box-shadow: none; width: 100%; }
          .album-body { padding: 10mm; }
          .album-grid { gap: 10mm; }
        }
      `}</style>
    </div>
  );
}
