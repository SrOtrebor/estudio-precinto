import React, { useState, useEffect } from 'react';
import { db, ref, onValue, update, set } from '../firebase';
import logo from '../assets/logo-troncal.png';

const Admin = () => {
  const [participants, setParticipants] = useState([]);
  const [drawStatus, setDrawStatus] = useState('waiting');
  const [winnerId, setWinnerId] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');

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
    if (!window.confirm("¿ESTÁS SEGURO? Se borrarán todos los participantes registrados.")) return;
    localStorage.clear();
    await set(ref(db, '/'), { 
      counter: 0, 
      participants: {}, 
      settings: { status: 'waiting', winner_id: null } 
    });
    window.location.reload();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <form className="glass-card" onSubmit={handleLogin} style={{ textAlign: 'center', maxWidth: '300px' }}>
          <img src={logo} alt="La Troncal" style={{ maxWidth: '180px', marginBottom: '2rem' }} />
          <input 
            type="password" 
            className="input-field" 
            placeholder="Contraseña de Admin" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>INGRESAR</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-view" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', color: 'white' }}>
       <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <img src={logo} alt="La Troncal" style={{ maxWidth: '280px', height: 'auto' }} />
          <h1 style={{ color: 'var(--accent)', fontSize: '1rem', marginTop: '0.5rem', letterSpacing: '4px' }}>DASHBOARD DE CONTROL</h1>
       </header>

       <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <section className="glass-card" style={{ padding: '2rem' }}>
             <h2 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '0.8rem', letterSpacing: '2px' }}>ESTADO DEL SORTEO</h2>
             <div style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                {drawStatus.toUpperCase()}
             </div>
             
             {drawStatus === 'waiting' && <button className="btn-primary" style={{ width: '100%' }} onClick={handleStartDraw}>LANZAR SORTEO</button>}
             {drawStatus === 'drawing' && <button className="btn-primary" style={{ width: '100%', opacity: 0.5 }} disabled>SORTEANDO...</button>}
             {drawStatus === 'finished' && (
               <>
                 <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                   GANADOR: <strong>#{winnerId}</strong>
                 </div>
                 <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" onClick={handleReset} style={{ flex: 1, background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}>OTRO PREMIO</button>
                    <button className="btn-primary" onClick={exportCSV} style={{ flex: 1, background: 'var(--secondary)' }}>EXPORTAR CSV</button>
                 </div>
               </>
             )}
             
             <button onClick={handleFullReset} style={{ width: '100%', marginTop: '3rem', background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>
                RESET TOTAL (BORRAR TODO)
             </button>
          </section>

          <section className="glass-card" style={{ padding: '1rem' }}>
             <h2 style={{ marginBottom: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>REGISTRADOS EN VIVO ({participants.length})</h2>
             <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <tbody>
                      {[...participants].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: p.isWinner ? 'rgba(0,142,69,0.2)' : 'transparent' }}>
                           <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>
                              <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>#{p.id}</span> {p.isWinner ? '🏆' : ''}
                           </td>
                           <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>
                              <div>{p.name}</div>
                              <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{p.whatsapp}</div>
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

export default Admin;
