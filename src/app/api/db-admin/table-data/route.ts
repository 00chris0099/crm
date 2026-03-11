import { NextRequest, NextResponse } from 'next/server';
import { getTableData } from '@/lib/pg-db';

// GET /api/db-admin/table-data?db=&schema=&table=&page=1&pageSize=50&sort=&dir=ASC&search=
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const dbId = searchParams.get('db');
    const schema = searchParams.get('schema') ?? 'public';
    const table = searchParams.get('table');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(200, Math.max(10, Number(searchParams.get('pageSize') ?? 50)));
    const sortCol = searchParams.get('sort') ?? undefined;
    const sortDir = (searchParams.get('dir') ?? 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const search = searchParams.get('search') ?? undefined;
    const filtersRaw = searchParams.get('filters');

    if (!dbId || !table) {
        return NextResponse.json({ error: 'Missing db or table param' }, { status: 400 });
    }

    let filters: { column: string; operator: string; value: string }[] = [];
    if (filtersRaw) {
        try { filters = JSON.parse(filtersRaw); } catch { }
    }

    try {
        const data = await getTableData(dbId, schema, table, {
            page, pageSize, sortCol, sortDir: sortDir as 'ASC' | 'DESC', search, filters,
        });
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// PATCH /api/db-admin/table-data  — update a single cell
export async function PATCH(req: NextRequest) {
    const { dbId, schema, table, primaryKey, primaryValue, column, value } = await req.json();
    if (!dbId || !table || !primaryKey || !column) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { getPool } = await import('@/lib/pg-db');
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '');
    const pool = getPool(dbId);
    const client = await pool.connect();
    try {
        const sql = `UPDATE "${sanitize(schema ?? 'public')}"."${sanitize(table)}"
                 SET "${sanitize(column)}" = $1
                 WHERE "${sanitize(primaryKey)}" = $2
                 RETURNING *`;
        const result = await client.query(sql, [value, primaryValue]);
        return NextResponse.json({ row: result.rows[0] });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}

// POST /api/db-admin/table-data  — insert a new row
export async function POST(req: NextRequest) {
    const { dbId, schema, table, data } = await req.json();
    if (!dbId || !table || !data) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { getPool } = await import('@/lib/pg-db');
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '');
    const pool = getPool(dbId);
    const client = await pool.connect();
    try {
        const cols = Object.keys(data).map((c) => `"${sanitize(c)}"`).join(', ');
        const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO "${sanitize(schema ?? 'public')}"."${sanitize(table)}"
                 (${cols}) VALUES (${placeholders}) RETURNING *`;
        const result = await client.query(sql, Object.values(data));
        return NextResponse.json({ row: result.rows[0] });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}

// DELETE /api/db-admin/table-data  — delete rows
export async function DELETE(req: NextRequest) {
    const { dbId, schema, table, primaryKey, primaryValues } = await req.json();
    if (!dbId || !table || !primaryKey || !primaryValues?.length) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { getPool } = await import('@/lib/pg-db');
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '');
    const pool = getPool(dbId);
    const client = await pool.connect();
    try {
        const placeholders = primaryValues.map((_: unknown, i: number) => `$${i + 1}`).join(', ');
        const sql = `DELETE FROM "${sanitize(schema ?? 'public')}"."${sanitize(table)}"
                 WHERE "${sanitize(primaryKey)}" IN (${placeholders})`;
        await client.query(sql, primaryValues);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
