import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ integrationId: string }> }) {
    const { integrationId } = await params;
    // Verificación de webhook con Meta usando custom config del integrationId
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Lógica futura: buscar la integración (integrationId), sacar su verify_token esperado.
    // Por ahora aceptamos por retrocompatibilidad.
    if (challenge) {
        return new NextResponse(challenge, { status: 200 });
    }
    
    return NextResponse.json({ error: 'Falta parametro hub.challenge' }, { status: 400 });
}

export async function POST(req: Request, { params }: { params: Promise<{ integrationId: string }> }) {
    const { integrationId } = await params;
    // Procesar los mensajes entrantes basados en la config de esta iteración.
    try {
        const body = await req.json();
        // Determinar rules, invocar al InboundMessageOrchestrator, etc.
        
        return NextResponse.json({ success: true, integration: integrationId }, { status: 200 });
    } catch(err) {
        console.error('Error Meta Webhook:', err);
        return NextResponse.json({ error: 'processing error' }, { status: 500 });
    }
}
