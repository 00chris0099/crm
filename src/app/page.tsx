'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import ConversationsView from '@/components/ConversationsView';
import ContactsView from '@/components/ContactsView';
import AnalyticsView from '@/components/AnalyticsView';
import DatabaseAdminView from '@/components/DatabaseAdminView';
import WhatsAppMonitorView from '@/components/WhatsAppMonitorView';

export type ViewType = 'dashboard' | 'conversations' | 'contacts' | 'analytics' | 'database' | 'whatsapp';

export default function CRMPage() {
    const [activeView, setActiveView] = useState<ViewType>('dashboard');

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView onNavigate={setActiveView} />;
            case 'conversations': return <ConversationsView />;
            case 'contacts': return <ContactsView />;
            case 'analytics': return <AnalyticsView />;
            case 'database': return <DatabaseAdminView />;
            case 'whatsapp': return <WhatsAppMonitorView />;
        }
    };

    return renderView();
}
