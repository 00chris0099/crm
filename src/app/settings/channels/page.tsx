export default function ChannelsSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Canales Conectados</h2>
      <div className="flex justify-between items-center mb-6">
         <p className="text-gray-600">Administra los canales de mensajería integrados a tu plataforma.</p>
         <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">+ Agregar Canal</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="border border-green-200 bg-green-50 p-4 rounded-xl flex items-center justify-between">
            <div>
               <h4 className="font-semibold text-green-800">WhatsApp (Meta)</h4>
               <p className="text-sm text-green-700">Estado: Conectado</p>
            </div>
            <span className="p-2 bg-green-100 text-green-800 rounded-full text-xs">Activo</span>
         </div>
         <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-xl flex items-center justify-between">
            <div>
               <h4 className="font-semibold text-yellow-800">Evolution API</h4>
               <p className="text-sm text-yellow-700">Estado: Pendiente</p>
            </div>
            <span className="p-2 bg-yellow-100 text-yellow-800 rounded-full text-xs">Inactivo</span>
         </div>
      </div>
    </div>
  )
}