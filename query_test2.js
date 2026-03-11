const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://admin:46be46def45864757b3f@187.77.57.116:5433/n8n_data?sslmode=disable' });

function extractPhone(sessionId) {
    try {
        if (sessionId.startsWith('phone_')) return sessionId.slice(6);
        const b64 = sessionId.startsWith('wamid.') ? sessionId.slice(6) : sessionId;
        const decoded = Buffer.from(b64, 'base64').toString('ascii');
        const match = decoded.match(/\\d{8,}/);
        if (match) return match[0];
    } catch (e) { /* ignore */ }
    return null;
}

pool.query('SELECT DISTINCT session_id FROM n8n_chat_histories').then(res => {
    const requestSessionId = '51955250185';
    const targetSessionIds = res.rows
        .map(r => r.session_id)
        .filter(sid => (extractPhone(sid) || sid) === requestSessionId);

    console.log("Target session IDs:", targetSessionIds);
    process.exit(0);
});
