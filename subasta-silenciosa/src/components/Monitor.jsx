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

    // 1. Carga inicial para saber dónde estamos
    let initialSyncDone = false;
    
    // Escuchar pujas de forma ultra-sensible
    onValue(bidsRef, (snapshot) => {
      const data = snapshot.val();
      const bidId = data ? Object.keys(data)[0] : null;
      const bidData = data ? Object.values(data)[0] : null;

      // DISPARADOR: Si ya sincronizamos y el ID es nuevo, saltar animación
      if (initialSyncDone && bidId && bidId !== lastBidIdRef.current) {
        setMode('PUJA');
        if (pujaTimeoutRef.current) clearTimeout(pujaTimeoutRef.current);
        pujaTimeoutRef.current = setTimeout(() => setMode('BANNER'), 15000);
      }

      // Guardar estado actual
      if (bidId) lastBidIdRef.current = bidId;
      if (bidData) setLastBid(bidData);
      
      // Marcar como sincronizado después del primer golpe de datos (o si está vacío)
      initialSyncDone = true;
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
      {/* Vuelven las Estrellas Animadas */}
      <div className="sparkles-container">
        {[...Array(40)].map((_, i) => (
          <div key={i} className="sparkle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            transform: `scale(${Math.random()})`
          }} />
        ))}
      </div>

      <style>{`
        .sparkles-container { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .sparkle {
          position: absolute; width: 3px; height: 3px; background: white;
          border-radius: 50%; opacity: 0;
          animation: twinkle 4s infinite;
          box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.3);
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .monitor-sidebar { background: rgba(0,0,0,0.5); border-left: 2px solid var(--primary); padding: 1.5rem; overflow-y: auto; z-index: 1; backdrop-filter: blur(5px); }
        .sidebar-item { display: flex; gap: 1rem; align-items: center; padding: 0.8rem; background: rgba(255,255,255,0.03); border-radius: 0.8rem; margin-bottom: 0.8rem; border: 1px solid rgba(224,159,62,0.1); }
        .sidebar-item.active { border-color: var(--primary); background: rgba(224,159,62,0.15); }
        .price-label { font-size: 0.8rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; }
      `}</style>

      {/* Header */}
      <header style={{ gridColumn: '1 / span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid var(--primary)', background: 'rgba(0,0,0,0.4)', zIndex: 1 }}>
        <img 
          src="https://fundacionnordelta.org/wp-content/uploads/2026/03/Fundacion-Nordelta-logo-25-anos-horizontal.png" 
          alt="Logo" 
          style={{ height: '140px', filter: 'drop-shadow(0 0 20px rgba(224,159,62,0.5))' }} 
        />
      </header>

      {/* Main Area */}
      <LayoutGroup>
        <main style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', overflow: 'hidden', zIndex: 1 }}>
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
            /* PUJA MODE */
            <motion.div layoutId="price-info" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(12, 22, 45, 0.9)', border: '5px solid var(--primary)', borderRadius: '4rem', padding: '4rem', textAlign: 'center', boxShadow: '0 0 100px rgba(224,159,62,0.5)', minWidth: '850px', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', color: 'var(--primary)', marginBottom: '1.5rem' }}>
                   <TrendingUp size={70} />
                   <h1 style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '8px', margin: 0 }}>¡NUEVA PUJA!</h1>
                </div>
                <h2 style={{ fontSize: '3.5rem', marginBottom: '2.5rem' }}>{lastBid?.articulo_nombre}</h2>
                <div style={{ background: 'rgba(224,159,62,0.1)', padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--primary)' }}>
                  <p className="price-label" style={{ fontSize: '1.4rem' }}>OFERTA ACTUAL</p>
                  <p style={{ fontSize: '11rem', fontWeight: 900, color: 'var(--primary)', margin: 0, lineHeight: 1 }}>
                    ${Number(lastBid?.monto || 0).toLocaleString('es-AR')}
                  </p>
                </div>
                <p style={{ fontSize: '2.8rem', marginTop: '2.5rem', fontWeight: 800 }}>{articulos.find(a => a.id === lastBid?.articulo_id)?.highestBidderName}</p>
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

        <footer style={{ gridColumn: '1 / span 2', background: 'rgba(0,0,0,0.6)', borderTop: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4rem', zIndex: 1 }}>
          {mode === 'BANNER' ? (
            <motion.div layoutId="price-info" style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="price-label">PRODUCTO ACTUAL</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currentArt?.nombre}</span>
              </div>
              <div style={{ background: 'var(--primary)', color: '#0c162d', padding: '0.5rem 2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>OFERTA:</span>
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
