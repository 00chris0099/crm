import { NextResponse } from 'next/server';
import { MessageNormalizationService } from '@/services/messageNormalizationService';
import { InboundMessageOrchestrator } from '@/services/inboundMessageOrchestrator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const normalizedMessages = MessageNormalizationService.normalizeEvolutionMessage(body);
        for (const msg of normalizedMessages) {
            await InboundMessageOrchestrator.process(msg);
        }
        return NextResponse.json({ success: true }, { status: 200 });
    } catch(err) {
        return NextResponse.json({ error: 'processing error' }, { status: 500 });
    }
}
