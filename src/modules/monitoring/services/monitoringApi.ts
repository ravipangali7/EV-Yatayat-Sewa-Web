import { api } from '@/lib/api';
import { MonitoringSnapshot } from '@/types';

export const monitoringApi = {
  getSnapshot: async (): Promise<MonitoringSnapshot> => {
    return api.get<MonitoringSnapshot>('monitoring/');
  },
};
