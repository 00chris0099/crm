export default function SecuritySettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Seguridad y Autenticación</h2>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
         <h3 className="font-medium text-lg mb-4">Tokens de Verificación</h3>
         <div className="space-y-4">
             <div>
                <label className="text-sm font-medium block mb-1">Meta Hub Verify Token</label>
                <input type="password" placeholder="Tu token secreto para verificación" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
             </div>
             <div>
                <label className="text-sm font-medium block mb-1">CRM API Secret (Para respuestas desde n8n)</label>
                <input type="password" placeholder="Clave secreta que n8n debe enviar en cabecera" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
             </div>
             <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition">Actualizar Credenciales</button>
         </div>
      </div>
    </div>
  )
}