# 🤖 E Beats CRM — Guía de Integración con N8N y WhatsApp Cloud API

## Arquitectura del Sistema

```
WhatsApp Cloud API → N8N Workflow → CRM API → SQLite DB → Frontend React
```

---

## Endpoints REST Disponibles

### 📥 POST `/api/messages`
Guarda un mensaje entrante del usuario desde WhatsApp.

**Body:**
```json
{
  "phone": "+51987654321",
  "wa_id": "51987654321",
  "content": "Hola, quiero información",
  "role": "user",
  "contact_name": "Carlos Rodríguez",
  "message_type": "text",
  "wa_message_id": "wamid.unique_id",
  "timestamp": "2026-03-07T17:30:00Z"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": { "id": 1, ... },
  "conversation_id": 5,
  "contact_id": 3
}
```

---

### 🤖 POST `/api/ai-response`
Guarda la respuesta generada por el agente IA.

**Body:**
```json
{
  "phone": "+51987654321",
  "content": "¡Hola! Soy el asistente de E Beats Perú...",
  "agent_name": "AI Agent",
  "input_tokens": 150,
  "output_tokens": 200,
  "response_time_ms": 1200
}
```

---

### 📋 GET `/api/conversations`
Lista todas las conversaciones con filtros.

**Params:** `?search=Carlos&status=active&limit=50&offset=0`

---

### 👥 GET `/api/contacts`
Lista contactos con búsqueda y filtros de lead.

**Params:** `?search=Rodriguez&lead_status=caliente`

---

### ➕ POST `/api/contacts`
Crea un nuevo contacto manualmente.

---

### 🔔 POST `/api/webhook/whatsapp`
Recibe webhooks directamente de WhatsApp Cloud API.
Procesa automáticamente todos los tipos de mensajes.

---

## Flujo N8N — Mensaje Entrante de WhatsApp

```
1. WhatsApp Cloud API → Webhook Trigger (N8N)
2. N8N: Extraer datos del mensaje
3. N8N: HTTP POST → /api/messages (guardar mensaje del usuario)
4. N8N: OpenAI / LLM Node → Generar respuesta
5. N8N: HTTP POST → /api/ai-response (guardar respuesta IA)
6. N8N: WhatsApp API → Enviar respuesta al cliente
```

### Nodo N8N - Guardar Mensaje de Usuario
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/messages",
  "body": {
    "phone": "={{ '+' + $json.entry[0].changes[0].value.messages[0].from }}",
    "wa_id": "={{ $json.entry[0].changes[0].value.messages[0].from }}",
    "content": "={{ $json.entry[0].changes[0].value.messages[0].text.body }}",
    "role": "user",
    "contact_name": "={{ $json.entry[0].changes[0].value.contacts[0].profile.name }}",
    "wa_message_id": "={{ $json.entry[0].changes[0].value.messages[0].id }}"
  }
}
```

### Nodo N8N - Guardar Respuesta IA
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/ai-response",
  "body": {
    "phone": "={{ $('Webhook').item.json.entry[0].changes[0].value.messages[0].from | prepend('+') }}",
    "content": "={{ $json.choices[0].message.content }}",
    "agent_name": "AI Agent GPT-4",
    "input_tokens": "={{ $json.usage.prompt_tokens }}",
    "output_tokens": "={{ $json.usage.completion_tokens }}"
  }
}
```

---

## Configuración de WhatsApp Cloud API

### Variables de entorno (.env.local)
```
WHATSAPP_VERIFY_TOKEN=ebeats_verify_token_2024
WHATSAPP_ACCESS_TOKEN=tu_access_token_aqui
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### Webhook URL para registrar en Meta
```
https://tu-dominio.com/api/webhook/whatsapp
```

### Verificación del Webhook
El endpoint GET `/api/webhook/whatsapp` responde automáticamente al challenge de verificación de Meta.

---

## Base de Datos

### Tablas
| Tabla | Descripción |
|-------|-------------|
| `contacts` | Clientes/prospectos con datos de WhatsApp |
| `conversations` | Hilo de conversación por contacto |
| `messages` | Todos los mensajes (usuario + IA) |
| `agents_logs` | Logs de rendimiento del agente IA |
| `whatsapp_accounts` | Números de WhatsApp conectados |

### Escalar a PostgreSQL / Supabase
1. Instalar: `npm install pg @types/pg`
2. Reemplazar `better-sqlite3` con `pg` en `src/lib/db.ts`
3. Usar `DATABASE_URL` en variables de entorno
4. El resto del código no cambia (mismas queries SQL)

---

## Tecnologías
- **Frontend:** Next.js 15 + React 19 + CSS personalizado
- **Backend:** Next.js API Routes (REST)
- **Database:** SQLite (better-sqlite3) → Migrable a PostgreSQL
- **Integración:** Compatible con N8N y WhatsApp Cloud API
