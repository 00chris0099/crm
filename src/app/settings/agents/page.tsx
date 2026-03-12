"use client";
import React, { useState } from 'react';

export default function AgentsSettings() {
  const [agents, setAgents] = useState([
    {
      id: 1,
      name: "Asistente de Ventas",
      type: "whatsapp_meta",
      webhookUrl: "https://aimachristian-n8n.ajcxjb.easypanel.host/webhook/ventas",
      status: "Activo"
    },
    {
      id: 2,
      name: "Bot de Soporte v1",
      type: "whatsapp_evolution",
      webhookUrl: "https://aimachristian-n8n.ajcxjb.easypanel.host/webhook/soporte",
      status: "Inactivo"
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [provider, setProvider] = useState('whatsapp_meta');
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Agentes IA y Canales</h2>
          <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 500 }}>+ Nuevo Agente IA</button>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>Crea agentes, elige si usarán la API oficial de Meta o Evolution, y configúrales el Webhook de n8n para que procesen los mensajes.</p>

      {/* Lista de Agentes */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
         <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Nombre del Agente</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Proveedor (Canal)</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Webhook Asignado (n8n)</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Acciones</th>
               </tr>
            </thead>
            <tbody>
              {agents.map(ag => (
               <tr key={ag.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>{ag.name}</td>
                  <td style={{ padding: '16px' }}>
                    {ag.type === 'whatsapp_meta' ? 
                       <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--brand-success)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Meta Cloud API</span> :
                       <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--brand-warning)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Evolution API</span>
                    }
                  </td>
                  <td style={{ padding: '16px', color: 'var(--brand-primary)', fontSize: '12px', fontFamily: 'monospace' }}>{ag.webhookUrl}</td>
                  <td style={{ padding: '16px' }}>
                     {ag.status === 'Activo' ? 
                       <span style={{ color: 'var(--brand-success)', fontWeight: 600, fontSize: '13px' }}>Activo</span> :
                       <span style={{ color: 'var(--text-disabled)', fontWeight: 600, fontSize: '13px' }}>Inactivo</span>
                     }
                  </td>
                  <td style={{ padding: '16px', display: 'flex', gap: '10px' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}>Editar</button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--brand-danger)', cursor: 'pointer', textDecoration: 'underline' }}>Eliminar</button>
                  </td>
               </tr>
              ))}
            </tbody>
         </table>
      </div>

      {/* Modal de Creación */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
           <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)' }}>
                 <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Crear Nuevo Agente IA</h3>
                 <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Nombre del Agente / Número</label>
                    <input type="text" placeholder="Ej: Agente Ventas - 51999888777" style={{ width: '100%', border: '1px solid var(--border-default)', padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }} />
                 </div>

                 <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Webhook URL de n8n</label>
                    <input type="url" placeholder="https://aimachristian-n8n.../webhook" style={{ width: '100%', border: '1px solid var(--brand-primary)', padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(99, 102, 241, 0.05)', color: 'var(--brand-primary)', outline: 'none', fontFamily: 'monospace' }} />
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Aquí el CRM enviará los mensajes para que este agente responda.</p>
                 </div>

                 <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Proveedor del Número</label>
                    <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ width: '100%', border: '1px solid var(--border-default)', padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}>
                       <option value="whatsapp_meta">WhatsApp Cloud API (Meta Oficial)</option>
                       <option value="whatsapp_evolution">Evolution API (Código QR)</option>
                    </select>
                 </div>

                 {provider === 'whatsapp_meta' && (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-success)' }}>Credenciales de Meta</h4>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Phone Number ID</label>
                        <input type="text" style={{ width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>App ID</label>
                        <input type="text" style={{ width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Permanent Access Token</label>
                        <input type="password" style={{ width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                   </div>
                 )}

                 {provider === 'whatsapp_evolution' && (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-warning)' }}>Credenciales de Evolution API</h4>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Base URL</label>
                        <input type="text" placeholder="https://api.tu-evolution.com" style={{ width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Instance Name</label>
                        <input type="text" style={{ width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Global API Key</label>
                        <input type="password" style={{ width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                   </div>
                 )}

                 <button onClick={() => setIsModalOpen(false)} style={{ marginTop: '10px', backgroundColor: 'var(--brand-primary)', color: 'white', padding: '12px 24px', borderRadius: 'var(--radius-md)', fontWeight: 600, border: 'none', cursor: 'pointer', textAlign: 'center' }}>Guardar Agente y Conectar</button>
              </div>
           </div>
        </div>
      )}

    </div>
  )
}