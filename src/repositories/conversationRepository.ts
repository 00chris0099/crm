import { dbQuery } from '@/lib/pg-db';

const DB_ID = 'globaldb';

export const ConversationRepository = {
    async logWebhookEvent(payload: any) {
        await dbQuery(DB_ID, 'INSERT INTO webhook_events(payload, created_at) VALUES($1, NOW())', [JSON.stringify(payload)]);
    },

    async checkChannelActive(channelId: string) {
        const res = await dbQuery(DB_ID, 'SELECT id FROM channels WHERE id = $1 LIMIT 1', [channelId]);
        return res.rows.length > 0;
    },

    async findOrCreateContact(organizationId: string, phone: string, name: string) {
        // Check if exists
        const res = await dbQuery(DB_ID, 'SELECT id FROM contacts WHERE organization_id = $1 AND phone = $2 LIMIT 1', [organizationId, phone]);
        if (res.rows.length) return res.rows[0].id;

        // Create
        const insert = await dbQuery(DB_ID, 'INSERT INTO contacts (organization_id, name, phone, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id', [organizationId, name, phone]);
        return insert.rows[0].id;
    },

    async findOrCreateConversation(organizationId: string, contactId: string, channelId: string) {
        const res = await dbQuery(DB_ID, "SELECT id, status FROM conversations WHERE organization_id = $1 AND contact_id = $2 AND channel_id = $3 ORDER BY updated_at DESC LIMIT 1", [organizationId, contactId, channelId]);
        if (res.rows.length) {
            const conv = res.rows[0];
            // Reopen if closed
            if (conv.status === 'closed') {
                await dbQuery(DB_ID, "UPDATE conversations SET status = 'open', updated_at = NOW() WHERE id = $1", [conv.id]);
            }
            return conv.id;
        }
        const insert = await dbQuery(DB_ID, "INSERT INTO conversations (organization_id, contact_id, channel_id, status, created_at, updated_at) VALUES ($1, $2, $3, 'open', NOW(), NOW()) RETURNING id", [organizationId, contactId, channelId]);
        return insert.rows[0].id;
    },

    async checkMessageExists(providerMsgId: string) {
        const res = await dbQuery(DB_ID, 'SELECT id FROM conversation_messages WHERE provider_message_id = $1 LIMIT 1', [providerMsgId]);
        return res.rows.length > 0;
    },

    async saveMessage(conversationId: string, providerMsgId: string, direction: 'inbound' | 'outbound', type: string, text: string | null, mediaUrl: string | null) {
        const exists = await this.checkMessageExists(providerMsgId);
        if (exists) return null; // Deduplicate

        const insert = await dbQuery(DB_ID, `
            INSERT INTO conversation_messages (conversation_id, provider_message_id, direction, message_type, message_text, media_url, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id
        `, [conversationId, providerMsgId, direction, type, text, mediaUrl]);
        return insert.rows[0].id;
    },

    async updateConversationActivity(conversationId: string, status: string = 'open') {
        await dbQuery(DB_ID, 'UPDATE conversations SET updated_at = NOW(), status = $2 WHERE id = $1', [conversationId, status]);
    },

    async assignAgentIfEligible(conversationId: string) {
        // Here we could run logic against agent_routing_rules
        // For now, it's just a placeholder as described in requirements
    }
};
