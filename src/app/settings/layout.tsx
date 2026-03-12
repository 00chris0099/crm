"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { label: "General", href: "/settings" },
    { label: "Canales", href: "/settings/channels" },
    { label: "WhatsApp Meta", href: "/settings/whatsapp-meta" },
    { label: "Evolution API", href: "/settings/evolution" },
    { label: "n8n / Automatización", href: "/settings/automation" },
    { label: "Agentes IA", href: "/settings/agents" },
    { label: "Webhooks", href: "/settings/webhooks" },
    { label: "Seguridad", href: "/settings/security" },
    { label: "Estado", href: "/settings/status" },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen text-gray-900">
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col h-screen fixed">
        <div className="p-6 border-b border-gray-100">
           <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Configuración</h1>
           <p className="text-sm text-gray-400 mt-1">Plataforma de Integración</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}>
              <div className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === l.href ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                {l.label}
              </div>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1 p-8 ml-64 overflow-y-auto max-h-screen">
        <div className="max-w-5xl mx-auto backdrop-blur-sm bg-white/50 border border-gray-100 p-8 rounded-2xl shadow-xl">
           {children}
        </div>
      </div>
    </div>
  )
}
