'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, Phone, MoreVertical, Send, Bot, User,
    Archive, RefreshCw, ChevronDown, Tag, Building2,
    Clock, MessageSquare, X
} from 'lucide-react';

interface ConversationItem {
    id: number;
    contact_id: number;
    status: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
    contact_name: string;
    contact_phone: string;
    contact_avatar_color: string;
    contact_lead_status: string;
    contact_company: string;
    assigned_agent: string;
}

interface Message {
    id: number;
    content: string;
    role: 'user' | 'ai' | 'system';
    status: string;
    timestamp: string;
    message_type: string;
}

interface ConversationDetail {
    id: number;
    contact_name: string;
    contact_phone: string;
    contact_avatar_color: string;
    contact_lead_status: string;
    contact_company: string;
    contact_email: string;
    contact_notes: string;
    first_contact_date: string;
    status: string;
    assigned_agent: string;
}

function getInitials(name: string) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function formatTime(ts: string) {
    const date = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800) return date.toLocaleDateString('es', { weekday: 'short' });
    return date.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
}

function formatFullTime(ts: string) {
    return new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: string) {
    const date = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return date.toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ConversationsView() {
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [detail, setDetail] = useState<ConversationDetail | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showDetails, setShowDetails] = useState(true);
    const [noIntegrations, setNoIntegrations] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fetchConversations = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (filter !== 'all') params.set('status', filter);
            const res = await fetch(`/api/conversations?${params}`);
            const json = await res.json();
            if (json.noActiveIntegrations) {
                setNoIntegrations(true);
                setConversations([]);
            } else {
                setNoIntegrations(false);
                setConversations(json.conversations || []);
            }
        } finally {
            setLoading(false);
        }
    }, [search, filter]);

    const fetchConversation = async (id: number) => {
        try {
            const res = await fetch(`/api/conversations/${id}`);
            const json = await res.json();
            setMessages(json.messages || []);
            setDetail(json.conversation);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    useEffect(() => {
        if (selectedId) {
            fetchConversation(selectedId);
            const interval = setInterval(() => fetchConversation(selectedId), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const selectConversation = (conv: ConversationItem) => {
        setSelectedId(conv.id);
        setMessages([]);
        setDetail(null);
        // Update unread count in list
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !selectedId || !detail || sending) return;
        setSending(true);
        const content = newMessage.trim();
        setNewMessage('');

        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: detail.contact_phone,
                    content,
                    role: 'ai',
                    conversation_id: selectedId,
                }),
            });
            await fetchConversation(selectedId);
            await fetchConversations();
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Group messages by date
    const groupMessagesByDate = () => {
        const groups: { date: string; messages: Message[] }[] = [];
        messages.forEach(msg => {
            const date = formatDate(msg.timestamp);
            const last = groups[groups.length - 1];
            if (!last || last.date !== date) {
                groups.push({ date, messages: [msg] });
            } else {
                last.messages.push(msg);
            }
        });
        return groups;
    };

    const filteredConversations = conversations.filter(c => {
        if (!search) return true;
        return c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.contact_phone?.includes(search);
    });

    return (
        <div className="conversations-view">
            {/* Left: Conversations list */}
            <div className="conversations-sidebar">
                <div className="conv-search">
                    <div className="search-input-wrap">
                        <Search size={15} />
                        <input
                            className="search-input"
                            placeholder="Buscar conversación..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="conv-filters">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'active', label: 'Activos' },
                        { id: 'pending', label: 'Pendientes' },
                        { id: 'closed', label: 'Cerrados' },
                    ].map(f => (
                        <button
                            key={f.id}
                            className={`filter-chip ${filter === f.id ? 'active' : ''}`}
                            onClick={() => setFilter(f.id)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="conv-list">
                    {loading ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            Cargando...
                        </div>
                    ) : noIntegrations ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 'bold' }}>
                            No hay integraciones conectadas
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No hay conversaciones
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`conv-item ${selectedId === conv.id ? 'active' : ''}`}
                                onClick={() => selectConversation(conv)}
                            >
                                <div className="contact-avatar" style={{ background: conv.contact_avatar_color || '#6366f1' }}>
                                    {getInitials(conv.contact_name)}
                                    <div className="avatar-status" style={{ background: conv.status === 'active' ? 'var(--status-active)' : conv.status === 'pending' ? 'var(--status-pending)' : 'var(--status-closed)' }} />
                                </div>
                                <div className="conv-info">
                                    <div className="conv-top">
                                        <div className="conv-name">{conv.contact_name}</div>
                                        <div className="conv-time">{formatTime(conv.last_message_at)}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {conv.last_message?.startsWith('[') ? null : (
                                            <Bot size={11} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                                        )}
                                        <div className="conv-preview">{conv.last_message || 'Sin mensajes'}</div>
                                    </div>
                                </div>
                                {conv.unread_count > 0 && (
                                    <div className="conv-badge">{conv.unread_count}</div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Center: Chat */}
            {selectedId && detail ? (
                <div className="chat-panel">
                    {/* Chat Header */}
                    <div className="chat-header">
                        <div className="contact-avatar" style={{ background: detail.contact_avatar_color || '#6366f1', width: '40px', height: '40px', fontSize: '14px' }}>
                            {getInitials(detail.contact_name)}
                        </div>
                        <div className="chat-header-info">
                            <div className="chat-header-name">{detail.contact_name}</div>
                            <div className="chat-header-sub">
                                <div className="online-dot" />
                                <span>{detail.contact_phone}</span>
                                {detail.contact_company && <><span>·</span><span>{detail.contact_company}</span></>}
                                <span className={`lead-badge ${detail.contact_lead_status}`} style={{ marginLeft: '4px', padding: '1px 8px', fontSize: '10px' }}>
                                    {detail.contact_lead_status}
                                </span>
                            </div>
                        </div>
                        <div className="chat-actions">
                            <button className="chat-action-btn" title="Llamar" onClick={() => window.open(`tel:${detail.contact_phone}`)}>
                                <Phone size={16} />
                            </button>
                            <button className="chat-action-btn" title={showDetails ? 'Ocultar detalles' : 'Ver detalles'} onClick={() => setShowDetails(!showDetails)}>
                                <MoreVertical size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {groupMessagesByDate().map((group, gi) => (
                            <div key={gi}>
                                <div className="date-divider">
                                    <span>{group.date}</span>
                                </div>
                                {group.messages.map((msg, mi) => (
                                    <div key={msg.id} className={`message-group`}>
                                        <div className={`message-row ${msg.role === 'user' ? 'user' : ''}`}>
                                            {msg.role !== 'user' && (
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Bot size={14} color="white" />
                                                </div>
                                            )}
                                            <div>
                                                <div className={`message-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                                                    {msg.content}
                                                </div>
                                                <div className="message-meta" style={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                                    {msg.role !== 'user' && (
                                                        <span className="ai-badge">
                                                            <Bot size={9} /> IA
                                                        </span>
                                                    )}
                                                    <span>{formatFullTime(msg.timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="chat-input-area">
                        <textarea
                            ref={textareaRef}
                            className="chat-input"
                            placeholder="Escribe un mensaje manualmente..."
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <button className="send-btn" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="chat-panel">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <MessageSquare size={28} color="var(--text-muted)" />
                        </div>
                        <div className="empty-state-title">Selecciona una conversación</div>
                        <div className="empty-state-text">
                            Elige un chat de la lista para ver el historial de mensajes con el agente IA
                        </div>
                    </div>
                </div>
            )}

            {/* Right: Contact details */}
            {selectedId && detail && showDetails && (
                <div className="contact-details">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Detalles</div>
                        <button className="btn btn-ghost" onClick={() => setShowDetails(false)}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Avatar */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', gap: '8px' }}>
                        <div className="contact-avatar" style={{ background: detail.contact_avatar_color || '#6366f1', width: '60px', height: '60px', fontSize: '22px' }}>
                            {getInitials(detail.contact_name)}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{detail.contact_name}</div>
                        <span className={`lead-badge ${detail.contact_lead_status}`}>{detail.contact_lead_status}</span>
                    </div>

                    <div className="detail-section">
                        <div className="detail-section-title">Contacto</div>
                        <div className="detail-row">
                            <Phone size={13} color="var(--text-muted)" />
                            <div>
                                <div className="detail-label">Teléfono</div>
                                <div className="detail-value">{detail.contact_phone}</div>
                            </div>
                        </div>
                        {detail.contact_company && (
                            <div className="detail-row">
                                <Building2 size={13} color="var(--text-muted)" />
                                <div>
                                    <div className="detail-label">Empresa</div>
                                    <div className="detail-value">{detail.contact_company}</div>
                                </div>
                            </div>
                        )}
                        {detail.contact_email && (
                            <div className="detail-row">
                                <Tag size={13} color="var(--text-muted)" />
                                <div>
                                    <div className="detail-label">Email</div>
                                    <div className="detail-value" style={{ fontSize: '12px' }}>{detail.contact_email}</div>
                                </div>
                            </div>
                        )}
                        <div className="detail-row">
                            <Clock size={13} color="var(--text-muted)" />
                            <div>
                                <div className="detail-label">Primer contacto</div>
                                <div className="detail-value">{new Date(detail.first_contact_date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <div className="detail-section-title">Conversación</div>
                        <div className="detail-row">
                            <Bot size={13} color="var(--text-muted)" />
                            <div>
                                <div className="detail-label">Agente</div>
                                <div className="detail-value">{detail.assigned_agent}</div>
                            </div>
                        </div>
                        <div className="detail-row">
                            <MessageSquare size={13} color="var(--text-muted)" />
                            <div>
                                <div className="detail-label">Mensajes</div>
                                <div className="detail-value">{messages.length}</div>
                            </div>
                        </div>
                    </div>

                    {detail.contact_notes && (
                        <div className="detail-section">
                            <div className="detail-section-title">Notas Internas</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
                                {detail.contact_notes}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <button className="btn btn-outline" style={{ justifyContent: 'center', width: '100%' }}>
                            <Archive size={14} />
                            Cerrar conversación
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
