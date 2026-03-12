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
        let condition = '';
        let params: any[] = [];
        if (search) {
            condition = 'WHERE c.phone ILIKE $1 OR c.name ILIKE $1';
            params.push(`%${search}%`);
        }

        // Query the new globaldb schema
        const query = `
            SELECT 
                c.phone AS session_id,
                (SELECT COUNT(*) FROM conversation_messages m WHERE m.conversation_id = conv.id) AS message_count,
                conv.created_at AS first_id,
                conv.updated_at AS last_id,
                (SELECT message_text FROM conversation_messages m WHERE m.conversation_id = conv.id ORDER BY created_at DESC LIMIT 1) AS last_content,
                (SELECT direction FROM conversation_messages m WHERE m.conversation_id = conv.id ORDER BY created_at DESC LIMIT 1) AS last_direction
            FROM conversations conv
            JOIN contacts c ON conv.contact_id = c.id
            ${condition}
            ORDER BY conv.updated_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const sessionsResult = await dbQuery('globaldb', query, [...params, pageSize, offset]);

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM conversations conv
            JOIN contacts c ON conv.contact_id = c.id
            ${condition}
        `;
        const countResult = await dbQuery('globaldb', countQuery, params);
        const total = Number(countResult.rows[0]?.total || 0);

        const conversations = sessionsResult.rows.map(row => ({
            session_id: row.session_id,
            message_count: Number(row.message_count),
            first_id: new Date(row.first_id).getTime(),
            last_id: new Date(row.last_id).getTime(),
            last_content: row.last_content || '',
            last_type: row.last_direction === 'inbound' ? 'human' : 'ai'
        }));

        return NextResponse.json({
            conversations,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
