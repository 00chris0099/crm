export default function AgentsSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Configuración de Agentes IA</h2>
      <div className="flex justify-end mb-4">
         <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium">+ Nuevo Agente</button>
      </div>
      <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
         <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
               <tr>
                  <th className="p-4 font-medium text-gray-500">Nombre</th>
                  <th className="p-4 font-medium text-gray-500">Tipo</th>
                  <th className="p-4 font-medium text-gray-500">Estado</th>
                  <th className="p-4 font-medium text-gray-500">Acciones</th>
               </tr>
            </thead>
            <tbody>
               <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">Sales Assistant Pro</td>
                  <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Ventas</span></td>
                  <td className="p-4"><span className="text-green-600 font-medium">Activo</span></td>
                  <td className="p-4"><button className="text-indigo-600 underline">Editar</button></td>
               </tr>
               <tr className="hover:bg-gray-50">
                  <td className="p-4 font-medium">Support Bot v1</td>
                  <td className="p-4"><span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Soporte</span></td>
                  <td className="p-4"><span className="text-gray-400 font-medium">Inactivo</span></td>
                  <td className="p-4"><button className="text-indigo-600 underline">Editar</button></td>
               </tr>
            </tbody>
         </table>
      </div>
    </div>
  )
}