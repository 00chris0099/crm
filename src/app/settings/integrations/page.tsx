'use client';

import { useState, useEffect } from 'react';
import { Copy, Plus, Save, X, Trash2, Power, PowerOff } from 'lucide-react';

interface Integration {
    id: string;
    type: string;
    name: string;
    config: any;
    active: boolean;
}

export default function IntegrationsSettings() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [selectedType, setSelectedType] = useState('META');
    
    // Form fields
    const [integrationName, setIntegrationName] = useState('');
    // Meta specific
    const [phoneId, setPhoneId] = useState('');
    const [wabaId, setWabaId] = useState('');
    const [appId, setAppId] = useState('');
    const [appSecret, setAppSecret] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [verifyToken, setVerifyToken] = useState('');
    // Evolution specific
    const [serverUrl, setServerUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [instanceName, setInstanceName] = useState('');
    // Twilio specific
    const [accountSid, setAccountSid] = useState('');
    const [authToken, setAuthToken] = useState('');
    const [twilioPhone, setTwilioPhone] = useState('');

    const [saving, setSaving] = useState(false);
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        try {
            const res = await fetch('/api/integrations');
            const data = await res.json();
            setIntegrations(data.integrations || []);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!integrationName.trim()) {
            alert('El nombre de la integración es obligatorio');
            return;
        }

        let config: any = {};
        if (selectedType === 'META') {
            config = {
                app_id: appId,
                app_secret: appSecret,
                phone_number_id: phoneId,
                whatsapp_business_account_id: wabaId,
                access_token: accessToken,
                verify_token: verifyToken,
                webhook_url: `${origin}/api/webhooks/meta/${encodeURIComponent(integrationName)}`
            };
        } else if (selectedType === 'EVOLUTION') {
            config = {
                server_url: serverUrl,
                api_key: apiKey,
                instance_name: instanceName,
                webhook_url: `${origin}/api/webhooks/evolution/${encodeURIComponent(integrationName)}`
            };
        } else if (selectedType === 'TWILIO') {
            config = {
                account_sid: accountSid,
                auth_token: authToken,
                twilio_phone_number: twilioPhone,
                webhook_url: `${origin}/api/webhooks/twilio/${encodeURIComponent(integrationName)}`
            };
        }

        setSaving(true);
        try {
            const res = await fetch('/api/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: selectedType,
                    name: integrationName,
                    config,
                    active: true
                })
            });

            if (res.ok) {
                setShowModal(false);
                resetForm();
                await fetchIntegrations();
            } else {
                const data = await res.json();
                alert('Error: ' + data.error);
            }
        } catch (e) {
            alert('Error guardando la integración');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setIntegrationName('');
        setAppId('');
        setAppSecret('');
        setPhoneId('');
        setWabaId('');
        setAccessToken('');
        setVerifyToken('');
        setServerUrl('');
        setApiKey('');
        setInstanceName('');
        setAccountSid('');
        setAuthToken('');
        setTwilioPhone('');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado: ' + text);
    };

    const generatedWebhookUrl = `${origin}/api/webhooks/${selectedType.toLowerCase()}/${encodeURIComponent(integrationName || '{nombre_integracion}')}`;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Integraciones y Canales</h2>
                <button 
                    onClick={() => { resetForm(); setShowModal(true); }}
                    style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={16} /> Nueva Integración
                </button>
            </div>

            {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Cargando integraciones...</div>
            ) : integrations.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-strong)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No tienes integraciones conectadas. Crea una para conectar tus canales de entrada.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {integrations.map(int => (
                        <div key={int.id} style={{ 
                            backgroundColor: 'var(--bg-card)', 
                            border: '1px solid var(--border-subtle)', 
                            borderRadius: 'var(--radius-lg)', 
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <h3 style={{ fontWeight: 600, fontSize: '18px', color: 'var(--text-primary)' }}>{int.name}</h3>
                                    <span style={{ 
                                        backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600
                                    }}>
                                        {int.type}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: int.active ? 'var(--brand-success)' : 'var(--text-muted)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {int.active ? <><Power size={14} /> Activo</> : <><PowerOff size={14} /> Inactivo</>}
                                    </span>
                                </div>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Webhook URL configurada / provista:</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <code style={{ flex: 1, backgroundColor: 'var(--bg-base)', padding: '8px', borderRadius: '4px', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {int.config.webhook_url}
                                    </code>
                                    <button onClick={() => copyToClipboard(int.config.webhook_url)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Creación */}
            {showModal && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ 
                        backgroundColor: 'var(--bg-surface)', 
                        padding: '32px', 
                        borderRadius: 'var(--radius-lg)', 
                        width: '100%', 
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Crear Conexión de API</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X /></button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Tipo de Integración</label>
                                <select 
                                    value={selectedType} 
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                                >
                                    <option value="META">Meta Cloud API (WhatsApp)</option>
                                    <option value="EVOLUTION">Evolution API (WhatsApp)</option>
                                    <option value="TWILIO">Twilio API (WhatsApp / SMS)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nombre de la Integración (Identificador)</label>
                                <input 
                                    type="text" 
                                    value={integrationName}
                                    onChange={(e) => setIntegrationName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                    placeholder="Ej: ventas_meta_1"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                                />
                                <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>Usa solo letras, números y guiones.</small>
                            </div>

                            <div style={{ padding: '16px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--brand-primary)' }}>🔗 Webhook Dinámico Generado</label>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    Debes pegar exactamente esta URL en el panel de {selectedType}. Cambia automáticamente según el nombre de la integración que escribas arriba.
                                </p>
                                <code style={{ display: 'block', backgroundColor: 'var(--bg-base)', padding: '10px', borderRadius: '4px', fontSize: '13px', color: 'var(--brand-primary)', wordBreak: 'break-all' }}>
                                    {generatedWebhookUrl}
                                </code>
                            </div>

                            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '8px 0' }} />

                            {selectedType === 'META' && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>App ID</label>
                                        <input type="text" value={appId} onChange={e => setAppId(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>App Secret</label>
                                        <input type="password" value={appSecret} onChange={e => setAppSecret(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Phone Number ID</label>
                                        <input type="text" value={phoneId} onChange={e => setPhoneId(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>WhatsApp Business Account ID</label>
                                        <input type="text" value={wabaId} onChange={e => setWabaId(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Access Token Permanente</label>
                                        <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Verify Token (Escribe uno personalizado)</label>
                                        <input type="text" value={verifyToken} onChange={e => setVerifyToken(e.target.value)} placeholder="Ej: mi_token_secr3t0" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                </>
                            )}

                            {selectedType === 'EVOLUTION' && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Server URL</label>
                                        <input type="text" value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="https://api.tu-evolution.com" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Global API Key</label>
                                        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Instance Name</label>
                                        <input type="text" value={instanceName} onChange={e => setInstanceName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                </>
                            )}

                            {selectedType === 'TWILIO' && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Account SID</label>
                                        <input type="text" value={accountSid} onChange={e => setAccountSid(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Auth Token</label>
                                        <input type="password" value={authToken} onChange={e => setAuthToken(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Phone Number SID (PN... o HX...)</label>
                                        <input type="text" value={twilioPhone} onChange={e => setTwilioPhone(e.target.value)} placeholder="Ej: PN1234567890abcdef" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }} />
                                    </div>
                                </>
                            )}

                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                            >
                                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar y Generar Webhook'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
