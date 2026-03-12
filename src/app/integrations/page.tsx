'use client';
import React, { useState, useEffect } from 'react';

interface Integration {
    id: string;
    name: string;
    type: string;
    config: {
        app_id?: string;
        phone_number_id?: string;
        waba_id?: string;
        access_token?: string;
        verify_token?: string;
    };
    active: boolean;
    created_at: string;
    webhook_url?: string;
}

function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://tu-dominio.com';
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    return (
        <button
            onClick={handleCopy}
            title="Copiar"
            style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.12)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.3)'}`,
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
                color: copied ? '#10b981' : '#818cf8',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 200ms ease',
                flexShrink: 0,
                whiteSpace: 'nowrap',
            }}
        >
            {copied ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copiado</>
            ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar</>
            )}
        </button>
    );
}

export default function IntegrationsPage() {
    const [showModal, setShowModal] = useState(false);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '',
        app_id: '',
        app_secret: '',
        access_token: '',
        phone_number_id: '',
        waba_id: '',
        verify_token: '',
    });

    const webhookPreview = form.name.trim()
        ? `${getBaseUrl()}/api/webhooks/meta/${slugify(form.name)}`
        : '';

    useEffect(() => {
        fetchIntegrations();
    }, []);

    async function fetchIntegrations() {
        setLoadingList(true);
        try {
            const res = await fetch('/api/integrations');
            const data = await res.json();
            // Filter only META type
            const metaOnes = (data.integrations || []).filter((i: Integration) => i.type === 'META');
            setIntegrations(metaOnes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingList(false);
        }
    }

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => setForm({ name: '', app_id: '', app_secret: '', access_token: '', phone_number_id: '', waba_id: '', verify_token: '' });

    const handleSave = async () => {
        setError('');
        const { name, app_id, app_secret, access_token, phone_number_id, waba_id, verify_token } = form;
        if (!name.trim()) return setError('El nombre de la integración es obligatorio.');
        if (!app_id.trim()) return setError('El App ID es obligatorio.');
        if (!access_token.trim()) return setError('El Access Token es obligatorio.');
        if (!phone_number_id.trim()) return setError('El Phone Number ID es obligatorio.');
        if (!verify_token.trim()) return setError('El Token de Verificación es obligatorio.');

        setSaving(true);
        try {
            const slug = slugify(name);
            const webhookUrl = `${getBaseUrl()}/api/webhooks/meta/${slug}`;

            const res = await fetch('/api/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'META',
                    name: slug,
                    display_name: name,
                    config: {
                        app_id,
                        app_secret,
                        access_token,
                        phone_number_id,
                        waba_id,
                        verify_token,
                        webhook_url: webhookUrl,
                    },
                    active: true,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error al guardar la integración');
            }

            setShowModal(false);
            resetForm();
            await fetchIntegrations();
        } catch (e: any) {
            setError(e.message || 'Error desconocido');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta integración? Esta acción no se puede deshacer.')) return;
        setDeletingId(id);
        try {
            await fetch(`/api/integrations?id=${id}`, { method: 'DELETE' });
            await fetchIntegrations();
        } catch (e) {
            console.error(e);
        } finally {
            setDeletingId(null);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 14px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'border-color 200ms ease',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '6px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
    };

    const fieldGroupStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        {/* Meta logo */}
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #1877f2, #0668e1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(24,119,242,0.35)',
                        }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2.04c-5.52 0-10 4.48-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.54-4.48-10.02-10-10.02z"/>
                            </svg>
                        </div>
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                Integraciones Meta
                            </h1>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Conecta cuentas de WhatsApp Business via Meta Cloud API
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    id="btn-nueva-integracion"
                    onClick={() => { setShowModal(true); setError(''); resetForm(); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'linear-gradient(135deg, #1877f2, #0668e1)',
                        color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)',
                        fontWeight: 600, cursor: 'pointer', border: 'none', fontSize: '14px',
                        boxShadow: '0 4px 14px rgba(24,119,242,0.3)',
                        transition: 'all 200ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Nueva Integración
                </button>
            </div>

            {/* Info banner */}
            <div style={{
                background: 'rgba(24,119,242,0.07)',
                border: '1px solid rgba(24,119,242,0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                marginBottom: '28px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1877f2" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div>
                    <p style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 600, marginBottom: '4px' }}>¿Cómo funciona?</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Crea una integración y se generará un <strong style={{ color: 'var(--text-primary)' }}>Webhook URL único</strong> para cada una.
                        Copia esa URL y pégala manualmente en tu app de Meta (Configuración → Webhooks → Webhook maestro).
                        Cada integración puede conectar una app o cuenta diferente de WhatsApp.
                    </p>
                </div>
            </div>

            {/* Integrations list */}
            {loadingList ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <div style={{
                        width: '36px', height: '36px', border: '3px solid var(--border-strong)',
                        borderTopColor: '#1877f2', borderRadius: '50%', margin: '0 auto 12px',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    Cargando integraciones...
                </div>
            ) : integrations.length === 0 ? (
                <div style={{
                    border: '2px dashed var(--border-strong)', padding: '60px 24px',
                    textAlign: 'center', borderRadius: 'var(--radius-lg)',
                    background: 'rgba(24,119,242,0.02)',
                }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📡</div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px', marginBottom: '6px' }}>
                        Sin integraciones todavía
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        Crea tu primera integración de Meta para empezar a recibir mensajes de WhatsApp.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {integrations.map(integ => {
                        const webhookUrl = `${getBaseUrl()}/api/webhooks/meta/${integ.name}`;
                        return (
                            <div key={integ.id} style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                transition: 'border-color 200ms ease',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                            >
                                {/* Card header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '18px 20px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '8px',
                                            background: 'linear-gradient(135deg, #1877f2, #0668e1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                                <path d="M12 2.04c-5.52 0-10 4.48-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.54-4.48-10.02-10-10.02z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {integ.name}
                                            </h3>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Meta Cloud API · App ID: {integ.config.app_id || '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                            background: integ.active ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                                            color: integ.active ? '#10b981' : '#6b7280',
                                            border: `1px solid ${integ.active ? 'rgba(16,185,129,0.25)' : 'rgba(107,114,128,0.2)'}`,
                                        }}>
                                            {integ.active ? '● Activa' : '● Inactiva'}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(integ.id)}
                                            disabled={deletingId === integ.id}
                                            title="Eliminar integración"
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                                color: '#f87171', cursor: 'pointer', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', transition: 'all 200ms ease',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Webhook URL section */}
                                <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.15)' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                                        🔗 Webhook URL — Pégalo en Meta como Webhook Maestro
                                    </p>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                                        borderRadius: 'var(--radius-md)', padding: '10px 14px',
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1877f2" strokeWidth="2" style={{ flexShrink: 0 }}>
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                        </svg>
                                        <code style={{ fontSize: '13px', color: '#93c5fd', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                                            {webhookUrl}
                                        </code>
                                        <CopyButton text={webhookUrl} />
                                    </div>

                                    {/* Verify Token row */}
                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                                            Token de Verificación:
                                        </p>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '8px', flex: 1,
                                            background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                                            borderRadius: 'var(--radius-md)', padding: '7px 12px',
                                        }}>
                                            <code style={{ fontSize: '13px', color: '#a78bfa', flex: 1, fontFamily: 'monospace' }}>
                                                {integ.config.verify_token || '—'}
                                            </code>
                                            {integ.config.verify_token && <CopyButton text={integ.config.verify_token} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div style={{ padding: '14px 20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    {[
                                        { label: 'Phone Number ID', value: integ.config.phone_number_id },
                                        { label: 'WABA ID', value: integ.config.waba_id },
                                    ].map(item => (
                                        <div key={item.label}>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</p>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>{item.value || '—'}</p>
                                        </div>
                                    ))}
                                    <div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Creada</p>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            {new Date(integ.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ===== MODAL ===== */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 2000, padding: '20px',
                    }}
                    onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
                >
                    <div style={{
                        background: 'var(--bg-panel, #16171f)', width: '100%', maxWidth: '560px',
                        borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-strong)',
                        boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
                        maxHeight: '90vh', overflowY: 'auto',
                    }}>
                        {/* Modal header */}
                        <div style={{
                            padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(24,119,242,0.05)',
                            position: 'sticky', top: 0, zIndex: 1,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #1877f2, #0668e1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                        <path d="M12 2.04c-5.52 0-10 4.48-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.54-4.48-10.02-10-10.02z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        Nueva integración Meta
                                    </h2>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>WhatsApp Business Cloud API</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Name field */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>
                                    Nombre de la integración <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    id="integ-nombre"
                                    value={form.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    placeholder="Ej: EBeats Principal, Cliente Corp, Tienda Miraflores"
                                    style={inputStyle}
                                    autoFocus
                                />
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Este nombre genera tu webhook único. Puedes crear múltiples integraciones con nombres distintos.
                                </p>
                            </div>

                            {/* Webhook preview */}
                            {form.name.trim() && (
                                <div style={{
                                    background: 'rgba(24,119,242,0.07)', border: '1px solid rgba(24,119,242,0.2)',
                                    borderRadius: 'var(--radius-md)', padding: '12px 14px',
                                }}>
                                    <p style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                                        🔗 Tu Webhook URL (se genera automáticamente)
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <code style={{ fontSize: '12px', color: '#93c5fd', flex: 1, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                            {webhookPreview}
                                        </code>
                                        <CopyButton text={webhookPreview} />
                                    </div>
                                </div>
                            )}

                            <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
                            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Credenciales de tu App en Meta for Developers
                            </p>

                            {/* App ID + App Secret */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>App ID <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        id="integ-app-id"
                                        value={form.app_id}
                                        onChange={e => handleChange('app_id', e.target.value)}
                                        placeholder="298806756..."
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>App Secret</label>
                                    <input
                                        id="integ-app-secret"
                                        type="password"
                                        value={form.app_secret}
                                        onChange={e => handleChange('app_secret', e.target.value)}
                                        placeholder="••••••••••••"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Access Token */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Access Token permanente <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    id="integ-access-token"
                                    type="password"
                                    value={form.access_token}
                                    onChange={e => handleChange('access_token', e.target.value)}
                                    placeholder="EAAq..."
                                    style={inputStyle}
                                />
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Lo encuentras en Meta for Developers → Tu App → WhatsApp → Configuración API
                                </p>
                            </div>

                            {/* Phone Number ID + WABA ID */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>Phone Number ID <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        id="integ-phone-number-id"
                                        value={form.phone_number_id}
                                        onChange={e => handleChange('phone_number_id', e.target.value)}
                                        placeholder="106890997..."
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>WABA ID</label>
                                    <input
                                        id="integ-waba-id"
                                        value={form.waba_id}
                                        onChange={e => handleChange('waba_id', e.target.value)}
                                        placeholder="84721522..."
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
                            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Configuración del Webhook
                            </p>

                            {/* Verify Token */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Token de verificación <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    id="integ-verify-token"
                                    value={form.verify_token}
                                    onChange={e => handleChange('verify_token', e.target.value)}
                                    placeholder="Ej: mi_token_secreto_ebeats_2024"
                                    style={inputStyle}
                                />
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Tú decides este valor. Debes pegarlo exactamente igual en Meta cuando configures el webhook maestro.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{
                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: 'var(--radius-md)', padding: '10px 14px',
                                    color: '#fca5a5', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start',
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '10px 20px', background: 'transparent',
                                        border: '1px solid var(--border-strong)', color: 'var(--text-secondary)',
                                        borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500, fontSize: '14px',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    id="btn-guardar-integracion"
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        padding: '10px 24px',
                                        background: saving ? 'rgba(24,119,242,0.5)' : 'linear-gradient(135deg, #1877f2, #0668e1)',
                                        border: 'none', color: 'white', borderRadius: 'var(--radius-md)',
                                        cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '14px',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        boxShadow: saving ? 'none' : '0 4px 14px rgba(24,119,242,0.3)',
                                        transition: 'all 200ms ease',
                                    }}
                                >
                                    {saving ? (
                                        <>
                                            <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                                            </svg>
                                            Crear Integración
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input:focus { border-color: #1877f2 !important; box-shadow: 0 0 0 3px rgba(24,119,242,0.12); }
            `}</style>
        </div>
    );
}
