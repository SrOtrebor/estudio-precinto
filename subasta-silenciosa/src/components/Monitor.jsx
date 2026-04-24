import { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, query, limitToLast } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Clock } from 'lucide-react';

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

    onValue(bidsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bid = Object.values(data)[0];
        if (lastBid && bid.timestamp > lastBid.timestamp) {
          triggerPujaMode(bid);
        }
        setLastBid(bid);
      }
    });
  }, [lastBid]);

  const triggerPujaMode = (bid) => {
    setMode('PUJA');
    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
    if (pujaTimeoutRef.current) clearTimeout(pujaTimeoutRef.current);
    pujaTimeoutRef.current = setTimeout(() => {
      setMode('BANNER');
    }, 8000);
  };

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
      height: '100vh', width: '100vw', overflow: 'hidden', background: '#0c162d',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Header Premium Fundación Nordelta */}
      <header className="monitor-header">
        <img 
          src="https://fundacionnordelta.org/wp-content/uploads/2024/09/Logo-Fundacion-Nordelta-25-Anos.png" 
          alt="Logo" 
          style={{ height: '80px', filter: 'drop-shadow(0 0 10px rgba(224,159,62,0.4))' }} 
        />
      </header>

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {mode === 'BANNER' ? (
            <motion.div 
              key="banner"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                {currentSponsor ? (
                  <motion.div 
                    key={currentSponsor.id}
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    {currentSponsor.video_url ? (
                      <video src={currentSponsor.video_url} autoPlay muted loop style={{ maxHeight: '60vh', borderRadius: '2rem', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} />
                    ) : (
                      <img src={currentSponsor.logo_url} style={{ maxHeight: '50vh', maxWidth: '80vw', objectFit: 'contain' }} alt="" />
                    )}
                  </motion.div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '6rem', color: 'var(--primary)', letterSpacing: '10px' }}>SUBASTA</h1>
                    <h2 style={{ fontSize: '3rem', opacity: 0.5 }}>Fundación Nordelta</h2>
                  </div>
                )}
              </div>

              {/* Ticker de artículos */}
              <div style={{ height: '180px', background: 'rgba(20, 40, 80, 0.5)', borderTop: '2px solid var(--primary)', display: 'flex', alignItems: 'center', padding: '0 5rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                  <img src={currentArt?.imagen_url} style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '1rem', border: '1px solid var(--primary)' }} />
                  <div>
                    <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{currentArt?.nombre}</h2>
                    <p style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 600 }}>ARTÍCULO EN SUBASTA</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.2rem', opacity: 0.7 }}>OFERTA ACTUAL</p>
                  <p className="price-tag" style={{ fontSize: '4.5rem', fontWeight: 900 }}>
                    ${Number(currentArt?.monto_actual || 0).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="puja"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }}
              style={{ 
                height: '100%', width: '100%', position: 'absolute', zIndex: 100,
                background: 'rgba(12, 22, 45, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', maxWidth: '1400px', alignItems: 'center' }}>
                <motion.img 
                  initial={{ x: -200 }} animate={{ x: 0 }}
                  src={bidArt?.imagen_url} 
                  style={{ width: '100%', height: '700px', objectFit: 'cover', borderRadius: '4rem', border: '5px solid var(--primary)', boxShadow: '0 0 100px rgba(224,159,62,0.3)' }} 
                />
                <motion.div initial={{ x: 200 }} animate={{ x: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--primary)', marginBottom: '2rem' }}>
                    <TrendingUp size={64} />
                    <span style={{ fontSize: '4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '5px' }}>¡Nueva Puja!</span>
                  </div>
                  <h1 style={{ fontSize: '5.5rem', marginBottom: '2rem' }}>{bidArt?.nombre}</h1>
                  <div className="glass" style={{ padding: '4rem', borderLeft: '15px solid var(--primary)' }}>
                    <p style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>Líder de la subasta:</p>
                    <p style={{ fontSize: '5rem', fontWeight: 800, marginBottom: '3rem' }}>{bidArt?.highestBidderName}</p>
                    <div style={{ height: '4px', background: 'rgba(224,159,62,0.2)', marginBottom: '3rem' }} />
                    <p className="price-tag" style={{ fontSize: '9rem', fontWeight: 900 }}>
                      ${Number(bidArt?.monto_actual).toLocaleString('es-AR')}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Estudio Precinto */}
      <footer className="monitor-footer">
        Desarrollado por <strong style={{ color: 'white', marginLeft: '5px' }}>ESTUDIO PRECINTO</strong>
      </footer>
    </div>
  );
}
