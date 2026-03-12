import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const search = url.searchParams.get('search');
        
        // Check for active integrations first
        const integrationsResult = await dbQuery('crm_db', 'SELECT count(*) as count FROM integrations WHERE active = $1', [true]);
        const count = parseInt(integrationsResult.rows[0].count);
        
        if (count === 0) {
            return NextResponse.json({ conversations: [], noActiveIntegrations: true });
        }

        // Fetch conversations
        let query = `
            SELECT 
                c.id, 
                c.status,
                c.created_at,
                co.name as contact_name,
                co.phone as contact_phone,
                co.attributes as contact_attributes,
                (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at,
                (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_type = 'user') as unread_count
            FROM conversations c
            JOIN contacts co ON c.contact_id = co.id
        `;
        
        const params: any[] = [];
        
        if (search) {
            query += ` WHERE co.name ILIKE $1 OR co.phone ILIKE $1`;
            params.push(`%${search}%`);
        }
        
        query += ` ORDER BY COALESCE((SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1), c.created_at) DESC`;

        const result = await dbQuery('crm_db', query, params);
        
        return NextResponse.json({ conversations: result.rows, noActiveIntegrations: false });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}
