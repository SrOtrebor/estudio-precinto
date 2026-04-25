import { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, query, limitToLast } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Gavel } from 'lucide-react';
import logoPrecinto from '../assets/logo-precinto.svg';

export default function Monitor() {
  const [articulos, setArticulos] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [lastBid, setLastBid] = useState(null);
  const [mode, setMode] = useState('BANNER'); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  
  const timerRef = useRef(null);
  const pujaTimeoutRef = useRef(null);
  const lastBidIdRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    const artRef = ref(db, 'articulos');
    const sponRef = ref(db, 'sponsors');
    const bidsRef = query(ref(db, 'pujas'), limitToLast(1));

    const unsubscribeArt = onValue(artRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const newArticulos = Object.values(data);

      // Si no es la carga inicial, buscamos qué artículo subió de precio
      if (!isFirstLoadRef.current) {
        let changedArt = null;
        
        // Comparamos el nuevo estado con el estado anterior guardado en "articulos"
        setArticulos(prevArticulos => {
          newArticulos.forEach(newArt => {
            const oldArt = prevArticulos.find(a => a.id === newArt.id);
            if (oldArt && newArt.monto_actual > oldArt.monto_actual) {
              changedArt = newArt;
            }
          });
          return newArticulos.sort((a,b) => b.prioridad - a.prioridad);
        });

        // Si encontramos un artículo que subió de precio, disparamos la alerta gigante
        if (changedArt) {
          setLastBid({
            articulo_id: changedArt.id,
            articulo_nombre: changedArt.nombre,
            monto: changedArt.monto_actual,
            user_name: changedArt.highestBidderName
          });
          setMode('PUJA');
          if (pujaTimeoutRef.current) clearTimeout(pujaTimeoutRef.current);
          pujaTimeoutRef.current = setTimeout(() => setMode('BANNER'), 12000);
        }
      } else {
        setArticulos(newArticulos.sort((a,b) => b.prioridad - a.prioridad));
        isFirstLoadRef.current = false;
      }
    });

    const unsubscribeSpon = onValue(sponRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSponsors(Object.values(data).sort((a,b) => a.orden - b.orden));
    });

    return () => {
      unsubscribeArt();
      unsubscribeSpon();
      if (pujaTimeoutRef.current) clearTimeout(pujaTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode === 'BANNER') {
      timerRef.current = setInterval(() => {
        if (sponsors.length > 0) setCurrentSponsorIndex(prev => (prev + 1) % sponsors.length);
        if (articulos.length > 0) setCurrentIndex(prev => (prev + 1) % articulos.length);
      }, 10000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [mode, sponsors.length, articulos.length]);

  const currentArt = articulos[currentIndex];
  const currentSponsor = sponsors[currentSponsorIndex];

  return (
    <div className="monitor-root" style={{ 
      height: '100vh', width: '100vw', overflow: 'hidden', 
      background: '#0c162d', color: 'white',
      display: 'grid', gridTemplateRows: '200px 1fr 120px', gridTemplateColumns: '1fr 400px',
      position: 'relative', fontFamily: 'Montserrat, sans-serif'
    }}>
      {/* Estrellas */}
      <div className="sparkles-container">
        {[...Array(40)].map((_, i) => (
          <div key={i} className="sparkle" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }} />
        ))}
      </div>

      <style>{`
        .sparkles-container { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .sparkle { position: absolute; width: 3px; height: 3px; background: white; border-radius: 50%; opacity: 0; animation: twinkle 4s infinite; box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.3); }
        @keyframes twinkle { 0%, 100% { opacity: 0; transform: scale(0.5); } 50% { opacity: 0.8; transform: scale(1.2); } }
        .monitor-sidebar { background: rgba(0,0,0,0.5); border-left: 2px solid var(--primary); padding: 1.5rem; overflow-y: auto; z-index: 1; backdrop-filter: blur(5px); }
        .sidebar-item { display: flex; gap: 1rem; align-items: center; padding: 0.8rem; background: rgba(255,255,255,0.03); border-radius: 0.8rem; margin-bottom: 0.8rem; border: 1px solid rgba(224,159,62,0.1); }
        .sidebar-item.active { border-color: var(--primary); background: rgba(224,159,62,0.15); }
        .price-label { font-size: 0.8rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; }
        .price-tag { color: var(--primary); font-weight: 900; font-family: 'Space Mono', monospace; }
      `}</style>

      {/* Header */}
      <header style={{ gridColumn: '1 / span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid var(--primary)', background: 'rgba(0,0,0,0.4)', zIndex: 1 }}>
        <img src="https://fundacionnordelta.org/wp-content/uploads/2026/03/Fundacion-Nordelta-logo-25-anos-horizontal.png" alt="Logo" style={{ height: '140px', filter: 'drop-shadow(0 0 20px rgba(224,159,62,0.5))' }} />
      </header>

      {/* Central Content Area (Siempre muestra el banner ahora) */}
      <main style={{ position: 'relative', overflow: 'hidden', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <AnimatePresence mode="wait">
          <motion.div key={currentSponsorIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {currentSponsor?.video_url ? (
               <video src={currentSponsor.video_url} autoPlay muted loop style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
             ) : (
               <img src={currentSponsor?.logo_url} style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} alt="" />
             )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* OVERLAY DE PUJA GIGANTE - CSS PURO PARA EVITAR BLOQUEOS */}
      <div 
        style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(12, 22, 45, 0.90)',
          opacity: mode === 'PUJA' ? 1 : 0,
          pointerEvents: mode === 'PUJA' ? 'auto' : 'none',
          transition: 'opacity 0.4s ease-in-out',
          backdropFilter: mode === 'PUJA' ? 'blur(15px)' : 'blur(0px)'
        }}
      >
         <div 
            style={{ 
              background: 'rgba(12, 22, 45, 0.95)', border: '6px solid var(--primary)', borderRadius: '4rem', padding: '5rem', textAlign: 'center', boxShadow: '0 0 150px rgba(224,159,62,0.6)', minWidth: '850px',
              transform: mode === 'PUJA' ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(50px)',
              transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
         >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', color: 'var(--primary)', marginBottom: '2rem' }}>
               <TrendingUp size={90} />
               <h1 style={{ fontSize: '6rem', fontWeight: 900, letterSpacing: '8px', margin: 0 }}>¡NUEVA PUJA!</h1>
            </div>
            <h2 style={{ fontSize: '4rem', marginBottom: '3rem' }}>{lastBid?.articulo_nombre}</h2>
            <div style={{ background: 'rgba(224,159,62,0.15)', padding: '3.5rem', borderRadius: '3rem', border: '1px solid var(--primary)' }}>
              <p className="price-label" style={{ fontSize: '1.8rem' }}>OFERTA ACTUAL</p>
              <p className="price-tag" style={{ fontSize: '14rem', margin: 0, lineHeight: 1 }}>
                ${Number(lastBid?.monto || 0).toLocaleString('es-AR')}
              </p>
            </div>
            <p style={{ fontSize: '4rem', marginTop: '3.5rem', fontWeight: 800 }}>{lastBid?.user_name || articulos.find(a => a.id === lastBid?.articulo_id)?.highestBidderName}</p>
         </div>
      </div>

      {/* Sidebar */}
      <aside className="monitor-sidebar">
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '2rem', textAlign: 'center', letterSpacing: '2px' }}>
          <Gavel size={20} style={{ marginRight: '10px' }} /> LOTES EN SUBASTA
        </h2>
        {articulos.map((art, idx) => (
          <div key={art.id} className={`sidebar-item ${idx === currentIndex ? 'active' : ''}`}>
            <img src={art.imagen_url} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '0.6rem' }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{art.nombre}</p>
              <p className="price-tag" style={{ fontSize: '1.2rem', margin: 0 }}>${Number(art.monto_actual || 0).toLocaleString('es-AR')}</p>
            </div>
          </div>
        ))}
      </aside>

      {/* Footer */}
      <footer style={{ gridColumn: '1 / span 2', background: 'rgba(0,0,0,0.6)', borderTop: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4rem', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="price-label">PRODUCTO EN PANTALLA</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currentArt?.nombre}</span>
          </div>
          <div style={{ background: 'var(--primary)', color: '#0c162d', padding: '0.5rem 2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>OFERTA:</span>
             <span className="price-tag" style={{ color: '#0c162d', fontSize: '2.5rem' }}>${Number(currentArt?.monto_actual || 0).toLocaleString('es-AR')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>DESARROLLADO POR</span>
          <img src={logoPrecinto} style={{ height: '30px', opacity: 0.8 }} />
        </div>
      </footer>
    </div>
  );
}
