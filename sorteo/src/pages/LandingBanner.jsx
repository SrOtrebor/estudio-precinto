import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, ref, push, set } from '../firebase';
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
            message: "Hola Rober! Mi gestión en Excel llegó a un techo. Quiero que Estudio Precinto me ayude a dar el salto a un sistema profesional."
        },
        {
            id: 2,
            title: "Mi equipo no se comunica bien",
            message: "Hola Rober! Noto fricciones en la comunicación de mi equipo. Necesito el diagnóstico para centralizar nuestra operativa."
        },
        {
            id: 3,
            title: "Quiero automatizar mis ventas",
            message: "Hola Rober! Mi proceso de ventas es muy manual. Quiero automatizar el flujo para no perder más leads."
        },
        {
            id: 4,
            title: "QUIERO MI DIAGNÓSTICO GENERAL",
            message: "Hola Rober! Vi el banner en La Troncal. Quiero realizar el Diagnóstico Estratégico Integral para optimizar mi negocio.",
            premium: true
        }
    ];

    useEffect(() => {
        // 1. Identificar si ya está registrado en localStorage
        const savedId = localStorage.getItem('participantId');
        const savedName = localStorage.getItem('participantName');
        
        if (savedId) {
            setParticipant({ id: savedId, name: savedName });
        }

        // 2. Trackear Hit (visita anónima o identificada)
        const trackHit = async () => {
            const hitsRef = ref(db, 'banner_tracking/hits');
            await push(hitsRef, {
                timestamp: Date.now(),
                participantId: savedId || 'anonymous',
                participantName: savedName || 'anonymous',
                userAgent: navigator.userAgent
            });
        };

        trackHit();

        // 3. Manejo de Giroscopio (Parallax)
        const handleOrientation = (e) => {
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
        // Vibración háptica si el móvil lo soporta
        if ("vibrate" in navigator) {
            navigator.vibrate(50);
        }

        // Tracking del click
        const clicksRef = ref(db, 'banner_tracking/clicks');
        await push(clicksRef, {
            timestamp: Date.now(),
            participantId: participant?.id || 'anonymous',
            participantName: participant?.name || 'anonymous',
            optionId: option.id,
            optionTitle: option.title
        });

        // Abrir WhatsApp con mensaje predefinido
        const encodedMsg = encodeURIComponent(option.message);
        window.open(`https://wa.me/${WA_NUMBER}?text=${encodedMsg}`, '_blank');

        // Mostrar estado de gracias y redirigir
        setStatus('thanks');
        setTimeout(() => {
            window.location.href = "https://estudioprecinto.com";
        }, 4000);
    };

    if (status === 'thanks') {
        return (
            <div className="landing-container">
                <div className="thanks-card">
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
                            transform: `perspective(1000px) rotateX(${tilt.y * 0.5}deg) rotateY(${tilt.x * 0.5}deg)`
                        }}
                    >
                        <div className="button-glare" style={{
                            transform: `translate(calc(var(--tilt-x) * 2), calc(var(--tilt-y) * 2))`
                        }}></div>
                        {opt.title}
                    </button>
                ))}
            </div>

            <p className="landing-closing">
                Estás a un click de recuperar 2 horas de tu día. <br/>
                Seleccioná una opción y hablemos.
            </p>

            <footer className="landing-footer">
                <div className="footer-slogan">TECNOLOGÍA QUE RESUELVE.</div>
            </footer>
        </div>
    );
};

export default LandingBanner;
