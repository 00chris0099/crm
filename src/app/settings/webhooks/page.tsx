export default function WebhooksSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Webhooks del CRM</h2>
      <p className="text-gray-600 mb-6">Aquí puedes visualizar las direcciones que debes registrar en plataformas externas.</p>
      
      <div className="space-y-4">
         <div className="border border-gray-200 p-4 rounded-xl bg-gray-50">
             <h4 className="font-semibold text-gray-800">Recibir mensajes de WhatsApp Meta</h4>
             <code className="text-sm font-mono text-indigo-700 mt-2 block">POST /api/webhooks/whatsapp/meta</code>
         </div>
         <div className="border border-gray-200 p-4 rounded-xl bg-gray-50">
             <h4 className="font-semibold text-gray-800">Recibir mensajes de Evolution API</h4>
             <code className="text-sm font-mono text-indigo-700 mt-2 block">POST /api/webhooks/whatsapp/evolution</code>
         </div>
         <div className="border border-gray-200 p-4 rounded-xl bg-gray-50">
             <h4 className="font-semibold text-gray-800">Recibir respuestas generadas por n8n/IA</h4>
             <code className="text-sm font-mono text-indigo-700 mt-2 block">POST /api/automation/n8n/agent-response</code>
         </div>
      </div>
    </div>
  )
}