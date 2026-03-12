import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ integrationId: string }> }) {
    try {
        const { integrationId } = await params;
        const body = await req.json();
        // Lógica para procesar el webhook de Evolution de forma modular, sabiendo qué
        // instancia/integración es dueña del evento por el integrationId.
        
        return NextResponse.json({ success: true, received: true });
    } catch(err) {
        console.error('Evolution Webhook error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
