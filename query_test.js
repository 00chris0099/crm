const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://admin:46be46def45864757b3f@187.77.57.116:5433/n8n_data?sslmode=disable' });
pool.query('SELECT id, session_id, message->>\'type\' as raw_type, message->>\'content\' as content FROM n8n_chat_histories ORDER BY id DESC LIMIT 10').then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
});
