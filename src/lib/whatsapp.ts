// WhatsApp Cloud API v22.0 client library

function getEnv() {
    return {
        BASE: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v22.0'}`,
        TOKEN: process.env.WHATSAPP_TOKEN || '',
        PHONE_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        WABA_ID: process.env.WHATSAPP_WABA_ID || '',
    };
}

async function waFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const env = getEnv();
    const url = path.startsWith('http') ? path : `${env.BASE}${path}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${env.TOKEN}`,
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
        },
        next: { revalidate: 0 },
    });
    const data = await res.json() as any;
    if (!res.ok) {
        throw new Error(data?.error?.message || "Meta API Error: " + res.status + " " + res.statusText);
    }
    return data as T;
}

// ─── Phone Number Info ────────────────────────────────────────────────────────
export async function getPhoneNumberInfo() {
    const env = getEnv();
    return waFetch<{
        id: string; display_phone_number: string; verified_name: string;
        quality_rating: string; code_verification_status: string;
        platform_type: string; throughput: { level: string };
    }>(`/${env.PHONE_ID}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,throughput`);
}

// ─── Analytics (message stats) ───────────────────────────────────────────────
export async function getAnalytics(granularity: 'DAY' | 'MONTH' = 'DAY', daysBack = 7) {
    const env = getEnv();
    const end = Math.floor(Date.now() / 1000);
    const start = end - daysBack * 86400;
    return waFetch<{
        analytics: {
            account_id: string;
            granularity: string;
            data_points: { start: number; end: number; sent: number; delivered: number; read: number }[];
        };
        id: string;
    }>(
        `/${env.WABA_ID}?fields=analytics.metric(MESSAGES_SENT,MESSAGES_DELIVERED,MESSAGES_READ).granularity(${granularity}).start(${start}).end(${end})&access_token=${env.TOKEN}`
    );
}

// ─── Conversations ────────────────────────────────────────────────────────────
export interface WAConversation {
    id: string;
    messages?: { data: WAMessage[] };
    participants?: { data: { id: string; name?: string }[] };
    updated_time?: string;
    snippet?: string;
    unread_count?: number;
    can_reply?: boolean;
    is_subscribed?: boolean;
    linked_to?: { data: unknown[] };
    message_count?: number;
    name?: string;
    scoped_thread_key?: string;
}

export interface WAMessage {
    id: string;
    message?: string;
    created_time?: string;
    from?: { id: string; name?: string };
    to?: { data: { id: string; name?: string }[] };
}

export async function getConversations(limit = 20, after?: string) {
    const env = getEnv();
    const cursor = after ? `&after=${after}` : '';
    return waFetch<{
        data: WAConversation[];
        paging?: { cursors?: { before: string; after: string }; next?: string };
    }>(
        `/${env.PHONE_ID}/conversations?fields=id,messages{message,created_time,from,to},participants,updated_time,snippet,unread_count,can_reply,message_count,name&limit=${limit}${cursor}`
    );
}

export async function getConversationMessages(conversationId: string, limit = 50) {
    return waFetch<{ data: WAMessage[]; paging?: { next?: string; previous?: string } }>(
        `/${conversationId}/messages?fields=message,created_time,from,to&limit=${limit}`
    );
}

// ─── Send Message ─────────────────────────────────────────────────────────────
export async function sendTextMessage(to: string, text: string) {
    const env = getEnv();
    return waFetch(`/${env.PHONE_ID}/messages`, {
        method: 'POST',
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { preview_url: false, body: text },
        }),
    });
}

// ─── Template Messages ────────────────────────────────────────────────────────
export async function getMessageTemplates() {
    const env = getEnv();
    return waFetch<{
        data: {
            id: string; name: string; status: string; category: string; language: string;
            components: unknown[];
        }[]
    }>(`/${env.WABA_ID}/message_templates?fields=id,name,status,category,language,components&limit=50`);
}

// ─── Media ────────────────────────────────────────────────────────────────────
export async function getMediaUrl(mediaId: string) {
    return waFetch<{ url: string; mime_type: string; sha256: string; file_size: number; id: string }>(
        `/${mediaId}`
    );
}

// ─── Account health ───────────────────────────────────────────────────────────
export async function getAccountHealth() {
    const env = getEnv();
    return waFetch<{
        id: string; name: string; currency: string;
        timezone_id: string; message_template_namespace: string;
    }>(
        `/${env.WABA_ID}?fields=id,name,currency,timezone_id,message_template_namespace`
    );
}
