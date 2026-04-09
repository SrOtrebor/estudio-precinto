import React, { useState, useEffect } from 'react';
import { db, ref, set, onValue, runTransaction, get, query, limitToLast, child } from '../firebase';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import confetti from 'canvas-confetti';
import logo from '../assets/logo-precinto.svg';
import logoPrecinto from '../assets/logo-precinto.svg';

const Register = () => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [registered, setRegistered] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [drawStatus, setDrawStatus] = useState('waiting');
  const [winnerId, setWinnerId] = useState(null);
  const [participants, setParticipants] = useState([]); // Ahora solo será una muestra pequeña para la animación
  const [userData, setUserData] = useState(null); // Datos del usuario actual
  const [shuffledId, setShuffledId] = useState('000');
  const [shuffledName, setShuffledName] = useState('...');
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    const savedId = localStorage.getItem('participantId');
    const savedName = localStorage.getItem('participantName');
    if (savedId) {
      setRegistered(true);
      setParticipantId(savedId);
      setName(savedName);
    }

    // Si ya tiene ID, escuchamos SOLO sus datos (muy eficiente)
    if (savedId) {
       const userRef = ref(db, `participants/${savedId}`);
       onValue(userRef, (snapshot) => {
         setUserData(snapshot.val());
       });
    }

    const settingsRef = ref(db, 'settings');
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Validar Sesión (Invalidación remota robusta)
        const savedSessionId = localStorage.getItem('sessionId');
        const savedId = localStorage.getItem('participantId');
        
        // Si hay un registro previo pero no hay sesión o no coincide, reseteamos todo.
        if (data.sessionId && savedId && (!savedSessionId || String(savedSessionId) !== String(data.sessionId))) {
          localStorage.clear();
          window.location.reload();
          return;
        }
        
        setCurrentSessionId(data.sessionId || null);
        setDrawStatus(data.status);
        setWinnerId(data.winner_id);
      }
    });
  }, []);

  // Cargar una muestra pequeña de participantes para la animación de la ruleta
  useEffect(() => {
    if (drawStatus === 'drawing' && participants.length === 0) {
      const sampleRef = query(ref(db, 'participants'), limitToLast(30));
      get(sampleRef).then((snapshot) => {
        const data = snapshot.val();
        if (data) setParticipants(Object.values(data));
      });
    } else if (drawStatus === 'waiting') {
      setParticipants([]); // Limpiar para ahorrar memoria
    }
  }, [drawStatus]);

  useEffect(() => {
    let interval;
    if (drawStatus === 'drawing' && participants.length > 0) {
      interval = setInterval(() => {
        const randomP = participants[Math.floor(Math.random() * participants.length)];
        if (randomP) {
          setShuffledId(randomP.id.toString().padStart(3, '0'));
          setShuffledName(randomP.name);
        }
      }, 70);
    }
    return () => clearInterval(interval);
  }, [drawStatus, participants]);

  useEffect(() => {
    // Usamos Number() para asegurar que la comparación sea exitosa (Firebase devuelve Number, localStorage devuelve String)
    if (drawStatus === 'finished' && Number(winnerId) === Number(participantId) && participantId) {
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

    // Validación de Formato Profesional (AR - Argentina)
    const phoneNumber = parsePhoneNumberFromString(whatsapp, 'AR');
    if (!phoneNumber || !phoneNumber.isValid()) {
      alert("Por favor, ingresá un número de WhatsApp válido (Ej: 1122334455). El sistema detectó un formato incorrecto.");
      return;
    }

    // Bloqueo de duplicados por WhatsApp (Ultra-rápido sin descargar lista)
    const normalizedWp = phoneNumber.number;
    const phoneCheckRef = ref(db, `phones/${normalizedWp.replace('+', '')}`);
    
    try {
      const phoneSnap = await get(phoneCheckRef);
      if (phoneSnap.exists()) {
        alert("Este número de WhatsApp ya se encuentra registrado.");
        return;
      }
    } catch (e) {
      console.error("Error checking phone", e);
    }

    try {
      const counterRef = ref(db, 'counter');
      const { snapshot: counterSnapshot } = await runTransaction(counterRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });

      const nextId = counterSnapshot.val();
      const participantsRef = ref(db, `participants/${nextId}`);
      
      const participantData = {
        name,
        whatsapp,
        whatsapp_normalized: normalizedWp,
        id: nextId,
        timestamp: Date.now()
      };

      await set(participantsRef, participantData);
      
      // Registrar teléfono para evitar duplicados en el futuro
      await set(phoneCheckRef, nextId);

      localStorage.setItem('participantId', nextId);
      localStorage.setItem('participantName', name);
      if (currentSessionId) {
        localStorage.setItem('sessionId', currentSessionId);
      }
      setParticipantId(nextId);
      setUserData(participantData);
      setRegistered(true);

      // Empezar a escuchar sus datos por si gana
      onValue(participantsRef, (snapshot) => {
        setUserData(snapshot.val());
      });
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
          alt="Estudio Precinto" 
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
               <p style={{ marginTop: '1.5rem', fontSize: '0.7rem', opacity: 0.5, fontStyle: 'italic', lineHeight: 1.4, textAlign: 'center' }}>
                 * El sistema verifica la validez del número. Registros falsos serán descalificados automáticamente y sus premios anulados.
               </p>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {/* Lógica Persistente de Ganador */}
            {userData?.isWinner ? (
              <div style={{ padding: '2rem 0', animation: 'winnerCelebrate 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                  <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏆</div>
                  <h2 style={{ color: 'var(--primary)', fontSize: '3rem', fontWeight: '900', textShadow: '0 0 20px rgba(0,142,69,0.5)' }}>¡GANASTE! 🎉</h2>
                  <div style={{ margin: '1rem 0', background: 'rgba(162, 138, 104, 0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--accent)' }}>
                    <p style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '1.2rem' }}>PREMIO #{currentParticipant?.prizeNumber}</p>
                  </div>
                  <p style={{ margin: '1.5rem 0', fontSize: '1.1rem', lineHeight: 1.5 }}>¡Felicidades, {name}! Sos el ganador. Acercate al escenario para retirar tu premio.</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Mantené esta pantalla abierta para retirar.</p>
              </div>
            ) : (
              <>
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
                  </div>
                )}


                {drawStatus === 'finished' && (
                  <div>
                    {winnerId === participantId ? (
                      <div style={{ padding: '2rem 0', animation: 'winnerCelebrate 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏆</div>
                        <h2 style={{ color: 'var(--primary)', fontSize: '3rem', fontWeight: '900', textShadow: '0 0 20px rgba(0,142,69,0.5)' }}>¡GANASTE! 🎉</h2>
                        <p style={{ margin: '1.5rem 0', fontSize: '1.1rem', lineHeight: 1.5 }}>¡Felicidades, {name}! Sos el ganador. Acercate al escenario para retirar tu premio.</p>
                        <button className="btn-primary" style={{ width: '100%', padding: '1.2rem', background: 'linear-gradient(45deg, var(--primary), var(--secondary))' }} onClick={() => window.location.reload()}>ENTENDIDO</button>
                      </div>
                    ) : (
                      <div style={{ padding: '2rem 0' }}>
                        <h2 style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: '1rem' }}>¡Gracias por estar!</h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', opacity: 0.9 }}>
                          ¡Gracias por ser parte de <strong>La Troncal</strong>!<br/><br/>
                          Valoramos mucho que estés acá compartiendo este día con nosotros.<br/>
                          ¡No te vayas lejos, que todavía queda mucho por disfrutar!<br/>
                          ¡Mucha suerte en lo que viene!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Register;
