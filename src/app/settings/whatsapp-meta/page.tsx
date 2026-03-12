export default function WhatsAppMetaSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Configuración de WhatsApp Meta</h2>
      <div className="space-y-6">
         <div className="bg-white border p-6 rounded-xl shadow-sm">
            <h3 className="font-medium mb-4">Credenciales Cloud API</h3>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">App ID</label>
                  <input type="text" className="w-full border p-2 rounded-lg bg-gray-50 focus:bg-white transition" />
               </div>
               <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">App Secret</label>
                  <input type="password" className="w-full border p-2 rounded-lg bg-gray-50 focus:bg-white transition" />
               </div>
               <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Permanent Access Token</label>
                  <textarea className="w-full border p-2 rounded-lg bg-gray-50 focus:bg-white transition" rows={3}></textarea>
               </div>
            </div>
            <button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg">Probar y Guardar</button>
         </div>

         <div className="bg-indigo-50 text-indigo-900 border border-indigo-200 p-6 rounded-xl shadow-sm">
            <h3 className="font-medium mb-2">Webhook URL Configurada</h3>
            <code className="bg-white px-4 py-2 rounded-lg block text-sm mb-4">https://tu-dominio.com/api/webhooks/whatsapp/meta</code>
            <p className="text-sm mb-4">Asegúrate de configurar esta URL en el panel de desarrolladores de Meta.</p>
         </div>
      </div>
    </div>
  )
}