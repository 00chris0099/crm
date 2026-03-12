const fs = require('fs');
const path = require('path');

const makeDir = (dir) => fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
const writeFile = (file, content) => fs.writeFileSync(path.join(__dirname, file), content);

// Layout for the new modules
const appLayoutPath = 'src/app/layout.tsx'; // Ensure they have the layout
// We will create the following routes:
// /integrations
// /channels
// /automations
// /agents
// /routing
// /inbox

const dirs = [
    'src/app/integrations',
    'src/app/channels',
    'src/app/automations',
    'src/app/agents',
    'src/app/routing',
    'src/app/inbox',
    'src/services',
    'src/repositories'
];
dirs.forEach(makeDir);

const sidebarCode = `'use client';
import { LayoutDashboard, MessageSquare, Box, Settings2, GitMerge, Bot, Inbox, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/inbox', icon: Inbox, label: 'Inbox / Chats' },
    { href: '/integrations', icon: Box, label: 'Integraciones' },
    { href: '/channels', icon: LinkIcon, label: 'Canales' },
    { href: '/automations', icon: Settings2, label: 'Automatizaciones' },
    { href: '/agents', icon: Bot, label: 'Agentes AI' },
    { href: '/routing', icon: GitMerge, label: 'Ruteo' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="sidebar" style={{ backgroundColor: 'var(--bg-surface)', width: '250px', borderRight: '1px solid var(--border-subtle)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h2 style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>E-Beats CRM</h2>
            </div>
            <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: 'var(--radius-md)', backgroundColor: pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/') ? 'var(--bg-active)' : 'transparent', color: pathname === item.href ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                            <item.icon size={20} />
                            <span style={{ fontWeight: 500, fontSize: '14px' }}>{item.label}</span>
                        </div>
                    </Link>
                ))}
            </nav>
        </div>
    );
}`;
writeFile('src/components/Sidebar.tsx', sidebarCode);

const rootLayout = `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'CRM Universal',
    description: 'Centralized Omni-channel CRM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className="dark">
            <body className={\`\${inter.variable} font-sans antialiased\`} style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
                <Sidebar />
                <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    {children}
                </main>
            </body>
        </html>
    );
}`;
writeFile('src/app/layout.tsx', rootLayout);

// Page stubs
const createPage = (title, desc) => \`export default function Page() {
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>\${title}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>\${desc}</p>
                </div>
                <button style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer', border: 'none' }}>+ Nuevo</button>
            </div>
            <div style={{ border: '1px dashed var(--border-strong)', padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Aún no hay registros creados. Comienza configurando tus servicios.</p>
            </div>
        </div>
    );
}\`;

writeFile('src/app/integrations/page.tsx', createPage('Integraciones', 'Múltiples conexiones hacia plataformas (Meta Cloud API, Evolution, etc.)'));
writeFile('src/app/channels/page.tsx', createPage('Canales', 'Administra tus números reales asociados a tus integraciones.'));
writeFile('src/app/automations/page.tsx', createPage('Automatizaciones', 'Conecta flujos de N8N y define webhooks para interacciones dinámicas.'));
writeFile('src/app/agents/page.tsx', createPage('Agentes IA', 'Agentes inteligentes que se alimentan de canales y automatizaciones.'));
writeFile('src/app/routing/page.tsx', createPage('Ruteo y Reglas', 'Prioridades y enrutamiento inteligente de canales entrantes.'));
writeFile('src/app/inbox/page.tsx', createPage('Bandeja Universal', 'Gestión de todos los chats. Entidad central del CRM.'));

// DB scaffold
const setupDbCode = \`
const { Pool } = require('pg');

const pool = new Pool({
    // Hardcoded global db just for the creation script during dev
    connectionString: 'postgres://crm_user:Mineria99*@187.77.57.116:5432/crm_db?sslmode=disable'
});

async function run() {
    await pool.query(\\\`
        CREATE TABLE IF NOT EXISTS integrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            provider VARCHAR(50) NOT NULL,
            account_id VARCHAR(255),
            config JSONB DEFAULT '{}',
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS automations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS automation_webhooks (
            id SERIAL PRIMARY KEY,
            automation_id INT REFERENCES automations(id) ON DELETE CASCADE,
            name VARCHAR(255),
            key_name VARCHAR(255),
            url VARCHAR(1024),
            method VARCHAR(10) DEFAULT 'POST',
            secret VARCHAR(255)
        );
    \\\`);
    console.log("Tablas base adicionales migradas en tu base existente!");
    process.exit(0);
}

run().catch(console.error);
\`;
writeFile('setupDb.js', setupDbCode);
