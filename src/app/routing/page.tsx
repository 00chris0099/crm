import React from 'react';

export default function RoutingPage() {
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Ruteo y Reglas</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Configura cómo los canales derivan a las automatizaciones y agentes.</p>
                </div>
                <button style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer', border: 'none' }}>+ Regla de Ruteo</button>
            </div>
            <div style={{ border: '1px dashed var(--border-strong)', padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Define condiciones para mandar leads al equipo humano o bot.</p>
            </div>
        </div>
    );
}
