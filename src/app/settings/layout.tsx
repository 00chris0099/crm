"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { label: "General", href: "/settings" },
    { label: "Agentes IA (Conexiones)", href: "/settings/agents" },
    { label: "Seguridad y Webhooks", href: "/settings/security" }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-inter)' }}>
      {/* Sidebar de Configuración */}
      <div style={{ 
        width: '260px', 
        backgroundColor: 'var(--bg-surface)', 
        borderRight: '1px solid var(--border-subtle)', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        position: 'fixed' 
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
           <h1 style={{ 
               fontSize: '20px', 
               fontWeight: 'bold', 
               background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))', 
               WebkitBackgroundClip: 'text', 
               WebkitTextFillColor: 'transparent',
               margin: 0
           }}>Configuración</h1>
           <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Plataforma de Integración</p>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {links.map(l => {
            const isActive = pathname === l.href;
            return (
              <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
                <div style={{ 
                    padding: '10px 16px', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '14px', 
                    fontWeight: 500, 
                    transition: 'all var(--transition-fast)',
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    borderLeft: isActive ? '3px solid var(--brand-primary)' : '3px solid transparent'
                }}
                onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
                onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
                >
                  {l.label}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Contenido Principal */}
      <div style={{ flex: 1, marginLeft: '260px', padding: '40px', overflowY: 'auto', maxHeight: '100vh' }}>
        <div style={{ 
            maxWidth: '900px', 
            margin: '0 auto', 
        }}>
           {children}
        </div>
      </div>
    </div>
  )
}
