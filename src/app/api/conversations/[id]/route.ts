import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const db = getDb();
        const { id } = await params;
        const messages = db.prepare(`
      SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC
    `).all(parseInt(id));

        const conversation = db.prepare(`
      SELECT c.*, ct.name as contact_name, ct.phone as contact_phone,
             ct.avatar_color as contact_avatar_color, ct.lead_status as contact_lead_status,
             ct.company as contact_company, ct.email as contact_email,
             ct.notes as contact_notes, ct.first_contact_date
      FROM conversations c
      JOIN contacts ct ON c.contact_id = ct.id
      WHERE c.id = ?
    `).get(parseInt(id));

        // Mark messages as read
        db.prepare(`UPDATE conversations SET unread_count = 0 WHERE id = ?`).run(parseInt(id));

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
        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        db.prepare(`UPDATE conversations SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, parseInt(id));

        const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(parseInt(id));
        return NextResponse.json({ conversation });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
