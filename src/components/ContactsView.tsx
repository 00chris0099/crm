'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Phone, Mail, Building2, Calendar,
    Flame, Thermometer, Snowflake, Edit2, MessageSquare,
    Filter, X, ChevronDown
} from 'lucide-react';

interface Contact {
    id: number;
    name: string;
    phone: string;
    wa_id: string;
    email?: string;
    company?: string;
    lead_status: 'frio' | 'tibio' | 'caliente';
    notes?: string;
    first_contact_date: string;
    last_activity: string;
    avatar_color: string;
}

function getInitials(name: string) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function timeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
    return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

const LeadIcon = ({ status }: { status: string }) => {
    if (status === 'caliente') return <Flame size={11} />;
    if (status === 'tibio') return <Thermometer size={11} />;
    return <Snowflake size={11} />;
};

interface ContactModalProps {
    contact?: Partial<Contact>;
    onClose: () => void;
    onSave: () => void;
}

function ContactModal({ contact, onClose, onSave }: ContactModalProps) {
    const [form, setForm] = useState({
        name: contact?.name || '',
        phone: contact?.phone || '',
        wa_id: contact?.wa_id || '',
        email: contact?.email || '',
        company: contact?.company || '',
        lead_status: contact?.lead_status || 'frio',
        notes: contact?.notes || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const method = contact?.id ? 'PATCH' : 'POST';
            const body = contact?.id ? { ...form, id: contact.id } : form;
            await fetch('/api/contacts', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            onSave();
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-title">{contact?.id ? 'Editar Contacto' : 'Nuevo Contacto'}</div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div className="form-group">
                            <label className="form-label">Nombre *</label>
                            <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Carlos Rodríguez" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Teléfono *</label>
                            <input className="form-input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+51987654321" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">WA ID</label>
                            <input className="form-input" value={form.wa_id} onChange={e => setForm({ ...form, wa_id: e.target.value })} placeholder="51987654321" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@empresa.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Empresa</label>
                            <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Empresa SAC" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Estado del Lead</label>
                            <select className="form-select" value={form.lead_status} onChange={e => setForm({ ...form, lead_status: e.target.value as 'frio' | 'tibio' | 'caliente' })}>
                                <option value="frio">❄️ Frío</option>
                                <option value="tibio">🌡️ Tibio</option>
                                <option value="caliente">🔥 Caliente</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notas Internas</label>
                        <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Anotaciones sobre este contacto..." />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Guardando...' : (contact?.id ? 'Actualizar' : 'Crear Contacto')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ContactsView() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [leadFilter, setLeadFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editContact, setEditContact] = useState<Contact | null>(null);

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (leadFilter) params.set('lead_status', leadFilter);
            const res = await fetch(`/api/contacts?${params}`);
            const json = await res.json();
            setContacts(json.contacts || []);
            setTotal(json.total || 0);
        } finally {
            setLoading(false);
        }
    }, [search, leadFilter]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    return (
        <div className="contacts-view">
            {/* Toolbar */}
            <div className="contacts-toolbar">
                <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="search-input-wrap" style={{ width: '280px' }}>
                        <Search size={15} />
                        <input
                            className="search-input"
                            placeholder="Buscar por nombre, teléfono, empresa..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[
                            { id: '', label: 'Todos' },
                            { id: 'caliente', label: '🔥 Caliente' },
                            { id: 'tibio', label: '🌡️ Tibio' },
                            { id: 'frio', label: '❄️ Frío' },
                        ].map(f => (
                            <button
                                key={f.id}
                                className={`filter-chip ${leadFilter === f.id ? 'active' : ''}`}
                                onClick={() => setLeadFilter(f.id)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{total} contactos</span>
                    <button className="btn btn-primary" onClick={() => { setEditContact(null); setShowModal(true); }}>
                        <Plus size={15} />
                        Nuevo Contacto
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="contacts-table-wrap">
                <table className="contacts-table">
                    <thead>
                        <tr>
                            <th>Contacto</th>
                            <th>Teléfono</th>
                            <th>Empresa</th>
                            <th>Estado Lead</th>
                            <th>Último Contacto</th>
                            <th>Primer Contacto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    Cargando contactos...
                                </td>
                            </tr>
                        ) : contacts.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No se encontraron contactos
                                </td>
                            </tr>
                        ) : (
                            contacts.map(contact => (
                                <tr key={contact.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="contact-avatar" style={{ background: contact.avatar_color, width: '36px', height: '36px', fontSize: '13px' }}>
                                                {getInitials(contact.name)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{contact.name}</div>
                                                {contact.email && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{contact.email}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={12} color="var(--text-muted)" />
                                            <span>{contact.phone}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {contact.company ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Building2 size={12} color="var(--text-muted)" />
                                                <span>{contact.company}</span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-disabled)' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`lead-badge ${contact.lead_status}`}>
                                            <LeadIcon status={contact.lead_status} />
                                            {contact.lead_status.charAt(0).toUpperCase() + contact.lead_status.slice(1)}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {timeAgo(contact.last_activity)}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {new Date(contact.first_contact_date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                className="btn btn-ghost"
                                                title="Editar"
                                                onClick={() => { setEditContact(contact); setShowModal(true); }}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                className="btn btn-ghost"
                                                title="WhatsApp"
                                                onClick={() => window.open(`https://wa.me/${contact.wa_id}`)}
                                            >
                                                <MessageSquare size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <ContactModal
                    contact={editContact || undefined}
                    onClose={() => { setShowModal(false); setEditContact(null); }}
                    onSave={fetchContacts}
                />
            )}
        </div>
    );
}
