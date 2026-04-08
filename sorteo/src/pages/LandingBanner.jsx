import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, ref, set, push } from '../firebase';
import logoPrecinto from '../assets/logo-precinto.svg';
import './LandingBanner.css';

const LandingBanner = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('landing'); // 'landing' | 'thanks'
    const [participant, setParticipant] = useState(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const WA_NUMBER = "5491164481943";

    const options = [
        {
            id: 1,
            title: "Pierdo mucho tiempo en Excel",
            message: "Hola Rober! Siento que el Excel me está ganando. Necesito un diagnóstico de procesos."
        },
        {
            id: 2,
            title: "Mi equipo no se comunica bien",
            message: "Hola Rober! Tengo ruidos en la comunicación de mi equipo. ¿Cómo lo resolvemos?"
        },
        {
            id: 3,
            title: "Quiero automatizar mis ventas",
            message: "Hola Rober! Quiero que mis ventas fluyan solas. ¿Qué herramientas me recomendás?"
        },
        {
            id: 4,
            title: "QUIERO MI DIAGNÓSTICO GENERAL",
            message: "Hola Rober! Quiero que me diagnostiques de punta a punta. Vengo del banner.",
            premium: true
        }
    ];

    useEffect(() => {
        // 1. Identificar al usuario
        const pId = localStorage.getItem('participantId');
        const pName = localStorage.getItem('participantName');
        
        if (pId) {
            setParticipant({ id: pId, name: pName });
        }

        // 2. Registrar el "Hit" (Visita) en Firebase
        const trackHit = async () => {
            try {
                const statsRef = ref(db, 'banner_tracking/hits');
                await push(statsRef, {
                    participantId: pId || 'anonymous',
                    participantName: pName || 'Anónimo',
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent
                });
            } catch (err) {
                console.error("Error tracking hit:", err);
            }
        };

        trackHit();

        // 3. Manejo de Giroscopio (Parallax)
        const handleOrientation = (e) => {
            // Beta (inclinación adelante/atrás) y Gamma (inclinación izquierda/derecha)
            const x = e.gamma ? Math.min(Math.max(e.gamma, -20), 20) : 0;
            const y = e.beta ? Math.min(Math.max(e.beta - 45, -20), 20) : 0;
            setTilt({ x, y });
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    const handleOptionSelect = async (option) => {
        // A. Efecto Gatillo (Vibración)
        if (navigator.vibrate) {
            navigator.vibrate(60);
        }

        // B. Registrar el Clic en Firebase
        try {
            const clicksRef = ref(db, 'banner_tracking/clicks');
            await push(clicksRef, {
                participantId: participant?.id || 'anonymous',
                participantName: participant?.name || 'Anónimo',
                optionId: option.id,
                optionTitle: option.title,
                timestamp: Date.now()
            });
        } catch (err) {
            console.error("Error tracking click:", err);
        }

        // C. Abrir WhatsApp
        const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(option.message)}`;
        window.open(waUrl, '_blank');

        // D. Cambiar a estado de Gracias
        setStatus('thanks');

        // E. Redirigir a estudioprecinto.com después de 3 segundos
        setTimeout(() => {
            window.location.href = "https://estudioprecinto.com";
        }, 4000);
    };

    if (status === 'thanks') {
        return (
            <div className="landing-container">
                <div className="thanks-container">
                    <div className="thanks-icon">✅</div>
                    <h1 className="thanks-title">¡Gracias!</h1>
                    <p className="thanks-text">Rober recibió tu interés.</p>
                    <p className="thanks-text" style={{ opacity: 0.5, marginTop: '2rem', fontSize: '0.8rem' }}>
                        Redirigiendo a Estudio Precinto...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-container">
            <header className="landing-header">
                <img src={logoPrecinto} alt="Estudio Precinto" className="landing-logo" />
                <h1 className="landing-title">Recuperá 2 horas de tu día.</h1>
                <p className="landing-subtitle">Seleccioná tu mayor obstáculo:</p>
            </header>

            <div 
                className="buttons-grid"
                style={{
                    '--tilt-x': `${tilt.x}px`,
                    '--tilt-y': `${tilt.y}px`
                }}
            >
                {options.map((opt) => (
                    <button 
                        key={opt.id}
                        className={`terminal-button ${opt.premium ? 'premium' : ''}`}
                        onClick={() => handleOptionSelect(opt)}
                        style={{
                            transform: `perspective(1000px) rotateX(${tilt.y * 0.1}deg) rotateY(${tilt.x * 0.1}deg)`
                        }}
                    >
                        <div className="button-glare" style={{
                            transform: `translate(calc(var(--tilt-x) * 2), calc(var(--tilt-y) * 2))`
                        }}></div>
                        {opt.title}
                    </button>
                ))}
            </div>

            <footer className="landing-footer">
                <div className="footer-slogan">TECNOLOGÍA QUE RESUELVE.</div>
            </footer>
        </div>
    );
};

export default LandingBanner;
