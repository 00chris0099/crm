import React from 'react';

export default function AutomationsPage() {
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Automatizaciones (n8n/Make)</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Registra y administra múltiples flujos conectando distintos webhooks.</p>
                </div>
                <button style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer', border: 'none' }}>+ Nueva Automatización</button>
            </div>
            <div style={{ border: '1px dashed var(--border-strong)', padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Configura tus flujos para enrutar mensajes hacia y desde plataformas externas.</p>
            </div>
        </div>
    );
}
