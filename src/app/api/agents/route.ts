import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

export async function GET() {
    try {
        const result = await dbQuery('crm_db', 'SELECT * FROM agents ORDER BY created_at DESC');
        return NextResponse.json({ agents: result.rows });
    } catch (error) {
        console.error('Error fetching agents:', error);
        return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { name, model, prompt, webhook_url } = data;

        if (!name || !model || !prompt || !webhook_url) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await dbQuery(
            'crm_db',
            `INSERT INTO agents (name, model, prompt, webhook_url) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, model, prompt, webhook_url]
        );

        return NextResponse.json({ agent: result.rows[0] });
    } catch (error) {
        console.error('Error creating agent:', error);
        return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }
}
