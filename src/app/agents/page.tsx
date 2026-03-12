'use client';
import React, { useState } from 'react';

export default function AgentsPage() {
    const [showModal, setShowModal] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [prompt, setPrompt] = useState('');

    const handleSave = () => {
        if (!name.trim()) return alert('El nombre es obligatorio');
        setLoading(true);
        setTimeout(() => {
            setAgents([...agents, { id: Date.now(), name, prompt, status: 'Activo' }]);
            setShowModal(false);
            setName('');
            setPrompt('');
            setLoading(false);
        }, 600);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Agentes AI</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Perfiles de IA separados que utilizan las automatizaciones.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer', border: 'none' }}
                >
                    + Nuevo Agente
                </button>
            </div>

            {agents.length === 0 ? (
                <div style={{ border: '1px dashed var(--border-strong)', padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Crea un agente AI y asígnalo a una automatización de ventas o soporte.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {agents.map(ag => (
                        <div key={ag.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{ag.name}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{ag.prompt ? `${ag.prompt.substring(0, 50)}...` : 'Sin prompt configurado'}</p>
                            </div>
                            <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--brand-success)', fontSize: '12px', fontWeight: 600 }}>{ag.status}</span>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-strong)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Crear nuevo agente</h2>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nombre del Agente</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Agente de Ventas" style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white' }} />
                        </div>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Prompt Base (System Prompt)</label>
                            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Eres un asistente especializado en..." rows={4} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white', resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'white', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleSave} disabled={loading} style={{ padding: '10px 16px', background: 'var(--brand-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>{loading ? 'Guardando...' : 'Crear Agente'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
