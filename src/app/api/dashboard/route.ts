import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

export async function GET() {
    try {
        const DB_ID = 'globaldb';
        let total_contacts = 0;
        let active_conversations = 0;
        let total_ai = 0;
        let total_received = 0;
        let last7days: { day: string; count: number; role: string }[] = [];
        let agentPerformance: any[] = [];
        let topContacts: any[] = [];

        try {
            const tc = await dbQuery(DB_ID, 'SELECT COUNT(*) as c FROM contacts');
            total_contacts = Number(tc.rows[0]?.c || 0);

            const ac = await dbQuery(DB_ID, "SELECT COUNT(*) as c FROM conversations WHERE status = 'open'");
            active_conversations = Number(ac.rows[0]?.c || 0);

            const tm = await dbQuery(DB_ID, "SELECT direction, COUNT(*) as c FROM conversation_messages GROUP BY direction");
            for (const row of tm.rows) {
                if (row.direction === 'outbound') total_ai += Number(row.c);
                if (row.direction === 'inbound') total_received += Number(row.c);
            }

            const l7 = await dbQuery(DB_ID, `
                SELECT DATE(created_at) as day, COUNT(*) as count, direction as role
                FROM conversation_messages
                WHERE created_at >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(created_at), direction
                ORDER BY day ASC
            `);
            last7days = l7.rows.map(r => ({
                day: new Date(r.day).toISOString().split('T')[0],
                count: Number(r.count),
                role: r.role === 'inbound' ? 'user' : 'ai'
            }));

            // Top contacts
            const topC = await dbQuery(DB_ID, `
                SELECT c.name, c.phone, COUNT(m.id) as message_count
                FROM contacts c
                LEFT JOIN conversations cv ON cv.contact_id = c.id
                LEFT JOIN conversation_messages m ON m.conversation_id = cv.id
                GROUP BY c.id, c.name, c.phone
                ORDER BY message_count DESC
                LIMIT 5
            `);
            topContacts = topC.rows.map(r => ({
                name: r.name || 'Desconocido',
                phone: r.phone || '',
                lead_status: 'frio',
                avatar_color: '#6366f1',
                message_count: Number(r.message_count)
            }));
            
        } catch (dbErr) {
            console.error('Info: Some dashboard tables are missing or empty in Postgres globaldb, returning empty zeros:', dbErr);
        }

        const response_rate = total_received > 0 ? Math.round((total_ai / total_received) * 100) : 0;

        return NextResponse.json({
            stats: {
                total_contacts,
                active_conversations,
                new_leads_today: 0,
                messages_sent_today: 0, // could add today filters
                messages_received_today: 0,
                response_rate,
                hot_leads: 0,
                warm_leads: 0,
                cold_leads: total_contacts,
                avg_response_time: 0,
                total_ai_messages: total_ai,
                total_user_messages: total_received,
            },
            last7days,
            agentPerformance,
            topContacts,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
