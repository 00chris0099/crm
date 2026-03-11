import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Dynamic import to avoid any module initialization issues
        const { getDb } = await import('@/lib/db');
        const db = getDb();
        const today = new Date().toISOString().split('T')[0];

        const total_contacts = (db.prepare('SELECT COUNT(*) as c FROM contacts').get() as { c: number }).c;
        const active_conversations = (db.prepare("SELECT COUNT(*) as c FROM conversations WHERE status = 'active'").get() as { c: number }).c;
        const new_leads_today = (db.prepare("SELECT COUNT(*) as c FROM contacts WHERE date(first_contact_date) = ?").get(today) as { c: number }).c;
        const messages_sent_today = (db.prepare("SELECT COUNT(*) as c FROM messages WHERE role = 'ai' AND date(timestamp) = ?").get(today) as { c: number }).c;
        const messages_received_today = (db.prepare("SELECT COUNT(*) as c FROM messages WHERE role = 'user' AND date(timestamp) = ?").get(today) as { c: number }).c;
        const hot_leads = (db.prepare("SELECT COUNT(*) as c FROM contacts WHERE lead_status = 'caliente'").get() as { c: number }).c;
        const warm_leads = (db.prepare("SELECT COUNT(*) as c FROM contacts WHERE lead_status = 'tibio'").get() as { c: number }).c;
        const cold_leads = (db.prepare("SELECT COUNT(*) as c FROM contacts WHERE lead_status = 'frio'").get() as { c: number }).c;

        const total_received = (db.prepare("SELECT COUNT(*) as c FROM messages WHERE role = 'user'").get() as { c: number }).c;
        const total_ai = (db.prepare("SELECT COUNT(*) as c FROM messages WHERE role = 'ai'").get() as { c: number }).c;
        const response_rate = total_received > 0 ? Math.round((total_ai / total_received) * 100) : 0;

        const avg_response_time_row = db.prepare("SELECT AVG(response_time_ms) as avg FROM agents_logs WHERE success = 1").get() as { avg: number | null };
        const avg_response_time = avg_response_time_row.avg ? Math.round(avg_response_time_row.avg / 1000) : 0;

        const last7days = db.prepare(`
      SELECT date(timestamp) as day, COUNT(*) as count, role
      FROM messages
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY day, role
      ORDER BY day ASC
    `).all() as { day: string; count: number; role: string }[];

        const agentPerformance = db.prepare(`
      SELECT date(timestamp) as day,
             COUNT(*) as total_responses,
             AVG(response_time_ms) as avg_response_ms,
             SUM(output_tokens) as total_tokens
      FROM agents_logs
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY day
      ORDER BY day ASC
    `).all();

        const topContacts = db.prepare(`
      SELECT ct.name, ct.phone, ct.lead_status, ct.avatar_color, COUNT(m.id) as message_count
      FROM contacts ct
      LEFT JOIN messages m ON ct.id = m.contact_id
      GROUP BY ct.id
      ORDER BY message_count DESC
      LIMIT 5
    `).all();

        return NextResponse.json({
            stats: {
                total_contacts,
                active_conversations,
                new_leads_today,
                messages_sent_today,
                messages_received_today,
                response_rate,
                hot_leads,
                warm_leads,
                cold_leads,
                avg_response_time,
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
