import { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, query, limitToLast } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Sparkles, Gavel } from 'lucide-react';
import logoPrecinto from '../assets/logo-precinto.svg';

export default function Monitor() {
  const [articulos, setArticulos] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [lastBid, setLastBid] = useState(null);
  const [mode, setMode] = useState('BANNER'); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [flash, setFlash] = useState(false);
  
  const timerRef = useRef(null);
  const pujaTimeoutRef = useRef(null);

  useEffect(() => {
    const artRef = ref(db, 'articulos');
    const sponRef = ref(db, 'sponsors');
    const bidsRef = query(ref(db, 'pujas'), limitToLast(1));

    onValue(artRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setArticulos(Object.values(data).sort((a,b) => b.prioridad - a.prioridad));
    });

    onValue(sponRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSponsors(Object.values(data).sort((a,b) => a.orden - b.orden));
    });

    const startTime = Date.now();
    onValue(bidsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bid = Object.values(data)[0];
        if (bid.timestamp > startTime) {
          setTimeout(() => {
            setMode('PUJA');
            setFlash(true);
            setTimeout(() => setFlash(false), 1000);
            if (pujaTimeoutRef.current) clearTimeout(pujaTimeoutRef.current);
            pujaTimeoutRef.current = setTimeout(() => setMode('BANNER'), 8000);
          }, 300);
        }
        setLastBid(bid);
      }
    });
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
  const bidArt = lastBid ? articulos.find(a => a.id === lastBid.articulo_id) : null;

  return (
    <div className={`monitor-root ${flash ? 'flash-trigger' : ''}`} style={{ 
      height: '100vh', width: '100vw', overflow: 'hidden', 
      background: '#0c162d', color: 'white',
      display: 'grid', gridTemplateRows: '200px 1fr 100px', gridTemplateColumns: '1fr 400px',
      position: 'relative'
    }}>
      <style>{`
        .monitor-sidebar { background: rgba(0,0,0,0.3); border-left: 2px solid var(--primary); padding: 1.5rem; overflow-y: auto; }
        .sidebar-item { display: flex; gap: 1rem; align-items: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 1rem; margin-bottom: 1rem; border: 1px solid rgba(224,159,62,0.1); }
        .sidebar-item.active { border-color: var(--primary); background: rgba(224,159,62,0.1); box-shadow: 0 0 15px rgba(224,159,62,0.2); }
        .price-glow { color: var(--primary); font-family: 'Space Mono', monospace; font-weight: 800; }
        .puja-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justifyContent: center; z-index: 100; backdrop-filter: blur(10px); }
        .puja-card { background: #0c162d; border: 4px solid var(--primary); padding: 4rem; border-radius: 3rem; text-align: center; box-shadow: 0 0 100px rgba(224,159,62,0.4); width: 800px; }
      `}</style>

      {/* Header - Span across all columns */}
      <header style={{ gridColumn: '1 / span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid var(--primary)', background: 'rgba(0,0,0,0.2)' }}>
        <img 
          src="https://fundacionnordelta.org/wp-content/uploads/2026/03/Fundacion-Nordelta-logo-25-anos-horizontal.png" 
          alt="Logo" 
          style={{ height: '150px', filter: 'drop-shadow(0 0 20px rgba(224,159,62,0.5))' }} 
        />
      </header>

      {/* Main Content Area */}
      <main style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSponsorIndex}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {currentSponsor?.video_url ? (
              <video src={currentSponsor.video_url} autoPlay muted loop style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
            ) : currentSponsor?.logo_url ? (
              <img src={currentSponsor.logo_url} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} alt="" />
            ) : (
              <h1 style={{ fontSize: '8rem', fontWeight: 900, opacity: 0.2 }}>BANNERS</h1>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Puja Overlay (Interrupts main area only if you want, or whole screen) */}
        <AnimatePresence>
          {mode === 'PUJA' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="puja-overlay"
              style={{ gridColumn: '1 / span 1' }} // Only covers main area
            >
              <motion.div 
                initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }}
                className="puja-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                  <TrendingUp size={60} />
                  <h2 style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '5px' }}>¡NUEVA PUJA!</h2>
                </div>
                <h3 style={{ fontSize: '3rem', marginBottom: '2rem', opacity: 0.8 }}>{bidArt?.nombre}</h3>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '2rem', border: '1px solid var(--primary)' }}>
                  <p style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>OFERTA ACTUAL</p>
                  <p style={{ fontSize: '10rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1, margin: 0 }}>
                    ${Number(bidArt?.monto_actual || 0).toLocaleString('es-AR')}
                  </p>
                </div>
                <p style={{ fontSize: '2.5rem', marginTop: '2rem', fontWeight: 700 }}>{bidArt?.highestBidderName}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Right Sidebar - Product List */}
      <aside className="monitor-sidebar">
        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '2rem', textAlign: 'center', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Gavel size={24} /> LOTES EN SUBASTA
        </h2>
        {articulos.map((art, idx) => (
          <div key={art.id} className={`sidebar-item ${idx === currentIndex ? 'active' : ''}`}>
            <img src={art.imagen_url} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.8rem' }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{art.nombre}</p>
              <p className="price-glow" style={{ fontSize: '1.4rem', margin: 0 }}>${Number(art.monto_actual || 0).toLocaleString('es-AR')}</p>
            </div>
          </div>
        ))}
      </aside>

      {/* Footer - Span across all columns */}
      <footer style={{ gridColumn: '1 / span 2', background: 'rgba(0,0,0,0.4)', borderTop: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 2rem', borderRadius: '1rem', border: '1px solid var(--primary)' }}>
             <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginRight: '1rem' }}>PRODUCTO ACTUAL:</span>
             <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentArt?.nombre || "Cargando..."}</span>
          </div>
          <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 800 }}>
             OFERTA: ${Number(currentArt?.monto_actual || 0).toLocaleString('es-AR')}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>DESARROLLADO POR</span>
          <img src={logoPrecinto} style={{ height: '30px' }} />
        </div>
      </footer>
    </div>
  );
}
