import { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, query, limitToLast } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Sparkles } from 'lucide-react';
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
      height: '100vh', width: '100vw', overflow: 'hidden', 
      background: 'linear-gradient(135deg, #0c162d 0%, #000000 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative'
    }}>
      {/* Background Sparkles Effect */}
      <div className="sparkles-container">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="sparkle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            transform: `scale(${Math.random()})`
          }} />
        ))}
      </div>

      <style>{`
        .sparkles-container { position: absolute; inset: 0; pointer-events: none; }
        .sparkle {
          position: absolute; width: 4px; height: 4px; background: white;
          border-radius: 50%; opacity: 0;
          animation: twinkle 4s infinite;
          box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.3);
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .flash-trigger { animation: flashEffect 1s ease-out; }
        @keyframes flashEffect {
          0% { background: white; }
          100% { background: inherit; }
        }
      `}</style>

      {/* Header */}
      <header className="monitor-header" style={{ position: 'relative', zIndex: 2 }}>
        <img 
          src="https://fundacionnordelta.org/wp-content/uploads/2026/03/Fundacion-Nordelta-logo-25-anos-horizontal.png" 
          alt="Logo" 
          style={{ height: '90px', filter: 'drop-shadow(0 0 15px rgba(224,159,62,0.6))' }} 
        />
      </header>

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
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
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ textAlign: 'center' }}
                  >
                    {currentSponsor.video_url ? (
                      <video src={currentSponsor.video_url} autoPlay muted loop style={{ maxHeight: '65vh', borderRadius: '2rem', border: '2px solid var(--primary)', boxShadow: '0 0 60px rgba(224,159,62,0.2)' }} />
                    ) : (
                      <img src={currentSponsor.logo_url} style={{ maxHeight: '55vh', maxWidth: '85vw', objectFit: 'contain' }} alt="" />
                    )}
                    <h2 style={{ marginTop: '2rem', fontSize: '2rem', color: 'var(--primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '4px' }}>{currentSponsor.nombre}</h2>
                  </motion.div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '7rem', fontWeight: 900, background: 'linear-gradient(to bottom, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SUBASTA 2026</h1>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 300, opacity: 0.6, letterSpacing: '15px' }}>NOCHE SOLIDARIA</h2>
                  </div>
                )}
              </div>

              {/* Ticker Artículos Destacados */}
              <div style={{ height: '200px', background: 'rgba(20, 40, 80, 0.4)', backdropFilter: 'blur(10px)', borderTop: '3px solid var(--primary)', display: 'flex', alignItems: 'center', padding: '0 6rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4rem' }}>
                  <img src={currentArt?.imagen_url} style={{ width: '220px', height: '130px', objectFit: 'cover', borderRadius: '1.5rem', border: '2px solid var(--primary)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                  <div>
                    <h2 style={{ fontSize: '3rem', margin: 0, fontWeight: 800 }}>{currentArt?.nombre}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginTop: '5px' }}>
                      <Sparkles size={20} />
                      <p style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '2px' }}>SUBASTA EN VIVO</p>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px' }}>OFERTA ACTUAL</p>
                  <p className="price-tag" style={{ fontSize: '5.5rem', fontWeight: 900, lineHeight: 1 }}>
                    ${Number(currentArt?.monto_actual || 0).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="puja"
              initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.3 }}
              style={{ 
                height: '100%', width: '100%', position: 'absolute', zIndex: 100,
                background: 'rgba(12, 22, 45, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8rem', maxWidth: '1500px', width: '90%', alignItems: 'center' }}>
                <motion.div initial={{ x: -100 }} animate={{ x: 0 }} transition={{ type: "spring" }}>
                  <img src={bidArt?.imagen_url} style={{ width: '100%', height: '750px', objectFit: 'cover', borderRadius: '4rem', border: '6px solid var(--primary)', boxShadow: '0 0 120px rgba(224,159,62,0.4)' }} />
                </motion.div>
                <motion.div initial={{ x: 100 }} animate={{ x: 0 }} transition={{ type: "spring" }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--primary)', marginBottom: '3rem' }}>
                    <TrendingUp size={80} />
                    <span style={{ fontSize: '5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '10px' }}>¡NUEVA PUJA!</span>
                  </div>
                  <h1 style={{ fontSize: '6rem', lineHeight: 1, marginBottom: '3rem', fontWeight: 800 }}>{bidArt?.nombre}</h1>
                  <div className="glass" style={{ padding: '4.5rem', borderLeft: '20px solid var(--primary)', background: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem', letterSpacing: '3px' }}>VA GANANDO:</p>
                    <p style={{ fontSize: '6rem', fontWeight: 800, marginBottom: '3.5rem', color: 'white' }}>{bidArt?.highestBidderName}</p>
                    <div style={{ height: '2px', background: 'rgba(224,159,62,0.3)', marginBottom: '3.5rem' }} />
                    <p className="price-tag" style={{ fontSize: '10rem', fontWeight: 900 }}>
                      ${Number(bidArt?.monto_actual).toLocaleString('es-AR')}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="monitor-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span>Fundación Nordelta  •  Noche Solidaria 2026</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>DESARROLLADO POR</span>
          <img src={logoPrecinto} alt="Estudio Precinto" style={{ height: '20px', opacity: 0.8 }} />
        </div>
      </footer>
    </div>
  );
}
