import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseStats, getPerTableStats, getSlowQueries } from '@/lib/pg-db';

// GET /api/db-admin/stats?db=crm_db&schema=public
export async function GET(req: NextRequest) {
    const dbId = req.nextUrl.searchParams.get('db');
    const schema = req.nextUrl.searchParams.get('schema') ?? 'public';
    if (!dbId) return NextResponse.json({ error: 'Missing db param' }, { status: 400 });
    try {
        const [dbStats, tableStats, slowQueries] = await Promise.all([
            getDatabaseStats(dbId),
            getPerTableStats(dbId, schema),
            getSlowQueries(dbId),
        ]);
        return NextResponse.json({ dbStats, tableStats, slowQueries });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
