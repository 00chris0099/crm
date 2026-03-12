import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

export const dynamic = 'force-dynamic';

function extractPhone(sessionId: string): string | null {
    try {
        if (sessionId.startsWith('phone_')) return sessionId.slice(6);
        const b64 = sessionId.startsWith('wamid.') ? sessionId.slice(6) : sessionId;
        const decoded = Buffer.from(b64, 'base64').toString('ascii');
        const match = decoded.match(/\d{8,}/);
        if (match) return match[0];
    } catch { /* ignore */ }
    return null;
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const requestSessionId = searchParams.get('session_id'); // This is now the phone number
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(500, Number(searchParams.get('pageSize') ?? 200));
    const offset = (page - 1) * pageSize;

    if (!requestSessionId) {
        return NextResponse.json({ error: 'Missing session_id (phone)' }, { status: 400 });
    }

    try {
        // Query messages from globaldb by joining with conversations and contacts
        const result = await dbQuery<{
            id: string; // uuid
            provider_message_id: string;
            direction: 'inbound' | 'outbound';
            message_type: string;
            message_text: string | null;
            media_url: string | null;
            created_at: Date;
        }>(
            'globaldb',
            `SELECT m.id, m.provider_message_id, m.direction, m.message_type, m.message_text, m.media_url, m.created_at
             FROM conversation_messages m
             JOIN conversations conv ON m.conversation_id = conv.id
             JOIN contacts c ON conv.contact_id = c.id
             WHERE c.phone = $1
             ORDER BY m.created_at ASC
             LIMIT $2 OFFSET $3`,
            [requestSessionId, pageSize, offset]
        );

        const countResult = await dbQuery<{ total: string }>(
            'globaldb',
            `SELECT COUNT(*) AS total
             FROM conversation_messages m
             JOIN conversations conv ON m.conversation_id = conv.id
             JOIN contacts c ON conv.contact_id = c.id
             WHERE c.phone = $1`,
            [requestSessionId]
        );

        // Normalize to the structure the frontend expects
        const messages = result.rows.map((row) => {
            const role: 'user' | 'ai' | 'system' = row.direction === 'inbound' ? 'user' : 'ai';

            return {
                id: row.id, // Using the uuid as ID (the frontend might treat it as string if it tolerates it or keep it as ID)
                session_id: requestSessionId, // Used by the frontend avatar clustering
                role,
                content: row.message_text || '',
                raw_type: row.message_type,
                tool_calls: [],
                additional_kwargs: { provider_message_id: row.provider_message_id, media_url: row.media_url },
            };
        });

        return NextResponse.json({
            messages,
            total: Number(countResult.rows[0]?.total ?? 0),
            page,
            pageSize,
        });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
