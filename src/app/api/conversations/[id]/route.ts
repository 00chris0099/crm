import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

const DB_ID = 'globaldb';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        let messages: any[] = [];
        let conversation: any = null;

        try {
            const msgsRes = await dbQuery(DB_ID, `
                SELECT 
                    id, 
                    direction as role, 
                    message_text as content,
                    created_at as timestamp 
                FROM conversation_messages 
                WHERE conversation_id = $1 
                ORDER BY created_at ASC
            `, [id]);
            messages = msgsRes.rows.map(m => ({
                id: m.id,
                role: m.role === 'inbound' ? 'user' : 'ai',
                content: m.content || '',
                timestamp: m.timestamp
            }));

            const convRes = await dbQuery(DB_ID, `
                SELECT 
                    c.id, c.status,
                    ct.name as contact_name, ct.phone as contact_phone
                FROM conversations c
                LEFT JOIN contacts ct ON c.contact_id = ct.id
                WHERE c.id = $1
            `, [id]);

            if (convRes.rows.length > 0) {
                const r = convRes.rows[0];
                conversation = {
                    id: r.id,
                    status: r.status,
                    contact_name: r.contact_name || 'Desconocido',
                    contact_phone: r.contact_phone || '',
                    contact_avatar_color: '#6366f1',
                    contact_lead_status: 'frio',
                    assigned_agent: 'AI Agent',
                    unread_count: 0
                };
            }
        } catch (dbErr) {
            console.error('Info: Conversations details table error in Postgres globaldb:', dbErr);
        }

        return NextResponse.json({ conversation, messages });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        try {
            await dbQuery(DB_ID, `UPDATE conversations SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
        } catch (dbErr) {
            console.error('Info: Could not update conversation status Postgres globaldb:', dbErr);
        }

        return NextResponse.json({ success: true, status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
