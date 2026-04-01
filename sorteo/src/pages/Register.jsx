import React, { useState, useEffect } from 'react';
import { db, ref, push, set, onValue, runTransaction } from '../firebase';
import confetti from 'canvas-confetti';
import logo from '../assets/logo-troncal.png';
import logoPrecinto from '../assets/logo-precinto.svg';

const Register = () => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [registered, setRegistered] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [drawStatus, setDrawStatus] = useState('waiting');
  const [winnerId, setWinnerId] = useState(null);

  useEffect(() => {
    const savedId = localStorage.getItem('participantId');
    const savedName = localStorage.getItem('participantName');
    if (savedId) {
      setRegistered(true);
      setParticipantId(savedId);
      setName(savedName);
    }

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
    if (drawStatus === 'finished' && winnerId === participantId && participantId) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#008e45', '#00b0e5', '#a28a68']
      });
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 500]);
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
    <div className="registration-view" style={{ padding: '1rem' }}>
      <header className="logo-container" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img 
          src={logo} 
          alt="La Troncal" 
          style={{ maxWidth: '280px', height: 'auto', marginBottom: '0.5rem' }} 
        />
      </header>

       <main className={`glass-card ${registered ? 'floating' : ''}`} style={{ maxWidth: '400px', margin: '1rem auto' }}>
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
                <div style={{ padding: '2rem 0' }}>
                  <h2 className="floating">¡SORTEANDO! 🎰</h2>
                  <p style={{ marginTop: '1rem' }}>Cruzá los dedos... el azar está decidiendo.</p>
                </div>
              )}

              {drawStatus === 'finished' && (
                <div>
                  {winnerId === participantId ? (
                    <div style={{ padding: '1rem 0' }}>
                      <h2 style={{ color: 'var(--primary)', fontSize: '2rem' }}>¡GANASTE! 🎉</h2>
                      <p style={{ margin: '1rem 0' }}>¡Felicidades, {name}! Acercate al control de la radio o comunicate con nosotros.</p>
                      <button className="btn-primary" onClick={() => window.location.reload()}>OK</button>
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
