import React, { useState, useEffect } from 'react';
import { db, ref, push, set, onValue, runTransaction } from '../firebase';
import confetti from 'canvas-confetti';
import logo from '../assets/logo-troncal.svg';
import logoPrecinto from '../assets/logo-precinto.svg';

const Register = () => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [registered, setRegistered] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [drawStatus, setDrawStatus] = useState('waiting');
  const [winnerId, setWinnerId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [shuffledId, setShuffledId] = useState('000');
  const [shuffledName, setShuffledName] = useState('...');

  useEffect(() => {
    const savedId = localStorage.getItem('participantId');
    const savedName = localStorage.getItem('participantName');
    if (savedId) {
      setRegistered(true);
      setParticipantId(savedId);
      setName(savedName);
    }

    const participantsRef = ref(db, 'participants');
    onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      setParticipants(data ? Object.values(data) : []);
    });

    const settingsRef = ref(db, 'settings');
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDrawStatus(data.status);
        setWinnerId(data.winner_id);
      }
    });
  }, []);

  useEffect(() => {
    let interval;
    if (drawStatus === 'drawing' && participants.length > 0) {
      interval = setInterval(() => {
        const randomP = participants[Math.floor(Math.random() * participants.length)];
        setShuffledId(randomP.id.toString().padStart(3, '0'));
        setShuffledName(randomP.name);
      }, 70);
    }
    return () => clearInterval(interval);
  }, [drawStatus, participants]);

  useEffect(() => {
    if (drawStatus === 'finished' && winnerId === participantId && participantId) {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#008e45', '#00b0e5', '#a28a68']
      });
      // VIBRACIÓN MÁS FUERTE
      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 800]);
      }
    }
  }, [drawStatus, winnerId, participantId]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !whatsapp) return;

    try {
      const counterRef = ref(db, 'counter');
      const { snapshot: counterSnapshot } = await runTransaction(counterRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });

      const nextId = counterSnapshot.val();
      const participantsRef = ref(db, `participants/${nextId}`);
      
      await set(participantsRef, {
        name,
        whatsapp,
        id: nextId,
        timestamp: Date.now()
      });

      localStorage.setItem('participantId', nextId);
      localStorage.setItem('participantName', name);
      setParticipantId(nextId);
      setRegistered(true);
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Error al registrar. Intenta de nuevo.");
    }
  };

  return (
    <div className="registration-view" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="logo-container" style={{ textAlign: 'center', marginBottom: '1rem', padding: '1rem 0' }}>
        <img 
          src={logo} 
          alt="La Troncal" 
          style={{ maxWidth: '280px', height: 'auto', marginBottom: '0.5rem' }} 
        />
      </header>

       <main className={`glass-card ${registered ? 'floating' : ''}`} style={{ maxWidth: '400px', margin: '0.2rem auto', padding: '1.5rem' }}>
          {!registered ? (
            <>
              <h2 style={{ marginBottom: '1rem' }}>Sorteo Exclusivo</h2>
              <p style={{ marginBottom: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>Ingresá tus datos para obtener tu número de participación.</p>
              
              <form onSubmit={handleRegister}>
                 <input 
                   className="input-field"
                   type="text" 
                   placeholder="Nombre y Apellido" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   required
                 />
                 <input 
                   className="input-field"
                   type="tel" 
                   placeholder="WhatsApp (Ej: 1122334455)" 
                   value={whatsapp}
                   onChange={(e) => setWhatsapp(e.target.value)}
                   required
                 />
                 <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                   OBTENER MI NÚMERO
                 </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              {drawStatus === 'waiting' && (
                <>
                  <h2 style={{ fontSize: '1.2rem' }}>¡Todo listo, {name.split(' ')[0]}!</h2>
                  <div style={{ margin: '2rem 0' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>TU NÚMERO ES</p>
                    <div style={{ fontSize: '4rem', fontWeight: '900', color: 'white', textShadow: '0 0 20px var(--primary)' }}>
                      #{participantId}
                    </div>
                  </div>
                  <div className="status-badge" style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '20px', background: 'rgba(0,142,69,0.2)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.8rem' }}>
                    ● ESCUCHA ACTIVA
                  </div>
                  <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
                    Mantené esta pantalla abierta. Te avisaremos aquí mismo si ganás.
                  </p>
                  <button 
                    onClick={() => { localStorage.removeItem('participantId'); localStorage.removeItem('participantName'); window.location.reload(); }}
                    style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: 'var(--secondary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    REGISTRAR A OTRA PERSONA
                  </button>
                </>
              )}

              {drawStatus === 'drawing' && (
                <div style={{ padding: '2rem 0', animation: 'pulse 1.5s infinite' }}>
                  <h2 style={{ fontSize: '1rem', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '2rem' }}>¡SORTEO EN VIVO!</h2>
                  <div style={{ margin: '2rem 0', background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '1.2rem', color: 'var(--secondary)', fontWeight: '300' }}>#{shuffledId}</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', lineHeight: 1.2 }}>{shuffledName}</div>
                  </div>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '1rem' }}>EL GANADOR APARECERÁ AQUÍ...</p>
                  <style>{`
                    @keyframes pulse {
                      0% { transform: scale(1); opacity: 1; }
                      50% { transform: scale(1.02); opacity: 0.8; }
                      100% { transform: scale(1); opacity: 1; }
                    }
                  `}</style>
                </div>
              )}

              {drawStatus === 'finished' && (
                <div>
                  {winnerId === participantId ? (
                    <div style={{ padding: '2rem 0', animation: 'winnerCelebrate 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏆</div>
                      <h2 style={{ color: 'var(--primary)', fontSize: '3rem', fontWeight: '900', textShadow: '0 0 20px rgba(0,142,69,0.5)' }}>¡GANASTE! 🎉</h2>
                      <p style={{ margin: '1.5rem 0', fontSize: '1.1rem', lineHeight: 1.5 }}>¡Felicidades, {name}! Sos el ganador del premio actual. Acercate al escenario para retirarlo.</p>
                      <button className="btn-primary" style={{ width: '100%', padding: '1.2rem', background: 'linear-gradient(45deg, var(--primary), var(--secondary))' }} onClick={() => window.location.reload()}>ENTENDIDO</button>
                      
                      <style>{`
                        @keyframes winnerCelebrate {
                          0% { transform: scale(0.5); opacity: 0; }
                          100% { transform: scale(1); opacity: 1; }
                        }
                      `}</style>
                    </div>
                  ) : (
                    <div>
                      <h2>¡Gracias por estar!</h2>
                      <p style={{ margin: '1rem 0' }}>Esta vez no saliste, pero tenemos un regalo para vos por escucharnos:</p>
                      <div style={{ border: '2px dashed var(--accent)', padding: '1.5rem', borderRadius: '12px', background: 'rgba(162, 138, 104, 0.1)' }}>
                        <p style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '1.2rem' }}>CUPÓN: TRONCAL10</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>10% OFF EN GASTRONOMÍA DEL EVENTO</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
       </main>
    </div>
  );
};

export default Register;
