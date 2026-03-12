import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

const DB_ID = 'globaldb';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let conversations: any[] = [];
        let total = 0;

        try {
            // Simplified query mapping to what we suspect is in globaldb
            const query = `
                SELECT 
                    c.id, c.status, c.created_at, c.updated_at as last_message_at,
                    ct.name as contact_name, ct.phone as contact_phone
                FROM conversations c
                LEFT JOIN contacts ct ON c.contact_id = ct.id
                ORDER BY c.updated_at DESC
                LIMIT $1 OFFSET $2
            `;
            const result = await dbQuery(DB_ID, query, [String(limit), String(offset)]);
            
            conversations = result.rows.map(r => ({
                id: r.id,
                contact_id: null,
                status: r.status || 'closed',
                last_message: 'No disponible',
                last_message_at: r.last_message_at,
                unread_count: 0,
                contact_name: r.contact_name || 'Desconocido',
                contact_phone: r.contact_phone || '',
                contact_avatar_color: '#6366f1',
                contact_lead_status: 'frio',
                contact_company: '',
                assigned_agent: 'AI Agent'
            }));

            const countRes = await dbQuery(DB_ID, 'SELECT COUNT(*) as c FROM conversations');
            total = Number(countRes.rows[0]?.c || 0);

        } catch (dbErr) {
            console.error('Info: Conversations tables missing or schema mismatch in globaldb:', dbErr);
        }

        return NextResponse.json({ conversations, total, limit, offset });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    // Retain a simplified creation mechanism for testing if needed
    return NextResponse.json({ error: 'Not fully adapted to PG yet' }, { status: 501 });
}
