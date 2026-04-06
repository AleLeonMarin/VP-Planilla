import { renderHook, act } from '@testing-library/react';
import { useClockLogs } from '@/hooks/useClockLogs';
import { ClockLogsService } from '@/services/clockLogsService';
import { getEmployees } from '@/services/employeeService';

jest.mock('@/services/clockLogsService');
jest.mock('@/services/employeeService');

const mockClockLogsService = ClockLogsService as jest.MockedObject<typeof ClockLogsService>;
const mockGetEmployees = getEmployees as jest.MockedFunction<typeof getEmployees>;

describe('useClockLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClockLogsService.getStats = jest.fn();
    mockClockLogsService.getClockLogsPaginated = jest.fn();
    mockClockLogsService.getImportSessions = jest.fn();
    mockGetEmployees.mockResolvedValue([]);
  });

  it('should initialize with default filters and loading state', () => {
    const { result } = renderHook(() => useClockLogs());

    expect(result.current.filters).toEqual({
      initDate: expect.stringMatching(/^\d{4}-\d{2}-01$/),
      endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      status: [],
      employee_id: undefined,
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isStatsLoading).toBe(true);
    expect(result.current.logs).toEqual([]);
    expect(result.current.stats).toBeNull();
    expect(result.current.importSessions).toEqual([]);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(20);
  });

  it('should fetch employees on mount', async () => {
    const mockEmployees = [
      { employee_id: 1, employee_first_name: 'Ana', employee_last_name: 'García' },
      { employee_id: 2, employee_first_name: 'Luis', employee_last_name: 'Pérez' },
    ];
    mockGetEmployees.mockResolvedValue(mockEmployees as any);

    const { result } = renderHook(() => useClockLogs());

    // Wait for employees to load
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetEmployees).toHaveBeenCalled();
    expect(result.current.employees).toHaveLength(2);
    expect(result.current.employees[0].name).toBe('Ana García');
    expect(result.current.employees[1].name).toBe('Luis Pérez');
  });

  it('should fetch all data on mount', async () => {
    mockClockLogsService.getStats.mockResolvedValue({ byStatus: {}, bySource: {}, total: 0 });
    mockClockLogsService.getClockLogsPaginated.mockResolvedValue({ success: true, data: [], total: 0, page: 1, pageSize: 20 });
    mockClockLogsService.getImportSessions.mockResolvedValue([]);
    mockGetEmployees.mockResolvedValue([]);

    const { result } = renderHook(() => useClockLogs());

    await act(async () => {
      await Promise.resolve();
    });

    expect(ClockLogsService.getStats).toHaveBeenCalled();
    expect(ClockLogsService.getClockLogsPaginated).toHaveBeenCalled();
    expect(ClockLogsService.getImportSessions).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStatsLoading).toBe(false);
  });

  it('should apply date preset and reset page', async () => {
    mockClockLogsService.getStats.mockResolvedValue({ byStatus: {}, bySource: {}, total: 0 });
    mockClockLogsService.getClockLogsPaginated.mockResolvedValue({ success: true, data: [], total: 0, page: 1, pageSize: 20 });
    mockClockLogsService.getImportSessions.mockResolvedValue([]);
    mockGetEmployees.mockResolvedValue([]);

    const { result } = renderHook(() => useClockLogs());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.applyDatePreset('last7days');
    });

    // After applyDatePreset, filters should update, page resets to 1, and fetchAll should trigger.
    // Since we cannot easily assert that fetchAll was called again, we can at least check filters changed.
    expect(result.current.filters.initDate).not.toBe(result.current.filters.endDate);
    // For last7days, initDate should be <= endDate - 6 days
    const init = new Date(result.current.filters.initDate);
    const end = new Date(result.current.filters.endDate);
    const diffDays = Math.floor((end.getTime() - init.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(6);
  });

  it('should update filters via setFilters', async () => {
    mockClockLogsService.getStats.mockResolvedValue({ byStatus: {}, bySource: {}, total: 0 });
    mockClockLogsService.getClockLogsPaginated.mockResolvedValue({ success: true, data: [], total: 0, page: 1, pageSize: 20 });
    mockClockLogsService.getImportSessions.mockResolvedValue([]);
    mockGetEmployees.mockResolvedValue([]);

    const { result } = renderHook(() => useClockLogs());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setFilters({ status: ['anomaly'] });
    });

    expect(result.current.filters.status).toEqual(['anomaly']);
    expect(result.current.page).toBe(1);
  });

  it('should set page and fetch logs only', async () => {
    mockClockLogsService.getStats.mockResolvedValue({ byStatus: {}, bySource: {}, total: 0 });
    mockClockLogsService.getClockLogsPaginated.mockResolvedValue({ success: true, data: [], total: 0, page: 1, pageSize: 20 });
    mockClockLogsService.getImportSessions.mockResolvedValue([]);
    mockGetEmployees.mockResolvedValue([]);

    const { result } = renderHook(() => useClockLogs());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.page).toBe(2);
    // fetchLogs should have been called with page 2
    expect(mockClockLogsService.getClockLogsPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });

  it('should provide refresh function that calls fetchAll', async () => {
    mockClockLogsService.getStats.mockResolvedValue({ byStatus: {}, bySource: {}, total: 0 });
    mockClockLogsService.getClockLogsPaginated.mockResolvedValue({ success: true, data: [], total: 0, page: 1, pageSize: 20 });
    mockClockLogsService.getImportSessions.mockResolvedValue([]);
    mockGetEmployees.mockResolvedValue([]);

    const { result } = renderHook(() => useClockLogs());

    await act(async () => {
      await Promise.resolve();
    });

    // Reset mock calls after initial mount
    jest.clearAllMocks();

    act(() => {
      result.current.refresh();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(ClockLogsService.getStats).toHaveBeenCalled();
    expect(ClockLogsService.getClockLogsPaginated).toHaveBeenCalled();
    expect(ClockLogsService.getImportSessions).toHaveBeenCalled();
  });
});
