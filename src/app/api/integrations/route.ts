import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';

export async function GET() {
    try {
        const result = await dbQuery('crm_db', 'SELECT * FROM integrations ORDER BY created_at DESC');
        return NextResponse.json({ integrations: result.rows });
    } catch (error) {
        console.error('Error fetching integrations:', error);
        return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { type, name, config, active } = data;

        if (!type || !name || !config) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const webhookUrl = config.webhook_url;

        // --- Lógica de creación automática de Webhooks en plataformas externas ---
        
        if (type === 'EVOLUTION') {
            const { server_url, api_key, instance_name } = config;
            try {
                const evoRes = await fetch(`${server_url}/webhook/set/${instance_name}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'apikey': api_key 
                    },
                    body: JSON.stringify({
                        url: webhookUrl,
                        enabled: true,
                        events: [
                            "MESSAGES_UPSERT",
                            "MESSAGES_UPDATE",
                            "MESSAGES_SET",
                            "SEND_MESSAGE"
                        ]
                    })
                });
                if (!evoRes.ok) console.error('Evolution API error:', await evoRes.text());
            } catch (e) {
                console.error('Failed to set Evolution webhook:', e);
            }
        } 
        
        else if (type === 'TWILIO') {
            const { account_sid, auth_token, twilio_phone_number } = config;
            const auth = Buffer.from(`${account_sid}:${auth_token}`).toString('base64');
            try {
                const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account_sid}/IncomingPhoneNumbers/${twilio_phone_number}.json`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        'SmsUrl': webhookUrl,
                        'SmsMethod': 'POST'
                    })
                });
                if (!twilioRes.ok) console.error('Twilio API error:', await twilioRes.text());
            } catch (e) {
                console.error('Failed to set Twilio webhook:', e);
            }
        }

        else if (type === 'META') {
            const { app_id, app_secret, verify_token } = config;
            try {
                const tokenRes = await fetch(`https://graph.facebook.com/oauth/access_token?client_id=${app_id}&client_secret=${app_secret}&grant_type=client_credentials`);
                const tokenData = await tokenRes.json();
                const appToken = tokenData.access_token;

                if (appToken) {
                    const subRes = await fetch(`https://graph.facebook.com/${app_id}/subscriptions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            access_token: appToken,
                            object: 'whatsapp_business_account',
                            callback_url: webhookUrl,
                            verify_token: verify_token,
                            fields: ['messages', 'message_echoes', 'message_statuses']
                        })
                    });
                    if (!subRes.ok) console.error('Meta API error:', await subRes.text());
                }
            } catch (e) {
                console.error('Failed to set Meta webhook:', e);
            }
        }

        const result = await dbQuery(
            'crm_db',
            `INSERT INTO integrations (type, name, config, active) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [type, name, JSON.stringify(config), active ?? true]
        );

        return NextResponse.json({ integration: result.rows[0] });
    } catch (error) {
        console.error('Error creating integration:', error);
        return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
    }
}
