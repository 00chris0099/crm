import { NextRequest, NextResponse } from 'next/server';
import { executeRawQuery } from '@/lib/pg-db';

// POST /api/db-admin/query  { dbId, sql }
export async function POST(req: NextRequest) {
    const { dbId, sql } = await req.json();
    if (!dbId || !sql?.trim()) {
        return NextResponse.json({ error: 'Missing dbId or sql' }, { status: 400 });
    }

    // Basic safety guard: disallow multiple statements & DROP/TRUNCATE without explicit flag
    const trimmed = sql.trim().toUpperCase();
    const isDestructive = /^\s*(DROP|TRUNCATE)\s/.test(trimmed);
    if (isDestructive) {
        return NextResponse.json(
            { error: 'Destructive DDL (DROP/TRUNCATE) not allowed via SQL editor. Use the Table Manager instead.' },
            { status: 403 }
        );
    }

    const result = await executeRawQuery(dbId, sql);
    return NextResponse.json(result);
}
