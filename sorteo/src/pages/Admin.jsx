import React, { useState, useEffect } from 'react';
import { db, ref, onValue, update, set, runTransaction } from '../firebase';
import logo from '../assets/logo-troncal.svg';

const Admin = () => {
  const [participants, setParticipants] = useState([]);
  const [drawStatus, setDrawStatus] = useState('waiting');
  const [winnerId, setWinnerId] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualWhatsapp, setManualWhatsapp] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const participantsRef = ref(db, 'participants');
    const settingsRef = ref(db, 'settings');

    onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      setParticipants(data ? Object.values(data) : []);
    });

    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDrawStatus(data.status || 'waiting');
        setWinnerId(data.winner_id || null);
      }
    });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'troncal2025') {
       setIsAuthorized(true);
    } else {
       alert("Contraseña incorrecta");
    }
  };

  const handleStartDraw = async () => {
    const eligible = participants.filter(p => !p.isWinner);
    if (eligible.length === 0) return alert("No hay más participantes.");
    
    await update(ref(db, 'settings'), { status: 'drawing', winner_id: null });
    
    setTimeout(async () => {
       const randomIndex = Math.floor(Math.random() * eligible.length);
       const winner = eligible[randomIndex];
       
       await update(ref(db, `participants/${winner.id}`), { isWinner: true });
       await update(ref(db, 'settings'), { 
         status: 'finished', 
         winner_id: winner.id 
       });
    }, 4000);
  };

  const handleReset = async () => {
    await update(ref(db, 'settings'), { status: 'waiting', winner_id: null });
  };

  const handleFullReset = async () => {
    const confirmPass = window.prompt("ESCRIBE LA CONTRASEÑA PARA BORRAR TODA LA BASE DE DATOS:");
    if (confirmPass !== 'troncal2025') {
       alert("Acción cancelada o contraseña incorrecta.");
       return;
    }
    
    if (!window.confirm("¿ESTÁS TOTALMENTE SEGURO? Esta acción es irreversible.")) return;
    
    localStorage.clear();
    await set(ref(db, '/'), { 
      counter: 0, 
      participants: {}, 
      settings: { status: 'waiting', winner_id: null } 
    });
    window.location.reload();
  };

  const handleManualRegister = async (e) => {
    e.preventDefault();
    if (!manualName || !manualWhatsapp) return;
    setIsRegistering(true);

    try {
      const counterRef = ref(db, 'counter');
      const { snapshot: counterSnapshot } = await runTransaction(counterRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });

      const nextId = counterSnapshot.val();
      const participantsRef = ref(db, `participants/${nextId}`);
      
      await set(participantsRef, {
        name: manualName,
        whatsapp: manualWhatsapp,
        id: nextId,
        timestamp: Date.now(),
        isManual: true
      });

      setManualName('');
      setManualWhatsapp('');
      alert(`¡Éxito! Registrado con el número #${nextId}`);
    } catch (error) {
      console.error("Error al registrar manual:", error);
      alert("Error al registrar. Intenta de nuevo.");
    } finally {
      setIsRegistering(false);
    }
  };

  const exportCSV = () => {
    const headers = "Nombre,WhatsApp,ID\n";
    const rows = participants.map(p => `${p.name},${p.whatsapp},${p.id}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes_troncal.csv`;
    a.click();
  };

  if (!isAuthorized) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at center, #1b2735 0%, #090a0f 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Adornos de fondo para efecto premium */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(0, 176, 229, 0.05)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(0, 142, 69, 0.05)', filter: 'blur(100px)', borderRadius: '50%' }}></div>

        <form 
          className="glass-card" 
          onSubmit={handleLogin} 
          style={{ 
            textAlign: 'center', 
            maxWidth: '400px', 
            width: '90%', 
            padding: '3rem', 
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'fadeInUp 0.6s ease-out'
          }}
        >
          <img src={logo} alt="La Troncal" style={{ maxWidth: '220px', marginBottom: '2.5rem', filter: 'drop-shadow(0 0 15px rgba(0, 176, 229, 0.2))' }} />
          
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '0.8rem', letterSpacing: '4px', color: 'var(--accent)', marginBottom: '1.5rem', fontWeight: 'bold' }}>PANEL DE SEGURIDAD</h2>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Contraseña de Acceso" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                textAlign: 'center', 
                fontSize: '1.2rem', 
                letterSpacing: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1rem',
              background: 'linear-gradient(45deg, var(--primary), var(--secondary))',
              boxShadow: '0 10px 20px -10px rgba(0, 142, 69, 0.5)'
            }}
          >
            AUTENTICAR
          </button>
          
          <p style={{ marginTop: '2rem', fontSize: '0.6rem', opacity: 0.3, letterSpacing: '2px' }}>
            SISTEMA DE SORTEOS EN VIVO V2.0
          </p>
        </form>

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-view" style={{ padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto', minHeight: '100vh', color: 'white' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <img src={logo} alt="La Troncal" style={{ maxWidth: '280px', height: 'auto' }} />
        <h1 style={{ color: 'var(--accent)', fontSize: '1rem', marginTop: '0.5rem', letterSpacing: '4px' }}>DASHBOARD DE CONTROL</h1>
      </header>

      <div className="admin-grid" style={{ width: '100%' }}>
        {/* COLUMNA IZQUIERDA: CONTROLES */}
        <div className="admin-controls-col">
          {/* TARJETA DE ESTADO */}
          <section className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '0.8rem', letterSpacing: '2px' }}>ESTADO DEL SORTEO</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
              {drawStatus === 'waiting' ? 'ESPERANDO' : 
               drawStatus === 'finished' ? 'TERMINADO' : 
               drawStatus.toUpperCase()}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {drawStatus === 'waiting' && <button className="btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }} onClick={handleStartDraw}>LANZAR SORTEO</button>}
              {drawStatus === 'drawing' && <button className="btn-primary" style={{ width: '100%', opacity: 0.5, padding: '1.2rem' }} disabled>SORTEANDO...</button>}
              {drawStatus === 'finished' && (
                <>
                  <div style={{ padding: '1rem', background: 'rgba(0,142,69,0.1)', borderRadius: '8px', border: '1px solid var(--primary)', textAlign: 'center', marginBottom: '1rem' }}>
                    ÚLTIMO GANADOR: <strong style={{ fontSize: '1.5rem' }}>#{winnerId}</strong>
                  </div>
                  <button className="btn-primary" style={{ width: '100%', background: 'var(--secondary)' }} onClick={handleReset}>NUEVA RONDA</button>
                </>
              )}
            </div>

            <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(231, 76, 60, 0.2)' }}>
              <button 
                onClick={handleFullReset} 
                style={{ 
                  width: '100%', 
                  background: 'rgba(231, 76, 60, 0.05)', 
                  color: '#e74c3c', 
                  border: '1px solid rgba(231, 76, 60, 0.1)', 
                  padding: '0.6rem', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontSize: '0.6rem', 
                  fontWeight: 'bold',
                  opacity: 0.4
                }}
              >
                ⚙️ RESET SISTEMA (BORRAR TODO)
              </button>
            </div>
          </section>

          {/* TARJETA DE REGISTRO MANUAL */}
          <section className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '0.8rem', opacity: 0.7, letterSpacing: '1px' }}>REGISTRO MANUAL (ADMIN)</h2>
            <form onSubmit={handleManualRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input 
                className="input-field"
                style={{ marginBottom: '0', fontSize: '1rem' }}
                type="text" 
                placeholder="Nombre del Invitado" 
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                required
              />
              <input 
                className="input-field"
                style={{ marginBottom: '0', fontSize: '1rem' }}
                type="text" 
                placeholder="Referencia / Empresa" 
                value={manualWhatsapp}
                onChange={(e) => setManualWhatsapp(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isRegistering}
                style={{ background: 'var(--accent)', marginTop: '0.5rem', padding: '1rem' }}
              >
                {isRegistering ? 'CARGANDO...' : 'CARGAR INVITADO'}
              </button>
            </form>
          </section>
        </div>

        {/* COLUMNA DERECHA: LISTADO DE PARTICIPANTES */}
        <section className="glass-card admin-participants-col" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '85vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '0.8rem', opacity: 0.7, letterSpacing: '2px' }}>PARTICIPANTES REGISTRADOS ({participants.length})</h2>
            <button 
              onClick={exportCSV} 
              style={{ background: 'transparent', border: '1px solid var(--secondary)', color: 'var(--secondary)', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              DESCARGAR CSV
            </button>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', fontSize: '0.7rem', color: 'var(--accent)' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>ID</th>
                  <th style={{ padding: '1rem 0.5rem' }}>PARTICIPANTE</th>
                  <th style={{ padding: '1rem 0.5rem' }}>CONTACTO</th>
                </tr>
              </thead>
              <tbody>
                {[...participants].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map((p, idx) => (
                  <tr key={idx} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)', 
                    background: p.isWinner ? 'rgba(0,142,69,0.1)' : 'transparent',
                    transition: 'background 0.3s'
                  }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: '900', color: 'var(--secondary)', fontSize: '1rem' }}>
                      #{p.id}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                        {p.name} {p.isWinner ? '🏆' : ''}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
                      <div>{p.whatsapp}</div>
                      {p.isManual && <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.6rem', marginTop: '0.2rem' }}>REGISTRO MANUAL</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
;

export default Admin;
