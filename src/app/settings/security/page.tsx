export default function SecuritySettings() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>Seguridad y Webhooks del CRM</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>Tus endpoints públicos y credenciales para plataformas externas.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
         <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
             <h3 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '20px', color: 'var(--text-primary)' }}>Tokens de Verificación Internos</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Meta Hub Verify Token (WHATSAPP_VERIFY_TOKEN)</label>
                    <input type="password" defaultValue="my_verify_token" placeholder="Tu token secreto para verificación" style={{ 
                        width: '100%', border: '1px solid var(--border-default)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none'
                    }} />
                 </div>
                 <button style={{ backgroundColor: 'var(--brand-danger)', color: 'white', padding: '10px 24px', borderRadius: 'var(--radius-md)', fontWeight: 500, border: 'none', cursor: 'pointer', width: 'fit-content', marginTop: '8px' }}>Actualizar Credenciales</button>
             </div>
         </div>

         <div style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
             <h3 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '20px', color: 'var(--text-primary)' }}>Rutas Exitosas del Webhook (Para configurar afuera)</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
                     <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px' }}>Webhook Base para Meta (Cloud API)</h4>
                     <code style={{ fontSize: '13px', color: 'var(--brand-success)', display: 'block', marginBottom: '4px' }}>GET https://aimachristian-crm.ajcxjb.easypanel.host/api/webhooks/whatsapp/meta</code>
                     <code style={{ fontSize: '13px', color: 'var(--brand-primary)', display: 'block' }}>POST https://aimachristian-crm.ajcxjb.easypanel.host/api/webhooks/whatsapp/meta</code>
                 </div>
                 <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
                     <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px' }}>Retorno desde n8n</h4>
                     <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Usa este endpoint en el último nodo HTTP de n8n para que el CRM devuelva el mensaje por WhatsApp.</p>
                     <code style={{ fontSize: '13px', color: 'var(--brand-primary)', display: 'block' }}>POST https://aimachristian-crm.ajcxjb.easypanel.host/api/automation/n8n/agent-response</code>
                 </div>
             </div>
         </div>
      </div>
    </div>
  )
}