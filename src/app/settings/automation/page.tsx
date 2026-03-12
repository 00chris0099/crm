export default function AutomationSettings() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Workflows de n8n Conectados</h2>
         <button style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 500 }}>+ Vincular Workflow</button>
      </div>

       <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px', lineHeight: 1.5 }}>
          Puedes registrar múltiples Webhooks de n8n y asignarlos a diferentes agentes, canales o propósitos (ventas, soporte, calificación).
       </p>

       <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
         <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Nombre del Workflow</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>URL de Webhook (n8n)</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Acciones</th>
               </tr>
            </thead>
            <tbody>
               <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>Agente Principal de Ventas</td>
                  <td style={{ padding: '16px', color: 'var(--brand-primary)', fontSize: '12px', fontFamily: 'monospace' }}>https://aimachristian-n8n.../17321a.../webhook</td>
                  <td style={{ padding: '16px' }}><span style={{ color: 'var(--brand-success)', fontWeight: 600, fontSize: '13px' }}>En Uso</span></td>
                  <td style={{ padding: '16px' }}><button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}>Editar</button></td>
               </tr>
               <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>Flujo de Soporte Técnico</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'monospace' }}>https://aimachristian-n8n.../fb8w92.../webhook</td>
                  <td style={{ padding: '16px' }}><span style={{ color: 'var(--text-disabled)', fontWeight: 600, fontSize: '13px' }}>En Pausa</span></td>
                  <td style={{ padding: '16px' }}><button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}>Editar</button></td>
               </tr>
            </tbody>
         </table>
      </div>
    </div>
  )
}