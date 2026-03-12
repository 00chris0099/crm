import { NormalizedMessage } from '../types/messaging';
import { dbQuery } from '../lib/pg-db';
import { AutomationDispatchService } from './automationDispatchService';

export class InboundMessageOrchestrator {
  public static async process(message: NormalizedMessage) {
    // 1. Save webhook events (done via controller)
    // 2. Normalize (done before this call)
    // 3. Find or create context (mocked logic)
    
    // Check if channel exists for this provider and external id
    const contacts = await dbQuery('globaldb', `SELECT * FROM contacts WHERE phone = $1`, [`+${message.from}`]);
    let contactId;
    if (contacts.rows.length === 0) {
       const res = await dbQuery('globaldb', `INSERT INTO contacts (name, phone, wa_id, lead_status) VALUES ($1, $2, $3, 'frio') RETURNING id`, [message.contact_name, `+${message.from}`, message.from]);
       contactId = res.rows[0].id;
    } else {
       contactId = contacts.rows[0].id;
    }

    const conversations = await dbQuery('globaldb', `SELECT * FROM conversations WHERE contact_id = $1 AND status = 'active'`, [contactId]);
    let conversationId;
    if (conversations.rows.length === 0) {
       const res = await dbQuery('globaldb', `INSERT INTO conversations (contact_id, status) VALUES ($1, 'active') RETURNING id`, [contactId]);
       conversationId = res.rows[0].id;
    } else {
       conversationId = conversations.rows[0].id;
    }

    await dbQuery('globaldb', `INSERT INTO conversation_messages (conversation_id, contact_id, role, content, status) VALUES ($1, $2, 'user', $3, 'delivered')`, [conversationId, contactId, message.text || '']);

    // Log internally for backward compatibility (crm_messages)
    try {
        await dbQuery(
            'crm_db',
            `INSERT INTO crm_messages (
                phone, contact_name, message_type, message_text,
                media_id, media_url, direction, agent_type,
                message_id, timestamp, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                message.from, message.contact_name, message.message_type, message.text || '', 
                message.media_id || '', message.media_url || '', 'incoming', 'user', 
                message.message_id, message.timestamp, JSON.stringify(message.raw_payload)
            ]
        );
    } catch(err) {
        console.error("Backward compatible crm_messages log failed:", err);
    }

    // Check automation and dispatch
    const n8nActive = true; 
    if (n8nActive) {
       // Using user's known default URL or environment variable.
       const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://aimachristian-n8n.ajcxjb.easypanel.host/webhook/17321a6d-1d65-429e-808c-5eebe4db066d/webhook';
       
       // Note: the dispatch service normally sends normalized message, but since your n8n expects the full raw payload right now,
       // we will forward both to ensure it doesn't break your existing n8n workflows.
       await AutomationDispatchService.sendToN8n(message, n8nWebhookUrl, message.raw_payload);
    }
  }
}

