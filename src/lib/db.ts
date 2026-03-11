import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'crm.db');

let db: Database.Database;

export function getDb(): Database.Database {
    if (!db) {
        if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR, { recursive: true });
        }
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initializeSchema(db);
        seedDemoData(db);
    }
    return db;
}

function initializeSchema(db: Database.Database) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      wa_id TEXT NOT NULL UNIQUE,
      email TEXT,
      company TEXT,
      lead_status TEXT DEFAULT 'frio' CHECK(lead_status IN ('frio','tibio','caliente')),
      notes TEXT,
      first_contact_date TEXT DEFAULT (datetime('now')),
      last_activity TEXT DEFAULT (datetime('now')),
      avatar_color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      wa_conversation_id TEXT UNIQUE,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','closed','pending')),
      channel TEXT DEFAULT 'whatsapp',
      assigned_agent TEXT DEFAULT 'AI Agent',
      unread_count INTEGER DEFAULT 0,
      last_message TEXT,
      last_message_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      wa_message_id TEXT UNIQUE,
      content TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user','ai','system')),
      status TEXT DEFAULT 'delivered' CHECK(status IN ('sent','delivered','read','failed')),
      message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text','image','audio','video','document','location')),
      media_url TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      metadata TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agents_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT DEFAULT 'AI Agent',
      action TEXT NOT NULL,
      contact_id INTEGER,
      conversation_id INTEGER,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      response_time_ms INTEGER DEFAULT 0,
      success INTEGER DEFAULT 1,
      error_message TEXT,
      metadata TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS whatsapp_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone_number TEXT NOT NULL UNIQUE,
      phone_number_id TEXT UNIQUE,
      waba_id TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','error')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  `);
}

function seedDemoData(db: Database.Database) {
    const count = db.prepare('SELECT COUNT(*) as c FROM contacts').get() as { c: number };
    if (count.c > 0) return;

    const contacts = [
        { name: 'Carlos Rodríguez', phone: '+51987654321', wa_id: '51987654321', email: 'carlos@techbiz.pe', company: 'TechBiz SAC', lead_status: 'caliente', notes: 'Muy interesado en automatización de ventas', avatar_color: '#f59e0b' },
        { name: 'María González', phone: '+51976543210', wa_id: '51976543210', email: 'maria@ecomm.pe', company: 'E-Commerce Perú', lead_status: 'tibio', notes: 'Quiere demo de chatbot', avatar_color: '#ec4899' },
        { name: 'Luis Torres', phone: '+51965432109', wa_id: '51965432109', email: 'luis@inmob.pe', company: 'Inmobiliaria Torres', lead_status: 'frio', notes: 'Primer contacto, pendiente seguimiento', avatar_color: '#06b6d4' },
        { name: 'Ana Pérez', phone: '+51954321098', wa_id: '51954321098', email: 'ana@clinica.pe', company: 'Clínica Dental Sonrisa', lead_status: 'caliente', notes: 'Lista para contratar, espera propuesta formal', avatar_color: '#10b981' },
        { name: 'Roberto Huamán', phone: '+51943210987', wa_id: '51943210987', email: 'roberto@gym.pe', company: 'FitGym Lima', lead_status: 'tibio', notes: 'Interesado en chatbot para citas', avatar_color: '#8b5cf6' },
        { name: 'Sofía Vargas', phone: '+51932109876', wa_id: '51932109876', email: 'sofia@restaurante.pe', company: 'Restaurante El Sabor', lead_status: 'frio', notes: '', avatar_color: '#ef4444' },
        { name: 'Diego Mamani', phone: '+51921098765', wa_id: '51921098765', email: 'diego@transporte.pe', company: 'Transporte Rápido SRL', lead_status: 'tibio', notes: 'Busca automatizar logística', avatar_color: '#f97316' },
        { name: 'Valentina Cruz', phone: '+51910987654', wa_id: '51910987654', email: 'valen@moda.pe', company: 'Moda Lima', lead_status: 'caliente', notes: 'Quiere catálogo por WhatsApp', avatar_color: '#a855f7' },
    ];

    const insertContact = db.prepare(`
    INSERT INTO contacts (name, phone, wa_id, email, company, lead_status, notes, avatar_color, first_contact_date, last_activity)
    VALUES (@name, @phone, @wa_id, @email, @company, @lead_status, @notes, @avatar_color, @first_contact_date, @last_activity)
  `);

    const insertConv = db.prepare(`
    INSERT INTO conversations (contact_id, wa_conversation_id, status, last_message, last_message_at)
    VALUES (@contact_id, @wa_conversation_id, @status, @last_message, @last_message_at)
  `);

    const insertMsg = db.prepare(`
    INSERT INTO messages (conversation_id, contact_id, content, role, status, timestamp)
    VALUES (@conversation_id, @contact_id, @content, @role, @status, @timestamp)
  `);

    const conversationData = [
        {
            messages: [
                { role: 'user', content: 'Hola! Vi su anuncio sobre automatización con IA, me interesa mucho para mi empresa.', hoursAgo: 48 },
                { role: 'ai', content: '¡Hola Carlos! 👋 Soy el asistente de E Beats Perú. Con gusto te cuento sobre nuestras soluciones de automatización. ¿En qué área de tu empresa te gustaría implementar IA?', hoursAgo: 47.9 },
                { role: 'user', content: 'Principalmente en ventas y atención al cliente. Tenemos un equipo de 5 personas y queremos optimizar el proceso.', hoursAgo: 47 },
                { role: 'ai', content: 'Perfecto Carlos 🎯 Para un equipo de ventas de 5 personas, nuestro chatbot con IA puede:\n\n✅ Calificar leads automáticamente\n✅ Responder consultas 24/7\n✅ Agendar reuniones\n✅ Enviar seguimientos automáticos\n\n¿Te gustaría una demo personalizada esta semana?', hoursAgo: 46.8 },
                { role: 'user', content: 'Sí, me interesa mucho la demo. ¿Cuándo tienen disponibilidad?', hoursAgo: 46 },
                { role: 'ai', content: 'Tenemos disponibilidad el miércoles y jueves de esta semana. ¿Cuál te viene mejor, mañana miércoles a las 10am o el jueves a las 3pm? 📅', hoursAgo: 45.9 },
                { role: 'user', content: 'El jueves a las 3pm perfecto!', hoursAgo: 45 },
                { role: 'ai', content: '¡Excelente! 🎉 Quedamos para el jueves a las 3pm. Te enviaré el link de la videollamada por este mismo WhatsApp. ¿Algo más en lo que pueda ayudarte?', hoursAgo: 44.9 },
            ],
            status: 'active',
        },
        {
            messages: [
                { role: 'user', content: 'Buenos días! Quiero información sobre chatbots para mi tienda online.', hoursAgo: 24 },
                { role: 'ai', content: '¡Buenos días María! 😊 Claro, te explico. Para tiendas online, nuestros chatbots pueden gestionar:\n\n🛒 Consultas de productos\n📦 Seguimiento de pedidos\n💬 Atención postventa\n\n¿Cuántos mensajes recibes aproximadamente por día?', hoursAgo: 23.9 },
                { role: 'user', content: 'Como unos 50-80 mensajes diarios, es bastante para manejar manual.', hoursAgo: 23 },
                { role: 'ai', content: 'Con ese volumen, un chatbot sería perfecto para ti María. Podríamos automatizar hasta el 80% de esas consultas, liberando tiempo para que te enfoques en lo estratégico. ¿Quieres que te prepare una propuesta?', hoursAgo: 22.8 },
                { role: 'user', content: 'Sí por favor, ¿cuánto costaría más o menos?', hoursAgo: 22 },
                { role: 'ai', content: 'Los planes empiezan desde $150/mes con soporte, instalación y mantenimiento incluido. Te preparo una propuesta detallada con el plan que mejor se adapte a tu negocio. ¿Me puedes compartir tu correo para enviártela?', hoursAgo: 21.9 },
            ],
            status: 'active',
        },
        {
            messages: [
                { role: 'user', content: 'Hola, vi que hacen automatizaciones. ¿Sirve para inmobiliarias?', hoursAgo: 72 },
                { role: 'ai', content: 'Hola Luis! Claro que sí 🏠 Para inmobiliarias, nuestras soluciones son ideales:\n\n• Clasificar clientes por tipo de propiedad buscada\n• Enviar fichas técnicas automáticamente\n• Agendar visitas\n• Seguimiento de prospectos\n\n¿Tienes alguna necesidad específica?', hoursAgo: 71.9 },
                { role: 'user', content: 'Ok gracias, lo voy a pensar.', hoursAgo: 71 },
                { role: 'ai', content: 'Perfecto Luis, sin problemas. Cuando estés listo, aquí estamos. Te comparto nuestra página por si quieres ver casos de éxito: ebeats.pe 👍', hoursAgo: 70.9 },
            ],
            status: 'pending',
        },
        {
            messages: [
                { role: 'user', content: 'Buenas tardes, necesito un chatbot para mi clínica dental urgente.', hoursAgo: 6 },
                { role: 'ai', content: '¡Buenas tardes Ana! 🦷 Para clínicas dentales tenemos una solución especializada que incluye:\n\n✅ Agendamiento de citas 24/7\n✅ Recordatorios automáticos\n✅ Confirmación por WhatsApp\n✅ Post-consulta y seguimiento\n\n¿Cuántos pacientes atienden por mes aproximadamente?', hoursAgo: 5.9 },
                { role: 'user', content: 'Atendemos como 200 pacientes al mes, y el 60% agenda por WhatsApp.', hoursAgo: 5 },
                { role: 'ai', content: 'Wow, 200 pacientes con 60% por WhatsApp es un caso perfecto para automatizar Ana. Con nuestro sistema:\n\n📅 Las citas se agendan solas\n⏰ Recordatorios automáticos = menos inasistencias\n💬 Tu equipo solo ve casos complejos\n\n¿Podemos hacer una llamada esta tarde para cerrar detalles?', hoursAgo: 4.8 },
                { role: 'user', content: 'Perfecto! A las 5pm estoy disponible.', hoursAgo: 4 },
                { role: 'ai', content: '¡Agendado a las 5pm! 📞 Te llamaré al +51954321098. Mientras, te comparto nuestro caso de éxito con otra clínica dental que redujo sus inasistencias en 40%. ¡Hasta las 5!', hoursAgo: 3.9 },
                { role: 'user', content: 'Excelente, espero la llamada. Ya estoy convencida de que esto es lo que necesitamos.', hoursAgo: 2 },
                { role: 'ai', content: '¡Genial Ana! 🎉 En un momento te llamo. Vamos a transformar la gestión de tu clínica. ¡Hasta pronto!', hoursAgo: 1.9 },
            ],
            status: 'active',
        },
        {
            messages: [
                { role: 'user', content: 'Hola! Vi su anuncio en Instagram. ¿Hacen chatbots para gimnasios?', hoursAgo: 12 },
                { role: 'ai', content: 'Hola Roberto! 💪 Sí, tenemos experiencia con gimnasios. Podemos automatizar:\n\n• Inscripciones y renovaciones\n• Horarios de clases\n• Consultas de planes\n• Seguimiento de miembros inactivos\n\n¿Cuántos miembros tiene tu gimnasio?', hoursAgo: 11.9 },
                { role: 'user', content: 'Como 300 miembros activos. El problema es que tardamos mucho en responder consultas.', hoursAgo: 11 },
                { role: 'ai', content: 'Con 300 miembros, un chatbot es exactamente lo que necesitas Roberto. Respuestas instantáneas, clasificación de consultas y derivación de casos urgentes. ¿Te mando más información?', hoursAgo: 10.9 },
                { role: 'user', content: 'Dale, manda más info por favor.', hoursAgo: 10 },
                { role: 'ai', content: 'Te comparto nuestro catálogo completo 📄 y también un video demo de cómo funciona con gimnasios. ¿Cuál es tu correo para enviarte la propuesta formal?', hoursAgo: 9.9 },
            ],
            status: 'active',
        },
        {
            messages: [
                { role: 'user', content: 'Quiero automatizar los pedidos de mi restaurante por WhatsApp', hoursAgo: 96 },
                { role: 'ai', content: 'Hola Sofía! 🍽️ Para restaurantes, podemos automatizar:\n\n• Toma de pedidos y pagos\n• Menú digital interactivo\n• Estado del pedido en tiempo real\n• Reservas de mesa\n\n¿Atienden delivery o solo en local?', hoursAgo: 95.9 },
                { role: 'user', content: 'Tenemos los dos, delivery y local.', hoursAgo: 95 },
                { role: 'ai', content: 'Perfecto Sofía! Un sistema integrado para ambos canales es completamente factible. ¿Cuántos pedidos por día manejan aproximadamente?', hoursAgo: 94.9 },
            ],
            status: 'pending',
        },

        {
            messages: [
                { role: 'user', content: 'Buenos días, busco automatizar el seguimiento de mis envíos por WhatsApp', hoursAgo: 36 },
                { role: 'ai', content: '¡Hola Diego! 🚚 Para transporte y logística, podemos implementar:\n\n• Tracking de envíos en tiempo real\n• Notificaciones automáticas al cliente\n• Confirmación de entrega\n• Gestión de reclamos\n\n¿Cuántos envíos manejan al día?', hoursAgo: 35.9 },
                { role: 'user', content: 'Unos 150-200 envíos diarios.', hoursAgo: 35 },
                { role: 'ai', content: 'Con ese volumen Diego, el ahorro en tiempo y errores sería significativo. Te propongo una integración con tu sistema de gestión actual. ¿Con qué software trabajan?', hoursAgo: 34.9 },
                { role: 'user', content: 'Usamos Excel principalmente, nada muy sofisticado.', hoursAgo: 34 },
                { role: 'ai', content: '¡Perfecto! Podemos partir desde Excel y migrar a una solución más robusta. Te presento un plan por fases que no interrumpe tus operaciones. ¿Cuándo podemos hablar 15 min?', hoursAgo: 33.9 },
            ],
            status: 'active',
        },
        {
            messages: [
                { role: 'user', content: 'Hola! Quiero enviar mi catálogo de ropa por WhatsApp de forma automática', hoursAgo: 3 },
                { role: 'ai', content: '¡Hola Valentina! 👗 ¡Excelente idea! Un catálogo interactivo por WhatsApp puede:\n\n• Mostrar productos por categoría\n• Recibir pedidos automáticamente\n• Procesar pagos con links de pago\n• Notificar disponibilidad de stock\n\n¿Cuántos productos tiene tu catálogo?', hoursAgo: 2.9 },
                { role: 'user', content: 'Tenemos como 200 productos separados por colecciones.', hoursAgo: 2 },
                { role: 'ai', content: 'Con 200 productos, podemos crear un catálogo navegable con botones interactivos. Los clientes pueden ver colecciones, filtrar por talla/color y hacer su pedido sin salir de WhatsApp. 🛍️\n\n¿Tienes las fotos en buena resolución?', hoursAgo: 1.9 },
                { role: 'user', content: 'Sí claro, tenemos todo en drive. ¿Cuándo podemos empezar?', hoursAgo: 1 },
                { role: 'ai', content: '¡Me encanta tu disposición Valentina! 🚀 Podemos empezar esta misma semana. Déjame coordinar con el equipo técnico y te confirmation los detalles hoy mismo. ¿Me das tu correo?', hoursAgo: 0.5 },
            ],
            status: 'active',
        },
    ];

    const now = Date.now();

    contacts.forEach((contact, i) => {
        const conv = conversationData[i];
        const lastMsg = conv.messages[conv.messages.length - 1];
        const lastMsgTime = new Date(now - lastMsg.hoursAgo * 3600000).toISOString();
        const firstMsgTime = new Date(now - conv.messages[0].hoursAgo * 3600000).toISOString();

        const contactResult = insertContact.run({
            ...contact,
            first_contact_date: firstMsgTime,
            last_activity: lastMsgTime,
        });
        const contactId = contactResult.lastInsertRowid;

        const convResult = insertConv.run({
            contact_id: contactId,
            wa_conversation_id: `wac_${Date.now()}_${i}`,
            status: conv.status,
            last_message: lastMsg.content.substring(0, 100),
            last_message_at: lastMsgTime,
        });
        const convId = convResult.lastInsertRowid;

        conv.messages.forEach((msg) => {
            insertMsg.run({
                conversation_id: convId,
                contact_id: contactId,
                content: msg.content,
                role: msg.role,
                status: 'read',
                timestamp: new Date(now - msg.hoursAgo * 3600000).toISOString(),
            });
        });

        // agent logs
        db.prepare(`
      INSERT INTO agents_logs (agent_name, action, contact_id, conversation_id, input_tokens, output_tokens, response_time_ms, success)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run('AI Agent', 'message_processed', contactId, convId, Math.floor(Math.random() * 200) + 50, Math.floor(Math.random() * 300) + 100, Math.floor(Math.random() * 2000) + 500);
    });

    db.prepare(`INSERT INTO whatsapp_accounts (name, phone_number, phone_number_id, waba_id) VALUES (?, ?, ?, ?)`).run('E Beats Perú Business', '+51900000001', 'PHONE_NUMBER_ID_HERE', 'WABA_ID_HERE');
}
