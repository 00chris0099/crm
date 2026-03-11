import { NextRequest, NextResponse } from 'next/server';
import { getSchemas } from '@/lib/pg-db';

export async function GET(req: NextRequest) {
    const dbId = req.nextUrl.searchParams.get('db');
    if (!dbId) return NextResponse.json({ error: 'Missing db param' }, { status: 400 });
    try {
        const schemas = await getSchemas(dbId);
        return NextResponse.json({ schemas });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
