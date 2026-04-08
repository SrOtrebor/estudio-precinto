import React, { useState, useEffect } from 'react';
import { db, ref, onValue } from '../firebase';
import confetti from 'canvas-confetti';
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
          // El nombre del ganador lo resolvemos con el array ya cargado en el useEffect de abajo
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

  // Resolver el nombre del ganador desde el array local (sin leer Firebase otra vez)
  useEffect(() => {
    if (winnerId && participants.length > 0) {
      const winnerObj = participants.find(p => p.id === winnerId);
      if (winnerObj) setWinnerName(winnerObj.name);
    }
  }, [winnerId, participants]);

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
    <div className="monitor-view" style={{ 
      height: '100vh', 
      width: '100vw',
      padding: '2vh 5vw', 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      background: 'radial-gradient(circle at center, #1b2735 0%, #090a0f 100%)',
      overflow: 'hidden'
    }}>
      <header style={{ width: '100%', padding: '2vh 0' }}>
         <img 
           src={logo} 
           alt="La Troncal" 
           style={{ 
             maxHeight: '15vh', 
             maxWidth: '80%', 
             height: 'auto', 
             filter: 'drop-shadow(0 0 30px rgba(0, 176, 229, 0.4))' 
           }} 
         />
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', position: 'relative' }}>
        {drawStatus === 'waiting' && (
          <div className="floating" style={{ padding: '2vh' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'white' }}>ESCANEANDO PARTICIPANTES...</h2>
            <div style={{ fontSize: '25vh', color: 'var(--primary)', fontWeight: '900', lineHeight: 1 }}>
              {participantsCount.toString().padStart(3, '0')}
            </div>
            <p style={{ fontSize: '2rem', opacity: 0.7, fontWeight: '300' }}>PERSONAS EN VIVO</p>
            <div style={{ marginTop: '2h', color: 'var(--accent)', fontSize: '1.2rem', letterSpacing: '5px' }}>LISTOS PARA EL SORTEO</div>
          </div>
        )}

        {drawStatus === 'drawing' && (
          <div className="suspense-container">
             <h2 style={{ fontSize: '3.5rem', color: 'var(--accent)', textShadow: '0 0 20px var(--accent)' }} className="floating">BUSCANDO SEÑAL GANADORA</h2>
             <div className="ruleta-container" style={{ margin: '2vh auto', minHeight: '30vh', overflow: 'hidden', borderTop: '2px solid var(--accent)', borderBottom: '2px solid var(--accent)', width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '4rem', color: 'var(--secondary)', fontWeight: '300', textTransform: 'uppercase', opacity: 0.8 }}>
                   #{shuffledId}
                </div>
                <div style={{ fontSize: '10vh', color: 'white', fontWeight: '900', textTransform: 'uppercase', lineHeight: 1.2 }}>
                   {shuffledName}
                </div>
             </div>
             <p style={{ fontSize: '1.5rem', opacity: 0.6 }}>CONECTANDO CON EL AZAR...</p>
          </div>
        )}

        {drawStatus === 'finished' && winnerId && (
          <div style={{ animation: 'winnerPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1vh', letterSpacing: '2px' }}>¡YA TENEMOS GANADOR!</h2>
            <div style={{ fontSize: '28vh', color: 'white', fontWeight: '900', textShadow: '0 0 80px rgba(0, 142, 69, 0.8)', lineHeight: 0.8, margin: '1vh 0' }}>
              #{winnerId}
            </div>
            <h3 style={{ fontSize: '8vh', color: 'var(--accent)', marginTop: '1vh', textTransform: 'uppercase', fontWeight: '900', maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {winnerName || 'CONECTANDO...'}
            </h3>
            <p style={{ fontSize: '2.5rem', color: 'var(--secondary)', fontWeight: 'bold', marginTop: '2vh' }}>¡ACERCATE AL ESCENARIO!</p>
          </div>
        )}
      </main>

      {/* CINTA DE GANADORES HISTÓRICOS */}
      {participants.filter(p => p.isWinner).length > 0 && (
        <section style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '1.5vh 0', borderTop: '1px solid rgba(162, 138, 104, 0.2)', marginBottom: '1vh' }}>
           <h4 style={{ fontSize: '0.8rem', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '1vh', opacity: 0.6 }}>HISTORIAL DE GANADORES</h4>
           <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 2rem' }}>
              {participants
                .filter(p => p.isWinner)
                .sort((a, b) => (a.prizeNumber || 0) - (b.prizeNumber || 0))
                .slice(-10) // Mostrar los últimos 10
                .map((p, idx) => (
                  <div key={idx} style={{ 
                    background: 'rgba(0, 142, 69, 0.1)', 
                    border: '1px solid var(--primary)', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    animation: 'fadeInUp 0.5s ease-out'
                  }}>
                    <span style={{ color: 'var(--secondary)', fontWeight: 'bold', fontSize: '0.9rem' }}>#{p.prizeNumber}</span>
                    <span style={{ fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>{p.name.split(' ')[0]}</span>
                  </div>
                ))}
           </div>
        </section>
      )}

      <footer style={{ width: '100%', padding: '2vh 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
        <p style={{ fontSize: '0.8rem', opacity: 0.4, letterSpacing: '2px' }}>Estudio Precinto</p>
        <div style={{ width: '1px', height: '1rem', background: 'rgba(255,255,255,0.2)' }}></div>
        <p style={{ fontSize: '0.8rem', opacity: 0.4, letterSpacing: '2px' }}>TECNOLOGÍA QUE RESUELVE</p>
      </footer>

      <style>{`
        .floating { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Monitor;
