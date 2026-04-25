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

    onValue(artRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setArticulos(Object.values(data).sort((a,b) => b.prioridad - a.prioridad));
    });

    onValue(sponRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSponsors(Object.values(data).sort((a,b) => a.orden - b.orden));
    });

    onValue(bidsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        isFirstLoadRef.current = false;
        return;
      }

      const bidId = Object.keys(data)[0];
      const bidData = Object.values(data)[0];

      // DISPARAR ANIMACIÓN
      if (!isFirstLoadRef.current && bidId !== lastBidIdRef.current) {
        setMode('PUJA');
        if (pujaTimeoutRef.current) clearTimeout(pujaTimeoutRef.current);
        pujaTimeoutRef.current = setTimeout(() => setMode('BANNER'), 15000);
      }

      lastBidIdRef.current = bidId;
      setLastBid(bidData);
      isFirstLoadRef.current = false;
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

      {/* Central Content Area */}
      <main style={{ position: 'relative', overflow: 'hidden', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <AnimatePresence mode="wait">
          {mode === 'BANNER' ? (
            <motion.div key="banner-mode" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {currentSponsor?.video_url ? (
                 <video src={currentSponsor.video_url} autoPlay muted loop style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
               ) : (
                 <img src={currentSponsor?.logo_url} style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} alt="" />
               )}
            </motion.div>
          ) : (
            <motion.div key="puja-mode" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ background: 'rgba(12, 22, 45, 0.95)', border: '6px solid var(--primary)', borderRadius: '4rem', padding: '5rem', textAlign: 'center', boxShadow: '0 0 120px rgba(224,159,62,0.6)', minWidth: '850px', backdropFilter: 'blur(15px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', color: 'var(--primary)', marginBottom: '2rem' }}>
                     <TrendingUp size={80} />
                     <h1 style={{ fontSize: '5rem', fontWeight: 900, letterSpacing: '8px', margin: 0 }}>¡NUEVA PUJA!</h1>
                  </div>
                  <h2 style={{ fontSize: '3.5rem', marginBottom: '3rem' }}>{lastBid?.articulo_nombre}</h2>
                  <div style={{ background: 'rgba(224,159,62,0.15)', padding: '3.5rem', borderRadius: '3rem', border: '1px solid var(--primary)' }}>
                    <p className="price-label" style={{ fontSize: '1.8rem' }}>OFERTA ACTUAL</p>
                    <p className="price-tag" style={{ fontSize: '12rem', margin: 0, lineHeight: 1 }}>
                      ${Number(lastBid?.monto || 0).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <p style={{ fontSize: '3.5rem', marginTop: '3.5rem', fontWeight: 800 }}>{lastBid?.user_name || articulos.find(a => a.id === lastBid?.articulo_id)?.highestBidderName}</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
        <AnimatePresence mode="wait">
          {mode === 'BANNER' ? (
            <motion.div key="footer-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="price-label">PRODUCTO ACTUAL</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currentArt?.nombre}</span>
              </div>
              <div style={{ background: 'var(--primary)', color: '#0c162d', padding: '0.5rem 2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>OFERTA ACTUAL:</span>
                 <span className="price-tag" style={{ color: '#0c162d', fontSize: '2.5rem' }}>${Number(currentArt?.monto_actual || 0).toLocaleString('es-AR')}</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="footer-puja" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '2rem', height: '80%' }}>
               <span className="price-label">EN EXHIBICIÓN:</span>
               {currentSponsor?.logo_url && <img src={currentSponsor.logo_url} style={{ height: '100%', objectFit: 'contain' }} />}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>DESARROLLADO POR</span>
          <img src={logoPrecinto} style={{ height: '30px', opacity: 0.8 }} />
        </div>
      </footer>
    </div>
  );
}
