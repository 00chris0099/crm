const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.CRM_DATABASE_URL || 'postgres://crm_user:Mineria99*@187.77.57.116:5432/crm_db?sslmode=disable' });
const sql = `
CREATE TABLE IF NOT EXISTS crm_messages (
id SERIAL PRIMARY KEY,
phone TEXT,
contact_name TEXT,
message_type TEXT,
message_text TEXT,
media_id TEXT,
media_url TEXT,
direction TEXT,
agent_type TEXT,
message_id TEXT,
timestamp BIGINT,
metadata JSONB,
created_at TIMESTAMP DEFAULT NOW()
)`;
pool.query(sql).then(() => {
    console.log('Table created or exists');
    process.exit(0);
}).catch(console.error);
