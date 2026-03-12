export interface Organization {
    id: string; // uuid
    name: string;
}

export interface Channel {
    id: string; // uuid
    organization_id: string;
    channel_type: 'whatsapp' | 'evolution_api' | 'facebook' | string;
    channel_name: string;
    identifier: string; // phoneNumber or instanceId
}

export interface Contact {
    id: string; // uuid
    organization_id: string;
    name: string;
    phone: string;
    created_at: Date;
    updated_at: Date;
}

export interface Conversation {
    id: string; // uuid
    organization_id: string;
    contact_id: string;
    channel_id: string;
    status: 'open' | 'closed' | 'pending';
    created_at: Date;
    updated_at: Date;
}

export interface ConversationMessage {
    id: string; // uuid
    conversation_id: string;
    provider_message_id: string;
    direction: 'inbound' | 'outbound';
    message_type: 'text' | 'image' | 'audio' | 'document' | 'video' | 'other';
    message_text: string | null;
    media_url: string | null;
    created_at: Date;
}

export interface AutomationAgent {
    id: string; // uuid
    organization_id: string;
    name: string;
    provider: string; // e.g., 'n8n'
    is_active: boolean;
}

export interface LeadSource {
    id: string; // uuid
    organization_id: string;
    name: string;
}
