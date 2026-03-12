export interface NormalizedMessage {
  organization_id?: number;
  channel_id?: number;
  provider: 'whatsapp_meta' | 'whatsapp_evolution' | 'instagram' | 'facebook_messenger' | 'webchat';
  external_user_id: string;
  from: string;
  contact_name: string;
  message_id: string;
  message_type: 'text' | 'audio' | 'image' | 'document' | 'video' | 'unsupported' | 'unknown';
  text?: string;
  caption?: string;
  media_id?: string;
  media_url?: string;
  mime_type?: string;
  timestamp: string;
  raw_payload: any;
}
