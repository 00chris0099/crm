import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/webhook/whatsapp - Receives WhatsApp Cloud API webhooks
// This endpoint processes the raw WhatsApp Cloud API payload and stores messages
export async function POST(request: NextRequest) {
    try {
        const db = getDb();
        const body = await request.json();

        // Verify WhatsApp webhook signature (in production, verify with HMAC)
        // const signature = request.headers.get('x-hub-signature-256');

        // Parse WhatsApp Cloud API payload structure
        if (body.object !== 'whatsapp_business_account') {
            return NextResponse.json({ status: 'ignored' });
        }

        const results = [];

        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                if (change.field !== 'messages') continue;

                const value = change.value;
                const messages = value.messages || [];
                const contacts = value.contacts || [];

                for (const waMessage of messages) {
                    const waContact = contacts.find((c: { wa_id: string }) => c.wa_id === waMessage.from);
                    const wa_id = waMessage.from;
                    const phone = `+${wa_id}`;
                    const contact_name = waContact?.profile?.name || phone;

                    // Extract message content based on type
                    let content = '';
                    let message_type = 'text';
                    let media_url = undefined;

                    if (waMessage.type === 'text') {
                        content = waMessage.text?.body || '';
                    } else if (waMessage.type === 'audio') {
                        content = '[Audio message]';
                        message_type = 'audio';
                    } else if (waMessage.type === 'image') {
                        content = waMessage.image?.caption || '[Image]';
                        message_type = 'image';
                    } else if (waMessage.type === 'video') {
                        content = waMessage.video?.caption || '[Video]';
                        message_type = 'video';
                    } else if (waMessage.type === 'document') {
                        content = `[Document: ${waMessage.document?.filename || 'file'}]`;
                        message_type = 'document';
                    } else if (waMessage.type === 'location') {
                        content = `[Location: ${waMessage.location?.name || `${waMessage.location?.latitude}, ${waMessage.location?.longitude}`}]`;
                        message_type = 'location';
                    } else {
                        content = `[${waMessage.type} message]`;
                    }

                    if (!content) continue;

                    // Find or create contact
                    let contact = db.prepare('SELECT * FROM contacts WHERE wa_id = ?').get(wa_id) as { id: number } | undefined;
                    if (!contact) {
                        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
                        const avatar_color = colors[Math.floor(Math.random() * colors.length)];
                        const insertResult = db.prepare(`
              INSERT INTO contacts (name, phone, wa_id, lead_status, avatar_color)
              VALUES (?, ?, ?, 'frio', ?)
            `).run(contact_name, phone, wa_id, avatar_color);
                        contact = { id: Number(insertResult.lastInsertRowid) };
                    }

                    // Find or create conversation
                    let conversation = db.prepare('SELECT * FROM conversations WHERE contact_id = ? AND status = "active"').get(contact.id) as { id: number } | undefined;
                    if (!conversation) {
                        const convResult = db.prepare(`
              INSERT INTO conversations (contact_id, wa_conversation_id, status, assigned_agent)
              VALUES (?, ?, 'active', 'AI Agent')
            `).run(contact.id, value.metadata?.display_phone_number ? `${value.metadata.display_phone_number}_${wa_id}` : null);
                        conversation = { id: Number(convResult.lastInsertRowid) };
                    }

                    const timestamp = new Date(parseInt(waMessage.timestamp) * 1000).toISOString();

                    // Insert message (ignore if duplicate)
                    try {
                        db.prepare(`
              INSERT INTO messages (conversation_id, contact_id, wa_message_id, content, role, message_type, media_url, timestamp)
              VALUES (?, ?, ?, ?, 'user', ?, ?, ?)
            `).run(conversation.id, contact.id, waMessage.id, content, message_type, media_url, timestamp);

                        db.prepare(`
              UPDATE conversations SET last_message = ?, last_message_at = ?, unread_count = unread_count + 1 WHERE id = ?
            `).run(content.substring(0, 100), timestamp, conversation.id);

                        db.prepare(`UPDATE contacts SET last_activity = ? WHERE id = ?`).run(timestamp, contact.id);

                        results.push({ wa_message_id: waMessage.id, status: 'saved' });
                    } catch {
                        results.push({ wa_message_id: waMessage.id, status: 'duplicate' });
                    }
                }
            }
        }

        return NextResponse.json({ status: 'processed', results });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

// GET - WhatsApp webhook verification (challenge)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'ebeats_verify_token_2024';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
