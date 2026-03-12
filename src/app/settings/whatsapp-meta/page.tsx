export default function WhatsAppMetaSettings() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Cuentas de WhatsApp Meta</h2>
         <button style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 500 }}>+ Nueva App Meta</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
         {/* App Meta 1 */}
         <div style={{ 
             backgroundColor: 'var(--bg-card)', 
             border: '1px solid var(--border-subtle)', 
             padding: '24px', 
             borderRadius: 'var(--radius-lg)' 
         }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
               <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>App E-Beats Ventas</h3>
               <span style={{ color: 'var(--brand-success)', fontSize: '13px', fontWeight: 600 }}>Verificada</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
               <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>App ID</label>
                  <input type="text" defaultValue="2988067561556366" style={{ 
                      width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none'
                  }} />
               </div>
               <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Phone Number ID</label>
                  <input type="text" defaultValue="1068909979635134" style={{ 
                      width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none'
                  }} />
               </div>
               <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Permanent Access Token</label>
                  <input type="password" defaultValue="EAAqdobGSSY4BQwpVs..." style={{ 
                      width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none'
                  }} />
               </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
               <button style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', fontWeight: 500, padding: '8px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Probar Conexión</button>
               <button style={{ backgroundColor: 'transparent', color: 'var(--brand-danger)', fontWeight: 500, padding: '8px 16px', border: 'none', cursor: 'pointer' }}>Eliminar</button>
            </div>
         </div>

         <div style={{ 
             backgroundColor: 'rgba(99, 102, 241, 0.05)', 
             border: '1px solid rgba(99, 102, 241, 0.2)', 
             padding: '24px', 
             borderRadius: 'var(--radius-lg)' 
         }}>
            <h3 style={{ fontWeight: 600, color: 'var(--brand-secondary)', marginBottom: '8px' }}>Webhook Global para Meta</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Pega esta URL exacta en el panel de todos tus perfiles de Meta Cloud API.</p>
            
            <code style={{ 
                backgroundColor: 'var(--bg-elevated)', 
                padding: '12px 16px', 
                borderRadius: 'var(--radius-md)', 
                display: 'block', 
                fontSize: '14px', 
                fontFamily: 'monospace', 
                color: 'var(--brand-primary)',
                border: '1px dashed var(--border-strong)'
            }}>https://aimachristian-crm.ajcxjb.easypanel.host/api/webhooks/whatsapp/meta</code>
         </div>
      </div>
    </div>
  )
}