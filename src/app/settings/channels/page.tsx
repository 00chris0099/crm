export default function ChannelsSettings() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Líneas y Canales</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Administra múltiples números de WhatsApp (Meta y Evolution).</p>
          </div>
         <button style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 500 }}>+ Agregar Canal</button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
         <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Identificador / Número</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Proveedor</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Agente Asignado</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Acciones</th>
               </tr>
            </thead>
            <tbody>
               <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>+51 987 654 321<br/><span style={{fontSize: '11px', color: 'var(--text-muted)'}}>Soporte General</span></td>
                  <td style={{ padding: '16px' }}><span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--brand-success)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>WhatsApp Meta</span></td>
                  <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '13px' }}>Support Bot v1</td>
                  <td style={{ padding: '16px' }}><span style={{ color: 'var(--brand-success)', fontWeight: 600, fontSize: '13px' }}>Conectado</span></td>
                  <td style={{ padding: '16px' }}><button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Editar</button></td>
               </tr>
               <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>+51 912 345 678<br/><span style={{fontSize: '11px', color: 'var(--text-muted)'}}>Ventas Lima</span></td>
                  <td style={{ padding: '16px' }}><span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--brand-warning)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Evolution API</span></td>
                  <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '13px' }}>Sales Assistant Pro</td>
                  <td style={{ padding: '16px' }}><span style={{ color: 'var(--brand-success)', fontWeight: 600, fontSize: '13px' }}>Conectado</span></td>
                  <td style={{ padding: '16px' }}><button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Editar</button></td>
               </tr>
               <tr>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>+51 999 888 777<br/><span style={{fontSize: '11px', color: 'var(--text-muted)'}}>Sin IA (Humano)</span></td>
                  <td style={{ padding: '16px' }}><span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--brand-warning)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Evolution API</span></td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>- Ninguno -</td>
                  <td style={{ padding: '16px' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Inactivo</span></td>
                  <td style={{ padding: '16px' }}><button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Conectar</button></td>
               </tr>
            </tbody>
         </table>
      </div>
    </div>
  )
}