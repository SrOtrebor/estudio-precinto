import { useState } from 'react';
import { db, ref, set } from '../firebase';
import { User, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register({ onRegister }) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const userId = crypto.randomUUID();
    const userData = {
      ...formData,
      id: userId,
      registeredAt: Date.now()
    };

    try {
      // Save to Firebase
      await set(ref(db, `users/${userId}`), userData);
      // Save to LocalStorage
      localStorage.setItem('silent_auction_user', JSON.stringify(userData));
      onRegister(userData);
    } catch (error) {
      console.error("Error registering:", error);
      alert("Error al registrarse. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 w-full max-w-md"
        style={{ padding: '2.5rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Registro</h1>
          <p style={{ color: 'var(--text-muted)' }}>Completá tus datos para participar de la subasta.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><User size={14} style={{ marginRight: '5px' }} /> Nombre y Apellido</label>
            <input 
              required
              className="form-input"
              type="text"
              placeholder="Ej: Juan Pérez"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label><Phone size={14} style={{ marginRight: '5px' }} /> WhatsApp</label>
            <input 
              required
              className="form-input"
              type="tel"
              placeholder="Ej: 1123456789"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label><Mail size={14} style={{ marginRight: '5px' }} /> Email</label>
            <input 
              required
              className="form-input"
              type="email"
              placeholder="ejemplo@correo.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full" 
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Registrando...' : 'Ingresar a la Subasta'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
