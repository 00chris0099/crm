import { ConversationRepository } from '../repositories/conversationRepository';

export const ConversationService = {
    async processInboundMessage(payload: any) {
        // Log raw webhook
        await ConversationRepository.logWebhookEvent(payload);

        // Required fields expected in the unified format:
        const {
            organization_id,
            channel_id,
            external_user_id,
            provider_message_id,
            message_type,
            message_text,
            media_url,
            contact_name = 'Unknown'
        } = payload;

        // 1. Validations
        if (!organization_id || !channel_id || !external_user_id || !provider_message_id) {
            throw new Error("Missing required unified fields: organization_id, channel_id, external_user_id, provider_message_id");
        }

        const validTypes = ['text', 'image', 'audio', 'document', 'video', 'other'];
        const mType = validTypes.includes(message_type) ? message_type : 'other';

        const isChannelActive = await ConversationRepository.checkChannelActive(channel_id);
        if (!isChannelActive) {
            throw new Error(`Channel ${channel_id} does not exist or is inactive`);
        }

        // 2. Find or Create Contact
        const contactId = await ConversationRepository.findOrCreateContact(organization_id, external_user_id, contact_name);

        // 3. Find or Create Conversation (creates if closed/new)
        const conversationId = await ConversationRepository.findOrCreateConversation(organization_id, contactId, channel_id);

        // 4. Save Message
        const msgId = await ConversationRepository.saveMessage(
            conversationId,
            provider_message_id,
            'inbound',
            mType,
            message_text || null,
            media_url || null
        );

        // 5. Update Conversation Activity
        if (msgId) {
            await ConversationRepository.updateConversationActivity(conversationId, 'open');
            // 6. Assign Agent logic
            await ConversationRepository.assignAgentIfEligible(conversationId);
        }

        return { success: true, conversationId, messageId: msgId };
    },

    async processOutboundMessage(payload: any) {
        const {
            conversation_id,
            provider_message_id,
            message_type,
            message_text,
            media_url
        } = payload;

        if (!conversation_id || !provider_message_id) {
            throw new Error("Missing required unified fields: conversation_id, provider_message_id");
        }

        const validTypes = ['text', 'image', 'audio', 'document', 'video', 'other'];
        const mType = validTypes.includes(message_type) ? message_type : 'other';

        const msgId = await ConversationRepository.saveMessage(
            conversation_id,
            provider_message_id,
            'outbound',
            mType,
            message_text || null,
            media_url || null
        );

        if (msgId) {
            await ConversationRepository.updateConversationActivity(conversation_id, 'open');
        }

        return { success: true, messageId: msgId };
    }
};
