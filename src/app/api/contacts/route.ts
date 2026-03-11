import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const lead_status = searchParams.get('lead_status') || '';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = 'SELECT * FROM contacts WHERE 1=1';
        const params: (string | number)[] = [];

        if (search) {
            query += ' AND (name LIKE ? OR phone LIKE ? OR company LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (lead_status) {
            query += ' AND lead_status = ?';
            params.push(lead_status);
        }

        query += ' ORDER BY last_activity DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const contacts = db.prepare(query).all(...params);

        const totalQuery = `SELECT COUNT(*) as count FROM contacts WHERE 1=1
      ${search ? 'AND (name LIKE ? OR phone LIKE ? OR company LIKE ?)' : ''}
      ${lead_status ? 'AND lead_status = ?' : ''}`;
        const total = (db.prepare(totalQuery).get(...params.slice(0, -2)) as { count: number }).count;

        return NextResponse.json({ contacts, total, limit, offset });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const db = getDb();
        const body = await request.json();
        const { name, phone, wa_id, email, company, lead_status = 'frio', notes } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: 'name and phone are required' }, { status: 400 });
        }

        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#f97316'];
        const avatar_color = colors[Math.floor(Math.random() * colors.length)];

        const result = db.prepare(`
      INSERT INTO contacts (name, phone, wa_id, email, company, lead_status, notes, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, phone, wa_id || phone, email, company, lead_status, notes, avatar_color);

        const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json({ contact }, { status: 201 });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'Contact with this phone already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const db = getDb();
        const body = await request.json();
        const { id, name, phone, email, company, lead_status, notes } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        db.prepare(`
      UPDATE contacts 
      SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email),
          company = COALESCE(?, company), lead_status = COALESCE(?, lead_status),
          notes = COALESCE(?, notes), updated_at = datetime('now')
      WHERE id = ?
    `).run(name, phone, email, company, lead_status, notes, id);

        const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
        return NextResponse.json({ contact });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
