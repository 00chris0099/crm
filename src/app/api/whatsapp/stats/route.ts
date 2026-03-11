import { NextResponse } from 'next/server';
import { getPhoneNumberInfo, getAccountHealth, getAnalytics } from '@/lib/whatsapp';
import { dbQuery } from '@/lib/pg-db';

export async function GET() {
    try {
        const [phoneInfo, accountInfo, analytics] = await Promise.allSettled([
            getPhoneNumberInfo(),
            getAccountHealth(),
            getAnalytics('DAY', 7),
        ]);

        // n8n stats from n8n_chat_histories (schema: id, session_id, message jsonb)
        let n8nStats = { totalSessions: 0, totalMessages: 0, activeSessions: 0 };
        try {
            const sessResult = await dbQuery<{ total: string; active: string }>(
                'n8n_data',
                // "active" sessions: session_ids whose most recent message has id >= (MAX(id) - 50)
                `SELECT
           COUNT(DISTINCT session_id) AS total,
           COUNT(DISTINCT CASE
             WHEN session_id IN (
               SELECT session_id FROM n8n_chat_histories
               WHERE id >= (SELECT MAX(id) FROM n8n_chat_histories) - 200
             ) THEN session_id END
           ) AS active
         FROM n8n_chat_histories`
            );
            const msgResult = await dbQuery<{ total: string }>(
                'n8n_data',
                `SELECT COUNT(*) AS total FROM n8n_chat_histories`
            );
            n8nStats = {
                totalSessions: Number(sessResult.rows[0]?.total ?? 0),
                activeSessions: Number(sessResult.rows[0]?.active ?? 0),
                totalMessages: Number(msgResult.rows[0]?.total ?? 0),
            };
        } catch { /* n8n DB might not be available */ }

        const analyticsData = analytics.status === 'fulfilled' ? analytics.value : null;
        const dataPoints = analyticsData?.analytics?.data_points ?? [];
        const totalSent = dataPoints.reduce((a, d) => a + (d.sent ?? 0), 0);
        const totalDelivered = dataPoints.reduce((a, d) => a + (d.delivered ?? 0), 0);
        const totalRead = dataPoints.reduce((a, d) => a + (d.read ?? 0), 0);

        return NextResponse.json({
            phone: phoneInfo.status === 'fulfilled' ? phoneInfo.value : null,
            account: accountInfo.status === 'fulfilled' ? accountInfo.value : null,
            analytics: {
                period: '7 days',
                totalSent,
                totalDelivered,
                totalRead,
                deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
                readRate: totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0,
                dataPoints,
            },
            n8nStats,
        });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
