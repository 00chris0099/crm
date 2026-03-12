const fs = require('fs');
const path = require('path');

const components = {
  'src/app/settings/layout.tsx': `"use client";
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
`,

  'src/app/settings/page.tsx': `export default function GeneralSettings() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>Configuración General</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '24px' 
        }}>
          <h3 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '16px', color: 'var(--text-primary)' }}>Información de la Organización</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <input type="text" placeholder="Nombre de la Compañía" style={{ 
                 width: '100%', 
                 border: '1px solid var(--border-default)', 
                 borderRadius: 'var(--radius-md)', 
                 padding: '10px 14px',
                 backgroundColor: 'var(--bg-elevated)',
                 color: 'var(--text-primary)',
                 outline: 'none'
             }} />
             <input type="email" placeholder="Correo Administrativo" style={{ 
                 width: '100%', 
                 border: '1px solid var(--border-default)', 
                 borderRadius: 'var(--radius-md)', 
                 padding: '10px 14px',
                 backgroundColor: 'var(--bg-elevated)',
                 color: 'var(--text-primary)',
                 outline: 'none'
             }} />
             <button style={{ 
                 backgroundColor: 'var(--brand-primary)', 
                 color: 'white', 
                 padding: '10px 24px', 
                 borderRadius: 'var(--radius-md)', 
                 fontWeight: 500, 
                 border: 'none', 
                 cursor: 'pointer',
                 width: 'fit-content',
                 marginTop: '8px'
             }}>Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  )
}`,

  'src/app/settings/channels/page.tsx': `export default function ChannelsSettings() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Canales Conectados</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Administra los canales de mensajería integrados a tu plataforma.</p>
          </div>
         <button style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 500 }}>+ Agregar Canal</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '16px' }}>
         <div style={{ 
             border: '1px solid rgba(16, 185, 129, 0.3)', 
             backgroundColor: 'rgba(16, 185, 129, 0.05)', 
             padding: '20px', 
             borderRadius: 'var(--radius-lg)', 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'space-between' 
         }}>
            <div>
               <h4 style={{ fontWeight: 600, color: 'var(--brand-success)', fontSize: '16px' }}>WhatsApp (Meta Webhook)</h4>
               <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Cloud API Oficial Integrada</p>
            </div>
            <span style={{ padding: '6px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--brand-success)', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600 }}>Cargado</span>
         </div>

         <div style={{ 
             border: '1px solid var(--border-subtle)', 
             backgroundColor: 'var(--bg-card)', 
             padding: '20px', 
             borderRadius: 'var(--radius-lg)', 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'space-between' 
         }}>
            <div>
               <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '16px' }}>Evolution API</h4>
               <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Instancia propia (Qrcode / Multi-device)</p>
            </div>
            <span style={{ padding: '6px 12px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600 }}>Inactivo</span>
         </div>
      </div>
    </div>
  )
}`,

  'src/app/settings/whatsapp-meta/page.tsx': `export default function WhatsAppMetaSettings() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>Configuración de WhatsApp Meta</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
         <div style={{ 
             backgroundColor: 'var(--bg-card)', 
             border: '1px solid var(--border-subtle)', 
             padding: '24px', 
             borderRadius: 'var(--radius-lg)' 
         }}>
            <h3 style={{ fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Credenciales Cloud API</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
               <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>App ID</label>
                  <input type="text" placeholder="Ej: 2988067561556366" style={{ 
                      width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none'
                  }} />
               </div>
               <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Phone Number ID</label>
                  <input type="text" placeholder="Ej: 1068909979635134" style={{ 
                      width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none'
                  }} />
               </div>
               <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Permanent Access Token</label>
                  <textarea rows={3} placeholder="EAAqdobGSSY4BQwp..." style={{ 
                      width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
                  }}></textarea>
               </div>
            </div>
            <button style={{ 
                marginTop: '20px', backgroundColor: 'var(--brand-primary)', color: 'white', fontWeight: 500, padding: '10px 24px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' 
            }}>Probar y Guardar</button>
         </div>

         <div style={{ 
             backgroundColor: 'rgba(99, 102, 241, 0.05)', 
             border: '1px solid rgba(99, 102, 241, 0.2)', 
             padding: '24px', 
             borderRadius: 'var(--radius-lg)' 
         }}>
            <h3 style={{ fontWeight: 600, color: 'var(--brand-secondary)', marginBottom: '8px' }}>Webhook URL Configurada</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Copia esta URL y pégala en el panel de desarrolladores de Meta (Webhooks).</p>
            
            <code style={{ 
                backgroundColor: 'var(--bg-elevated)', 
                padding: '12px 16px', 
                borderRadius: 'var(--radius-md)', 
                display: 'block', 
                fontSize: '14px', 
                fontFamily: 'monospace', 
                color: 'var(--brand-primary)',
                border: '1px dashed var(--border-strong)'
            }}>https://[tu-dominio]/api/webhooks/whatsapp/meta</code>
         </div>
      </div>
    </div>
  )
}`,

  'src/app/settings/evolution/page.tsx': `export default function EvolutionSettings() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>Configuración de Evolution API</h2>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Base URL</label>
                <input type="url" placeholder="https://api.tu-evolution.com" style={{ 
                    width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)'
                }} />
            </div>
            <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>API Key (Global)</label>
                <input type="password" placeholder="••••••••••••" style={{ 
                    width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)'
                }} />
            </div>
            <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Instance Name</label>
                <input type="text" placeholder="crm-instance" style={{ 
                    width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)'
                }} />
            </div>
            <div style={{ paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 24px', borderRadius: 'var(--radius-md)', fontWeight: 500, border: 'none', cursor: 'pointer' }}>Conectar Instancia</button>
            </div>
         </div>
      </div>
    </div>
  )
}`,

  'src/app/settings/automation/page.tsx': `export default function AutomationSettings() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>Integración n8n / Automatización</h2>
       <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
         <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px', lineHeight: 1.5 }}>
            El Inbound Orchestrator del CRM invocará al Webhook de n8n para delegar la respuesta a tu workflow IA cuando se reciban mensajes.
         </p>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Webhook URL n8n entrante</label>
                <input type="url" placeholder="https://aimachristian-n8n.ajcxjb.easypanel.host/webhook/..." defaultValue="https://aimachristian-n8n.ajcxjb.easypanel.host/webhook/17321a6d-1d65-429e-808c-5eebe4db066d/webhook" style={{ 
                    width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--brand-primary)', fontFamily: 'monospace'
                }} />
            </div>
            <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Timeout de espera (ms)</label>
                <input type="number" defaultValue={30000} style={{ 
                    width: '200px', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)'
                }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '8px' }}>
                <input type="checkbox" id="n8n_enabled" defaultChecked style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }} />
                <label htmlFor="n8n_enabled" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Habilitar delegación automática a n8n</label>
            </div>
            <button style={{ marginTop: '10px', backgroundColor: 'var(--brand-primary)', color: 'white', fontWeight: 500, padding: '10px 24px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', width: 'fit-content' }}>Guardar Cambios</button>
         </div>
      </div>
    </div>
  )
}`,

  'src/app/settings/agents/page.tsx': `export default function AgentsSettings() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Agentes IA</h2>
          <button style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 500 }}>+ Nuevo Agente</button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
         <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Rol / Tipo</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Acciones</th>
               </tr>
            </thead>
            <tbody>
               <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>Sales Assistant Pro</td>
                  <td style={{ padding: '16px' }}><span style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Ventas</span></td>
                  <td style={{ padding: '16px' }}><span style={{ color: 'var(--brand-success)', fontWeight: 600, fontSize: '13px' }}>Activo</span></td>
                  <td style={{ padding: '16px' }}><button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Configurar</button></td>
               </tr>
               <tr>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-disabled)' }}>Support Bot v1</td>
                  <td style={{ padding: '16px' }}><span style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Soporte</span></td>
                  <td style={{ padding: '16px' }}><span style={{ color: 'var(--text-disabled)', fontWeight: 600, fontSize: '13px' }}>Inactivo</span></td>
                  <td style={{ padding: '16px' }}><button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Configurar</button></td>
               </tr>
            </tbody>
         </table>
      </div>
    </div>
  )
}`,

  'src/app/settings/webhooks/page.tsx': `export default function WebhooksSettings() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>Webhooks del CRM</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>Aquí tienes todos los endpoints expuestos que puedes usar para registrar en plataformas externas.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
         <div style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
             <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Webhooks Meta (Cloud API)</h4>
             <code style={{ fontSize: '13px', color: 'var(--brand-success)', display: 'block', marginBottom: '8px' }}>GET /api/webhooks/whatsapp/meta (Verification)</code>
             <code style={{ fontSize: '13px', color: 'var(--brand-primary)', display: 'block' }}>POST /api/webhooks/whatsapp/meta (Events)</code>
         </div>
         <div style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
             <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Webhooks Evolution API</h4>
             <code style={{ fontSize: '13px', color: 'var(--brand-primary)', display: 'block' }}>POST /api/webhooks/whatsapp/evolution</code>
         </div>
         <div style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
             <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Retorno de Respuestas IA (n8n -> CRM)</h4>
             <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Usa este endpoint en n8n al finalizar tu pipeline para devolver la respuesta al cliente.</p>
             <code style={{ fontSize: '13px', color: 'var(--brand-primary)', display: 'block' }}>POST /api/automation/n8n/agent-response</code>
         </div>
      </div>
    </div>
  )
}`,

  'src/app/settings/security/page.tsx': `export default function SecuritySettings() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>Seguridad y Autenticación</h2>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
         <h3 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '20px', color: 'var(--text-primary)' }}>Tokens de Verificación</h3>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Meta Hub Verify Token (WHATSAPP_VERIFY_TOKEN)</label>
                <input type="password" defaultValue="my_verify_token" placeholder="Tu token secreto para verificación" style={{ 
                    width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none'
                }} />
             </div>
             <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>CRM API Secret (Webhook entrante desde n8n)</label>
                <input type="password" placeholder="Clave secreta opcional para firmar el endpoint de retorno" style={{ 
                    width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none'
                }} />
             </div>
             <button style={{ backgroundColor: 'var(--brand-danger)', color: 'white', padding: '10px 24px', borderRadius: 'var(--radius-md)', fontWeight: 500, border: 'none', cursor: 'pointer', width: 'fit-content', marginTop: '8px' }}>Actualizar Credenciales</button>
         </div>
      </div>
    </div>
  )
}`,

  'src/app/settings/status/page.tsx': `export default function StatusSettings() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>Estado del Sistema</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
         <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>API de Meta</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--brand-success)', marginTop: '8px' }}>Operativo</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Último ping hace 2 min</p>
         </div>
         <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Webhook n8n</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--brand-primary)', marginTop: '8px' }}>Conectado</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Respuesta prom. 1.2s</p>
         </div>
         <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evolution API</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-disabled)', marginTop: '8px' }}>Desactivado</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Faltan credenciales</p>
         </div>
      </div>
    </div>
  )
}`
};

Object.keys(components).forEach(filepath => {
  const fullPath = path.join(__dirname, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, components[filepath]);
  console.log('Updated UI: ' + filepath);
});
