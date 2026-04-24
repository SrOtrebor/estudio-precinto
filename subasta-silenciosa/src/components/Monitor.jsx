import { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, query, limitToLast, orderByKey } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award } from 'lucide-react';

export default function Monitor() {
  const [articulos, setArticulos] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [lastBid, setLastBid] = useState(null);
  const [mode, setMode] = useState('BANNER'); // 'BANNER' or 'PUJA'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [flash, setFlash] = useState(false);
  
  const timerRef = useRef(null);
  const pujaTimeoutRef = useRef(null);

  // Load Data
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

    // Listen for NEW bids
    onValue(bidsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bid = Object.values(data)[0];
        // Only trigger if it's a new bid (not initial load)
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

    // Clear existing timeouts
    if (pujaTimeoutRef.current) clearTimeout(pujaTimeoutRef.current);
    
    // Return to BANNER after 8 seconds
    pujaTimeoutRef.current = setTimeout(() => {
      setMode('BANNER');
    }, 8000);
  };

  // Rotation logic for BANNER mode
  useEffect(() => {
    if (mode === 'BANNER') {
      timerRef.current = setInterval(() => {
        if (sponsors.length > 0) {
          setCurrentSponsorIndex(prev => (prev + 1) % sponsors.length);
        }
        if (articulos.length > 0) {
          setCurrentIndex(prev => (prev + 1) % articulos.length);
        }
      }, 10000); // Rotate every 10s
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [mode, sponsors.length, articulos.length]);

  const currentArt = articulos[currentIndex];
  const currentSponsor = sponsors[currentSponsorIndex];
  
  // Find article related to the last bid for PUJA mode
  const bidArt = lastBid ? articulos.find(a => a.id === lastBid.articulo_id) : null;

  return (
    <div className={`monitor-root ${flash ? 'flash-trigger' : ''}`} style={{ 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      background: 'black',
      position: 'relative'
    }}>
      <style>{`
        .monitor-root { color: white; font-family: 'Outfit', sans-serif; }
        .bg-gradient {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: radial-gradient(circle at center, #1a1a1a 0%, #000 100%);
          z-index: 0;
        }
      `}</style>

      <div className="bg-gradient" />

      <AnimatePresence mode="wait">
        {mode === 'BANNER' ? (
          <motion.div 
            key="banner-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {/* Sponsor Section (90%) */}
            <div style={{ flex: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
              {currentSponsor ? (
                <motion.div 
                  key={currentSponsor.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  transition={{ duration: 1 }}
                  style={{ textAlign: 'center', width: '100%' }}
                >
                  {currentSponsor.video_url ? (
                    <video 
                      src={currentSponsor.video_url} 
                      autoPlay muted loop 
                      style={{ maxWidth: '80%', maxHeight: '70vh', borderRadius: '2rem', boxShadow: '0 0 50px rgba(212,175,55,0.2)' }} 
                    />
                  ) : (
                    <img 
                      src={currentSponsor.logo_url} 
                      style={{ maxWidth: '60%', maxHeight: '60vh', objectFit: 'contain' }} 
                      alt={currentSponsor.nombre} 
                    />
                  )}
                  <h2 style={{ marginTop: '2rem', fontSize: '3rem', opacity: 0.5 }}>{currentSponsor.nombre}</h2>
                </motion.div>
              ) : (
                <h1 style={{ fontSize: '5rem' }}>Subasta Silenciosa</h1>
              )}
            </div>

            {/* Bottom Strip: Current High Bid (10%) */}
            <div style={{ flex: 1, background: 'rgba(212,175,55,0.1)', borderTop: '2px solid var(--primary)', display: 'flex', alignItems: 'center', padding: '0 4rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Award size={40} color="var(--primary)" />
                <div>
                  <p style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Artículo Destacado</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{currentArt?.nombre}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Monto Actual</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)' }}>
                  ${Number(currentArt?.monto_actual || 0).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="puja-mode"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{ 
              position: 'relative', zIndex: 10, height: '100%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)'
            }}
          >
            <div style={{ maxWidth: '1200px', width: '90%', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '4rem', alignItems: 'center' }}>
              <motion.img 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                src={bidArt?.imagen_url} 
                style={{ width: '100%', height: '600px', objectFit: 'cover', borderRadius: '3rem', border: '4px solid var(--primary)' }}
              />
              <div>
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                    <TrendingUp size={48} />
                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '4px' }}>¡Nueva Puja!</span>
                  </div>
                  <h1 style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '2rem', background: 'white', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {bidArt?.nombre}
                  </h1>
                  <div className="glass" style={{ padding: '3rem', borderLeft: '10px solid var(--primary)' }}>
                    <p style={{ fontSize: '2rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Oferta actual de:</p>
                    <p style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '2rem' }}>{bidArt?.highestBidderName || 'Alguien'}</p>
                    <div style={{ height: '2px', background: 'rgba(255,255,255,0.1)', marginBottom: '2rem' }} />
                    <p className="price-tag" style={{ fontSize: '8rem' }}>
                      ${Number(bidArt?.monto_actual).toLocaleString('es-AR')}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
