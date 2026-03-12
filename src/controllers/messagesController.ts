import { ConversationService } from '../services/conversationService';

export const MessagesController = {
    async handleInbound(reqBody: any) {
        // The service receives the unified payload and abstracts the DB logic away
        return await ConversationService.processInboundMessage(reqBody);
    },

    async handleOutbound(reqBody: any) {
        // Handle logic when CRM or Bot tries to send outbound event back to provider
        return await ConversationService.processOutboundMessage(reqBody);
    }
};
