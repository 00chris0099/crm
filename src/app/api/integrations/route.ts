import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

export async function GET() {
    try {
        const result = await dbQuery('crm_db', 'SELECT * FROM integrations ORDER BY created_at DESC');
        return NextResponse.json({ integrations: result.rows });
    } catch (error) {
        console.error('Error fetching integrations:', error);
        return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { type, name, config, active } = data;

        if (!type || !name || !config) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await dbQuery(
            'crm_db',
            `INSERT INTO integrations (type, name, config, active) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [type, name, JSON.stringify(config), active ?? true]
        );

        return NextResponse.json({ integration: result.rows[0] });
    } catch (error) {
        console.error('Error creating integration:', error);
        return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
    }
}
