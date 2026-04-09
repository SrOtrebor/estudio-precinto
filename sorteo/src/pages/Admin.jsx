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
  const [nfcStock, setNfcStock] = useState(0);
  const [asesoriaStock, setAsesoriaStock] = useState(0);
  const [candyStock, setCandyStock] = useState(0);
  const [activeTab, setActiveTab] = useState('sorteo'); // 'sorteo' | 'banner'
  const [bannerHits, setBannerHits] = useState([]);
  const [bannerClicks, setBannerClicks] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'winner' | 'tag' | 'ase' | 'candy'

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

    const stockRef = ref(db, 'nfc_stock');
    onValue(stockRef, (snapshot) => {
      const data = snapshot.val();
      setNfcStock(data !== null ? data : 9);
    });

    const aseRef = ref(db, 'asesoria_stock');
    onValue(aseRef, (snapshot) => {
      const data = snapshot.val();
      setAsesoriaStock(data !== null ? data : 35);
    });

    const candyRef = ref(db, 'candy_stock');
    onValue(candyRef, (snapshot) => {
      const data = snapshot.val();
      setCandyStock(data !== null ? data : 100);
    });

    // Listeners de Banner Tracking
    const hitsRef = ref(db, 'banner_tracking/hits');
    onValue(hitsRef, (snapshot) => {
      const data = snapshot.val();
      setBannerHits(data ? Object.values(data) : []);
    });

    const clicksRef = ref(db, 'banner_tracking/clicks');
    onValue(clicksRef, (snapshot) => {
      const data = snapshot.val();
      setBannerClicks(data ? Object.values(data) : []);
    });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
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
       
       const totalWinnersSoFar = participants.filter(p => p.isWinner).length;
       const prizeNumber = totalWinnersSoFar + 1;
       
       await update(ref(db, `participants/${winner.id}`), { 
         isWinner: true,
         prizeNumber: prizeNumber 
       });

       await update(ref(db, 'settings'), { 
         status: 'finished', 
         winner_id: winner.id 
       });
    }, 4000);
  };

  const handleReset = async () => {
    await update(ref(db, 'settings'), { status: 'waiting', winner_id: null });
  };

  const handleUpdateStock = async (newStock) => {
    await set(ref(db, 'nfc_stock'), Number(newStock));
  };

  const handleUpdateAseStock = async (newStock) => {
    await set(ref(db, 'asesoria_stock'), Number(newStock));
  };

  const handleUpdateCandyStock = async (newStock) => {
    await set(ref(db, 'candy_stock'), Number(newStock));
  };

  const handleFullReset = async () => {
    const confirmPass = window.prompt("ESCRIBE LA CONTRASEÑA PARA BORRAR TODA LA BASE DE DATOS:");
    if (confirmPass !== import.meta.env.VITE_ADMIN_PASSWORD) {
       alert("Acción cancelada o contraseña incorrecta.");
       return;
    }
    
    if (!window.confirm("¿ESTÁS TOTALMENTE SEGURO? Esta acción es irreversible.")) return;
    
    localStorage.clear();
    await set(ref(db, '/'), { 
      counter: 0, 
      participants: {}, 
      settings: { 
        status: 'waiting', 
        winner_id: null,
        sessionId: Date.now() 
      } 
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
    const headers = "Nombre,WhatsApp,ID,Ganador Sorteo,Premio Ruleta\n";
    const rows = participants.map(p => {
        const raffle = p.isWinner ? `SI (#${p.prizeNumber})` : "NO";
        const roulette = p.roulette_win || (p.ya_jugo_ruleta ? "DULCE (Default)" : "NO JUGO");
        return `${p.name},${p.whatsapp},${p.id},${raffle},${roulette}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes_troncal_completo.csv`;
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

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', boxShadow: '0 10px 20px -10px rgba(0, 142, 69, 0.5)' }}>AUTENTICAR</button>
          <p style={{ marginTop: '2rem', fontSize: '0.6rem', opacity: 0.3, letterSpacing: '2px' }}>SISTEMA DE SORTEOS EN VIVO V2.0</p>
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
    <div className="admin-view" style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto', color: 'white' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img src={logo} alt="La Troncal" style={{ maxWidth: '280px', height: 'auto' }} />
        <h1 style={{ color: 'var(--accent)', fontSize: '1rem', marginTop: '0.5rem', letterSpacing: '4px' }}>DASHBOARD DE CONTROL</h1>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem', 
          marginTop: '2.5rem',
          padding: '0.5rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          display: 'inline-flex',
          border: '1px solid var(--glass-border)'
        }}>
          <button 
            onClick={() => setActiveTab('sorteo')}
            style={{
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'sorteo' ? 'linear-gradient(45deg, var(--primary), var(--secondary))' : 'transparent',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >🎰 GESTIÓN SORTEO</button>
          <button 
            onClick={() => setActiveTab('banner')}
            style={{
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'banner' ? 'var(--accent)' : 'transparent',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >📊 MÉTRICAS BANNER</button>
        </div>
      </header>

      {activeTab === 'sorteo' ? (
        <div className="admin-layout-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', width: '100%', alignItems: 'start' }}>
          <div style={{ flex: '1 1 400px', minWidth: '350px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section className="glass-card" style={{ padding: '2rem' }}>
                <h2 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '0.8rem', letterSpacing: '2px' }}>ESTADO DEL SORTEO</h2>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                  {drawStatus === 'waiting' ? 'ESPERANDO' : drawStatus === 'finished' ? 'TERMINADO' : drawStatus.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {drawStatus === 'waiting' && <button className="btn-primary" style={{ width: '100%', padding: '1.2rem' }} onClick={handleStartDraw}>LANZAR SORTEO</button>}
                  {drawStatus === 'drawing' && <button className="btn-primary" style={{ width: '100%', opacity: 0.5 }} disabled>SORTEANDO...</button>}
                  {drawStatus === 'finished' && (
                    <>
                      <div style={{ padding: '1rem', background: 'rgba(0,142,69,0.1)', borderRadius: '8px', border: '1px solid var(--primary)', textAlign: 'center' }}>
                        ÚLTIMO GANADOR: <strong style={{ fontSize: '1.5rem' }}>#{winnerId}</strong>
                      </div>
                      <button className="btn-primary" style={{ width: '100%', background: 'var(--secondary)' }} onClick={handleReset}>NUEVA RONDA</button>
                    </>
                  )}
                </div>
                <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(231, 76, 60, 0.2)' }}>
                  <button onClick={handleFullReset} style={{ width: '100%', background: 'rgba(231, 76, 60, 0.05)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.1)', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 'bold', opacity: 0.4 }}>⚙️ RESET SISTEMA (BORRAR TODO)</button>
                </div>
              </section>

              <section className="glass-card" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '0.8rem', opacity: 0.7, letterSpacing: '1px' }}>REGISTRO MANUAL (ADMIN)</h2>
                <form onSubmit={handleManualRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input className="input-field" type="text" placeholder="Nombre" value={manualName} onChange={(e) => setManualName(e.target.value)} required />
                  <input className="input-field" type="text" placeholder="Referencia" value={manualWhatsapp} onChange={(e) => setManualWhatsapp(e.target.value)} required />
                  <button type="submit" className="btn-primary" disabled={isRegistering} style={{ background: 'var(--accent)' }}>{isRegistering ? 'CARGANDO...' : 'CARGAR INVITADO'}</button>
                </form>
              </section>

              <section className="glass-card" style={{ padding: '2rem', border: '1px solid var(--accent)' }}>
                <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold' }}>STOCK PREMIOS</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(162, 138, 104, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.6rem' }}>TAGS NFC</p>
                    <input 
                      type="number" 
                      value={nfcStock} 
                      onChange={(e) => handleUpdateStock(e.target.value)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'white', 
                        fontSize: '1.2rem', 
                        fontWeight: '900', 
                        width: '100%',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ background: 'rgba(0, 176, 229, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.6rem' }}>ASESORÍAS</p>
                    <input 
                      type="number" 
                      value={asesoriaStock} 
                      onChange={(e) => handleUpdateAseStock(e.target.value)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'white', 
                        fontSize: '1.2rem', 
                        fontWeight: '900', 
                        width: '100%',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.6rem' }}>CARAMELOS</p>
                    <input 
                      type="number" 
                      value={candyStock} 
                      onChange={(e) => handleUpdateCandyStock(e.target.value)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'white', 
                        fontSize: '1.2rem', 
                        fontWeight: '900', 
                        width: '100%',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <section className="glass-card" style={{ flex: '2 1 600px', minWidth: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', maxHeight: '75vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.8rem', opacity: 0.7 }}>PARTICIPANTES ({participants.length})</h2>
              <button onClick={exportCSV} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.7rem' }}>EXPORTAR CSV</button>
            </div>

            {/* BARRA DE FILTROS */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setFilter('all')} style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', border: '1px solid var(--glass-border)', background: filter === 'all' ? 'var(--secondary)' : 'transparent', color: 'white', cursor: 'pointer' }}>TODOS</button>
                <button onClick={() => setFilter('winner')} style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', border: '1px solid var(--primary)', background: filter === 'winner' ? 'var(--primary)' : 'transparent', color: filter === 'winner' ? 'black' : 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>🏆 GANADORES</button>
                <button onClick={() => setFilter('tag')} style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', border: '1px solid var(--accent)', background: filter === 'tag' ? 'var(--accent)' : 'transparent', color: 'white', cursor: 'pointer' }}>🏷️ TAG NFC</button>
                <button onClick={() => setFilter('ase')} style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', border: '1px solid #00b0e5', background: filter === 'ase' ? '#00b0e5' : 'transparent', color: 'white', cursor: 'pointer' }}>💡 ASESORÍA</button>
                <button onClick={() => setFilter('candy')} style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', border: '1px solid #999', background: filter === 'candy' ? '#666' : 'transparent', color: 'white', cursor: 'pointer' }}>🍬 CARAMELOS</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', fontSize: '0.7rem' }}>
                    <th style={{ padding: '1rem 0.5rem' }}>ID</th>
                    <th style={{ padding: '1rem 0.5rem' }}>NOMBRE</th>
                    <th style={{ padding: '1rem 0.5rem' }}>RULETA / PREMIO</th>
                    <th style={{ padding: '1rem 0.5rem' }}>CONTACTO</th>
                  </tr>
                </thead>
                <tbody>
                  {[...participants]
                    .filter(p => {
                        if (filter === 'winner') return p.isWinner;
                        if (filter === 'tag') return p.roulette_win === 'TAG_NFC';
                        if (filter === 'ase') return p.roulette_win === 'ASESORIA';
                        if (filter === 'candy') return p.roulette_win === 'CARAMELOS';
                        return true;
                    })
                    .sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0))
                    .map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: p.isWinner ? 'rgba(0,142,69,0.1)' : 'transparent' }}>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>#{p.id}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{p.name} {p.isWinner ? '🏆' : ''}</div>
                        {p.isWinner && <div style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>GANADOR #{p.prizeNumber}</div>}
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        {p.ya_jugo_ruleta ? (
                            <span style={{ 
                                padding: '0.2rem 0.6rem', 
                                borderRadius: '4px', 
                                fontSize: '0.65rem', 
                                fontWeight: 'bold',
                                background: p.roulette_win === 'TAG_NFC' ? 'var(--accent)' : 
                                            p.roulette_win === 'ASESORIA' ? '#00b0e5' : 'rgba(255,255,255,0.1)',
                                color: p.roulette_win === 'CARAMELOS' ? '#999' : 'white'
                            }}>
                                {p.roulette_win === 'TAG_NFC' ? '🏷️ TAG NFC' : 
                                 p.roulette_win === 'ASESORIA' ? '💡 ASESORÍA' : '🍬 CARAMELOS'}
                            </span>
                        ) : (
                            <span style={{ fontSize: '0.65rem', opacity: 0.3 }}>- pend -</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>{p.whatsapp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <BannerMetricsView 
            bannerHits={bannerHits} 
            bannerClicks={bannerClicks} 
            participants={participants}
        />
      )}
    </div>
  );
};

const BannerMetricsView = ({ bannerHits, bannerClicks, participants }) => {
  const totalScans = bannerHits.length;
  const totalClicks = bannerClicks.length;
  const ctr = totalScans > 0 ? ((totalClicks / totalScans) * 100).toFixed(1) : 0;

  const counts = bannerClicks.reduce((acc, click) => {
    acc[click.optionTitle] = (acc[click.optionTitle] || 0) + 1;
    return acc;
  }, {});
  const topObstacle = Object.keys(counts).length > 0 
    ? Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) 
    : 'N/A';

  const exportBannerCSV = () => {
    const headers = "Hora,Nombre/ID,Opción Elegida\n";
    const rows = [...bannerClicks].reverse().map(c => {
        const time = new Date(c.timestamp).toLocaleTimeString();
        const user = c.participantName || `Anónimo (#${c.participantId})`;
        const title = c.optionTitle ? c.optionTitle.replace(/,/g, '') : 'N/A';
        return `${time},${user},${title}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metricas_banner_estudio_precinto.csv`;
    a.click();
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.6, letterSpacing: '2px' }}>ESCANEOS TOTALES</div>
          <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--secondary)' }}>{totalScans}</div>
        </div>
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.6, letterSpacing: '2px' }}>CONVERSIÓN (CTR)</div>
          <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--accent)' }}>{ctr}%</div>
        </div>
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.6, letterSpacing: '2px' }}>TOP OBSTÁCULO</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginTop: '1rem' }}>{topObstacle}</div>
        </div>
      </div>

      <section className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.8rem', opacity: 0.7 }}>INTERESADOS ({totalClicks})</h2>
          <button onClick={exportBannerCSV} className="btn-secondary" style={{ padding: '0.5rem 1.2rem', color: 'var(--accent)', borderColor: 'var(--accent)' }}>DESCARGAR PROSPECTOS</button>
        </div>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', fontSize: '0.7rem', color: 'var(--accent)' }}>
                <th style={{ padding: '1rem' }}>HORA</th>
                <th style={{ padding: '1rem' }}>USUARIO</th>
                <th style={{ padding: '1rem' }}>ELECCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {[...bannerClicks].reverse().map((click, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>{new Date(click.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{click.participantName || 'Anónimo'}</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>ID: #{click.participantId}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      padding: '0.3rem 0.8rem', 
                      borderRadius: '20px', 
                      fontSize: '0.7rem',
                      border: click.optionTitle.includes('GENERAL') ? '1px solid var(--accent)' : 'none'
                    }}>{click.optionTitle}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default Admin;
