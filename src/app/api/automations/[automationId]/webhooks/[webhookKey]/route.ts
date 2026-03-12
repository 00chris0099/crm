import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { automationId: string, webhookKey: string } }) {
    try {
        const body = await req.json();
        
        // 1. Validar que la automatización params.automationId existe y está activa.
        // 2. Comprobar que params.webhookKey coincide con los webhooks registrados.
        // 3. Procesar las acciones (ej: outboung message, update lead status, etc.)
        
        return NextResponse.json({ success: true, processed_by: params.automationId });
    } catch(err) {
        return NextResponse.json({ error: 'Failed executing automation webhook' }, { status: 500 });
    }
}
