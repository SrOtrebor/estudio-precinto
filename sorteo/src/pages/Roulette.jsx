import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db, ref, onValue, update, runTransaction } from '../firebase';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import confetti from 'canvas-confetti';
import logoPrecinto from '../assets/logo-precinto.svg';

const Roulette = () => {
  const [whatsapp, setWhatsapp] = useState('');
  const [step, setStep] = useState('login'); // login | check | play | result | already-played
  const [participant, setParticipant] = useState(null);
  const [error, setError] = useState('');
  const [nfcStock, setNfcStock] = useState(0);
  const [asesoriaStock, setAsesoriaStock] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [tick, setTick] = useState(false);
  const audioContext = useRef(null);

  const segments = [
    { label: '🏷️ TAG NFC', type: 'TAG_NFC', colorPrimary: '#a28a68', colorText: '#ffffff' },
    { label: '🍬 DULCE', type: 'CARAMELOS', colorPrimary: '#0e132b', colorText: '#a28a68' },
    { label: '💡 ASESORÍA', type: 'ASESORIA', colorPrimary: '#a28a68', colorText: '#ffffff' },
    { label: '🍬 DULCE', type: 'CARAMELOS', colorPrimary: '#0e132b', colorText: '#a28a68' },
    { label: '🎁 SORPRESA', type: 'CARAMELOS', colorPrimary: '#a28a68', colorText: '#ffffff' },
    { label: '🍬 DULCE', type: 'CARAMELOS', colorPrimary: '#0e132b', colorText: '#a28a68' },
    { label: '💡 ASESORÍA', type: 'ASESORIA', colorPrimary: '#a28a68', colorText: '#ffffff' },
    { label: '🍬 DULCE', type: 'CARAMELOS', colorPrimary: '#0e132b', colorText: '#a28a68' },
  ];

  useEffect(() => {
    const nfcRef = ref(db, 'nfc_stock');
    onValue(nfcRef, (snapshot) => setNfcStock(snapshot.val() ?? 9));
    const aseRef = ref(db, 'asesoria_stock');
    onValue(aseRef, (snapshot) => setAsesoriaStock(snapshot.val() ?? 35));

    const savedId = localStorage.getItem('participantId');
    if (savedId) handleLookup(null, savedId);
  }, []);

  const playClickSound = () => {
    try {
        if (!audioContext.current) audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.current.createOscillator();
        const gain = audioContext.current.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioContext.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioContext.current.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.05);
        osc.connect(gain); gain.connect(audioContext.current.destination);
        osc.start(); osc.stop(audioContext.current.currentTime + 0.05);
    } catch(e) {}
  };

  const playWinSound = () => {
    try {
        if (!audioContext.current) audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.current.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = audioContext.current.createOscillator();
            const gain = audioContext.current.createGain();
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
            osc.connect(gain); gain.connect(audioContext.current.destination);
            osc.start(now + i * 0.15); osc.stop(now + i * 0.15 + 0.4);
        });
    } catch(e) {}
  };

  const handleLookup = (e, forcedId = null) => {
    if (e) e.preventDefault();
    const val = forcedId || whatsapp;
    const phoneNumber = parsePhoneNumberFromString(val, 'AR');
    if (!phoneNumber || !phoneNumber.isValid()) {
      setStep('login'); 
      if (!forcedId) setError('Formato de número inválido.');
      return;
    }
    
    setStep('check');
    const participantsRef = ref(db, 'participants');
    onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      const pList = data ? Object.values(data) : [];
      const found = forcedId ? pList.find(p => String(p.id) === String(forcedId)) : pList.find(p => p.whatsapp.trim() === whatsapp.trim());
      if (!found) { setStep('login'); if (!forcedId) setError('No encontrado'); }
      else if (found.ya_jugo_ruleta) { setParticipant(found); setStep('already-played'); }
      else { setParticipant(found); setStep('play'); if (!forcedId) localStorage.setItem('participantId', found.id); }
    }, { onlyOnce: true });
  };

  const startSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    await update(ref(db, `participants/${participant.id}`), { ya_jugo_ruleta: true });

    const rand = Math.random() * 100;
    let winType = 'CARAMELOS';
    if (rand < 5 && nfcStock > 0) winType = 'TAG_NFC';
    else if (rand < 25 && asesoriaStock > 0) winType = 'ASESORIA';

    const matchIndices = segments.map((s, i) => s.type === winType ? i : -1).filter(i => i !== -1);
    const targetIdx = matchIndices[Math.floor(Math.random() * matchIndices.length)];

    const fullTurns = 8;
    const segmentAngle = targetIdx * 45;
    const finalRotation = rotation + (360 * fullTurns) + (360 - segmentAngle);
    setRotation(finalRotation);

    const tickInterval = setInterval(() => { playClickSound(); setTick(t => !t); }, 150);
    setTimeout(() => { clearInterval(tickInterval); setTick(false); }, 4500);

    setTimeout(async () => {
      if (winType === 'TAG_NFC') await runTransaction(ref(db, 'nfc_stock'), (c) => (c || 0) > 0 ? c - 1 : 0);
      else if (winType === 'ASESORIA') await runTransaction(ref(db, 'asesoria_stock'), (c) => (c || 0) > 0 ? c - 1 : 0);
      await update(ref(db, `participants/${participant.id}`), { roulette_win: winType });
      setPrize(winType); setStep('result'); setIsSpinning(false);
      if (winType !== 'CARAMELOS') {
          playWinSound();
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    }, 5000);
  };

  return (
    <div className="roulette-page" style={{ 
      minHeight: '100dvh', background: 'radial-gradient(circle at center, #1b2735 0%, #090a0f 100%)', color: 'white', display: 'flex', flexDirection: 'column'
    }}>
      <header style={{ textAlign: 'center', padding: '1.5rem 0' }}>
        <img src={logoPrecinto} alt="Precinto" style={{ height: '35px' }} />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', textAlign: 'center', border: '1px solid rgba(162,138,104,0.1)' }}>
          
          {step === 'login' && (
            <div style={{ animation: 'fadeIn 0.5s' }}>
              <h2 style={{ color: 'var(--accent)', fontWeight: '900', fontSize: '1.5rem' }}>BIENVENIDO</h2>
              <p style={{ opacity: 0.5, fontSize: '0.8rem', marginBottom: '2rem' }}>Registrá tu participación en la ruleta.</p>
              <form onSubmit={handleLookup}>
                <input className="input-field" type="tel" placeholder="WP: 1122334455" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required style={{ textAlign: 'center' }} />
                {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>INGRESAR</button>
                <p style={{ marginTop: '1.5rem', fontSize: '0.7rem', opacity: 0.5, fontStyle: 'italic', lineHeight: 1.4, textAlign: 'center' }}>
                  * El sistema verifica la autenticidad del número. Participaciones falsas serán anuladas.
                </p>
              </form>
            </div>
          )}

          {step === 'already-played' && (
            <div>
              <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🍬</div>
              <h2 style={{ color: 'var(--accent)' }}>¡Hola, {participant.name.split(' ')[0]}!</h2>
              <p style={{ opacity: 0.8, lineHeight: 1.6 }}>Ya participaste hoy. ¡Igual retirá tu dulce con Rober!</p>
              <Link to="/"><button className="btn-primary" style={{ width: '100%', marginTop: '2rem' }}>VOLVER</button></Link>
            </div>
          )}

          {step === 'play' && (
            <div style={{ animation: 'fadeIn 0.5s' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '2rem', letterSpacing: '2px' }}>MUCHA SUERTE, {participant.name.split(' ')[0].toUpperCase()}</h3>
              
              <div style={{ position: 'relative', width: '310px', height: '310px', margin: '0 auto 3rem' }}>
                {/* Puntero */}
                <div style={{ 
                  position: 'absolute', top: '-15px', left: '50%', transform: `translateX(-50%) rotate(${tick ? -15 : 0}deg)`, 
                  zIndex: 20, width: '30px', height: '40px', background: 'var(--accent)', clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
                  transition: 'transform 0.1s'
                }}></div>

                {/* Luces LEDs */}
                {[...Array(24)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute', top: '50%', left: '50%', width: '6px', height: '6px', borderRadius: '50%',
                        background: i % 2 === 0 ? '#fff' : '#a28a68',
                        transform: `translate(-50%, -50%) rotate(${i * 15}deg) translateY(-155px)`,
                        zIndex: 10, animation: 'blink 0.5s infinite'
                    }}></div>
                ))}

                {/* Disco de la Ruleta */}
                <div style={{ 
                  width: '100%', height: '100%', borderRadius: '50%', border: '8px solid #1a1f3c',
                  position: 'relative', transform: `rotate(${rotation}deg)`,
                  transition: 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)',
                  background: '#0e132b', overflow: 'hidden', boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                }}>
                  {segments.map((s, i) => (
                    <div key={i} style={{ 
                        position: 'absolute', top: '0', left: '50%', width: '310px', height: '155px',
                        transformOrigin: '0% 100%', transform: `rotate(${i * 45}deg)`,
                        borderLeft: '1px solid rgba(162,138,104,0.2)'
                    }}>
                        {/* El Segmento Visual (CSS Triangle) */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, width: 0, height: 0,
                            borderStyle: 'solid', borderWidth: '0 65px 155px 65px',
                            borderColor: `transparent transparent ${i % 2 === 0 ? 'rgba(162,138,104,0.1)' : 'rgba(255,255,255,0.03)'} transparent`,
                            transform: 'translateX(-50%)'
                        }}></div>
                        
                        {/* El Label del Premio - POSICIONADO RADIALMENTE */}
                        <div style={{
                            position: 'absolute', top: '20px', left: '0', transform: 'translateX(-50%)',
                            color: i % 2 === 0 ? '#fff' : '#a28a68', fontWeight: '900', fontSize: '0.8rem',
                            whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.8)', padding: '0 10px'
                        }}>
                            {s.label}
                        </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn-primary" onClick={startSpin} disabled={isSpinning} style={{ 
                width: '100%', height: '60px', fontSize: '1.2rem', fontWeight: '900'
              }}>
                {isSpinning ? 'BUENA SUERTE...' : 'GIRAR RULETA'}
              </button>
            </div>
          )}

          {step === 'result' && (
            <div style={{ animation: 'winnerPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{prize === 'TAG_NFC' ? '🏷️' : prize === 'ASESORIA' ? '💡' : '🍬'}</div>
              <h3 style={{ color: 'var(--accent)', fontSize: '2rem', fontWeight: '900' }}>{segments.find(s => s.type === prize)?.label}</h3>
              <p style={{ margin: '1.5rem 0', opacity: 0.8 }}>¡Felicidades! Reclamá tu premio con Rober ahora mismo.</p>
              <Link to="/"><button className="btn-primary" style={{ width: '100%' }}>TERMINAR</button></Link>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes winnerPop { 0% { scale: 0.7; opacity: 0; } 100% { scale: 1; opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Roulette;
