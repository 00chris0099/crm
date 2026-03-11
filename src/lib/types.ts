export interface Contact {
    id: number;
    name: string;
    phone: string;
    wa_id: string;
    email?: string;
    company?: string;
    lead_status: 'frio' | 'tibio' | 'caliente';
    notes?: string;
    first_contact_date: string;
    last_activity: string;
    avatar_color: string;
    created_at: string;
    updated_at: string;
}

export interface Conversation {
    id: number;
    contact_id: number;
    wa_conversation_id?: string;
    status: 'active' | 'closed' | 'pending';
    channel: string;
    assigned_agent: string;
    unread_count: number;
    last_message?: string;
    last_message_at: string;
    created_at: string;
    updated_at: string;
    // joined fields
    contact_name?: string;
    contact_phone?: string;
    contact_avatar_color?: string;
    contact_lead_status?: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    contact_id: number;
    wa_message_id?: string;
    content: string;
    role: 'user' | 'ai' | 'system';
    status: 'sent' | 'delivered' | 'read' | 'failed';
    message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';
    media_url?: string;
    timestamp: string;
    metadata?: string;
}

export interface AgentLog {
    id: number;
    agent_name: string;
    action: string;
    contact_id?: number;
    conversation_id?: number;
    input_tokens: number;
    output_tokens: number;
    response_time_ms: number;
    success: number;
    error_message?: string;
    metadata?: string;
    timestamp: string;
}

export interface DashboardStats {
    total_contacts: number;
    active_conversations: number;
    new_leads_today: number;
    messages_sent_today: number;
    messages_received_today: number;
    response_rate: number;
    hot_leads: number;
    warm_leads: number;
    cold_leads: number;
    avg_response_time: number;
}
