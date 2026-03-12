export default function AutomationSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Integración n8n / Automatización</h2>
       <div className="bg-white border rounded-xl p-6 shadow-sm">
         <p className="text-gray-600 mb-6">El CRM invocará este Webhook de n8n para delegar la respuesta al agente de IA cuando sea elegible.</p>
         <div className="space-y-4">
            <div>
                <label className="text-sm font-medium block mb-1">Webhook URL n8n entrante</label>
                <input type="url" placeholder="https://n8n.tu-dominio.com/webhook/crm-inbound" className="w-full border p-2 rounded-lg font-mono text-sm" />
            </div>
            <div>
                <label className="text-sm font-medium block mb-1">Timeout de espera (ms)</label>
                <input type="number" defaultValue={30000} className="w-full border p-2 rounded-lg max-w-xs" />
            </div>
            <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="n8n_enabled" className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="n8n_enabled">Habilitar delegación automática a n8n</label>
            </div>
            <button className="mt-4 bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-indigo-700">Guardar Cambios</button>
         </div>
      </div>
    </div>
  )
}