import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = `
      SELECT c.*, ct.name as contact_name, ct.phone as contact_phone, 
             ct.avatar_color as contact_avatar_color, ct.lead_status as contact_lead_status,
             ct.company as contact_company
      FROM conversations c
      JOIN contacts ct ON c.contact_id = ct.id
      WHERE 1=1
    `;
        const params: (string | number)[] = [];

        if (search) {
            query += ` AND (ct.name LIKE ? OR ct.phone LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            query += ` AND c.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY c.last_message_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const conversations = db.prepare(query).all(...params);

        const total = (db.prepare(`
      SELECT COUNT(*) as count FROM conversations c
      JOIN contacts ct ON c.contact_id = ct.id
      WHERE 1=1
      ${search ? 'AND (ct.name LIKE ? OR ct.phone LIKE ?)' : ''}
      ${status ? 'AND c.status = ?' : ''}
    `).get(...params.slice(0, -2)) as { count: number }).count;

        return NextResponse.json({ conversations, total, limit, offset });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const db = getDb();
        const body = await request.json();
        const { contact_id, wa_conversation_id, status = 'active', assigned_agent = 'AI Agent' } = body;

        if (!contact_id) {
            return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
        }

        const existing = db.prepare('SELECT id FROM conversations WHERE contact_id = ? AND status = "active"').get(contact_id);
        if (existing) {
            return NextResponse.json({ conversation: existing, created: false });
        }

        const result = db.prepare(`
      INSERT INTO conversations (contact_id, wa_conversation_id, status, assigned_agent)
      VALUES (?, ?, ?, ?)
    `).run(contact_id, wa_conversation_id, status, assigned_agent);

        const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json({ conversation, created: true }, { status: 201 });
    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
