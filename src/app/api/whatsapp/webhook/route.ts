import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const challenge = searchParams.get('hub.challenge');

    if (challenge) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Log incoming WhatsApp messages into the CRM Database
        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    const value = change.value;

                    // Parse incoming user messages
                    if (value && value.messages && value.messages.length > 0) {
                        for (const message of value.messages) {
                            const phone = value.contacts?.[0]?.wa_id || message.from;
                            const contact_name = value.contacts?.[0]?.profile?.name || '';
                            const message_type = message.type;
                            let message_text = '';
                            let media_id = '';
                            const media_url = ''; // Usually WhatsApp doesn't send URL, only ID. Can be retrieved via API if needed.

                            if (message_type === 'text') {
                                message_text = message.text?.body || '';
                            } else if (message.audio) {
                                media_id = message.audio.id;
                            } else if (message.image) {
                                media_id = message.image.id;
                            } else if (message.document) {
                                media_id = message.document.id;
                                message_text = message.document.caption || '';
                            }

                            const message_id = message.id;
                            const timestamp = message.timestamp;
                            const direction = 'incoming';
                            const agent_type = 'user';

                            try {
                                await dbQuery(
                                    'crm_db',
                                    `INSERT INTO crm_messages (
                                        phone, contact_name, message_type, message_text,
                                        media_id, media_url, direction, agent_type,
                                        message_id, timestamp, metadata
                                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                                    [
                                        phone,
                                        contact_name,
                                        message_type,
                                        message_text,
                                        media_id,
                                        media_url,
                                        direction,
                                        agent_type,
                                        message_id,
                                        timestamp,
                                        JSON.stringify(body)
                                    ]
                                );
                            } catch (dbErr) {
                                console.error('Failed to log incoming message to crm_messages:', dbErr);
                            }
                        }
                    }
                }
            }
        }

        // 2. Forward everything to the n8n Agent Webhook
        try {
            await fetch('https://aimachristian-n8n.ajcxjb.easypanel.host/webhook/17321a6d-1d65-429e-808c-5eebe4db066d/webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
        } catch (err) {
            console.error('Error forwarding to n8n:', err);
        }

        // Return a quick 200 OK so Meta is happy
        return new NextResponse('OK', { status: 200 });

    } catch (e) {
        console.error('Webhook Error:', e);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
