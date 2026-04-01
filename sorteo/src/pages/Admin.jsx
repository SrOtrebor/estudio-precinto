import React, { useState, useEffect } from 'react';
import { db, ref, onValue, update, set } from '../firebase';

const Admin = () => {
  const [participants, setParticipants] = useState([]);
  const [drawStatus, setDrawStatus] = useState('waiting');
  const [winnerId, setWinnerId] = useState(null);

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
    // SIN CONFIRM PARA EVITAR BLOQUEO DE SUBAGENTE
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
    a.download = `participantes.csv`;
    a.click();
  };

  return (
    <div className="admin-view" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', color: 'white' }}>
       <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>Admin Dashboard</h1>

       <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <section className="glass-card" style={{ padding: '2rem' }}>
             <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Estatus: {drawStatus.toUpperCase()}</h2>
             
             {drawStatus === 'waiting' && <button className="btn-primary" onClick={handleStartDraw}>LANZAR SORTEO</button>}
             {drawStatus === 'drawing' && <button className="btn-primary" disabled>SORTEANDO...</button>}
             {drawStatus === 'finished' && (
               <>
                 <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                   GANADOR: <strong>#{winnerId}</strong>
                 </div>
                 <button className="btn-primary" onClick={handleReset} style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}>OTRO PREMIO</button>
               </>
             )}
             
             <button onClick={handleFullReset} style={{ width: '100%', marginTop: '2rem', background: '#e74c3c', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer' }}>
                RESET TOTAL
             </button>
          </section>

          <section className="glass-card" style={{ padding: '1rem' }}>
             <h2 style={{ marginBottom: '1rem' }}>Fila ({participants.length})</h2>
             <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <tbody>
                      {[...participants].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #222', background: p.isWinner ? 'rgba(0,255,0,0.1)' : 'transparent' }}>
                           <td style={{ padding: '0.5rem' }}>#{p.id} {p.isWinner ? '🏆' : ''}</td>
                           <td style={{ padding: '0.5rem' }}>{p.name}</td>
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
