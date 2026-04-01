import React, { useState, useEffect } from 'react';
import { db, ref, onValue } from '../firebase';
import logo from '../assets/logo-troncal.svg';

const Monitor = () => {
  const [participantsCount, setParticipantsCount] = useState(0);
  const [drawStatus, setDrawStatus] = useState('waiting');
  const [winnerName, setWinnerName] = useState(null);
  const [winnerId, setWinnerId] = useState(null);
  const [shuffledId, setShuffledId] = useState('000');
  const [shuffledName, setShuffledName] = useState('...');
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const participantsRef = ref(db, 'participants');
    const settingsRef = ref(db, 'settings');

    onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      const pList = data ? Object.values(data) : [];
      setParticipants(pList);
      setParticipantsCount(pList.length);
    });

    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDrawStatus(data.status);
        if (data.status === 'finished' && data.winner_id) {
          setWinnerId(data.winner_id);
          // Buscar el nombre del ganador de forma manual una vez
          const pRef = ref(db, 'participants');
          onValue(pRef, (pSnapshot) => {
             const pData = pSnapshot.val();
             if (pData) {
               const winnerObj = Object.values(pData).find(p => p.id === data.winner_id);
               if (winnerObj) setWinnerName(winnerObj.name);
             }
          }, { onlyOnce: true });
        }
      }
    });
  }, []);

  useEffect(() => {
    let interval;
    if (drawStatus === 'drawing' && participants.length > 0) {
      const eligible = participants.filter(p => !p.isWinner);
      interval = setInterval(() => {
        const randomP = eligible[Math.floor(Math.random() * eligible.length)] || { id: '???', name: '...' };
        setShuffledId(randomP.id.toString().padStart(3, '0'));
        setShuffledName(randomP.name);
      }, 70);
    }
    return () => clearInterval(interval);
  }, [drawStatus, participants]);

  useEffect(() => {
    if (drawStatus === 'finished' && winnerId) {
      const duration = 15 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [drawStatus, winnerId]);

  return (
    <div className="monitor-view" style={{ minHeight: '100vh', padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'radial-gradient(circle at center, #1b2735 0%, #090a0f 100%)' }}>
      <header style={{ position: 'absolute', top: '4rem', left: '0', right: '0' }}>
         <img 
           src={logo} 
           alt="La Troncal" 
           style={{ maxWidth: '600px', height: 'auto', filter: 'drop-shadow(0 0 30px rgba(0, 176, 229, 0.4))' }} 
         />
      </header>

      <main style={{ marginTop: '5rem' }}>
        {drawStatus === 'waiting' && (
          <div className="floating">
            <h2 style={{ fontSize: '3.5rem', marginBottom: '2rem', color: 'white' }}>Escaneando Participantes...</h2>
            <div style={{ fontSize: '15rem', color: 'var(--primary)', fontWeight: '900', lineHeight: 1 }}>
              {participantsCount.toString().padStart(3, '0')}
            </div>
            <p style={{ fontSize: '2.5rem', opacity: 0.7, fontWeight: '300' }}>PERSONAS EN VIVO</p>
            <div style={{ marginTop: '3rem', color: 'var(--accent)', fontSize: '1.2rem', letterSpacing: '3px' }}>LISTOS PARA EL SORTEO</div>
          </div>
        )}

        {drawStatus === 'drawing' && (
          <div className="suspense-container">
             <h2 style={{ fontSize: '4rem', color: 'var(--accent)', textShadow: '0 0 20px var(--accent)' }} className="floating">BUSCANDO SEÑAL GANADORA</h2>
             <div className="ruleta-container" style={{ margin: '4rem auto', minHeight: '300px', overflow: 'hidden', borderTop: '2px solid var(--accent)', borderBottom: '2px solid var(--accent)', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '6rem', color: 'var(--secondary)', fontWeight: '300', textTransform: 'uppercase', opacity: 0.8 }}>
                   #{shuffledId}
                </div>
                <div style={{ fontSize: '10rem', color: 'white', fontWeight: '900', textTransform: 'uppercase', lineHeight: 1 }}>
                   {shuffledName}
                </div>
             </div>
             <p style={{ fontSize: '2rem', opacity: 0.6 }}>CONECTANDO CON EL AZAR...</p>
             <style>{`
               @keyframes blinkRuleta {
                 0% { opacity: 0.2; transform: scale(0.9); }
                 50% { opacity: 1; transform: scale(1.1); }
                 100% { opacity: 0.2; transform: scale(0.9); }
               }
             `}</style>
          </div>
        )}

        {drawStatus === 'finished' && winnerId && (
          <div style={{ animation: 'winnerPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <h2 style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '2rem' }}>¡YA TENEMOS GANADOR!</h2>
            <div style={{ fontSize: '18rem', color: 'white', fontWeight: '900', textShadow: '0 0 80px rgba(0, 142, 69, 0.8)', lineHeight: 0.9 }}>
              #{winnerId}
            </div>
            <h3 style={{ fontSize: '6rem', color: 'var(--accent)', marginTop: '2rem', textTransform: 'uppercase' }}>{winnerName || 'CONECTANDO...'}</h3>
            <p style={{ fontSize: '2rem', color: 'var(--secondary)', marginTop: '2rem' }}>¡ACERCATE AL ESCENARIO!</p>
            <style>{`
              @keyframes winnerPop {
                0% { transform: scale(0.5); opacity: 0; filter: blur(20px); }
                100% { transform: scale(1); opacity: 1; filter: blur(0); }
              }
            `}</style>
          </div>
        )}
      </main>
    </div>
  );
};

export default Monitor;
