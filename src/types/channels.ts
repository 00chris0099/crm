export interface Channel {
  id: number;
  organization_id: number;
  provider: 'whatsapp_meta' | 'whatsapp_evolution' | 'instagram' | 'facebook_messenger' | 'webchat';
  display_name: string;
  provider_account_id?: string;
  provider_phone_number?: string;
  settings?: any;
  status: 'active' | 'inactive' | 'error';
  created_at?: string;
  updated_at?: string;
}

export interface WebhookEvent {
  id: number;
  provider: string;
  channel_id?: number;
  payload: any;
  status: 'pending' | 'processed' | 'error';
  error_message?: string;
  created_at?: string;
}
