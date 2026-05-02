import { http } from './http';

export enum MinuteRoundingPolicy {
  EXACT = 'EXACT',
  ALWAYS_UP = 'ALWAYS_UP',
  NEAREST_QUARTER = 'NEAREST_QUARTER',
}

export enum ShiftType {
  DIURNA = 'DIURNA',
  MIXTA = 'MIXTA',
  NOCTURNA = 'NOCTURNA',
}

export interface EnterpriseConfig {
  enterprise_id: number;
  enterprise_name: string;
  enterprise_image?: string;
  enterprise_creation_date: string;
  enterprise_version: number;
  enterprise_minute_rounding_policy: MinuteRoundingPolicy;
  enterprise_rounding_policy_acknowledged: boolean;
  enterprise_is_commercial_activity: boolean;
  enterprise_ordinary_shift_type: ShiftType;
  enterprise_pay_unworked_holidays: boolean;
  enterprise_aguinaldo_period_start_month: number;
  enterprise_aguinaldo_period_start_day: number;
  enterprise_aguinaldo_payment_deadline_day: number;
}

export const EnterpriseService = {
  /**
   * Retrieves the current enterprise configuration.
   * @returns {Promise<EnterpriseConfig>} The enterprise configuration.
   */
  getConfig: async (): Promise<EnterpriseConfig> => {
    return http.get('/enterprise/config');
  },

  /**
   * Updates the enterprise configuration.
   * @param {Partial<EnterpriseConfig>} data The fields to update.
   * @returns {Promise<EnterpriseConfig>} The updated configuration.
   */
  updateConfig: async (data: Partial<EnterpriseConfig>): Promise<EnterpriseConfig> => {
    return http.patch('/enterprise/config', data);
  },
};
