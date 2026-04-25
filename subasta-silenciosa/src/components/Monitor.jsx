import { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, query, limitToLast } from '../firebase';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
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

    // Reliable bid detection
    let isInitialLoad = true;
    let lastSeenBidId = null;

    onValue(bidsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bidId = Object.keys(data)[0];
        const bid = Object.values(data)[0];
        
        // Trigger if it's NOT the first time we load AND the bid ID has changed
        if (!isInitialLoad && bidId !== lastSeenBidId) {
          setTimeout(() => setMode('PUJA'), 100);
          if (pujaTimeoutRef.current) clearTimeout(pujaTimeoutRef.current);
          pujaTimeoutRef.current = setTimeout(() => setMode('BANNER'), 15000);
        }
        
        lastSeenBidId = bidId;
        setLastBid(bid);
      }
      isInitialLoad = false;
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
    <div className="monitor-root" style={{ 
      height: '100vh', width: '100vw', overflow: 'hidden', 
      background: '#0c162d', color: 'white',
      display: 'grid', gridTemplateRows: '200px 1fr 120px', gridTemplateColumns: '1fr 400px',
      position: 'relative'
    }}>
      <style>{`
        .monitor-sidebar { background: rgba(0,0,0,0.4); border-left: 2px solid var(--primary); padding: 1.5rem; overflow-y: auto; }
        .sidebar-item { display: flex; gap: 1rem; align-items: center; padding: 0.8rem; background: rgba(255,255,255,0.03); border-radius: 0.8rem; margin-bottom: 0.8rem; border: 1px solid rgba(224,159,62,0.1); }
        .sidebar-item.active { border-color: var(--primary); background: rgba(224,159,62,0.15); }
        .price-label { font-size: 0.8rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; }
      `}</style>

      {/* Header */}
      <header style={{ gridColumn: '1 / span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid var(--primary)', background: 'rgba(0,0,0,0.3)' }}>
        <img 
          src="https://fundacionnordelta.org/wp-content/uploads/2026/03/Fundacion-Nordelta-logo-25-anos-horizontal.png" 
          alt="Logo" 
          style={{ height: '140px', filter: 'drop-shadow(0 0 20px rgba(224,159,62,0.5))' }} 
        />
      </header>

      {/* Main & Footer with Layout Animation */}
      <LayoutGroup>
        <main style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', overflow: 'hidden' }}>
          {mode === 'BANNER' ? (
            <motion.div layoutId="main-content" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentSponsorIndex}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {currentSponsor?.video_url ? (
                    <video src={currentSponsor.video_url} autoPlay muted loop style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
                  ) : (
                    <img src={currentSponsor?.logo_url} style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} alt="" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            /* PUJA MODE: Big Price in center */
            <motion.div layoutId="price-info" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.6)', border: '5px solid var(--primary)', borderRadius: '4rem', padding: '5rem', textAlign: 'center', boxShadow: '0 0 100px rgba(224,159,62,0.4)', minWidth: '800px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', color: 'var(--primary)', marginBottom: '2rem' }}>
                   <TrendingUp size={80} />
                   <h1 style={{ fontSize: '5rem', fontWeight: 900, letterSpacing: '8px', margin: 0 }}>¡NUEVA PUJA!</h1>
                </div>
                <h2 style={{ fontSize: '3.5rem', marginBottom: '3rem' }}>{bidArt?.nombre}</h2>
                <div style={{ background: 'rgba(224,159,62,0.1)', padding: '3rem', borderRadius: '2rem', border: '1px solid var(--primary)' }}>
                  <p className="price-label" style={{ fontSize: '1.5rem' }}>OFERTA ACTUAL</p>
                  <p style={{ fontSize: '12rem', fontWeight: 900, color: 'var(--primary)', margin: 0, lineHeight: 1 }}>
                    ${Number(bidArt?.monto_actual || 0).toLocaleString('es-AR')}
                  </p>
                </div>
                <p style={{ fontSize: '3rem', marginTop: '3rem', fontWeight: 800 }}>{bidArt?.highestBidderName}</p>
              </div>
            </motion.div>
          )}
        </main>

        <aside className="monitor-sidebar">
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '2rem', textAlign: 'center', letterSpacing: '2px' }}>
            <Gavel size={20} style={{ marginRight: '10px' }} /> LOTES EN SUBASTA
          </h2>
          {articulos.map((art, idx) => (
            <div key={art.id} className={`sidebar-item ${idx === currentIndex ? 'active' : ''}`}>
              <img src={art.imagen_url} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '0.6rem' }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{art.nombre}</p>
                <p style={{ color: 'var(--primary)', fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>${Number(art.monto_actual || 0).toLocaleString('es-AR')}</p>
              </div>
            </div>
          ))}
        </aside>

        <footer style={{ gridColumn: '1 / span 2', background: 'rgba(0,0,0,0.5)', borderTop: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4rem' }}>
          {mode === 'BANNER' ? (
            <motion.div layoutId="price-info" style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="price-label">PRODUCTO ACTUAL</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currentArt?.nombre}</span>
              </div>
              <div style={{ background: 'var(--primary)', color: '#0c162d', padding: '0.5rem 2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>OFERTA ACTUAL:</span>
                 <span style={{ fontWeight: 900, fontSize: '2.2rem' }}>${Number(currentArt?.monto_actual || 0).toLocaleString('es-AR')}</span>
              </div>
            </motion.div>
          ) : (
            <motion.div layoutId="main-content" style={{ display: 'flex', alignItems: 'center', gap: '2rem', height: '80%' }}>
               <span className="price-label">EN EXHIBICIÓN:</span>
               <AnimatePresence mode="wait">
                 <motion.div key={currentSponsorIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                    {currentSponsor?.logo_url && <img src={currentSponsor.logo_url} style={{ height: '100%', objectFit: 'contain' }} />}
                 </motion.div>
               </AnimatePresence>
            </motion.div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>DESARROLLADO POR</span>
            <img src={logoPrecinto} style={{ height: '30px', opacity: 0.8 }} />
          </div>
        </footer>
      </LayoutGroup>
    </div>
  );
}
