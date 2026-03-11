'use client';

import { useState, useEffect } from 'react';
import {
    MessageSquare, Users, Zap, TrendingUp, ArrowUpRight, ArrowDownRight,
    Bot, Clock, BarChart2, RefreshCw, Send, Inbox, Flame, Thermometer, Snowflake
} from 'lucide-react';
import { ViewType } from '@/app/page';

interface DashboardViewProps {
    onNavigate: (view: ViewType) => void;
}

interface DashboardData {
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
    agentPerformance: Array<{ day: string; total_responses: number; avg_response_ms: number }>;
    topContacts: Array<{ name: string; phone: string; lead_status: string; avatar_color: string; message_count: number }>;
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard');
            const json = await res.json();
            setData(json);
            setLastRefresh(new Date());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Build 7-day chart data
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
        }));
    };

    const chartData = buildChartData();
    const maxTotal = Math.max(...chartData.map(d => d.total), 1);

    const statCards = data ? [
        {
            label: 'Conversaciones Activas',
            value: data.stats.active_conversations,
            icon: MessageSquare,
            color: '#6366f1',
            bg: 'rgba(99,102,241,0.1)',
            accent: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            change: '+12%',
            positive: true,
        },
        {
            label: 'Contactos Totales',
            value: data.stats.total_contacts,
            icon: Users,
            color: '#06b6d4',
            bg: 'rgba(6,182,212,0.1)',
            accent: 'linear-gradient(90deg, #06b6d4, #0891b2)',
            change: '+5 esta semana',
            positive: true,
        },
        {
            label: 'Mensajes IA Enviados',
            value: data.stats.total_ai_messages,
            icon: Bot,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.1)',
            accent: 'linear-gradient(90deg, #10b981, #059669)',
            change: `Hoy: ${data.stats.messages_sent_today}`,
            positive: true,
        },
        {
            label: 'Mensajes Recibidos',
            value: data.stats.total_user_messages,
            icon: Inbox,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.1)',
            accent: 'linear-gradient(90deg, #f59e0b, #d97706)',
            change: `Hoy: ${data.stats.messages_received_today}`,
            positive: true,
        },
        {
            label: 'Tasa de Respuesta',
            value: `${data.stats.response_rate}%`,
            icon: TrendingUp,
            color: '#8b5cf6',
            bg: 'rgba(139,92,246,0.1)',
            accent: 'linear-gradient(90deg, #8b5cf6, #6d28d9)',
            change: 'Últimos 30 días',
            positive: true,
        },
        {
            label: 'Tiempo Resp. Promedio',
            value: `${data.stats.avg_response_time}s`,
            icon: Clock,
            color: '#ec4899',
            bg: 'rgba(236,72,153,0.1)',
            accent: 'linear-gradient(90deg, #ec4899, #be185d)',
            change: 'Respuesta IA',
            positive: true,
        },
    ] : [];

    if (loading && !data) {
        return (
            <div className="dashboard-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Cargando dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-view">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Dashboard
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Monitoreo en tiempo real · Actualizado {timeAgo(lastRefresh.toISOString())}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div className="online-dot" />
                        <span style={{ fontSize: '12px', color: 'var(--brand-success)', fontWeight: '600' }}>Agente IA Activo</span>
                    </div>
                    <button className="btn btn-outline" onClick={fetchData}>
                        <RefreshCw size={14} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((card, i) => (
                    <div key={i} className="stat-card" style={{ '--card-accent': card.accent } as React.CSSProperties}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div className="stat-icon" style={{ background: card.bg }}>
                                <card.icon size={20} color={card.color} strokeWidth={1.8} />
                            </div>
                        </div>
                        <div>
                            <div className="stat-label">{card.label}</div>
                            <div className="stat-value">{card.value}</div>
                        </div>
                        <div className={`stat-change positive`}>
                            <ArrowUpRight size={12} />
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{card.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="charts-section">
                {/* Message Volume */}
                <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                            <div className="chart-title" style={{ marginBottom: '2px' }}>Volumen de Mensajes — Últimos 7 días</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mensajes de usuarios vs IA</div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--brand-primary)' }} />
                                Usuario
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} />
                                IA
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100px' }}>
                        {chartData.map((d, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', justifyContent: 'flex-end', height: '100%' }}>
                                    <div style={{ height: `${(d.ai / maxTotal) * 85}px`, background: 'linear-gradient(to top, #10b981, #06b6d4)', borderRadius: '3px 3px 0 0', minHeight: d.ai > 0 ? '4px' : '0', transition: 'height 0.5s ease', opacity: 0.9 }} />
                                    <div style={{ height: `${(d.user / maxTotal) * 85}px`, background: 'linear-gradient(to top, #6366f1, #8b5cf6)', borderRadius: '3px 3px 0 0', minHeight: d.user > 0 ? '4px' : '0', transition: 'height 0.5s ease', opacity: 0.9 }} />
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>{d.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lead Distribution */}
                <div className="chart-card">
                    <div className="chart-title">Distribución de Leads</div>
                    {data && (
                        <div className="lead-donut">
                            <svg width="90" height="90" viewBox="0 0 90 90" className="donut-svg">
                                {(() => {
                                    const total = data.stats.hot_leads + data.stats.warm_leads + data.stats.cold_leads || 1;
                                    const r = 32;
                                    const circ = 2 * Math.PI * r;
                                    const hotPct = data.stats.hot_leads / total;
                                    const warmPct = data.stats.warm_leads / total;
                                    const coldPct = data.stats.cold_leads / total;
                                    const hotDash = hotPct * circ;
                                    const warmDash = warmPct * circ;
                                    const coldDash = coldPct * circ;
                                    const hotOffset = 0;
                                    const warmOffset = -hotDash;
                                    const coldOffset = -(hotDash + warmDash);
                                    return (
                                        <g transform="rotate(-90 45 45)">
                                            <circle cx="45" cy="45" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="14" />
                                            <circle cx="45" cy="45" r={r} fill="none" stroke="#ef4444" strokeWidth="14"
                                                strokeDasharray={`${hotDash} ${circ - hotDash}`} strokeDashoffset={hotOffset} />
                                            <circle cx="45" cy="45" r={r} fill="none" stroke="#f59e0b" strokeWidth="14"
                                                strokeDasharray={`${warmDash} ${circ - warmDash}`} strokeDashoffset={warmOffset} />
                                            <circle cx="45" cy="45" r={r} fill="none" stroke="#06b6d4" strokeWidth="14"
                                                strokeDasharray={`${coldDash} ${circ - coldDash}`} strokeDashoffset={coldOffset} />
                                        </g>
                                    );
                                })()}
                                <text x="45" y="48" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text-primary)">
                                    {data.stats.total_contacts}
                                </text>
                            </svg>
                            <div className="lead-legend">
                                <div className="legend-item">
                                    <Flame size={12} color="#ef4444" />
                                    <span>Caliente</span>
                                    <span className="legend-value">{data.stats.hot_leads}</span>
                                </div>
                                <div className="legend-item">
                                    <Thermometer size={12} color="#f59e0b" />
                                    <span>Tibio</span>
                                    <span className="legend-value">{data.stats.warm_leads}</span>
                                </div>
                                <div className="legend-item">
                                    <Snowflake size={12} color="#06b6d4" />
                                    <span>Frío</span>
                                    <span className="legend-value">{data.stats.cold_leads}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Top Contacts */}
                <div className="chart-card">
                    <div className="section-header">
                        <div className="chart-title">Top Contactos por Actividad</div>
                        <button className="btn btn-ghost" style={{ fontSize: '12px', color: 'var(--brand-primary)', padding: '4px 8px' }} onClick={() => onNavigate('contacts')}>
                            Ver todos →
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data?.topContacts.map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</div>
                                <div className="contact-avatar" style={{ background: c.avatar_color, width: '32px', height: '32px', fontSize: '12px' }}>
                                    {getInitials(c.name)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.message_count} mensajes</div>
                                </div>
                                <span className={`lead-badge ${c.lead_status}`}>{c.lead_status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Agent Performance */}
                <div className="chart-card">
                    <div className="chart-title" style={{ marginBottom: '16px' }}>Rendimiento del Agente IA</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { label: 'Tasa de Respuesta', value: `${data?.stats.response_rate ?? 0}%`, color: '#10b981', pct: data?.stats.response_rate ?? 0 },
                            { label: 'Conversaciones Activas', value: `${data?.stats.active_conversations ?? 0}`, color: '#6366f1', pct: Math.min(((data?.stats.active_conversations ?? 0) / 10) * 100, 100) },
                            { label: 'Leads Calientes', value: `${data?.stats.hot_leads ?? 0}`, color: '#ef4444', pct: Math.min(((data?.stats.hot_leads ?? 0) / (data?.stats.total_contacts || 1)) * 100, 100) },
                        ].map((item, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    <span>{item.label}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onNavigate('conversations')}>
                            <MessageSquare size={14} />
                            Ver Chats
                        </button>
                        <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onNavigate('analytics')}>
                            <BarChart2 size={14} />
                            Analítica
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
