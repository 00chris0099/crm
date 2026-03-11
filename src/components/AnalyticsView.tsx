'use client';

import { useState, useEffect } from 'react';
import {
    Bot, Zap, TrendingUp, MessageSquare, Users, Clock,
    BarChart3, Activity, RefreshCw, Cpu, Send, Inbox,
    Flame, Thermometer, Snowflake
} from 'lucide-react';

interface AnalyticsData {
    stats: {
        total_contacts: number;
        active_conversations: number;
        new_leads_today: number;
        messages_sent_today: number;
        messages_received_today: number;
        response_rate: number;
        hot_leads: number;
        warm_leads: number;
        cold_leads: number;
        avg_response_time: number;
        total_ai_messages: number;
        total_user_messages: number;
    };
    last7days: Array<{ day: string; count: number; role: string }>;
    agentPerformance: Array<{ day: string; total_responses: number; avg_response_ms: number; total_tokens: number }>;
    topContacts: Array<{ name: string; phone: string; lead_status: string; avatar_color: string; message_count: number }>;
}

function getInitials(name: string) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function AnalyticsView() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard');
            const json = await res.json();
            setData(json);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const buildChartData = () => {
        if (!data?.last7days) return [];
        const days: Record<string, { user: number; ai: number }> = {};
        const last7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });
        last7.forEach(d => { days[d] = { user: 0, ai: 0 }; });
        data.last7days.forEach(row => {
            if (days[row.day]) days[row.day][row.role as 'user' | 'ai'] = row.count;
        });
        return last7.map(d => ({
            day: d.slice(5).replace('-', '/'),
            user: days[d].user,
            ai: days[d].ai,
            total: days[d].user + days[d].ai,
            fullDate: d,
        }));
    };

    const chartData = buildChartData();
    const maxTotal = Math.max(...chartData.map(d => d.total), 1);

    if (loading && !data) {
        return (
            <div className="analytics-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Cargando analítica...</span>
                </div>
            </div>
        );
    }

    const kpis = data ? [
        { label: 'Total Mensajes Procesados', value: (data.stats.total_ai_messages + data.stats.total_user_messages).toLocaleString(), icon: MessageSquare, color: '#6366f1', sub: 'Usuarios + IA' },
        { label: 'Respuestas del Agente IA', value: data.stats.total_ai_messages.toLocaleString(), icon: Bot, color: '#10b981', sub: '100% automatizadas' },
        { label: 'Mensajes de Usuarios', value: data.stats.total_user_messages.toLocaleString(), icon: Inbox, color: '#f59e0b', sub: 'Recibidos de WhatsApp' },
        { label: 'Tasa de Respuesta IA', value: `${data.stats.response_rate}%`, icon: TrendingUp, color: '#8b5cf6', sub: 'Eficiencia del agente' },
        { label: 'Conv. Activas', value: data.stats.active_conversations, icon: Activity, color: '#ec4899', sub: 'Chats en curso' },
        { label: 'Tiempo Resp. Promedio', value: `${data.stats.avg_response_time}s`, icon: Clock, color: '#06b6d4', sub: 'Por el agente IA' },
    ] : [];

    return (
        <div className="analytics-view">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Analítica del Agente IA
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Métricas de rendimiento y actividad</p>
                </div>
                <button className="btn btn-outline" onClick={fetchData}>
                    <RefreshCw size={14} />
                    Actualizar
                </button>
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {kpis.map((kpi, i) => (
                    <div key={i} style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'all var(--transition-base)',
                    }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: `${kpi.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <kpi.icon size={22} color={kpi.color} strokeWidth={1.8} />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '4px' }}>{kpi.label}</div>
                            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{kpi.value}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{kpi.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* Message chart */}
                <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div>
                            <div className="chart-title" style={{ marginBottom: '4px' }}>Mensajes por Día — Últimos 7 días</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Comparativa usuarios vs agente IA</div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#6366f1' }} />
                                Usuario
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} />
                                IA
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '120px' }}>
                        {chartData.map((d, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', justifyContent: 'flex-end', height: '100%' }}>
                                    <div title={`IA: ${d.ai}`} style={{ height: `${(d.ai / maxTotal) * 110}px`, background: 'linear-gradient(to top, #10b981, #06b6d4)', borderRadius: '4px 4px 0 0', minHeight: d.ai > 0 ? '4px' : '0', opacity: 0.85 }} />
                                    <div title={`Usuarios: ${d.user}`} style={{ height: `${(d.user / maxTotal) * 110}px`, background: 'linear-gradient(to top, #6366f1, #8b5cf6)', borderRadius: '4px 4px 0 0', minHeight: d.user > 0 ? '4px' : '0', opacity: 0.85 }} />
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>{d.day}</div>
                                <div style={{ fontSize: '9px', color: 'var(--text-disabled)' }}>{d.total}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lead distribution */}
                <div className="chart-card">
                    <div className="chart-title" style={{ marginBottom: '20px' }}>Estado de Leads</div>
                    {data && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Caliente 🔥', value: data.stats.hot_leads, total: data.stats.total_contacts, color: '#ef4444', cls: 'caliente' },
                                { label: 'Tibio 🌡️', value: data.stats.warm_leads, total: data.stats.total_contacts, color: '#f59e0b', cls: 'tibio' },
                                { label: 'Frío ❄️', value: data.stats.cold_leads, total: data.stats.total_contacts, color: '#06b6d4', cls: 'frio' },
                            ].map((item, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({item.total > 0 ? Math.round(item.value / item.total * 100) : 0}%)</span></span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%`, background: item.color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                                    </div>
                                </div>
                            ))}

                            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Contactos</div>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{data.stats.total_contacts}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Agent performance & API docs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Agent logs summary */}
                <div className="chart-card">
                    <div className="chart-title" style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bot size={16} color="var(--brand-primary)" />
                            Resumen del Agente IA
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { label: 'Mensajes automáticos generados', value: data?.stats.total_ai_messages || 0, icon: Send, color: '#10b981' },
                            { label: 'Mensajes recibidos de usuarios', value: data?.stats.total_user_messages || 0, icon: Inbox, color: '#6366f1' },
                            { label: 'Conversaciones activas', value: data?.stats.active_conversations || 0, icon: MessageSquare, color: '#f59e0b' },
                            { label: 'Nuevos leads generados hoy', value: data?.stats.new_leads_today || 0, icon: Users, color: '#ec4899' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <item.icon size={15} color={item.color} />
                                </div>
                                <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</div>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* API Endpoints reference */}
                <div className="chart-card">
                    <div className="chart-title" style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={16} color="var(--brand-primary)" />
                            Endpoints para Integración N8N
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { method: 'POST', path: '/api/messages', desc: 'Guardar mensaje entrante (usuario)' },
                            { method: 'POST', path: '/api/ai-response', desc: 'Guardar respuesta del agente IA' },
                            { method: 'GET', path: '/api/conversations', desc: 'Listar conversaciones activas' },
                            { method: 'GET', path: '/api/contacts', desc: 'Listar y buscar contactos' },
                            { method: 'POST', path: '/api/contacts', desc: 'Crear nuevo contacto' },
                            { method: 'POST', path: '/api/webhook/whatsapp', desc: 'Webhook WhatsApp Cloud API' },
                        ].map((ep, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                                <span style={{
                                    fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px',
                                    background: ep.method === 'GET' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                                    color: ep.method === 'GET' ? '#10b981' : '#6366f1',
                                    flexShrink: 0, fontFamily: 'monospace'
                                }}>
                                    {ep.method}
                                </span>
                                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--brand-primary)', flexShrink: 0 }}>{ep.path}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1 }}>{ep.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
