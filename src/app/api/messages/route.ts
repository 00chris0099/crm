import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/pg-db';
import { OutboundMessagingService } from '@/services/outboundMessagingService';
import { ConversationRepository } from '@/repositories/conversationRepository';

const DB_ID = 'globaldb';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            phone,
            content,
            conversation_id,
            role = 'ai',
        } = body;

        if (!phone || !content || !conversation_id) {
            return NextResponse.json({ error: 'phone, content and conversation_id are required' }, { status: 400 });
        }

        try {
            // Mocking a send operation to the client
            const sendRes = await OutboundMessagingService.send('whatsapp_meta', phone, content);
            const providerMsgId = sendRes.messageId || 'm_' + Date.now();
            
            await ConversationRepository.saveMessage(
                String(conversation_id),
                providerMsgId,
                'outbound',
                'text',
                content,
                null
            );

            await ConversationRepository.updateConversationActivity(String(conversation_id), 'open');

        } catch (dbErr) {
            console.error('Info: Messages save failed in PG globaldb:', dbErr);
        }

        return NextResponse.json({
            success: true,
            conversation_id,
        }, { status: 201 });

    } catch (error) {
        console.error('Error saving message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const conversation_id = searchParams.get('conversation_id');
        const contact_id = searchParams.get('contact_id');
        const limit = parseInt(searchParams.get('limit') || '100');

        if (!conversation_id && !contact_id) {
            return NextResponse.json({ error: 'conversation_id or contact_id required' }, { status: 400 });
        }

        let messages: any[] = [];
        
        try {
            const msgsRes = await dbQuery(DB_ID, `
                SELECT 
                    id, 
                    direction as role, 
                    message_text as content,
                    created_at as timestamp 
                FROM conversation_messages 
                WHERE ${conversation_id ? 'conversation_id = $1' : 'contact_id = $1'}  /* Assuming fallback schema here */
                ORDER BY created_at ASC
                LIMIT $2
            `, [conversation_id || contact_id, limit]);

            messages = msgsRes.rows.map(m => ({
                id: m.id,
                role: m.role === 'inbound' ? 'user' : 'ai',
                content: m.content || '',
                timestamp: m.timestamp
            }));
            
        } catch(dbErr) {
            console.error('Info: Messages fetch failed in PG globaldb:', dbErr);
        }
        
        return NextResponse.json({ messages });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
