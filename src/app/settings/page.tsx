export default function GeneralSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Configuración General</h2>
      <div className="space-y-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition">
          <h3 className="font-medium text-lg mb-4">Información de la Organización</h3>
          <div className="space-y-4">
             <input type="text" placeholder="Nombre de la Compañía" className="w-full border rounded-lg px-4 py-2" />
             <input type="email" placeholder="Correo Administrativo" className="w-full border rounded-lg px-4 py-2" />
             <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  )
}