export default function EvolutionSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Configuración de Evolution API</h2>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
         <div className="space-y-4">
            <div>
                <label className="text-sm font-medium block mb-1">Base URL</label>
                <input type="url" placeholder="https://api.tu-evolution.com" className="w-full border p-2 rounded-lg" />
            </div>
            <div>
                <label className="text-sm font-medium block mb-1">API Key (Global)</label>
                <input type="password" placeholder="••••••••••••" className="w-full border p-2 rounded-lg" />
            </div>
            <div>
                <label className="text-sm font-medium block mb-1">Instance Name</label>
                <input type="text" placeholder="crm-instance" className="w-full border p-2 rounded-lg" />
            </div>
            <div className="pt-4 flex items-center space-x-4">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium">Conectar</button>
                <span className="text-gray-400 text-sm">Validar conexión con la API de Evolution</span>
            </div>
         </div>
      </div>
    </div>
  )
}