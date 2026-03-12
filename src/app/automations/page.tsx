'use client';
import React, { useState } from 'react';

export default function AutomationsPage() {
    const [showModal, setShowModal] = useState(false);
    const [automations, setAutomations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState('n8n');
    const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');

    const handleSave = () => {
        if (!name.trim()) return alert('El nombre es obligatorio');
        setLoading(true);
        setTimeout(() => {
            setAutomations([...automations, { id: Date.now(), name, type, n8nWebhookUrl, status: 'Activa' }]);
            setShowModal(false);
            setName('');
            setN8nWebhookUrl('');
            setLoading(false);
        }, 600);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Automatizaciones (n8n/Make)</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Registra y administra múltiples flujos conectando distintos webhooks.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer', border: 'none' }}
                >
                    + Nueva Automatización
                </button>
            </div>

            {automations.length === 0 ? (
                <div style={{ border: '1px dashed var(--border-strong)', padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Configura tus flujos para enrutar mensajes hacia y desde plataformas externas.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {automations.map(aut => (
                        <div key={aut.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{aut.name}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Tipo: {aut.type} {aut.n8nWebhookUrl ? `· Webhook: ${aut.n8nWebhookUrl}`: ''}</p>
                            </div>
                            <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--brand-success)', fontSize: '12px', fontWeight: 600 }}>{aut.status}</span>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-strong)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Crear nueva automatización</h2>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nombre de la automatización</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Flujo Principal Ventas n8n" style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white' }} />
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Tipo</label>
                            <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white' }}>
                                <option value="n8n">n8n</option>
                                <option value="Make">Make (Integromat)</option>
                                <option value="Custom">Custom Webhook</option>
                            </select>
                        </div>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Webhook URL del Flujo</label>
                            <input value={n8nWebhookUrl} onChange={e => setN8nWebhookUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'white', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleSave} disabled={loading} style={{ padding: '10px 16px', background: 'var(--brand-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>{loading ? 'Guardando...' : 'Guardar Automatización'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
