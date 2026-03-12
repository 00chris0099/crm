export default function GeneralSettings() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>Configuración General</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '24px' 
        }}>
          <h3 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '16px', color: 'var(--text-primary)' }}>Información de la Organización</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <input type="text" placeholder="Nombre de la Compañía" style={{ 
                 width: '100%', 
                 border: '1px solid var(--border-default)', 
                 borderRadius: 'var(--radius-md)', 
                 padding: '10px 14px',
                 backgroundColor: 'var(--bg-elevated)',
                 color: 'var(--text-primary)',
                 outline: 'none'
             }} />
             <input type="email" placeholder="Correo Administrativo" style={{ 
                 width: '100%', 
                 border: '1px solid var(--border-default)', 
                 borderRadius: 'var(--radius-md)', 
                 padding: '10px 14px',
                 backgroundColor: 'var(--bg-elevated)',
                 color: 'var(--text-primary)',
                 outline: 'none'
             }} />
             <button style={{ 
                 backgroundColor: 'var(--brand-primary)', 
                 color: 'white', 
                 padding: '10px 24px', 
                 borderRadius: 'var(--radius-md)', 
                 fontWeight: 500, 
                 border: 'none', 
                 cursor: 'pointer',
                 width: 'fit-content',
                 marginTop: '8px'
             }}>Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  )
}