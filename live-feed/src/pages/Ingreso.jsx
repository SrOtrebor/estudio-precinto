import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, ref, get, push, set, update, runTransaction } from "../firebase";

export default function Ingreso() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [eventConfig, setEventConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States
  const [step, setStep] = useState("dni"); // 'dni', 'form', 'success'
  const [dni, setDni] = useState("");
  
  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    emprendimiento: ""
  });

  const [raffleNumber, setRaffleNumber] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    const configRef = ref(db, `livefeed/${eventId}/config`);
    get(configRef).then((snap) => {
      if (snap.exists()) {
        setEventConfig(snap.val());
      } else {
        setError("Evento no encontrado");
      }
      setLoading(false);
    });
  }, [eventId]);

  const handleDniCheck = async (e) => {
    e.preventDefault();
    if (!dni.trim()) return;
    setProcessing(true);

    try {
      // Fetch RSVPs to find by DNI
      const rsvpsRef = ref(db, `livefeed/${eventId}/rsvps`);
      const snap = await get(rsvpsRef);
      let foundRsvp = null;
      let foundId = null;

      if (snap.exists()) {
        const data = snap.val();
        for (const [id, rsvp] of Object.entries(data)) {
          if (rsvp.dni === dni) {
            foundRsvp = rsvp;
            foundId = id;
            break;
          }
        }
      }

      if (foundRsvp) {
        // Already exists! Let's enroll in raffle if not already
        await enrollParticipant(foundId, foundRsvp);
      } else {
        // Not found, go to form
        setStep("form");
      }
    } catch (err) {
      console.error(err);
      alert("Error al verificar DNI");
    } finally {
      setProcessing(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !dni || !formData.phone || !formData.email) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }
    setProcessing(true);

    try {
      const rsvpsRef = ref(db, `livefeed/${eventId}/rsvps`);
      const newRsvpRef = push(rsvpsRef);
      const newRsvpData = {
        name: formData.name,
        dni: dni,
        phone: formData.phone,
        email: formData.email,
        emprendimiento: formData.emprendimiento || "",
        attending: true,
        timestamp: Date.now()
      };
      
      await set(newRsvpRef, newRsvpData);
      
      await enrollParticipant(newRsvpRef.key, newRsvpData);
    } catch (err) {
      console.error(err);
      alert("Error al registrarse");
    } finally {
      setProcessing(false);
    }
  };

  const enrollParticipant = async (id, data) => {
    // Usar el DNI directamente como ID único del participante
    const participantDniKey = data.dni;
    const participantRef = ref(db, `livefeed/${eventId}/participants/${participantDniKey}`);
    const snap = await get(participantRef);
    
    if (snap.exists()) {
      // Ya es un participante registrado
      setRaffleNumber(snap.val().raffleNumber);
      setStep("success");
      return;
    }

    // Assign sequential raffle number using transaction
    const counterRef = ref(db, `livefeed/${eventId}/counters/raffleNumber`);
    let assignedNumber = 1;
    
    await runTransaction(counterRef, (currentValue) => {
      if (currentValue === null) {
        assignedNumber = 1;
        return 1;
      }
      assignedNumber = currentValue + 1;
      return assignedNumber;
    });

    // Save participant
    const participantData = {
      id: participantDniKey,
      name: data.name,
      dni: data.dni,
      phone: data.phone || "",
      email: data.email || "",
      emprendimiento: data.emprendimiento || "",
      raffleNumber: assignedNumber,
      checkedIn: true,
      isWinner: false,
      timestamp: Date.now()
    };
    
    await set(participantRef, participantData);
    
    // Guardar localmente para que el celular recuerde que ya hizo check-in
    localStorage.setItem(`livefeed_guest_name_${eventId}`, data.name);
    localStorage.setItem(`livefeed_guest_dni_${eventId}`, data.dni);
    localStorage.setItem(`livefeed_guest_attending_${eventId}`, "true");

    // Ensure rsvp attending is true if it was checked in
    if (!data.attending) {
      await update(ref(db, `livefeed/${eventId}/rsvps/${id}`), { attending: true });
    }

    setRaffleNumber(assignedNumber);
    setStep("success");
  };

  if (loading) return <div className="monitor-screen"><div className="pulse-ring" /></div>;
  if (error) return <div className="not-found"><h1>Oops</h1><p>{error}</p></div>;

  const accentColor = eventConfig?.accentColor || "#a28a68";
  
  return (
    <div className="ingreso-screen" style={{ "--accent": accentColor }}>
      <div className="ingreso-card">
        {step === "dni" && (
          <form onSubmit={handleDniCheck} className="ingreso-form fade-in">
            <h2>👋 Ingreso presencial</h2>
            <p>Ingresá tu DNI para confirmar tu asistencia y recibir tu número para el sorteo.</p>
            
            <input 
              type="number" 
              placeholder="Número de DNI" 
              value={dni} 
              onChange={(e) => setDni(e.target.value)}
              disabled={processing}
              autoFocus
            />
            
            <button type="submit" className="btn-primary" disabled={processing || !dni}>
              {processing ? "Verificando..." : "Continuar"}
            </button>
          </form>
        )}

        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="ingreso-form fade-in">
            <h2>📝 Completá tus datos</h2>
            <p>No encontramos tu DNI, por favor registrate para ingresar al evento.</p>
            
            <input 
              type="text" 
              placeholder="Nombre y Apellido *" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              disabled={processing}
              required
            />
            
            <input 
              type="number" 
              placeholder="DNI *" 
              value={dni} 
              disabled={true} 
            />
            
            <input 
              type="tel" 
              placeholder="Teléfono *" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              disabled={processing}
              required
            />
            
            <input 
              type="email" 
              placeholder="Correo electrónico *" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={processing}
              required
            />

            <input 
              type="text" 
              placeholder="Emprendimiento (Opcional)" 
              value={formData.emprendimiento} 
              onChange={(e) => setFormData({...formData, emprendimiento: e.target.value})}
              disabled={processing}
            />
            
            <button type="submit" className="btn-primary" disabled={processing}>
              {processing ? "Guardando..." : "Registrarme"}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="ingreso-success fade-in">
            <div className="success-icon">✅</div>
            <h2>¡Asistencia Confirmada!</h2>
            <p>Ya estás participando del sorteo.</p>
            <div className="raffle-number-box">
              <span>TU NÚMERO</span>
              <div className="raffle-number">{raffleNumber}</div>
            </div>
            
            <button onClick={() => navigate(`/invitacion/${eventId}`)} className="btn-primary" style={{ marginTop: '2rem' }}>
              🎟️ Ver Invitación y Cámara
            </button>
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
              Guarda este número. Si ganás, lo anunciaremos en la pantalla gigante.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .ingreso-screen {
          min-height: 100vh;
          background: #f4f4f6;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          font-family: 'Inter', sans-serif;
        }
        .ingreso-card {
          background: #fff;
          width: 100%;
          max-width: 450px;
          border-radius: 16px;
          padding: 2.5rem 2rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          text-align: center;
        }
        .ingreso-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .ingreso-form h2 {
          font-weight: 900;
          color: #111;
          margin-bottom: 0.5rem;
        }
        .ingreso-form p {
          color: #555;
          font-size: 0.95rem;
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .ingreso-form input {
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #ddd;
          font-size: 1rem;
          background: #fafafa;
          transition: border 0.3s;
        }
        .ingreso-form input:focus {
          border-color: var(--accent);
          outline: none;
        }
        .btn-primary {
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 1rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: opacity 0.3s, transform 0.1s;
        }
        .btn-primary:active {
          transform: scale(0.98);
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .ingreso-success {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .success-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        .ingreso-success h2 {
          color: #008e45;
          margin-bottom: 0.5rem;
        }
        .raffle-number-box {
          margin-top: 2rem;
          background: #111;
          color: #fff;
          padding: 2rem;
          border-radius: 16px;
          width: 100%;
          position: relative;
          overflow: hidden;
        }
        .raffle-number-box span {
          display: block;
          font-size: 0.8rem;
          letter-spacing: 2px;
          color: #aaa;
          margin-bottom: 0.5rem;
        }
        .raffle-number {
          font-size: 4rem;
          font-weight: 900;
          color: var(--accent);
        }
        .fade-in {
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
