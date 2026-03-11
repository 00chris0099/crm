import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage } from '@/lib/whatsapp';
import { dbQuery } from '@/lib/pg-db';

export async function POST(req: NextRequest) {
    try {
        const { to, text, agent_type = 'human' } = await req.json(); // default to human if sent from CRM dashboard

        if (!to || !text) {
            return NextResponse.json({ error: 'Missing phone number or text' }, { status: 400 });
        }

        // Determine correct agent type for logging
        const finalAgentType = agent_type === 'ai' ? 'ai' : 'human';

        // 1. Send via valid Meta API
        const response = await sendTextMessage(to, text);

        // 2. Log manual reply into n8n_data so it appears in old n8n history
        try {
            const fakeSessionId = `phone_${to}`;
            await dbQuery(
                'n8n_data',
                `INSERT INTO n8n_chat_histories (session_id, message) VALUES ($1, $2)`,
                [
                    fakeSessionId,
                    JSON.stringify({
                        type: 'ai', // Mark manual replies as "ai" so they show up as outgoing bubbles in n8n system
                        content: text,
                        additional_kwargs: { manual_crm_reply: true }
                    })
                ]
            );
        } catch (dbErr) {
            console.error('Failed saving to n8n_data:', dbErr);
        }

        // 3. Log outgoing message seamlessly into crm_messages
        try {
            // Check if response has message IDs
            let messageId = null;
            const resObj = response as any;
            if (resObj && resObj.messages && resObj.messages.length > 0) {
                messageId = resObj.messages[0].id; // The Meta API returns the created WAMID
            }

            await dbQuery(
                'crm_db',
                `INSERT INTO crm_messages (
                    phone, contact_name, message_type, message_text,
                    media_id, media_url, direction, agent_type,
                    message_id, timestamp, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    to, // phone
                    null, // contact_name not easily available strictly from an exact outgoing send
                    'text', // message_type
                    text, // message_text
                    null, // media_id
                    null, // media_url
                    'outgoing', // direction
                    finalAgentType, // agent_type
                    messageId, // message_id
                    Math.floor(Date.now() / 1000).toString(), // UNIX timestamp
                    JSON.stringify({ note: "Sent from CRM API", response }) // metadata
                ]
            );
        } catch (dbErr) {
            console.error('Failed saving into crm_db crm_messages:', dbErr);
        }

        return NextResponse.json({ success: true, response });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
