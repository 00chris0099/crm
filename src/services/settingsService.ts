import { dbQuery } from '../lib/pg-db';

export class SettingsService {
  public static async getSetting(organizationId: number, moduleName: string, key: string) {
    const res = await dbQuery('globaldb', 'SELECT value FROM integration_settings WHERE organization_id = $1 AND module = $2 AND key = $3', [organizationId, moduleName, key]);
    return res.rows[0]?.value;
  }
  public static async setSetting(organizationId: number, moduleName: string, key: string, value: any) {
    await dbQuery('globaldb', `
      INSERT INTO integration_settings (organization_id, module, key, value) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (organization_id, module, key) 
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `, [organizationId, moduleName, key, value]);
  }
}
