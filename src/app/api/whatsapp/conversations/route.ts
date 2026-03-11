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
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20));
    const search = searchParams.get('search') ?? '';
    const offset = (page - 1) * pageSize;

    try {
        // 1. Fetch all unique sessions from n8n
        const sessionsResult = await dbQuery<{
            session_id: string;
            message_count: number;
            first_id: number;
            last_id: number;
            last_content: string;
            last_type: string;
        }>(
            'n8n_data',
            `SELECT
         session_id,
         COUNT(*) AS message_count,
         MIN(id) AS first_id,
         MAX(id) AS last_id,
         (SELECT message->>'content' FROM n8n_chat_histories h2 WHERE h2.session_id = h1.session_id ORDER BY id DESC LIMIT 1) AS last_content,
         (SELECT message->>'type' FROM n8n_chat_histories h2 WHERE h2.session_id = h1.session_id ORDER BY id DESC LIMIT 1) AS last_type
       FROM n8n_chat_histories h1
       GROUP BY session_id`
        );

        // 2. Group by extracted Phone Number
        const phoneMap = new Map<string, any>();

        for (const row of sessionsResult.rows) {
            const phoneId = extractPhone(row.session_id) || row.session_id; // Fallback to raw ID if no phone

            if (!phoneMap.has(phoneId)) {
                phoneMap.set(phoneId, {
                    session_id: phoneId, // Use phone as the new global session_id!
                    real_sessions: [],
                    message_count: 0,
                    first_id: Infinity,
                    last_id: -Infinity,
                    last_content: '',
                    last_type: ''
                });
            }

            const group = phoneMap.get(phoneId);
            group.real_sessions.push(row.session_id);
            group.message_count += Number(row.message_count);

            if (Number(row.first_id) < group.first_id) group.first_id = Number(row.first_id);
            if (Number(row.last_id) > group.last_id) {
                group.last_id = Number(row.last_id);
                group.last_content = row.last_content;
                group.last_type = row.last_type;
            }
        }

        let conversations = Array.from(phoneMap.values());

        // 3. Sort by most recent message (last_id DESC)
        conversations.sort((a, b) => b.last_id - a.last_id);

        // 4. Client-side search (since we aggregated in JS)
        if (search) {
            const q = search.toLowerCase();
            conversations = conversations.filter(c =>
                c.session_id.toLowerCase().includes(q) ||
                (c.last_content || '').toLowerCase().includes(q)
            );
        }

        // 5. Paginate
        const total = conversations.length;
        const paginated = conversations.slice(offset, offset + pageSize);

        return NextResponse.json({
            conversations: paginated,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
