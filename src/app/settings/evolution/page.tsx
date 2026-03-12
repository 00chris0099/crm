export default function EvolutionSettings() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Instancias Evolution API</h2>
         <button style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 500 }}>+ Nueva Instancia</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
         <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
               <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>crm-ventas-01</h3>
               <span style={{ color: 'var(--brand-success)', fontSize: '13px', fontWeight: 600 }}>Conectado</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Base URL</label>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>https://api.tu-evolution.com</div>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Línea Vinculada</label>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>+51 912 345 678</div>
                </div>
                <button style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer', marginTop: '8px', alignSelf: 'flex-start' }}>Editar Configuración</button>
            </div>
         </div>
      </div>
    </div>
  )
}