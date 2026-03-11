'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    MessageCircle, Search, RefreshCw, Send,
    CheckCheck, Activity, Users,
    BarChart2, ChevronLeft, Bot,
    User, Circle, AlertCircle, TrendingUp, MessageSquare,
    PhoneCall, Eye, Phone,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WAStats {
    phone: {
        display_phone_number: string;
        verified_name: string;
        quality_rating: string;
        code_verification_status: string;
        platform_type: string;
        throughput?: { level: string };
    } | null;
    account: { id: string; name: string; currency: string } | null;
    analytics: {
        period: string;
        totalSent: number;
        totalDelivered: number;
        totalRead: number;
        deliveryRate: number;
        readRate: number;
        dataPoints: { start: number; end: number; sent: number; delivered: number; read: number }[];
    };
    n8nStats: { totalSessions: number; totalMessages: number; activeSessions: number };
}

interface Conversation {
    session_id: string;
    message_count: number;
    first_id: number;
    last_id: number;
    last_content: string;
    last_type: string;
}

interface Message {
    id: number;
    session_id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    raw_type: string;
    tool_calls?: unknown[];
    additional_kwargs: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Decodes the phone number from n8n's wamid-based session_id */
function extractPhone(sessionId: string): string | null {
    // If sessionId is already a raw phone number (from our new backend grouper), return it directly
    if (/^\d{8,15}$/.test(sessionId)) return sessionId;

    try {
        const b64 = sessionId.startsWith('wamid.')
            ? sessionId.slice(6)
            : sessionId;
        // atob works in browser; Buffer works server-side
        const decoded = typeof atob !== 'undefined'
            ? atob(b64)
            : Buffer.from(b64, 'base64').toString('ascii');
        const match = decoded.match(/\d{8,}/);
        if (match) return match[0];
    } catch {/* ignore */ }
    return null;
}

function formatPhone(raw: string | null): string {
    if (!raw) return 'Desconocido';
    // Peruvian numbers: 51XXXXXXXXX → +51 XXX XXX XXX
    if (raw.startsWith('51') && raw.length === 11) {
        return `+51 ${raw.slice(2, 5)} ${raw.slice(5, 8)} ${raw.slice(8)}`;
    }
    if (raw.length >= 10) {
        return `+${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 8)} ${raw.slice(8)}`;
    }
    return `+${raw}`;
}

function qualityColor(q: string | undefined) {
    if (!q) return '#94a3b8';
    if (q === 'GREEN') return '#34d399';
    if (q === 'YELLOW') return '#fbbf24';
    return '#f87171';
}

function avatarColor(sessionId: string): string {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#84cc16'];
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) hash = sessionId.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function phoneInitials(phone: string | null): string {
    if (!phone) return '??';
    const digits = phone.replace(/\D/g, '');
    return digits.slice(-4, -2) || digits.slice(-2) || '??';
}

function msgCountBadge(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
    const max = Math.max(...data, 1);
    return (
        <div className="wam-mini-chart">
            {data.map((v, i) => (
                <div key={i} className="wam-mini-bar-wrap">
                    <div
                        className="wam-mini-bar"
                        style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: color }}
                    />
                </div>
            ))}
        </div>
    );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
// Perspective: CLIENT = left (incoming), AGENT/AI = right (outgoing)

function MessageBubble({ msg, contactPhone }: { msg: Message; contactPhone: string | null }) {
    const isFromClient = msg.role === 'user';   // client → LEFT
    const isFromAI = msg.role === 'ai';      // AI agent → RIGHT
    const isSystem = msg.role === 'system';

    if (isSystem) {
        return (
            <div className="wam-system-msg">
                <span>{msg.content || '[sistema]'}</span>
            </div>
        );
    }

    return (
        <div className={`wam-msg-row ${isFromClient ? 'incoming' : 'outgoing'}`}>
            {/* Avatar — only for incoming (client) */}
            {isFromClient && (
                <div
                    className="wam-msg-avatar-sm"
                    style={{ background: avatarColor(msg.session_id) }}
                >
                    <User size={11} />
                </div>
            )}

            <div className={`wam-bubble-col ${isFromClient ? '' : 'right'}`}>
                {/* Sender label */}
                <div className="wam-bubble-label">
                    {isFromClient
                        ? (contactPhone ? formatPhone(contactPhone) : 'Cliente')
                        : <><Bot size={10} /> Agente IA</>
                    }
                </div>

                <div className={`wam-bubble-new ${isFromClient ? 'client' : 'agent'}`}>
                    {msg.content || <span className="wam-empty-msg">[sin contenido]</span>}
                </div>

                <div className="wam-bubble-meta">
                    #{msg.id}
                    {isFromAI && <><CheckCheck size={10} /> IA</>}
                </div>
            </div>

            {/* Avatar — only for outgoing (AI) */}
            {isFromAI && (
                <div className="wam-msg-avatar-sm agent">
                    <Bot size={11} />
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WhatsAppMonitorView() {
    const [stats, setStats] = useState<WAStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [convTotal, setConvTotal] = useState(0);
    const [convPage, setConvPage] = useState(1);
    const [convLoading, setConvLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [msgsLoading, setMsgsLoading] = useState(false);

    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'analytics'>('chat');

    const msgsEndRef = useRef<HTMLDivElement>(null);
    const msgsContainerRef = useRef<HTMLDivElement>(null);
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Immortal Refs for robust polling
    const pollState = useRef({ activeTab, selectedConv, convPage, searchInput });
    useEffect(() => {
        pollState.current = { activeTab, selectedConv, convPage, searchInput };
    }, [activeTab, selectedConv, convPage, searchInput]);

    // ── Load Stats ──────────────────────────────────────────────────────────────
    const loadStats = useCallback(async () => {
        setLoadingStats(true);
        setStatsError(null);
        try {
            const r = await fetch('/api/whatsapp/stats');
            const d = await r.json() as WAStats & { error?: string };
            if (d.error) throw new Error(d.error);
            setStats(d);
        } catch (e) {
            setStatsError((e as Error).message);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    // ── Load Conversations ──────────────────────────────────────────────────────
    const loadConvs = useCallback(async (pg = 1, q = '', background = false) => {
        if (!background) setConvLoading(true);
        const params = new URLSearchParams({ page: String(pg), pageSize: '20', _t: String(Date.now()) });
        if (q) params.set('search', q);
        const r = await fetch(`/api/whatsapp/conversations?${params}`);
        const d = await r.json() as { conversations: Conversation[]; total: number };
        if (pg === 1) setConversations(d.conversations ?? []);
        else {
            setConversations(prev => {
                const newItems = d.conversations ?? [];
                const existIds = new Set(prev.map(c => c.session_id));
                return [...prev, ...newItems.filter(c => !existIds.has(c.session_id))];
            });
        }
        setConvTotal(d.total ?? 0);
        if (!background) setConvLoading(false);
    }, []);

    useEffect(() => { loadConvs(1, ''); }, [loadConvs]);

    const handleSearchChange = (v: string) => {
        setSearchInput(v);
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        searchDebounce.current = setTimeout(() => { setConvPage(1); loadConvs(1, v); }, 400);
    };

    // ── Load Messages ────────────────────────────────────────────────────────────
    const loadMessages = useCallback(async (conv: Conversation, background = false) => {
        if (!background) {
            setMsgsLoading(true);
            setMessages([]);
        }
        const r = await fetch(`/api/whatsapp/messages?session_id=${encodeURIComponent(conv.session_id)}&pageSize=200&_t=${Date.now()}`);
        const d = await r.json() as { messages: Message[] };
        setMessages(d.messages ?? []);
        if (!background) setMsgsLoading(false);
    }, []);

    useEffect(() => {
        if (selectedConv) loadMessages(selectedConv);
    }, [selectedConv, loadMessages]);

    useEffect(() => {
        if (msgsContainerRef.current) {
            msgsContainerRef.current.scrollTop = msgsContainerRef.current.scrollHeight;
        }
    }, [messages.length, messages[messages.length - 1]?.id]);

    // ── Real-time Poller (Immortal) ──────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const state = pollState.current;
            if (state.activeTab === 'chat') {
                if (state.convPage === 1) loadConvs(1, state.searchInput, true);
                if (state.selectedConv) loadMessages(state.selectedConv, true);
            }
        }, 2000); // 2 seconds poll for snappy real-time
        return () => clearInterval(interval);
    }, [loadConvs, loadMessages]);

    // ── Send Reply ───────────────────────────────────────────────────────────────
    const sendReply = async () => {
        if (!replyText.trim() || !selectedConv) return;
        const rawPhone = extractPhone(selectedConv.session_id);
        if (!rawPhone) { alert('No se pudo extraer el número de teléfono del session ID'); return; }
        setSending(true);
        const r = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: rawPhone, text: replyText }),
        });
        const d = await r.json() as { error?: string };
        setSending(false);
        if (d.error) { alert(`Error al enviar: ${d.error}`); return; }
        setReplyText('');
        loadMessages(selectedConv, true);
    };

    // ─── Render ──────────────────────────────────────────────────────────────────
    const phone = stats?.phone;
    const analytics = stats?.analytics;
    const n8n = stats?.n8nStats;

    // Derived per selected conversation
    const contactPhone = selectedConv ? extractPhone(selectedConv.session_id) : null;

    return (
        <div className="wam-root">
            {/* ── HEADER ── */}
            <div className="wam-header">
                <div className="wam-header-left">
                    <div className="wam-wa-logo">
                        <MessageCircle size={18} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="wam-title">WhatsApp Monitor</h1>
                        <p className="wam-subtitle">
                            {phone ? (
                                <><span className="wam-phone-num">{phone.display_phone_number}</span> · {phone.verified_name}</>
                            ) : loadingStats ? 'Conectando...' : 'E-Beats Perú'}
                        </p>
                    </div>
                </div>

                <div className="wam-header-right">
                    {phone && (
                        <div className="wam-quality-badge" style={{ borderColor: qualityColor(phone.quality_rating) }}>
                            <Circle size={8} fill={qualityColor(phone.quality_rating)} color={qualityColor(phone.quality_rating)} />
                            <span>{phone.quality_rating ?? '—'}</span>
                        </div>
                    )}
                    {phone?.code_verification_status === 'VERIFIED' && (
                        <div className="wam-verified-badge">
                            <CheckCheck size={12} /> Verificado
                        </div>
                    )}
                    <div className="wam-header-tabs">
                        <button className={`wam-tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                            <MessageSquare size={14} /> Conversaciones
                        </button>
                        <button className={`wam-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                            <BarChart2 size={14} /> Analytics
                        </button>
                    </div>
                    <button className="wam-refresh-btn" onClick={() => { loadStats(); if (selectedConv) loadMessages(selectedConv); }} title="Refresh">
                        <RefreshCw size={14} className={loadingStats ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── STATS ROW ── */}
            <div className="wam-stats-row">
                {[
                    { icon: <Users size={16} />, color: '#6366f1', label: 'Sesiones totales', value: loadingStats ? '...' : String(n8n?.totalSessions ?? 0) },
                    { icon: <MessageCircle size={16} />, color: '#10b981', label: 'Mensajes totales', value: loadingStats ? '...' : String(n8n?.totalMessages ?? 0) },
                    { icon: <Activity size={16} />, color: '#f59e0b', label: 'Sesiones activas', value: loadingStats ? '...' : String(n8n?.activeSessions ?? 0) },
                    { icon: <Send size={16} />, color: '#06b6d4', label: 'Enviados (7d)', value: loadingStats ? '...' : String(analytics?.totalSent ?? 0) },
                    { icon: <CheckCheck size={16} />, color: '#34d399', label: 'Tasa entrega', value: loadingStats ? '...' : `${analytics?.deliveryRate ?? 0}%` },
                    { icon: <Eye size={16} />, color: '#a78bfa', label: 'Tasa lectura', value: loadingStats ? '...' : `${analytics?.readRate ?? 0}%` },
                ].map((s) => (
                    <div key={s.label} className="wam-stat-pill">
                        <div className="wam-stat-icon-wrap" style={{ color: s.color, background: s.color + '1a' }}>{s.icon}</div>
                        <div>
                            <div className="wam-stat-val">{s.value}</div>
                            <div className="wam-stat-lbl">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {statsError && (
                <div className="wam-api-error">
                    <AlertCircle size={14} />
                    <strong>API Meta:</strong> {statsError}
                </div>
            )}

            {/* ── CHAT TAB ── */}
            {activeTab === 'chat' && (
                <div className="wam-body">
                    {/* ── Conversation List ── */}
                    <div className="wam-conv-panel">
                        <div className="wam-conv-header">
                            <div className="wam-search-wrap">
                                <Search size={13} />
                                <input
                                    className="wam-search"
                                    placeholder="Buscar número o mensaje..."
                                    value={searchInput}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                />
                            </div>
                            <span className="wam-conv-count">{convTotal} conversaciones</span>
                        </div>

                        <div className="wam-conv-list">
                            {convLoading && conversations.length === 0 ? (
                                <div className="wam-conv-loading"><RefreshCw size={16} className="spin" /> Cargando...</div>
                            ) : conversations.length === 0 ? (
                                <div className="wam-conv-loading">Sin conversaciones</div>
                            ) : (
                                conversations.map((c) => {
                                    const rawPhone = extractPhone(c.session_id);
                                    const displayPhone = formatPhone(rawPhone);
                                    const color = avatarColor(c.session_id);
                                    const isActive = selectedConv?.session_id === c.session_id;
                                    const isLastFromClient = c.last_type === 'human';

                                    return (
                                        <div
                                            key={c.session_id}
                                            className={`wam-conv-item ${isActive ? 'active' : ''}`}
                                            onClick={() => setSelectedConv(c)}
                                        >
                                            <div className="wam-conv-avatar" style={{ background: color }}>
                                                {phoneInitials(rawPhone)}
                                            </div>
                                            <div className="wam-conv-info">
                                                <div className="wam-conv-top">
                                                    <span className="wam-conv-id">{displayPhone}</span>
                                                    <span className="wam-conv-time">{msgCountBadge(c.message_count)} msgs</span>
                                                </div>
                                                <div className="wam-conv-preview">
                                                    {isLastFromClient ? '' : <><Bot size={10} style={{ display: 'inline' }} /> </>}
                                                    {c.last_content?.slice(0, 55) || '—'}
                                                </div>
                                                <div className="wam-conv-meta">
                                                    <Phone size={10} />
                                                    <span className="wam-conv-phone-small">{rawPhone ? `+${rawPhone}` : c.session_id.slice(-10)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            {conversations.length < convTotal && (
                                <button
                                    className="wam-load-more"
                                    onClick={() => { const np = convPage + 1; setConvPage(np); loadConvs(np, searchInput); }}
                                    disabled={convLoading}
                                >
                                    {convLoading ? <RefreshCw size={12} className="spin" /> : null}
                                    Cargar más
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Chat Panel ── */}
                    <div className="wam-chat-panel">
                        {!selectedConv ? (
                            <div className="wam-no-chat">
                                <MessageCircle size={48} opacity={0.15} />
                                <h3>Selecciona una conversación</h3>
                                <p>Visualiza y responde los mensajes de tus clientes de WhatsApp.</p>
                                <div className="wam-no-chat-legend">
                                    <div className="wam-legend-item client"><span /> Cliente (izquierda)</div>
                                    <div className="wam-legend-item agent"><span /> Agente IA (derecha)</div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat header with contact info */}
                                <div className="wam-chat-header">
                                    <button className="wam-back-btn" onClick={() => setSelectedConv(null)}>
                                        <ChevronLeft size={16} />
                                    </button>
                                    <div
                                        className="wam-chat-avatar"
                                        style={{ background: avatarColor(selectedConv.session_id) }}
                                    >
                                        {phoneInitials(contactPhone)}
                                    </div>
                                    <div className="wam-chat-header-info">
                                        <div className="wam-chat-name">
                                            {contactPhone ? formatPhone(contactPhone) : 'Cliente WhatsApp'}
                                        </div>
                                        <div className="wam-chat-sub">
                                            <span className="wam-online-dot" />
                                            {selectedConv.message_count} mensajes ·
                                            {contactPhone && <><PhoneCall size={10} /> +{contactPhone}</>}
                                        </div>
                                    </div>
                                    <div className="wam-chat-actions">
                                        <button
                                            className="wam-action-btn"
                                            onClick={() => loadMessages(selectedConv, true)}
                                            title="Refrescar mensajes"
                                        >
                                            <RefreshCw size={14} className={msgsLoading ? 'spin' : ''} />
                                        </button>
                                        {/* Indicator: AI or human mode */}
                                        <div className="wam-mode-badge ai">
                                            <Bot size={11} /> Modo IA
                                        </div>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="wam-chat-legend">
                                    <div className="wam-legend-item client"><span /> {contactPhone ? formatPhone(contactPhone) : 'Cliente'}</div>
                                    <div className="wam-legend-arrow">↔</div>
                                    <div className="wam-legend-item agent"><span /> Agente IA · {phone?.display_phone_number ?? ''}</div>
                                </div>

                                {/* Messages — WhatsApp Web perspective */}
                                <div className="wam-messages" ref={msgsContainerRef}>
                                    {msgsLoading ? (
                                        <div className="wam-msgs-loading"><RefreshCw size={20} className="spin" /></div>
                                    ) : messages.length === 0 ? (
                                        <div className="wam-msgs-loading">Sin mensajes</div>
                                    ) : (
                                        messages.map((msg) => (
                                            <MessageBubble
                                                key={msg.id}
                                                msg={msg}
                                                contactPhone={contactPhone}
                                            />
                                        ))
                                    )}
                                    <div ref={msgsEndRef} />
                                </div>

                                {/* Reply bar */}
                                <div className="wam-reply-bar">
                                    <div className="wam-reply-to">
                                        <Send size={12} />
                                        Respondiendo a <strong>{contactPhone ? formatPhone(contactPhone) : 'cliente'}</strong>
                                        {contactPhone && <span className="wam-reply-number"> (+{contactPhone})</span>}
                                    </div>
                                    <div className="wam-reply-input-row">
                                        <textarea
                                            className="wam-reply-input"
                                            placeholder="Escribe un mensaje manual... (Enter para enviar, Shift+Enter nueva línea)"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
                                            }}
                                            rows={2}
                                        />
                                        <button
                                            className="wam-send-btn"
                                            onClick={sendReply}
                                            disabled={!replyText.trim() || sending}
                                        >
                                            {sending ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── ANALYTICS TAB ── */}
            {activeTab === 'analytics' && (
                <div className="wam-analytics">
                    {loadingStats ? (
                        <div className="wam-analytic-loading"><RefreshCw size={20} className="spin" /> Cargando analytics...</div>
                    ) : (
                        <>
                            <div className="wam-analytic-cards">
                                <div className="wam-analytic-card" style={{ '--card-color': '#6366f1' } as React.CSSProperties}>
                                    <div className="wam-analytic-icon"><Send size={20} /></div>
                                    <div>
                                        <div className="wam-analytic-val">{analytics?.totalSent.toLocaleString()}</div>
                                        <div className="wam-analytic-lbl">Mensajes enviados (7d)</div>
                                    </div>
                                    {analytics && <MiniBarChart data={analytics.dataPoints.map(d => d.sent)} color="#6366f1" />}
                                </div>
                                <div className="wam-analytic-card" style={{ '--card-color': '#10b981' } as React.CSSProperties}>
                                    <div className="wam-analytic-icon"><CheckCheck size={20} /></div>
                                    <div>
                                        <div className="wam-analytic-val">{analytics?.totalDelivered.toLocaleString()}</div>
                                        <div className="wam-analytic-lbl">Entregados · {analytics?.deliveryRate}%</div>
                                    </div>
                                    {analytics && <MiniBarChart data={analytics.dataPoints.map(d => d.delivered)} color="#10b981" />}
                                </div>
                                <div className="wam-analytic-card" style={{ '--card-color': '#f59e0b' } as React.CSSProperties}>
                                    <div className="wam-analytic-icon"><Eye size={20} /></div>
                                    <div>
                                        <div className="wam-analytic-val">{analytics?.totalRead.toLocaleString()}</div>
                                        <div className="wam-analytic-lbl">Leídos · {analytics?.readRate}%</div>
                                    </div>
                                    {analytics && <MiniBarChart data={analytics.dataPoints.map(d => d.read)} color="#f59e0b" />}
                                </div>
                            </div>

                            {analytics && analytics.dataPoints.length > 0 && (
                                <div className="wam-analytic-table-wrap">
                                    <h3 className="wam-section-title">Detalle diario (últimos 7 días)</h3>
                                    <table className="wam-analytic-table">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th><th>Enviados</th><th>Entregados</th>
                                                <th>Leídos</th><th>Entrega %</th><th>Lectura %</th><th>Tendencia</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.dataPoints.slice().reverse().map((dp) => {
                                                const del = dp.sent > 0 ? Math.round((dp.delivered / dp.sent) * 100) : 0;
                                                const rd = dp.delivered > 0 ? Math.round((dp.read / dp.delivered) * 100) : 0;
                                                return (
                                                    <tr key={dp.start}>
                                                        <td>{new Date(dp.start * 1000).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                                        <td><strong>{dp.sent}</strong></td>
                                                        <td>{dp.delivered}</td>
                                                        <td>{dp.read}</td>
                                                        <td>
                                                            <div className="wam-pct-bar">
                                                                <div className="wam-pct-fill" style={{ width: `${del}%`, background: '#10b981' }} />
                                                                <span>{del}%</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="wam-pct-bar">
                                                                <div className="wam-pct-fill" style={{ width: `${rd}%`, background: '#f59e0b' }} />
                                                                <span>{rd}%</span>
                                                            </div>
                                                        </td>
                                                        <td>{dp.sent > 0 ? <span style={{ color: '#34d399' }}><TrendingUp size={13} /></span> : <span style={{ color: '#5c5f7a' }}>—</span>}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {phone && (
                                <div className="wam-phone-card">
                                    <h3 className="wam-section-title">Cuenta WhatsApp Business</h3>
                                    <div className="wam-phone-grid">
                                        {[
                                            { label: 'Número', value: phone.display_phone_number },
                                            { label: 'Nombre', value: phone.verified_name },
                                            { label: 'Calidad', value: phone.quality_rating },
                                            { label: 'Estado', value: phone.code_verification_status },
                                            { label: 'Plataforma', value: phone.platform_type },
                                            { label: 'Throughput', value: phone.throughput?.level ?? '—' },
                                            { label: 'WABA ID', value: stats?.account?.id ?? '—' },
                                            { label: 'Moneda', value: stats?.account?.currency ?? '—' },
                                        ].map((r) => (
                                            <div key={r.label} className="wam-phone-row">
                                                <span className="wam-phone-lbl">{r.label}</span>
                                                <span className="wam-phone-val">{r.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
