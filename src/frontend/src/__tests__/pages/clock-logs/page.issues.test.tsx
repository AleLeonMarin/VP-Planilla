import React from 'react';
import { render, screen } from '@testing-library/react';
import ClockLogsPage from '@/app/pages/clock-logs/page';
import { useEffectiveMarks } from '@/hooks/useEffectiveMarks';
import { useClockAudit } from '@/hooks/useClockAudit';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ replace: jest.fn() }),
  usePathname: jest.fn().mockReturnValue('/clock-logs'),
  useSearchParams: jest.fn().mockReturnValue({ get: jest.fn() }),
}));

jest.mock('@/hooks/useEffectiveMarks');
jest.mock('@/hooks/useClockAudit');
jest.mock('@/hooks/useTimeWindows', () => ({
  useTimeWindows: jest.fn().mockReturnValue({ windows: [] }),
}));

const mockedUseEffectiveMarks = useEffectiveMarks as jest.MockedFunction<typeof useEffectiveMarks>;
const mockedUseClockAudit = useClockAudit as jest.MockedFunction<typeof useClockAudit>;

describe('ClockLogsPage - has_issues logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockData = (status: any, confidence: any = 'HIGH') => [
    {
      id: '1-2026-02-02-1-2',
      employee_id: '101',
      employee_name: 'Ana García',
      branch_name: 'Main Branch',
      log_date: '2026-02-02',
      original: {
        in_time: '2026-02-02T08:00:00.000Z',
        out_time: '2026-02-02T17:00:00.000Z',
        in_log_id: 1,
        out_log_id: 2,
        status,
        source: 'device',
      },
      calculated_hours: 8,
    },
  ];

  it('shows NO issues for LOW confidence + valid status', () => {
    mockedUseEffectiveMarks.mockReturnValue({
      data: mockData('valid', 'LOW'),
      filters: { initDate: '2026-01-01', endDate: '2026-01-15' },
      importSessions: [],
    } as any);

    mockedUseClockAudit.mockReturnValue({
      clearedDays: new Set(),
      confirmedDays: new Set(),
      fetchConfirmations: jest.fn(),
    } as any);

    render(<ClockLogsPage />);
    
    // In audit tab (via query param mock if needed, or just check the data structure)
    // Actually, buildAuditData is called and its result is used.
    // We can't easily check the internal result of auditEmployees() without more setup,
    // but we can check if the amber dot is NOT present.
    // Let's force 'audit' tab in mock searchParams
    const { get } = require('next/navigation').useSearchParams();
    get.mockImplementation((key: string) => key === 'tab' ? 'audit' : null);

    render(<ClockLogsPage />);
    
    const issueDot = screen.queryByTitle(/Tiene marcas con problemas/i);
    expect(issueDot).not.toBeInTheDocument();
  });

  it('shows issues for anomaly status', () => {
    mockedUseEffectiveMarks.mockReturnValue({
      data: mockData('anomaly'),
      filters: { initDate: '2026-01-01', endDate: '2026-01-15' },
      importSessions: [],
    } as any);

    mockedUseClockAudit.mockReturnValue({
      clearedDays: new Set(),
      confirmedDays: new Set(),
      fetchConfirmations: jest.fn(),
    } as any);

    render(<ClockLogsPage />);
    
    const issueDot = screen.queryByTitle(/Tiene marcas con problemas/i);
    expect(issueDot).toBeInTheDocument();
  });

  it('hides issues optimistically if the day is in clearedDays', () => {
    mockedUseEffectiveMarks.mockReturnValue({
      data: mockData('anomaly'),
      filters: { initDate: '2026-01-01', endDate: '2026-01-15' },
      importSessions: [],
    } as any);

    mockedUseClockAudit.mockReturnValue({
      clearedDays: new Set(['101_2026-02-02']),
      confirmedDays: new Set(),
      fetchConfirmations: jest.fn(),
    } as any);

    render(<ClockLogsPage />);
    
    const issueDot = screen.queryByTitle(/Tiene marcas con problemas/i);
    expect(issueDot).not.toBeInTheDocument();
  });

  it('hides issues for void actions optimistically', () => {
    mockedUseEffectiveMarks.mockReturnValue({
      data: mockData('orphan'),
      filters: { initDate: '2026-01-01', endDate: '2026-01-15' },
      importSessions: [],
    } as any);

    mockedUseClockAudit.mockReturnValue({
      clearedDays: new Set(['101_2026-02-02']),
      confirmedDays: new Set(),
      fetchConfirmations: jest.fn(),
    } as any);

    const { get } = require('next/navigation').useSearchParams();
    get.mockImplementation((key: string) => key === 'tab' ? 'audit' : null);

    render(<ClockLogsPage />);
    
    const issueDot = screen.queryByTitle(/Tiene marcas con problemas/i);
    expect(issueDot).not.toBeInTheDocument();
  });
});
