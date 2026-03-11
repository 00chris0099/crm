import { NextRequest, NextResponse } from 'next/server';
import { getColumns, getTableData } from '@/lib/pg-db';

// GET /api/db-admin/schema?db=crm_db&schema=public&table=contacts
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const dbId = searchParams.get('db');
    const schema = searchParams.get('schema') ?? 'public';
    const table = searchParams.get('table');
    if (!dbId || !table) {
        return NextResponse.json({ error: 'Missing db or table param' }, { status: 400 });
    }
    try {
        const columns = await getColumns(dbId, schema, table);
        return NextResponse.json({ columns });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
