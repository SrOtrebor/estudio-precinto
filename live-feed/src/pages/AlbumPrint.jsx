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

    // Cargar Config
    const configRef = ref(db, `livefeed/${eventId}/config`);
    onValue(configRef, (snap) => {
      setEventConfig(snap.val());
    });

    // Cargar Fotos Aprobadas
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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Generando Álbum...</div>;

  return (
    <div className="album-print-page">
      <header className="no-print" style={{ padding: '1rem', background: '#333', color: '#fff', textAlign: 'center' }}>
        <h2>Vista Previa del Álbum - {eventConfig?.eventName}</h2>
        <p>Presioná Ctrl+P (o Cmd+P) y seleccioná "Guardar como PDF" en el destino de la impresora.</p>
        <button onClick={() => window.print()} style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', cursor: 'pointer', background: '#a28a68', border: 'none', color: '#fff', borderRadius: '8px' }}>
          🖨️ Abrir Diálogo de Impresión
        </button>
      </header>

      <div className="album-container">
        <h1 className="album-main-title">{eventConfig?.eventName}</h1>
        <p className="album-meta">Álbum de fotos del evento - {new Date().toLocaleDateString()}</p>

        <div className="album-grid">
          {photos.map((photo, index) => (
            <div key={photo.id} className="album-item">
              <img src={photo.imageUrl} alt={`Foto ${index + 1}`} />
              <div className="album-footer">
                <span>Por: {photo.authorName}</span>
                <span>{new Date(photo.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        body { background: white; color: black; margin: 0; font-family: 'Inter', sans-serif; }
        .album-container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
        .album-main-title { text-align: center; font-size: 3rem; margin-bottom: 0.5rem; color: #a28a68; }
        .album-meta { text-align: center; font-style: italic; color: #666; margin-bottom: 3rem; }
        
        .album-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .album-item { 
          page-break-inside: avoid; 
          border: 1px solid #eee; 
          padding: 10px; 
          border-radius: 4px;
          display: flex;
          flex-direction: column;
        }
        .album-item img { width: 100%; height: 400px; object-fit: cover; border-radius: 2px; }
        .album-footer { 
          display: flex; 
          justify-content: space-between; 
          font-size: 0.8rem; 
          margin-top: 10px; 
          color: #555;
          font-weight: 600;
        }

        @media print {
          .no-print { display: none; }
          body { padding: 0; }
          .album-container { max-width: 100%; width: 100%; padding: 0; }
          .album-grid { gap: 20px; }
        }
      `}</style>
    </div>
  );
}
