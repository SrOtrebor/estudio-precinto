import { useState, useEffect } from 'react';
import { db, ref, onValue, set, update, get } from '../firebase';
import { Plus, Trash2, Download, Power, Package, Image as ImageIcon, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [articulos, setArticulos] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [activeTab, setActiveTab] = useState('articulos');
  const [loading, setLoading] = useState(true);

  // Form states
  const [newArt, setNewArt] = useState({ nombre: '', descripcion: '', precio_base: 0, imagen_url: '', prioridad: 5 });
  const [newSponsor, setNewSponsor] = useState({ nombre: '', logo_url: '', video_url: '', orden: 1 });

  useEffect(() => {
    const artRef = ref(db, 'articulos');
    const sponRef = ref(db, 'sponsors');

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

    return () => { unsubArt(); unsubSpon(); };
  }, []);

  const addArticulo = async (e) => {
    e.preventDefault();
    const id = crypto.randomUUID();
    const artData = {
      ...newArt,
      monto_actual: Number(newArt.precio_base),
      status: 'open',
      createdAt: Date.now()
    };
    await set(ref(db, `articulos/${id}`), artData);
    setNewArt({ nombre: '', descripcion: '', precio_base: 0, imagen_url: '', prioridad: 5 });
  };

  const addSponsor = async (e) => {
    e.preventDefault();
    const id = crypto.randomUUID();
    await set(ref(db, `sponsors/${id}`), newSponsor);
    setNewSponsor({ nombre: '', logo_url: '', video_url: '', orden: 1 });
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

    // Export Leads
    let leadsCSV = "Nombre,Telefono,Email,Fecha Registro\n";
    Object.values(users).forEach(u => {
      leadsCSV += `${u.name},${u.phone},${u.email},${new Date(u.registeredAt).toLocaleString()}\n`;
    });

    // Export Bids Timeline
    let bidsCSV = "Articulo,Usuario,Monto,Fecha\n";
    bids.sort((a,b) => a.timestamp - b.timestamp).forEach(b => {
      const art = articulos.find(a => a.id === b.articulo_id)?.nombre || 'Unknown';
      const user = users[b.user_id]?.name || 'Unknown';
      bidsCSV += `${art},${user},${b.monto},${new Date(b.timestamp).toLocaleString()}\n`;
    });

    // Download Logic
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
    <div className="container" style={{ maxWidth: '1000px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ margin: 0 }}>Dashboard Admin</h1>
        <button className="btn-secondary" onClick={exportCSV}>
          <Download size={18} style={{ marginRight: '8px' }} /> Exportar CSV
        </button>
      </header>

      <nav className="glass" style={{ display: 'flex', padding: '0.5rem', marginBottom: '2rem', gap: '0.5rem' }}>
        <button 
          className={`btn-secondary ${activeTab === 'articulos' ? 'active' : ''}`}
          onClick={() => setActiveTab('articulos')}
          style={{ flex: 1, border: activeTab === 'articulos' ? '1px solid var(--primary)' : '1px solid transparent' }}
        >
          Artículos
        </button>
        <button 
          className={`btn-secondary ${activeTab === 'sponsors' ? 'active' : ''}`}
          onClick={() => setActiveTab('sponsors')}
          style={{ flex: 1, border: activeTab === 'sponsors' ? '1px solid var(--primary)' : '1px solid transparent' }}
        >
          Sponsors
        </button>
      </nav>

      {activeTab === 'articulos' ? (
        <section className="page-transition">
          <div className="glass p-6 mb-8" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2><Package size={20} /> Nuevo Artículo</h2>
            <form onSubmit={addArticulo} className="grid-auto" style={{ gap: '1rem' }}>
              <input required placeholder="Nombre" className="form-input" value={newArt.nombre} onChange={e => setNewArt({...newArt, nombre: e.target.value})} />
              <input placeholder="Imagen URL" className="form-input" value={newArt.imagen_url} onChange={e => setNewArt({...newArt, imagen_url: e.target.value})} />
              <input required type="number" placeholder="Precio Base" className="form-input" value={newArt.precio_base} onChange={e => setNewArt({...newArt, precio_base: e.target.value})} />
              <input required type="number" placeholder="Prioridad (1-10)" className="form-input" value={newArt.prioridad} onChange={e => setNewArt({...newArt, prioridad: e.target.value})} />
              <textarea placeholder="Descripción" className="form-input" style={{ gridColumn: '1 / -1' }} value={newArt.descripcion} onChange={e => setNewArt({...newArt, descripcion: e.target.value})} />
              <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }}><Plus /> Agregar Artículo</button>
            </form>
          </div>

          <div className="grid-auto">
            <AnimatePresence>
              {articulos.map(art => (
                <motion.div key={art.id} layout className="glass p-4" style={{ padding: '1.5rem' }}>
                  <img src={art.imagen_url || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '1rem', marginBottom: '1rem' }} alt="" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{art.nombre}</h3>
                      <p className="price-tag" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>${Number(art.monto_actual).toLocaleString('es-AR')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => toggleStatus(art.id, art.status)} style={{ background: 'none', border: 'none', color: art.status === 'open' ? 'var(--success)' : 'var(--error)', cursor: 'pointer' }}>
                        <Power size={20} />
                      </button>
                      <button onClick={() => deleteItem('articulos', art.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      ) : (
        <section className="page-transition">
          <div className="glass p-6 mb-8" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2>Nuevo Sponsor</h2>
            <form onSubmit={addSponsor} className="grid-auto" style={{ gap: '1rem' }}>
              <input required placeholder="Nombre" className="form-input" value={newSponsor.nombre} onChange={e => setNewSponsor({...newSponsor, nombre: e.target.value})} />
              <input required placeholder="Logo URL" className="form-input" value={newSponsor.logo_url} onChange={e => setNewSponsor({...newSponsor, logo_url: e.target.value})} />
              <input placeholder="Video URL (Opcional)" className="form-input" value={newSponsor.video_url} onChange={e => setNewSponsor({...newSponsor, video_url: e.target.value})} />
              <input required type="number" placeholder="Orden" className="form-input" value={newSponsor.orden} onChange={e => setNewSponsor({...newSponsor, orden: e.target.value})} />
              <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }}><Plus /> Agregar Sponsor</button>
            </form>
          </div>

          <div className="grid-auto">
            {sponsors.sort((a,b) => a.orden - b.orden).map(s => (
              <div key={s.id} className="glass p-4" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={s.logo_url} style={{ width: '40px', height: '40px', objectFit: 'contain' }} alt="" />
                  <span>{s.nombre}</span>
                </div>
                <button onClick={() => deleteItem('sponsors', s.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
