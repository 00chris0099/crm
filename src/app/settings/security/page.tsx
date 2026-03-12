export default function SecuritySettings() {
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
}