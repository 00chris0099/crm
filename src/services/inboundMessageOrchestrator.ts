import { NormalizedMessage } from '../types/messaging';
import { dbQuery } from '../lib/pg-db';

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

    await dbQuery('globaldb', `INSERT INTO conversation_messages (conversation_id, contact_id, role, content, status) VALUES ($1, $2, 'user', $3, 'delivered')`, [conversationId, contactId, message.text]);

    // Check automation (placeholder)
    const n8nActive = true; 
    if (n8nActive) {
       // Dispatch to automation service
    }
  }
}
