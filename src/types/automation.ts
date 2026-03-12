export interface AutomationAgent {
  id: number;
  organization_id: number;
  name: string;
  type: 'sales' | 'support' | 'qualification' | 'custom';
  description?: string;
  config: any;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}
