'use client';

import {
    LayoutDashboard,
    MessageSquare,
    Users,
    BarChart3,
    Settings,
    Bell,
    Zap,
    Database,
    MessageCircle,
} from 'lucide-react';
import { ViewType } from '@/app/page';
import Link from 'next/link';

interface SidebarProps {
    activeView?: ViewType;
    onNavigate?: (view: ViewType) => void;
}

const navItems = [
    { id: 'dashboard' as ViewType, href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'conversations' as ViewType, href: '/inbox', icon: MessageSquare, label: 'Inbox / Chats' },
    { id: 'integrations' as ViewType, href: '/integrations', icon: Settings, label: 'Integraciones' },
    { id: 'channels' as ViewType, href: '/channels', icon: MessageCircle, label: 'Canales' },
    { id: 'automations' as ViewType, href: '/automations', icon: Zap, label: 'Automatizaciones' },
    { id: 'agents' as ViewType, href: '/agents', icon: Users, label: 'Agentes AI' },
    { id: 'routing' as ViewType, href: '/routing', icon: Database, label: 'Ruteo' }
];

export default function Sidebar() {
    return (
        <div className="sidebar">
            <div className="sidebar-logo" title="E Beats Perú CRM">
                <Zap size={18} strokeWidth={2.5} />
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <div key={item.id} className="tooltip-wrap">
                        <Link href={item.href || '/'}>
                            <button
                                className={`sidebar-btn`}
                                aria-label={item.label}
                            >
                                <item.icon size={20} strokeWidth={1.8} />
                            </button>
                        </Link>
                        <div className="tooltip" style={{ left: '120%', top: '50%', transform: 'translateY(-50%)' }}>
                            {item.label}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="sidebar-divider" />

            {/* Bottom buttons */}
            <div className="sidebar-bottom">
                <div className="tooltip-wrap">
                    <button className="sidebar-btn" aria-label="Notificaciones">
                        <div style={{ position: 'relative' }}>
                            <Bell size={20} strokeWidth={1.8} />
                            <span className="notif-badge" />
                        </div>
                    </button>
                    <div className="tooltip" style={{ left: '120%', top: '50%', transform: 'translateY(-50%)' }}>
                        Notificaciones
                    </div>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
                    <div className="user-avatar" title="Admin">A</div>
                </div>
            </div>
        </div>
    );
}
