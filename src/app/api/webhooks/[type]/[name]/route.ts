import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

// ─── Helper: Parse incoming message payload by integration type ──────────────
async function processIncomingMessage(
    integration_name: string,
    integrationType: string,
    payload: any
) {
    // 1. Fetch integration config
    const intResult = await dbQuery(
        'crm_db',
        'SELECT * FROM integrations WHERE name = $1 AND type = $2 AND active = true',
        [integration_name, integrationType.toUpperCase()]
    );

    if (intResult.rows.length === 0) {
        throw new Error(`Integration "${integration_name}" (${integrationType}) not found or inactive`);
    }
    const integration = intResult.rows[0];

    // 2. Parse message based on type
    let phone = '';
    let name = '';
    let text = '';
    const timestamp = new Date().toISOString();

    if (integrationType === 'meta') {
        const entry = payload.entry?.[0]?.changes?.[0]?.value;
        const msg = entry?.messages?.[0];
        const contact = entry?.contacts?.[0];

        if (!msg) return; // Ignore status updates / non-message events

        phone = msg.from;
        text = msg.text?.body || '[media]';
        name = contact?.profile?.name || phone;

    } else if (integrationType === 'evolution') {
        const data = payload.data || payload;
        const key = data.key || {};
        phone = key.remoteJid?.split('@')[0] || '';
        text = data.message?.conversation || data.message?.extendedTextMessage?.text || '';
        name = data.pushName || phone;

    } else if (integrationType === 'twilio') {
        phone = payload.From?.replace('whatsapp:', '') || '';
        text = payload.Body || '';
        name = payload.ProfileName || phone;
    }

    if (!phone || !text) return;

    // 3. Find or create contact
    let contactId;
    const contactResult = await dbQuery(
        'crm_db',
        'SELECT id, name FROM contacts WHERE phone = $1',
        [phone]
    );
    if (contactResult.rows.length > 0) {
        contactId = contactResult.rows[0].id;
    } else {
        const newContact = await dbQuery(
            'crm_db',
            'INSERT INTO contacts (phone, name) VALUES ($1, $2) RETURNING id',
            [phone, name]
        );
        contactId = newContact.rows[0].id;
    }

    // 4. Find or create open conversation
    let convId;
    const convResult = await dbQuery(
        'crm_db',
        "SELECT id FROM conversations WHERE contact_id = $1 AND integration_id = $2 AND status = 'open'",
        [contactId, integration.id]
    );

    if (convResult.rows.length > 0) {
        convId = convResult.rows[0].id;
    } else {
        const newConv = await dbQuery(
            'crm_db',
            'INSERT INTO conversations (integration_id, contact_id, status) VALUES ($1, $2, $3) RETURNING id',
            [integration.id, contactId, 'open']
        );
        convId = newConv.rows[0].id;
    }

    // 5. Save inbound message
    await dbQuery(
        'crm_db',
        'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3)',
        [convId, 'user', text]
    );

    // 6. Notify agent (if configured)
    try {
        const agentResult = await dbQuery(
            'crm_db',
            'SELECT webhook_url FROM agents WHERE active = true ORDER BY created_at DESC LIMIT 1'
        );
        if (agentResult.rows.length > 0) {
            const agentUrl = agentResult.rows[0].webhook_url;
            await fetch(agentUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contacto: name,
                    telefono: phone,
                    mensaje: text,
                    timestamp,
                    integration_id: integration.id,
                    conversation_id: convId,
                }),
            });
        }
    } catch (e) {
        console.error('Failed to notify agent:', e);
    }
}

// ─── GET: Webhook verification challenge (Meta) ──────────────────────────────
export async function GET(
    req: Request,
    { params }: { params: Promise<{ type: string; name: string }> }
) {
    const { type, name } = await params;

    // Only META uses webhook verification challenge
    if (type.toLowerCase() !== 'meta') {
        return new Response('OK', { status: 200 });
    }

    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (!mode || !token || !challenge) {
        return NextResponse.json(
            { error: 'Missing hub.mode, hub.verify_token, or hub.challenge' },
            { status: 400 }
        );
    }

    if (mode !== 'subscribe') {
        return NextResponse.json({ error: 'Invalid hub.mode' }, { status: 403 });
    }

    // Look up the integration by name and verify the token
    try {
        const intResult = await dbQuery(
            'crm_db',
            "SELECT config FROM integrations WHERE name = $1 AND type = 'META' AND active = true",
            [name]
        );

        if (intResult.rows.length === 0) {
            console.warn(`Webhook verification: integration "${name}" not found`);
            return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
        }

        const config = intResult.rows[0].config;
        const expectedToken = config?.verify_token;

        if (token !== expectedToken) {
            console.warn(`Webhook verification failed for "${name}": token mismatch`);
            return NextResponse.json({ error: 'Token mismatch' }, { status: 403 });
        }

        // Respond with the challenge to confirm ownership
        console.log(`✅ Webhook verified for integration: ${name}`);
        return new Response(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        });
    } catch (e: any) {
        console.error('Webhook verification error:', e);
        return NextResponse.json({ error: 'Server error during verification' }, { status: 500 });
    }
}

// ─── POST: Receive incoming messages ────────────────────────────────────────
export async function POST(
    req: Request,
    { params }: { params: Promise<{ type: string; name: string }> }
) {
    const { type, name } = await params;

    try {
        let payload: any;

        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            payload = Object.fromEntries(formData);
        } else {
            payload = await req.json();
        }

        // Process async (respond 200 immediately to Meta)
        processIncomingMessage(name, type, payload).catch(e => {
            console.error(`[Webhook ${type}/${name}] Processing error:`, e.message);
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (e: any) {
        console.error(`[Webhook ${type}/${name}] Error:`, e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
