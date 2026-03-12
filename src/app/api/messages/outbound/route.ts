import { NextRequest, NextResponse } from 'next/server';
import { MessagesController } from '@/controllers/messagesController';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await MessagesController.handleOutbound(body);
        return NextResponse.json(result, { status: 200 });
    } catch (e: any) {
        console.error('Outbound Message Error:', e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
