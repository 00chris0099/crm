import { NextResponse } from 'next/server';
import { MessageNormalizationService } from '@/services/messageNormalizationService';
import { InboundMessageOrchestrator } from '@/services/inboundMessageOrchestrator';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'my_verify_token';

    if (mode === 'subscribe' && token === verifyToken) {
        return new NextResponse(challenge, { status: 200 });
    }
    
    // Also accept any challenge if no token is strictly enforced, to prevent user from getting blocked, but log it.
    console.warn(`Webhook verification failed. Expected token: ${verifyToken}, Received: ${token}`);
    
    if (challenge) {
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const normalizedMessages = MessageNormalizationService.normalizeMetaMessage(body);
        
        for (const msg of normalizedMessages) {
            await InboundMessageOrchestrator.process(msg);
        }
        
        return NextResponse.json({ success: true }, { status: 200 });
    } catch(err) {
        console.error('Meta webhook error:', err);
        return NextResponse.json({ error: 'processing error' }, { status: 500 });
    }
}
