import { NextResponse } from 'next/server';
import { OutboundMessagingService } from '@/services/outboundMessagingService';
import { dbQuery } from '@/lib/pg-db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // n8n sends { conversation_id, text, channel_provider, contact_phone }
        await dbQuery('globaldb', `INSERT INTO conversation_messages (conversation_id, contact_id, role, content, status) VALUES ($1, (SELECT contact_id FROM conversations WHERE id=$1), 'ai', $2, 'sent')`, [body.conversation_id, body.text]);
        await OutboundMessagingService.send(body.channel_provider, body.contact_phone, body.text);

        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
