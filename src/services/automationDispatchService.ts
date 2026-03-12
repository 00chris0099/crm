import { NormalizedMessage } from '../types/messaging';

export class AutomationDispatchService {
   public static async sendToN8n(message: NormalizedMessage, n8nWebhookUrl: string, rawPayload?: any) {
       try {
           const bodyContent = rawPayload ? rawPayload : message; // Prefer the raw Meta body if passed, because your n8n is likely configured for it.
           const response = await fetch(n8nWebhookUrl, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(bodyContent)
           });
           
           // N8n might not always return valid JSON depending on the node (e.g., respond to webhook node).
           const textResponse = await response.text();
           try {
               return JSON.parse(textResponse);
           } catch (e) {
               return textResponse;
           }
       } catch (err) {
           console.error("N8n dispatch failed", err);
       }
   }
}
