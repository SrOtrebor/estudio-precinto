import { useState, useEffect } from 'react';
import { db, storage, ref, sRef, onValue, set, update, get, uploadBytes, getDownloadURL } from '../firebase';
import { Plus, Trash2, Download, Power, Package, Image as ImageIcon, Video, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [articulos, setArticulos] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [activeTab, setActiveTab] = useState('articulos');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [revelarGanadores, setRevelarGanadores] = useState(false);

  // Form states
  const [newArt, setNewArt] = useState({ nombre: '', descripcion: '', precio_base: '', prioridad: 5 });
  const [newSponsor, setNewSponsor] = useState({ nombre: '', orden: 1 });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const artRef = ref(db, 'articulos');
    const sponRef = ref(db, 'sponsors');
    const settingsRef = ref(db, 'settings');

    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setRevelarGanadores(!!data.revelar_ganadores);
    });

    const unsubArt = onValue(artRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setArticulos(Object.entries(data).map(([id, val]) => ({ id, ...val })));
      } else {
        setArticulos([]);
      }
      setLoading(false);
    });

    const unsubSpon = onValue(sponRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSponsors(Object.entries(data).map(([id, val]) => ({ id, ...val })));
      } else {
        setSponsors([]);
      }
    });

    return () => { unsubArt(); unsubSpon(); unsubSettings(); };
  }, []);

  const uploadFile = async (file, path) => {
    if (!file) return null;
    const fileRef = sRef(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const addArticulo = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Por favor, subí una imagen para el artículo.");
    
    setUploading(true);
    try {
      const imageUrl = await uploadFile(selectedFile, 'articulos');
      const id = crypto.randomUUID();
      const artData = {
        ...newArt,
        imagen_url: imageUrl,
        monto_actual: Number(newArt.precio_base),
        status: 'open',
        createdAt: Date.now()
      };
      await set(ref(db, `articulos/${id}`), artData);
      setNewArt({ nombre: '', descripcion: '', precio_base: '', prioridad: 5 });
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      alert("Error al subir archivo.");
    } finally {
      setUploading(false);
    }
  };

  const addSponsor = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Por favor, subí un logo o video para el sponsor.");

    setUploading(true);
    try {
      const fileUrl = await uploadFile(selectedFile, 'sponsors');
      const isVideo = selectedFile.type.includes('video');
      const id = crypto.randomUUID();
      await set(ref(db, `sponsors/${id}`), {
        ...newSponsor,
        logo_url: isVideo ? '' : fileUrl,
        video_url: isVideo ? fileUrl : '',
      });
      setNewSponsor({ nombre: '', orden: 1 });
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (path, id) => {
    if (confirm('¿Eliminar definitivamente?')) {
      await set(ref(db, `${path}/${id}`), null);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    await update(ref(db, `articulos/${id}`), { status: newStatus });
  };

  const exportCSV = async () => {
    const usersSnapshot = await get(ref(db, 'users'));
    const bidsSnapshot = await get(ref(db, 'pujas'));
    const users = usersSnapshot.val() || {};
    const bids = Object.entries(bidsSnapshot.val() || {}).map(([id, b]) => ({ id, ...b }));

    let leadsCSV = "Nombre,Telefono,Email,Fecha Registro\n";
    Object.values(users).forEach(u => {
      leadsCSV += `${u.name},${u.phone},${u.email},${new Date(u.registeredAt).toLocaleString()}\n`;
    });

    let bidsCSV = "Articulo,Usuario,Monto,Fecha\n";
    bids.sort((a,b) => a.timestamp - b.timestamp).forEach(b => {
      const art = articulos.find(a => a.id === b.articulo_id)?.nombre || 'Unknown';
      const user = users[b.user_id]?.name || 'Unknown';
      bidsCSV += `${art},${user},${b.monto},${new Date(b.timestamp).toLocaleString()}\n`;
    });

    const download = (content, filename) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", filename);
      link.click();
    };

    download(leadsCSV, "leads_subasta.csv");
    download(bidsCSV, "historial_pujas.csv");
  };

  return (
    <div className="admin-root" style={{ 
      minHeight: '100vh', background: '#0c162d', color: 'white', 
      padding: '2rem', fontFamily: 'Montserrat, sans-serif' 
    }}>
      <header style={{ 
        maxWidth: '1400px', margin: '0 auto 3rem auto', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255,255,255,0.03)', padding: '1.5rem 2.5rem', 
        borderRadius: '1.5rem', border: '1px solid rgba(224,159,62,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img src="https://fundacionnordelta.org/wp-content/uploads/2026/03/Fundacion-Nordelta-logo-25-anos-horizontal.png" alt="Logo" style={{ height: '60px', filter: 'drop-shadow(0 0 10px rgba(224,159,62,0.2))' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--primary)' }}>DASHBOARD</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5, letterSpacing: '1px' }}>CONTROL DE SUBASTA SILENCIOSA</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-secondary" 
            style={{ 
              borderColor: revelarGanadores ? 'var(--success)' : 'rgba(224,159,62,0.3)', 
              color: revelarGanadores ? 'var(--success)' : 'var(--primary)',
              background: revelarGanadores ? 'rgba(40,167,69,0.1)' : 'transparent'
            }}
            onClick={() => set(ref(db, 'settings/revelar_ganadores'), !revelarGanadores)}
          >
            {revelarGanadores ? "OCULTAR GANADORES" : "REVELAR GANADORES"}
          </button>
          <button className="btn-primary" onClick={exportCSV} style={{ padding: '0.8rem 1.5rem' }}>
            <Download size={18} style={{ marginRight: '8px' }} /> EXPORTAR DATOS
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <nav style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
          {['articulos', 'sponsors'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                flex: 1, padding: '1.2rem', borderRadius: '1rem', border: '1px solid',
                borderColor: activeTab === tab ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                background: activeTab === tab ? 'rgba(224,159,62,0.1)' : 'rgba(255,255,255,0.02)',
                color: activeTab === tab ? 'var(--primary)' : 'white',
                fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                textTransform: 'uppercase', letterSpacing: '2px'
              }}
            >
              {tab === 'articulos' ? <Package size={18} style={{marginRight: '8px'}} /> : <Video size={18} style={{marginRight: '8px'}} />}
              {tab}
            </button>
          ))}
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2.5rem', alignItems: 'start' }}>
          {/* Form Side */}
          <aside className="glass" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--primary)', borderBottom: '1px solid rgba(224,159,62,0.2)', paddingBottom: '1rem' }}>
              {activeTab === 'articulos' ? 'NUEVO ARTÍCULO' : 'NUEVO SPONSOR'}
            </h2>
            
            {activeTab === 'articulos' ? (
              <form onSubmit={addArticulo} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="file-upload-wrapper" style={{ height: '140px' }}>
                  <Upload size={24} color="var(--primary)" />
                  <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>{selectedFile ? selectedFile.name : "Subir Imagen"}</p>
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                </div>
                <input required placeholder="Nombre" className="form-input" value={newArt.nombre} onChange={e => setNewArt({...newArt, nombre: e.target.value})} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input required type="number" placeholder="Precio ($)" className="form-input" value={newArt.precio_base} onChange={e => setNewArt({...newArt, precio_base: e.target.value})} />
                  <input required type="number" placeholder="Prioridad" className="form-input" value={newArt.prioridad} onChange={e => setNewArt({...newArt, prioridad: e.target.value})} />
                </div>
                <textarea placeholder="Descripción..." className="form-input" style={{ minHeight: '80px' }} value={newArt.descripcion} onChange={e => setNewArt({...newArt, descripcion: e.target.value})} />
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={uploading}>
                  {uploading ? <Loader2 className="animate-spin" /> : <Plus />} {uploading ? "Subiendo..." : "CREAR ARTÍCULO"}
                </button>
              </form>
            ) : (
              <form onSubmit={addSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="file-upload-wrapper" style={{ height: '140px' }}>
                  <Upload size={24} color="var(--primary)" />
                  <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>{selectedFile ? selectedFile.name : "Subir Logo/Video"}</p>
                  <input type="file" accept="image/*,video/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                </div>
                <input required placeholder="Nombre Sponsor" className="form-input" value={newSponsor.nombre} onChange={e => setNewSponsor({...newSponsor, nombre: e.target.value})} />
                <input required type="number" placeholder="Orden" className="form-input" value={newSponsor.orden} onChange={e => setNewSponsor({...newSponsor, orden: e.target.value})} />
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={uploading}>
                  {uploading ? <Loader2 className="animate-spin" /> : <Plus />} {uploading ? "Subiendo..." : "CREAR SPONSOR"}
                </button>
              </form>
            )}
          </aside>

          {/* List Side */}
          <section>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <AnimatePresence mode="popLayout">
                {activeTab === 'articulos' ? (
                  articulos.map(art => (
                    <motion.div 
                      key={art.id} 
                      layout 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="glass" 
                      style={{ padding: '1rem', border: '1px solid rgba(224,159,62,0.1)' }}
                    >
                      <div style={{ position: 'relative' }}>
                        <img src={art.imagen_url} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '0.8rem', marginBottom: '1rem' }} alt="" />
                        <div style={{ 
                          position: 'absolute', top: '10px', right: '10px', 
                          background: art.status === 'open' ? 'var(--success)' : 'var(--error)',
                          padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900
                        }}>
                          {art.status === 'open' ? 'ABIERTO' : 'CERRADO'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{art.nombre}</h3>
                          <p className="price-tag" style={{ fontSize: '1.3rem', margin: '0.3rem 0' }}>${Number(art.monto_actual).toLocaleString('es-AR')}</p>
                          {art.highestBidderName && <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>🏆 {art.highestBidderName}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => toggleStatus(art.id, art.status)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.6rem', cursor: 'pointer' }}>
                            <Power size={18} color={art.status === 'open' ? 'var(--success)' : 'var(--error)'} />
                          </button>
                          <button onClick={() => deleteItem('articulos', art.id)} style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', color: 'var(--error)', padding: '0.6rem', borderRadius: '0.6rem', cursor: 'pointer' }}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  sponsors.sort((a,b) => a.orden - b.orden).map(s => (
                    <motion.div 
                      key={s.id} 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass" 
                      style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                        <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(224,159,62,0.2)' }}>
                          {s.video_url ? <Video size={20} color="var(--primary)" /> : <img src={s.logo_url} style={{ width: '35px', height: '35px', objectFit: 'contain' }} alt="" />}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700 }}>{s.nombre}</p>
                          <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.5 }}>Orden: {s.orden}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteItem('sponsors', s.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem' }}>
                        <Trash2 size={20} />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
