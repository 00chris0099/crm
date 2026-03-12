export default function StatusSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Estado del Sistema</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white border rounded-xl p-6 shadow-sm text-center">
            <h3 className="text-gray-500 text-sm font-medium uppercase">API de Meta</h3>
            <div className="text-2xl font-bold text-green-600 mt-2">Conectado</div>
            <p className="text-xs text-gray-400 mt-2">Último ping hace 2 min</p>
         </div>
         <div className="bg-white border rounded-xl p-6 shadow-sm text-center">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Webhook n8n</h3>
            <div className="text-2xl font-bold text-indigo-600 mt-2">Operativo</div>
            <p className="text-xs text-gray-400 mt-2">Respuesta en ~1.2s</p>
         </div>
         <div className="bg-white border rounded-xl p-6 shadow-sm text-center">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Evolution API</h3>
            <div className="text-2xl font-bold text-gray-400 mt-2">Desactivado</div>
            <p className="text-xs text-gray-400 mt-2">Faltan credenciales</p>
         </div>
      </div>
    </div>
  )
}