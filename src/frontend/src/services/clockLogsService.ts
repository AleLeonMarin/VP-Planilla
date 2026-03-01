import { http } from './http';

export interface ClockLog {
  id: number;
  employee_id: number | string | null;
  timestamp: string;
  log_type: string;
  remarks?: string;
  version: number;
  employee_name?: string;
}
export const ClockLogsService = {
  async getClockLogs(startDate: string, endDate: string): Promise<ClockLog[]> {
    if (!startDate || !endDate) return [];

    const params = new URLSearchParams({
      initDate: startDate,
      endDate
    });

    try {
      const response = await http.get(`/clock-logs?${params.toString()}`);
      if (!response) return [];
      if (Array.isArray(response)) return response as ClockLog[];
      if (response?.data && Array.isArray(response.data)) return response.data as ClockLog[];
      return [];
    } catch (error: any) {
      console.warn('[ClockLogsService] No se pudieron obtener marcas del backend:', error?.message || error);
      return [];
    }
  },

  async bulkSave(logs: ClockLog[]): Promise<{ created: number; skipped?: string[] }> {
    if (!logs.length) return { created: 0 };

    try {
      const response = await http.post('/clock-logs/bulk', { logs });
      return response ?? { created: 0 };
    } catch (error: any) {
      console.error('[ClockLogsService] Error al guardar marcas en BD:', error?.message || error);
      throw error;
    }
  }
};
