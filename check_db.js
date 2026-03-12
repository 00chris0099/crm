const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.GLOBAL_DATABASE_URL || 'postgres://postgres:Mineria99*@aimachristian_db_n8n:5432/globaldb?sslmode=disable' });

async function run() {
    try {
        const res = await pool.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('conversations', 'contacts', 'conversation_messages')");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e.message);
    } finally {
        process.exit(0);
    }
}
run();
