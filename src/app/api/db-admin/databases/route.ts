import { NextResponse } from 'next/server';
import { DATABASES, testConnection, getDatabaseStats } from '@/lib/pg-db';

export async function GET() {
    const results = await Promise.all(
        DATABASES.map(async (db) => {
            const conn = await testConnection(db.id);
            let stats = { size: 'N/A', activeConnections: 0 };
            if (conn.ok) {
                try { stats = await getDatabaseStats(db.id); } catch { }
            }
            return {
                id: db.id,
                name: db.name,
                color: db.color,
                description: db.description,
                status: conn.ok ? 'connected' : 'error',
                error: conn.error,
                version: conn.version,
                ...stats,
            };
        })
    );
    return NextResponse.json({ databases: results });
}
