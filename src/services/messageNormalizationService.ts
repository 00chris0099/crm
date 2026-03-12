import { NormalizedMessage } from '../types/messaging';

export class MessageNormalizationService {
  public static normalizeMetaMessage(payload: any): NormalizedMessage[] {
    const messages: NormalizedMessage[] = [];
    if (payload.object === 'whatsapp_business_account') {
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value;
            const contacts = value.contacts || [];
            const contactName = contacts[0]?.profile?.name || 'Unknown';
            for (const msg of value.messages || []) {
                messages.push({
                    provider: 'whatsapp_meta',
                    external_user_id: msg.from,
                    from: msg.from,
                    contact_name: contactName,
                    message_id: msg.id,
                    message_type: this.mapMetaType(msg.type),
                    text: msg.text?.body || '',
                    timestamp: msg.timestamp,
                    raw_payload: msg
                });
            }
          }
        }
      }
    }
    return messages;
  }

  public static normalizeEvolutionMessage(payload: any): NormalizedMessage[] {
    const msgData = payload.data?.message || payload.data;
    return [{
       provider: 'whatsapp_evolution',
       external_user_id: payload.data?.key?.remoteJid || 'unknown',
       from: payload.data?.key?.remoteJid || 'unknown',
       contact_name: payload.data?.pushName || 'Unknown',
       message_id: payload.data?.key?.id,
       message_type: 'text', // simplification
       text: msgData?.conversation || msgData?.extendedTextMessage?.text || '',
       timestamp: new Date().getTime().toString(),
       raw_payload: payload
    }];
  }

  private static mapMetaType(type: string): NormalizedMessage['message_type'] {
     const types = ['text', 'audio', 'image', 'document', 'video'];
     if (types.includes(type)) return type as any;
     return 'unsupported';
  }
}
