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
        // 1. Find all raw n8n session_ids that match this phone number
        const allIdsResult = await dbQuery<{ session_id: string }>('n8n_data', 'SELECT DISTINCT session_id FROM n8n_chat_histories');

        const targetSessionIds = allIdsResult.rows
            .map(r => r.session_id)
            .filter(sid => (extractPhone(sid) || sid) === requestSessionId);

        // Also include the raw requestSessionId just in case
        if (!targetSessionIds.includes(requestSessionId)) {
            targetSessionIds.push(requestSessionId);
        }

        // 2. Fetch all messages matching any of these underlying wamid sessions
        const result = await dbQuery<{
            id: number;
            session_id: string;
            message: Record<string, unknown>;
        }>(
            'n8n_data',
            `SELECT id, session_id, message
       FROM n8n_chat_histories
       WHERE session_id = ANY($1)
       ORDER BY id ASC
       LIMIT $2 OFFSET $3`,
            [targetSessionIds, pageSize, offset]
        );

        const countResult = await dbQuery<{ total: string }>(
            'n8n_data',
            `SELECT COUNT(*) AS total FROM n8n_chat_histories WHERE session_id = ANY($1)`,
            [targetSessionIds]
        );

        // 3. Normalize to clean message structure
        const messages = result.rows.map((row) => {
            const msg = row.message as Record<string, unknown>;
            const rawType = (msg.type as string) ?? 'unknown';

            // Anything not strictly 'human' is agent/system
            const role: 'user' | 'ai' | 'system' =
                rawType === 'human' ? 'user'
                    : rawType === 'ai' ? 'ai'
                        : 'system';

            return {
                id: row.id,
                session_id: row.session_id,
                role,
                content: (msg.content as string) ?? '',
                raw_type: rawType,
                tool_calls: (msg.tool_calls as unknown[]) ?? [],
                additional_kwargs: (msg.additional_kwargs as Record<string, unknown>) ?? {},
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
