import { NormalizedMessage } from '../types/messaging';

export class AutomationDispatchService {
   public static async sendToN8n(message: NormalizedMessage, n8nWebhookUrl: string) {
       try {
           const response = await fetch(n8nWebhookUrl, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(message)
           });
           return await response.json();
       } catch (err) {
           console.error("N8n dispatch failed", err);
       }
   }
}
