import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'E Beats CRM – Monitor de Agente IA WhatsApp',
    description: 'CRM especializado para monitorear conversaciones entre clientes y agentes de inteligencia artificial conectados a WhatsApp Cloud API.',
};

import Sidebar from '@/components/Sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className="dark">
            <body className={`${inter.variable} font-sans antialiased`}>
                <div className="crm-layout">
                    <Sidebar />
                    <div className="main-content">
                        {children}
                    </div>
                </div>
            </body>
        </html>
    );
}
