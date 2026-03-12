import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

// ─── GET: List all integrations (or filter by type) ─────────────────────────
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        let query = 'SELECT * FROM integrations ORDER BY created_at DESC';
        const params: any[] = [];

        if (type) {
            query = 'SELECT * FROM integrations WHERE type = $1 ORDER BY created_at DESC';
            params.push(type.toUpperCase());
        }

        const result = await dbQuery('crm_db', query, params.length ? params : undefined);
        return NextResponse.json({ integrations: result.rows });
    } catch (error) {
        console.error('Error fetching integrations:', error);
        return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }
}

// ─── POST: Create a new META integration ────────────────────────────────────
export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { type, name, display_name, config, active } = data;

        if (!type || !name || !config) {
            return NextResponse.json({ error: 'Missing required fields: type, name, config' }, { status: 400 });
        }

        // Validate META required fields
        if (type === 'META') {
            const { access_token, phone_number_id, verify_token } = config;
            if (!access_token || !phone_number_id || !verify_token) {
                return NextResponse.json(
                    { error: 'Para META se requieren: access_token, phone_number_id, verify_token' },
                    { status: 400 }
                );
            }
        }

        // Check for duplicate name+type
        const existing = await dbQuery(
            'crm_db',
            'SELECT id FROM integrations WHERE name = $1 AND type = $2',
            [name, type.toUpperCase()]
        );
        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: `Ya existe una integración ${type} con el nombre "${name}". Usa un nombre diferente.` },
                { status: 409 }
            );
        }

        // Insert into DB - try with display_name column first, fallback without it
        let result;
        try {
            result = await dbQuery(
                'crm_db',
                `INSERT INTO integrations (type, name, config, active)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [type.toUpperCase(), name, JSON.stringify(config), active ?? true]
            );
        } catch (dbErr: any) {
            console.error('DB insert error:', dbErr);
            return NextResponse.json({ error: `Database error: ${dbErr.message}` }, { status: 500 });
        }

        return NextResponse.json({ integration: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating integration:', error);
        return NextResponse.json({ error: error.message || 'Failed to create integration' }, { status: 500 });
    }
}

// ─── DELETE: Remove an integration by ID ────────────────────────────────────
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing integration ID' }, { status: 400 });
        }

        await dbQuery('crm_db', 'DELETE FROM integrations WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting integration:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete integration' }, { status: 500 });
    }
}

// ─── PATCH: Toggle active status ────────────────────────────────────────────
export async function PATCH(req: Request) {
    try {
        const { id, active } = await req.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const result = await dbQuery(
            'crm_db',
            'UPDATE integrations SET active = $1 WHERE id = $2 RETURNING *',
            [active, id]
        );
        return NextResponse.json({ integration: result.rows[0] });
    } catch (error: any) {
        console.error('Error updating integration:', error);
        return NextResponse.json({ error: error.message || 'Failed to update integration' }, { status: 500 });
    }
}
