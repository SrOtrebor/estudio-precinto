import { useState } from 'react';
import { db, ref, set } from '../firebase';
import { User, Phone, Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register({ onRegister }) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userId = crypto.randomUUID();
    const userData = { ...formData, id: userId, registeredAt: Date.now() };
    try {
      await set(ref(db, `users/${userId}`), userData);
      localStorage.setItem('silent_auction_user', JSON.stringify(userData));
      onRegister(userData);
    } catch (error) {
      alert("Error al registrarse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ padding: '3.5rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <img src="https://fundacionnordelta.org/wp-content/uploads/2026/03/Fundacion-Nordelta-logo-25-anos-horizontal.png" alt="Logo" style={{ height: '100px', marginBottom: '2.5rem' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', letterSpacing: '2px' }}>REGISTRO</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '3rem' }}>Ingresá tus datos para participar de la subasta solidaria.</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary)', fontWeight: 600 }}>
              <User size={16} /> NOMBRE COMPLETO
            </label>
            <input required className="form-input" type="text" placeholder="Ej: Juan Pérez" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary)', fontWeight: 600 }}>
              <Phone size={16} /> WHATSAPP
            </label>
            <input required className="form-input" type="tel" placeholder="Ej: 1123456789" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary)', fontWeight: 600 }}>
              <Mail size={16} /> CORREO ELECTRÓNICO
            </label>
            <input required className="form-input" type="email" placeholder="ejemplo@correo.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.2rem' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" style={{ margin: 'auto' }} /> : "INGRESAR A LA SUBASTA"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
