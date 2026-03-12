export default function StatusSettings() {
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
}