const { Pool } = require('pg');

const crmUrl = process.env.CRM_DATABASE_URL || 'postgres://crm_user:Mineria99*@187.77.57.116:5432/crm_db?sslmode=disable';

async function setupDb() {
    const pool = new Pool({ connectionString: crmUrl });

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS integrations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                type VARCHAR(50) NOT NULL, -- 'META', 'EVOLUTION', 'TWILIO'
                name VARCHAR(100) NOT NULL,
                config JSONB NOT NULL,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS agents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                model VARCHAR(50) NOT NULL,
                prompt TEXT NOT NULL,
                webhook_url VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS contacts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                phone VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(100),
                attributes JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
                contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                sender_type VARCHAR(50) NOT NULL, -- 'user', 'agent', 'system'
                content TEXT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Tables created successfully");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

setupDb();
