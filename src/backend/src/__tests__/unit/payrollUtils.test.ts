import {
  isCRHoliday,
  getCRHolidays,
  countWorkingDaysInPeriod,
} from '../../utils/payrollUtils';

describe('payrollUtils - Costa Rica Holidays', () => {
  describe('isCRHoliday', () => {
    it('returns true for January 1 (Año Nuevo) 2026', () => {
      expect(isCRHoliday(new Date('2026-01-01'), 2026)).toBe(true);
    });

    it('returns true for May 1 (Día del Trabajo) 2026', () => {
      expect(isCRHoliday(new Date('2026-05-01'), 2026)).toBe(true);
    });

    it('returns true for September 15 (Independencia) 2026', () => {
      expect(isCRHoliday(new Date('2026-09-15'), 2026)).toBe(true);
    });

    it('returns true for December 25 (Navidad) 2026', () => {
      expect(isCRHoliday(new Date('2026-12-25'), 2026)).toBe(true);
    });

    it('returns true for July 25 (Anexión de Guanacaste) 2026', () => {
      expect(isCRHoliday(new Date('2026-07-25'), 2026)).toBe(true);
    });

    it('returns true for August 15 (Asunción) 2026', () => {
      expect(isCRHoliday(new Date('2026-08-15'), 2026)).toBe(true);
    });

    it('returns true for October 12 (Día de las Culturas) 2026', () => {
      expect(isCRHoliday(new Date('2026-10-12'), 2026)).toBe(true);
    });

    it('returns true for April 11 (Juan Santamaría) 2026', () => {
      expect(isCRHoliday(new Date('2026-04-11'), 2026)).toBe(true);
    });

    it('returns true for Jueves Santo (April 2, 2026)', () => {
      expect(isCRHoliday(new Date('2026-04-02'), 2026)).toBe(true);
    });

    it('returns true for Viernes Santo (April 3, 2026)', () => {
      expect(isCRHoliday(new Date('2026-04-03'), 2026)).toBe(true);
    });

    it('returns false for regular day (May 2, 2026)', () => {
      expect(isCRHoliday(new Date('2026-05-02'), 2026)).toBe(false);
    });

    it('returns false for Saturday (not a holiday)', () => {
      expect(isCRHoliday(new Date('2026-01-03'), 2026)).toBe(false);
    });

    it('returns false when year has no holidays defined', () => {
      expect(isCRHoliday(new Date('2025-05-01'), 2025)).toBe(false);
    });
  });

  describe('getCRHolidays', () => {
    it('returns all 10 holidays for 2026', () => {
      const holidays = getCRHolidays(2026);
      expect(holidays).toHaveLength(10);
    });

    it('returns holidays as Date objects', () => {
      const holidays = getCRHolidays(2026);
      holidays.forEach((h) => {
        expect(h instanceof Date).toBe(true);
        expect(isNaN(h.getTime())).toBe(false);
      });
    });

    it('returns empty array for year without holidays', () => {
      const holidays = getCRHolidays(2025);
      expect(holidays).toHaveLength(0);
    });
  });

  describe('countWorkingDaysInPeriod', () => {
    it('counts 6 days for normal week Jan 5-10, 2026 (Mon-Sat)', () => {
      const result = countWorkingDaysInPeriod(
        new Date('2026-01-05'),
        new Date('2026-01-10'),
        2026
      );
      expect(result).toBe(6);
    });

    it('counts 0 days for Jan 1, 2026 (holiday)', () => {
      const result = countWorkingDaysInPeriod(
        new Date('2026-01-01'),
        new Date('2026-01-01'),
        2026
      );
      expect(result).toBe(0);
    });

    it('counts 12 working days for May 1-15, 2026 (UTC Apr 30-May 14, excludes May 1 + 2 Sundays)', () => {
      const result = countWorkingDaysInPeriod(
        new Date('2026-05-01'),
        new Date('2026-05-15'),
        2026
      );
      expect(result).toBe(12);
    });

    it('counts 5 working days for Sep 11-17, 2026 (excludes Sep 15 + Sunday)', () => {
      const result = countWorkingDaysInPeriod(
        new Date('2026-09-11'),
        new Date('2026-09-17'),
        2026
      );
      expect(result).toBe(5);
    });

    it('counts 5 working days for Dec 21-27, 2026 (excludes Dec 25 + Sunday)', () => {
      const result = countWorkingDaysInPeriod(
        new Date('2026-12-21'),
        new Date('2026-12-27'),
        2026
      );
      expect(result).toBe(5);
    });

    it('counts 4 working days for Apr 2-8, 2026 (excludes Jueves Santo and Viernes Santo)', () => {
      const result = countWorkingDaysInPeriod(
        new Date('2026-04-02'),
        new Date('2026-04-08'),
        2026
      );
      expect(result).toBe(4);
    });

    it('excludes Sundays from count', () => {
      const result = countWorkingDaysInPeriod(
        new Date('2026-01-04'),
        new Date('2026-01-10'),
        2026
      );
      expect(result).toBe(6);
    });

    it('uses startDate year when year parameter not provided', () => {
      const result = countWorkingDaysInPeriod(
        new Date('2026-05-01'),
        new Date('2026-05-15')
      );
      expect(result).toBe(12);
    });
  });
});
