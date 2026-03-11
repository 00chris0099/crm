import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/messages - Save incoming WhatsApp message (n8n webhook integration)
export async function POST(request: NextRequest) {
    try {
        const db = getDb();
        const body = await request.json();
        const {
            phone,
            wa_id,
            content,
            role = 'user',
            timestamp,
            wa_message_id,
            message_type = 'text',
            media_url,
            contact_name,
            metadata,
        } = body;

        if (!phone || !content) {
            return NextResponse.json({ error: 'phone and content are required' }, { status: 400 });
        }

        // Find or create contact
        let contact = db.prepare('SELECT * FROM contacts WHERE wa_id = ? OR phone = ?').get(wa_id || phone, phone) as { id: number } | undefined;

        if (!contact) {
            const insertResult = db.prepare(`
        INSERT INTO contacts (name, phone, wa_id, lead_status)
        VALUES (?, ?, ?, 'frio')
      `).run(contact_name || phone, phone, wa_id || phone);
            contact = { id: Number(insertResult.lastInsertRowid) };
        }

        // Find or create conversation
        let conversation = db.prepare('SELECT * FROM conversations WHERE contact_id = ? AND status = "active"').get(contact.id) as { id: number } | undefined;

        if (!conversation) {
            const convResult = db.prepare(`
        INSERT INTO conversations (contact_id, status, assigned_agent)
        VALUES (?, 'active', 'AI Agent')
      `).run(contact.id);
            conversation = { id: Number(convResult.lastInsertRowid) };
        }

        // Insert message
        const msgResult = db.prepare(`
      INSERT INTO messages (conversation_id, contact_id, wa_message_id, content, role, message_type, media_url, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            conversation.id,
            contact.id,
            wa_message_id,
            content,
            role,
            message_type,
            media_url,
            timestamp || new Date().toISOString(),
            metadata ? JSON.stringify(metadata) : null
        );

        // Update conversation
        db.prepare(`
      UPDATE conversations 
      SET last_message = ?, last_message_at = ?, unread_count = unread_count + 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(content.substring(0, 100), timestamp || new Date().toISOString(), conversation.id);

        // Update contact last activity
        db.prepare(`UPDATE contacts SET last_activity = datetime('now') WHERE id = ?`).run(contact.id);

        const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(msgResult.lastInsertRowid);

        return NextResponse.json({
            success: true,
            message,
            conversation_id: conversation.id,
            contact_id: contact.id,
        }, { status: 201 });

    } catch (error) {
        console.error('Error saving message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const conversation_id = searchParams.get('conversation_id');
        const contact_id = searchParams.get('contact_id');
        const limit = parseInt(searchParams.get('limit') || '100');

        if (!conversation_id && !contact_id) {
            return NextResponse.json({ error: 'conversation_id or contact_id required' }, { status: 400 });
        }

        let query = 'SELECT * FROM messages WHERE ';
        const params: (string | number)[] = [];

        if (conversation_id) {
            query += 'conversation_id = ?';
            params.push(parseInt(conversation_id));
        } else {
            query += 'contact_id = ?';
            params.push(parseInt(contact_id!));
        }

        query += ` ORDER BY timestamp ASC LIMIT ?`;
        params.push(limit);

        const messages = db.prepare(query).all(...params);
        return NextResponse.json({ messages });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
