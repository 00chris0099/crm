import { Pool, QueryResultRow } from 'pg';

export interface DatabaseConfig {
    id: string;
    name: string;
    url: string;
    color: string;
    description?: string;
}

export const DATABASES: DatabaseConfig[] = [
    {
        id: 'crm_db',
        name: 'CRM Database',
        url: process.env.CRM_DATABASE_URL ?? '',
        color: '#6366f1',
        description: 'Base de datos principal del CRM',
    },
    {
        id: 'n8n_data',
        name: 'n8n Workflows',
        url: process.env.N8N_DATABASE_URL ?? '',
        color: '#f59e0b',
        description: 'Base de datos de automatizaciones n8n',
    },
    {
        id: 'globaldb',
        name: 'Omnichannel Database',
        url: process.env.GLOBAL_DATABASE_URL ?? 'postgres://postgres:Mineria99*@aimachristian_db_n8n:5432/globaldb?sslmode=disable',
        color: '#10b981',
        description: 'Base de datos principal para el CRM y múltiples canales de automatización',
    },
];

// Pool cache — one pool per database
const pools = new Map<string, Pool>();

export function getPool(dbId: string): Pool {
    if (pools.has(dbId)) return pools.get(dbId)!;

    const config = DATABASES.find((d) => d.id === dbId);
    if (!config) throw new Error(`Database "${dbId}" not found`);
    if (!config.url) throw new Error(`No URL configured for database "${dbId}"`);

    const pool = new Pool({
        connectionString: config.url,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
        console.error(`[pg-pool:${dbId}] Unexpected error:`, err.message);
    });

    pools.set(dbId, pool);
    return pool;
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
    dbId: string,
    sql: string,
    params: unknown[] = []
) {
    const pool = getPool(dbId);
    const client = await pool.connect();
    try {
        return await client.query<T>(sql, params as string[]);
    } finally {
        client.release();
    }
}

export async function testConnection(
    dbId: string
): Promise<{ ok: boolean; error?: string; version?: string }> {
    try {
        const result = await dbQuery(dbId, 'SELECT version() AS v');
        return { ok: true, version: String(result.rows[0]?.v ?? '') };
    } catch (err) {
        return { ok: false, error: (err as Error).message };
    }
}

// ——————————————————————————————————————————
// Schema helpers
// ——————————————————————————————————————————

function extractDbName(url: string) {
    try {
        return new URL(url.replace(/^postgres(ql)?:\/\//, 'http://')).pathname.slice(1).split('?')[0];
    } catch {
        return '';
    }
}

export async function getDatabaseStats(dbId: string) {
    const config = DATABASES.find((d) => d.id === dbId)!;
    const dbName = extractDbName(config.url);

    const sizeResult = await dbQuery(
        dbId,
        `SELECT pg_size_pretty(pg_database_size($1)) AS size`,
        [dbName]
    );
    const connResult = await dbQuery(
        dbId,
        `SELECT count(*) AS count FROM pg_stat_activity WHERE datname = $1`,
        [dbName]
    );

    return {
        size: String(sizeResult.rows[0]?.size ?? 'N/A'),
        activeConnections: Number(connResult.rows[0]?.count ?? 0),
    };
}

export async function getSchemas(dbId: string): Promise<string[]> {
    const result = await dbQuery(
        dbId,
        `SELECT schema_name FROM information_schema.schemata
     WHERE schema_name NOT IN ('pg_catalog','information_schema','pg_toast')
     ORDER BY schema_name`
    );
    return result.rows.map((r) => String(r.schema_name));
}

export async function getTables(dbId: string, schema = 'public') {
    const result = await dbQuery(
        dbId,
        `SELECT
       t.table_name,
       t.table_type,
       pg_size_pretty(pg_total_relation_size(
         quote_ident(t.table_schema)||'.'||quote_ident(t.table_name)
       )) AS size,
       (SELECT reltuples::bigint FROM pg_class
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE relname = t.table_name AND pg_namespace.nspname = t.table_schema
       ) AS row_estimate
     FROM information_schema.tables t
     WHERE t.table_schema = $1
     ORDER BY t.table_type, t.table_name`,
        [schema]
    );
    return result.rows;
}

export async function getColumns(dbId: string, schema: string, table: string) {
    const result = await dbQuery(
        dbId,
        `SELECT
       c.column_name,
       c.data_type,
       c.character_maximum_length,
       c.is_nullable,
       c.column_default,
       c.ordinal_position,
       c.udt_name,
       CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key,
       fk.foreign_table_schema,
       fk.foreign_table_name,
       fk.foreign_column_name
     FROM information_schema.columns c
     LEFT JOIN (
       SELECT ku.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage ku
         ON tc.constraint_name = ku.constraint_name AND tc.table_schema = ku.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_schema = $1 AND tc.table_name = $2
     ) pk ON pk.column_name = c.column_name
     LEFT JOIN (
       SELECT
         kcu.column_name,
         ccu.table_schema AS foreign_table_schema,
         ccu.table_name  AS foreign_table_name,
         ccu.column_name AS foreign_column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_schema = $1 AND tc.table_name = $2
     ) fk ON fk.column_name = c.column_name
     WHERE c.table_schema = $1 AND c.table_name = $2
     ORDER BY c.ordinal_position`,
        [schema, table]
    );
    return result.rows;
}

export interface TableDataOptions {
    page?: number;
    pageSize?: number;
    sortCol?: string;
    sortDir?: 'ASC' | 'DESC';
    search?: string;
    filters?: { column: string; operator: string; value: string }[];
}

export async function getTableData(
    dbId: string,
    schema: string,
    table: string,
    options: TableDataOptions = {}
) {
    const {
        page = 1,
        pageSize = 50,
        sortCol,
        sortDir = 'ASC',
        search,
        filters = [],
    } = options;
    const offset = (page - 1) * pageSize;

    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '');
    const qualifiedTable = `"${sanitize(schema)}"."${sanitize(table)}"`;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
        conditions.push(`CAST(ROW_TO_JSON(${qualifiedTable}.*) AS TEXT) ILIKE $${idx}`);
        params.push(`%${search}%`);
        idx++;
    }

    for (const f of filters) {
        const col = `"${sanitize(f.column)}"`;
        switch (f.operator) {
            case 'eq':
                conditions.push(`${col} = $${idx}`); params.push(f.value); idx++; break;
            case 'neq':
                conditions.push(`${col} != $${idx}`); params.push(f.value); idx++; break;
            case 'contains':
                conditions.push(`${col}::text ILIKE $${idx}`); params.push(`%${f.value}%`); idx++; break;
            case 'starts_with':
                conditions.push(`${col}::text ILIKE $${idx}`); params.push(`${f.value}%`); idx++; break;
            case 'gt':
                conditions.push(`${col} > $${idx}`); params.push(f.value); idx++; break;
            case 'lt':
                conditions.push(`${col} < $${idx}`); params.push(f.value); idx++; break;
            case 'is_null':
                conditions.push(`${col} IS NULL`); break;
            case 'not_null':
                conditions.push(`${col} IS NOT NULL`); break;
        }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = sortCol
        ? `ORDER BY "${sanitize(sortCol)}" ${sortDir === 'DESC' ? 'DESC' : 'ASC'}`
        : '';

    const countResult = await dbQuery(
        dbId,
        `SELECT COUNT(*) AS total FROM ${qualifiedTable} ${where}`,
        params as string[]
    );
    const total = Number(countResult.rows[0]?.total ?? 0);

    const dataParams = [...params, pageSize, offset];
    const dataResult = await dbQuery(
        dbId,
        `SELECT * FROM ${qualifiedTable} ${where} ${orderBy} LIMIT $${idx} OFFSET $${idx + 1}`,
        dataParams as string[]
    );

    return {
        rows: dataResult.rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

export async function getPerTableStats(dbId: string, schema = 'public') {
    const result = await dbQuery(
        dbId,
        `SELECT
       relname AS table_name,
       n_live_tup AS row_count,
       pg_size_pretty(pg_total_relation_size(
         quote_ident($1)||'.'||quote_ident(relname)
       )) AS total_size,
       pg_total_relation_size(
         quote_ident($1)||'.'||quote_ident(relname)
       ) AS total_size_bytes
     FROM pg_stat_user_tables
     WHERE schemaname = $1
     ORDER BY total_size_bytes DESC`,
        [schema]
    );
    return result.rows;
}

export async function getSlowQueries(dbId: string) {
    try {
        const result = await dbQuery(
            dbId,
            `SELECT
         LEFT(query, 200) AS query,
         calls,
         round(total_exec_time::numeric, 2) AS total_ms,
         round(mean_exec_time::numeric, 2)  AS avg_ms
       FROM pg_stat_statements
       ORDER BY mean_exec_time DESC
       LIMIT 10`
        );
        return result.rows;
    } catch {
        return [];
    }
}

export async function executeRawQuery(dbId: string, sql: string) {
    const start = Date.now();
    try {
        const result = await dbQuery(dbId, sql);
        return {
            ok: true,
            rows: result.rows,
            rowCount: result.rowCount ?? 0,
            fields: result.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
            durationMs: Date.now() - start,
        };
    } catch (err) {
        return {
            ok: false,
            error: (err as Error).message,
            durationMs: Date.now() - start,
        };
    }
}
