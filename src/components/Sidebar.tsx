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

interface SidebarProps {
    activeView: ViewType;
    onNavigate: (view: ViewType) => void;
}

const navItems = [
    { id: 'dashboard' as ViewType, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'conversations' as ViewType, icon: MessageSquare, label: 'Conversaciones' },
    { id: 'contacts' as ViewType, icon: Users, label: 'Contactos' },
    { id: 'analytics' as ViewType, icon: BarChart3, label: 'Analítica' },
    { id: 'database' as ViewType, icon: Database, label: 'Database Admin' },
    { id: 'whatsapp' as ViewType, icon: MessageCircle, label: 'WhatsApp Monitor' },
];

export default function Sidebar({ activeView, onNavigate }: SidebarProps) {
    return (
        <div className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo" title="E Beats Perú CRM">
                <Zap size={18} strokeWidth={2.5} />
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <div key={item.id} className="tooltip-wrap">
                        <button
                            className={`sidebar-btn ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => onNavigate(item.id)}
                            aria-label={item.label}
                        >
                            <item.icon size={20} strokeWidth={1.8} />
                        </button>
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
                <div className="tooltip-wrap">
                    <button className="sidebar-btn" aria-label="Configuración">
                        <Settings size={20} strokeWidth={1.8} />
                    </button>
                    <div className="tooltip" style={{ left: '120%', top: '50%', transform: 'translateY(-50%)' }}>
                        Configuración
                    </div>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
                    <div className="user-avatar" title="Admin">A</div>
                </div>
            </div>
        </div>
    );
}
