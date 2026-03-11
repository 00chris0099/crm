import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/ai-response - Save AI agent response (called by n8n after AI processes message)
export async function POST(request: NextRequest) {
    try {
        const db = getDb();
        const body = await request.json();
        const {
            conversation_id,
            contact_id,
            phone,
            content,
            timestamp,
            agent_name = 'AI Agent',
            input_tokens = 0,
            output_tokens = 0,
            response_time_ms = 0,
            wa_message_id,
        } = body;

        if (!content) {
            return NextResponse.json({ error: 'content is required' }, { status: 400 });
        }

        // Resolve conversation_id
        let convId = conversation_id;
        let contId = contact_id;

        if (!convId && phone) {
            const contact = db.prepare('SELECT id FROM contacts WHERE phone = ? OR wa_id = ?').get(phone, phone) as { id: number } | undefined;
            if (contact) {
                contId = contact.id;
                const conv = db.prepare('SELECT id FROM conversations WHERE contact_id = ? AND status = "active"').get(contact.id) as { id: number } | undefined;
                convId = conv?.id;
            }
        }

        if (!convId) {
            return NextResponse.json({ error: 'Could not find conversation' }, { status: 404 });
        }

        // Save AI message
        const msgResult = db.prepare(`
      INSERT INTO messages (conversation_id, contact_id, wa_message_id, content, role, status, timestamp)
      VALUES (?, ?, ?, ?, 'ai', 'delivered', ?)
    `).run(convId, contId, wa_message_id, content, timestamp || new Date().toISOString());

        // Update conversation
        db.prepare(`
      UPDATE conversations 
      SET last_message = ?, last_message_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(content.substring(0, 100), timestamp || new Date().toISOString(), convId);

        // Save agent log
        db.prepare(`
      INSERT INTO agents_logs (agent_name, action, contact_id, conversation_id, input_tokens, output_tokens, response_time_ms, success)
      VALUES (?, 'ai_response', ?, ?, ?, ?, ?, 1)
    `).run(agent_name, contId, convId, input_tokens, output_tokens, response_time_ms);

        const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(msgResult.lastInsertRowid);

        return NextResponse.json({
            success: true,
            message,
            conversation_id: convId,
        }, { status: 201 });

    } catch (error) {
        console.error('Error saving AI response:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
