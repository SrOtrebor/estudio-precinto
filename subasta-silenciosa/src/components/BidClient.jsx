import { useState, useEffect } from 'react';
import { db, ref, onValue, runTransaction, set } from '../firebase';
import { Gavel, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
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

        // Actualizar el monto actual y el último pujador
        currentData.monto_actual = nextBid;
        currentData.highestBidderId = user.id;
        currentData.highestBidderName = user.name;
        currentData.lastBidTime = Date.now();
        
        return currentData;
      });

      if (result.committed) {
        // Registrar la puja en el historial
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
      console.error("Bid transaction failed:", error);
      setFeedback({ type: 'error', message: 'Alguien más pujó. Intenta de nuevo.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (loading) return <div className="container">Cargando subasta...</div>;

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Hola, <strong>{user.name}</strong></p>
        <h1>Subasta en Vivo</h1>
      </header>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, padding: '1rem 2rem', borderRadius: '1rem',
              background: feedback.type === 'success' ? '#22c55e' : '#ef4444',
              color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
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
            <motion.div 
              key={art.id} 
              layout
              className={`glass ${isWinning ? 'winning-border' : ''}`}
              style={{ 
                overflow: 'hidden', 
                border: isWinning ? '2px solid var(--primary)' : '1px solid var(--border)',
                transition: 'border 0.3s ease'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img src={art.imagen_url} alt={art.nombre} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                {isWinning && (
                  <div style={{ 
                    position: 'absolute', top: '10px', right: '10px', 
                    background: 'var(--primary)', color: 'black', padding: '0.3rem 0.8rem',
                    borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <TrendingUp size={14} /> ¡Vas ganando!
                  </div>
                )}
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{art.nombre}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', minHeight: '3em' }}>
                  {art.descripcion}
                </p>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Monto Actual</p>
                  <p className="price-tag" style={{ fontSize: '1.8rem' }}>${Number(art.monto_actual).toLocaleString('es-AR')}</p>
                </div>

                <button 
                  className="btn-primary" 
                  style={{ width: '100%' }}
                  onClick={() => handleBid(art.id)}
                >
                  <Gavel size={20} /> Pujar ${Number(suggestedBid).toLocaleString('es-AR')}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                  Incremento mínimo: 5%
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {articulos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No hay artículos disponibles en este momento.</p>
        </div>
      )}
    </div>
  );
}
