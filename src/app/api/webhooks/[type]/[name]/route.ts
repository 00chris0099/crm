import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

async function processIncomingMessage(
    integration_name: string,
    integrationType: string,
    payload: any
) {
    // 1. Fetch integration to verify it's active
    const intResult = await dbQuery('crm_db', 'SELECT * FROM integrations WHERE name = $1 AND type = $2 AND active = true', [integration_name, integrationType.toUpperCase()]);
    
    if (intResult.rows.length === 0) {
        throw new Error('Integration not found or inactive');
    }
    const integration = intResult.rows[0];

    // parse basic info depending on type
    let phone = '';
    let name = '';
    let text = '';
    let timestamp = new Date().toISOString();

    if (integrationType === 'meta') {
        const entry = payload.entry?.[0]?.changes?.[0]?.value;
        const msg = entry?.messages?.[0];
        const contact = entry?.contacts?.[0];
        if (!msg) return; // ignore status updates
        
        phone = msg.from;
        text = msg.text?.body || '';
        name = contact?.profile?.name || phone;
    } else if (integrationType === 'evolution') {
        // Evolution API structure
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

    if (!phone || !text) return; // Invalid

    // 2. Find or create contact
    let contactId;
    const contactResult = await dbQuery('crm_db', 'SELECT id, name FROM contacts WHERE phone = $1', [phone]);
    if (contactResult.rows.length > 0) {
        contactId = contactResult.rows[0].id;
    } else {
        const newContact = await dbQuery('crm_db', 'INSERT INTO contacts (phone, name) VALUES ($1, $2) RETURNING id', [phone, name]);
        contactId = newContact.rows[0].id;
    }

    // 3. Find or create open conversation
    let convId;
    const convResult = await dbQuery('crm_db', "SELECT id FROM conversations WHERE contact_id = $1 AND integration_id = $2 AND status = 'open'", [contactId, integration.id]);
    
    if (convResult.rows.length > 0) {
        convId = convResult.rows[0].id;
    } else {
        const newConv = await dbQuery('crm_db', 'INSERT INTO conversations (integration_id, contact_id, status) VALUES ($1, $2, $3) RETURNING id', [integration.id, contactId, 'open']);
        convId = newConv.rows[0].id;
    }

    // 4. Save user message
    await dbQuery('crm_db', 'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3)', [convId, 'user', text]);

    // 5. Fire webhook to Agent
    const agentResult = await dbQuery('crm_db', 'SELECT webhook_url FROM agents ORDER BY created_at DESC LIMIT 1');
    if (agentResult.rows.length > 0) {
        const agentUrl = agentResult.rows[0].webhook_url;
        const agentPayload = {
            contacto: name,
            telefono: phone,
            mensaje: text,
            timestamp: timestamp,
            integration_id: integration.id,
            conversation_id: convId
        };
        
        try {
            await fetch(agentUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentPayload)
            });
        } catch (e) {
            console.error('Failed to notify agent:', e);
        }
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ type: string, name: string }> }) {
    const { type, name } = await params;
    // Webhook verification for Meta
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode && token) {
        // verify dynamically
        const intResult = await dbQuery('crm_db', 'SELECT config FROM integrations WHERE name = $1 AND type = $2', [name, type.toUpperCase()]);
        if (intResult.rows.length > 0 && intResult.rows[0].config.verify_token === token) {
            return new Response(challenge, { status: 200 });
        }
    }
    return new Response('OK', { status: 200 });
}

export async function POST(req: Request, { params }: { params: Promise<{ type: string, name: string }> }) {
    const { type, name } = await params;
    try {
        let payload;
        
        // Handle form-data (twilio) or JSON
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            payload = Object.fromEntries(formData);
        } else {
            payload = await req.json();
        }

        await processIncomingMessage(name, type, payload);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Webhook error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
