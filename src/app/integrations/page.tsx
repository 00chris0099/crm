'use client';
import React, { useState } from 'react';

export default function IntegrationsPage() {
    const [showModal, setShowModal] = useState(false);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [provider, setProvider] = useState('meta');
    const [webhookUrl, setWebhookUrl] = useState('');

    const handleSave = () => {
        if (!name.trim()) return alert('El nombre es obligatorio');
        setLoading(true);
        setTimeout(() => {
            setIntegrations([...integrations, { id: Date.now(), name, provider, webhookUrl, status: 'Activa' }]);
            setShowModal(false);
            setName('');
            setWebhookUrl('');
            setLoading(false);
        }, 600);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Integraciones</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Múltiples conexiones hacia plataformas (Meta Cloud API, Evolution, etc.)</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer', border: 'none' }}
                >
                    + Nueva Integración
                </button>
            </div>

            {integrations.length === 0 ? (
                <div style={{ border: '1px dashed var(--border-strong)', padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Aún no hay conexiones. Configura tu primera cuenta de Meta o Evolution API.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {integrations.map(int => (
                        <div key={int.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{int.name}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Proveedor: {int.provider} {int.webhookUrl ? `· Webhook: ${int.webhookUrl}`: ''}</p>
                            </div>
                            <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--brand-success)', fontSize: '12px', fontWeight: 600 }}>{int.status}</span>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-strong)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Crear nueva integración</h2>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nombre de la conexión</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Meta API Principal" style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white' }} />
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Proveedor</label>
                            <select value={provider} onChange={e => setProvider(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white' }}>
                                <option value="Meta Cloud API">Meta Cloud API</option>
                                <option value="Evolution API">Evolution API</option>
                                <option value="Twilio">Twilio</option>
                            </select>
                        </div>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Webhook URL (Opcional)</label>
                            <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'white', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleSave} disabled={loading} style={{ padding: '10px 16px', background: 'var(--brand-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>{loading ? 'Guardando...' : 'Guardar Integración'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
