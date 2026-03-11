import { NextRequest, NextResponse } from 'next/server';
import { getTables, getPerTableStats } from '@/lib/pg-db';

export async function GET(req: NextRequest) {
    const dbId = req.nextUrl.searchParams.get('db');
    const schema = req.nextUrl.searchParams.get('schema') || 'public';
    if (!dbId) return NextResponse.json({ error: 'Missing db param' }, { status: 400 });
    try {
        const [tables, stats] = await Promise.all([
            getTables(dbId, schema),
            getPerTableStats(dbId, schema).catch(() => []),
        ]);
        const statsMap = Object.fromEntries(
            (stats as { table_name: string; row_count: number; total_size: string }[]).map((s) => [s.table_name, s])
        );
        const enriched = tables.map((t) => ({
            ...t,
            row_count: statsMap[t.table_name as string]?.row_count ?? t.row_estimate,
            total_size: statsMap[t.table_name as string]?.total_size ?? t.size,
        }));
        return NextResponse.json({ tables: enriched });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
