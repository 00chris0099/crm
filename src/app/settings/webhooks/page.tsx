export default function WebhooksSettings() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>Webhooks del CRM</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>Endpoints públicos de tu CRM para recibir eventos de plataformas externas.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
         <div style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
             <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Webhooks Meta (Cloud API)</h4>
             <code style={{ fontSize: '13px', color: 'var(--brand-success)', display: 'block', marginBottom: '4px' }}>GET https://aimachristian-crm.ajcxjb.easypanel.host/api/webhooks/whatsapp/meta (Verificación)</code>
             <code style={{ fontSize: '13px', color: 'var(--brand-primary)', display: 'block' }}>POST https://aimachristian-crm.ajcxjb.easypanel.host/api/webhooks/whatsapp/meta (Recepción)</code>
         </div>
         <div style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
             <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Webhooks Evolution API</h4>
             <code style={{ fontSize: '13px', color: 'var(--brand-primary)', display: 'block' }}>POST https://aimachristian-crm.ajcxjb.easypanel.host/api/webhooks/whatsapp/evolution</code>
         </div>
         <div style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
             <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Retorno de Respuestas IA (n8n -{'>'} CRM)</h4>
             <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Usa este endpoint en el nodo final de tus flujos de n8n para devolver la respuesta del agente al CRM.</p>
             <code style={{ fontSize: '13px', color: 'var(--brand-primary)', display: 'block' }}>POST https://aimachristian-crm.ajcxjb.easypanel.host/api/automation/n8n/agent-response</code>
         </div>
      </div>
    </div>
  )
}