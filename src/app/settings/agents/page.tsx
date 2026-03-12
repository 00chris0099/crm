export default function AgentsSettings() {
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
}