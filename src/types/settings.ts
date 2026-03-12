export interface IntegrationSettings {
  id: number;
  organization_id: number;
  module: string;
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
}

export interface SystemSecret {
  id: number;
  organization_id: number;
  key: string;
  secret_value: string;
  created_at: string;
  updated_at: string;
}
