import { useState, useEffect } from 'react';
import { db, ref, onValue, runTransaction, set } from '../firebase';
import { Gavel, TrendingUp, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BidClient({ user }) {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const artRef = ref(db, 'articulos');
    return onValue(artRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setArticulos(Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .filter(a => a.status === 'open')
          .sort((a,b) => b.prioridad - a.prioridad)
        );
      }
      setLoading(false);
    });
  }, []);

  const handleBid = async (articuloId) => {
    const artRef = ref(db, `articulos/${articuloId}`);
    try {
      const result = await runTransaction(artRef, (currentData) => {
        if (!currentData) return;
        const minIncrement = currentData.monto_actual * 0.05;
        const nextBid = Math.ceil(currentData.monto_actual + minIncrement);
        currentData.monto_actual = nextBid;
        currentData.highestBidderId = user.id;
        currentData.highestBidderName = user.name;
        currentData.lastBidTime = Date.now();
        return currentData;
      });

      if (result.committed) {
        const bidId = crypto.randomUUID();
        await set(ref(db, `pujas/${bidId}`), {
          articulo_id: articuloId,
          user_id: user.id,
          monto: result.snapshot.val().monto_actual,
          timestamp: Date.now()
        });
        setFeedback({ type: 'success', message: '¡Puja exitosa! Vas ganando.' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Alguien más pujó. Intenta de nuevo.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem', paddingTop: '2rem' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <img src="https://fundacionnordelta.org/wp-content/uploads/2026/03/Fundacion-Nordelta-logo-25-anos-horizontal.png" alt="Logo" style={{ height: '70px', marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          <UserIcon size={16} />
          <span style={{ fontWeight: 600, letterSpacing: '1px' }}>{user.name.toUpperCase()}</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>SUBASTA EN VIVO</h1>
      </header>

      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, padding: '1.2rem 2.5rem', borderRadius: '1rem',
              background: feedback.type === 'success' ? 'var(--success)' : 'var(--error)',
              color: 'white', display: 'flex', alignItems: 'center', gap: '1rem',
              boxShadow: '0 15px 35px rgba(0,0,0,0.4)', fontWeight: 700
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid-auto">
        {articulos.map(art => {
          const isWinning = art.highestBidderId === user.id;
          const minIncrement = art.monto_actual * 0.05;
          const suggestedBid = Math.ceil(art.monto_actual + minIncrement);

          return (
            <motion.div key={art.id} layout className={`glass`} style={{ overflow: 'hidden', border: isWinning ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <img src={art.imagen_url} alt={art.nombre} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                {isWinning && (
                  <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--primary)', color: '#142850', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                    <TrendingUp size={14} /> VAS GANANDO
                  </div>
                )}
              </div>
              <div style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '0.8rem' }}>{art.nombre}</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>{art.descripcion}</p>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', textTransform: 'uppercase' }}>Oferta Actual</p>
                  <p className="price-tag" style={{ fontSize: '2.5rem', fontWeight: 800 }}>${Number(art.monto_actual).toLocaleString('es-AR')}</p>
                </div>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => handleBid(art.id)}>
                  <Gavel size={20} style={{ marginRight: '10px' }} /> PUJAR ${Number(suggestedBid).toLocaleString('es-AR')}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
