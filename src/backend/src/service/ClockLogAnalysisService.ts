import { prisma } from '../lib/prisma';

/**
 * Service for analyzing clock logs to detect anomalies and orphan records.
 * All methods are static and operate on logs within a specific import session.
 */
export class ClockLogAnalysisService {

  /**
   * Detect orphan clock logs (IN without matching OUT within 24h, or OUT without preceding IN within 24h)
   * @param sessionId - The import session ID to analyze
   * @returns Promise<number> - Count of logs marked as orphan
   * @throws Error if database query fails
   */
  static async detectOrphans(sessionId: number): Promise<number> {
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const orphanIds: number[] = [];

    // Fetch all pending logs for this session, ordered by timestamp
    const logs = await prisma.vpg_clock_logs.findMany({
      where: {
        clock_logs_import_session_id: sessionId,
        clock_logs_status: 'pending'
      },
      orderBy: {
        clock_logs_timestamp: 'asc'
      }
    });

    if (logs.length === 0) {
      return 0;
    }

    // Group logs by employee
    const logsByEmployee = new Map<number, typeof logs>();
    for (const log of logs) {
      const employeeId = log.clock_logs_employee_id;
      if (!logsByEmployee.has(employeeId)) {
        logsByEmployee.set(employeeId, []);
      }
      logsByEmployee.get(employeeId)!.push(log);
    }

    // Check each employee's logs
    for (const [, employeeLogs] of logsByEmployee) {
      // Already sorted by timestamp from query
      for (let i = 0; i < employeeLogs.length; i++) {
        const current = employeeLogs[i];
        // Skip if not pending (defensive, though query should filter)
        if (current.clock_logs_status !== 'pending') continue;

        if (current.clock_logs_log_type === 'IN') {
          // An IN is orphan if no OUT follows within 24h
          const hasMatchingOut = employeeLogs.slice(i + 1).some(log =>
            log.clock_logs_log_type === 'OUT' && (log.clock_logs_timestamp.getTime() - current.clock_logs_timestamp.getTime()) <= TWENTY_FOUR_HOURS_MS
          );
          if (!hasMatchingOut) {
            orphanIds.push(current.clock_logs_id);
          }
        } else if (current.clock_logs_log_type === 'OUT') {
          // An OUT is orphan if no IN precedes it within 24h
          const hasMatchingIn = employeeLogs.slice(0, i).some(log =>
            log.clock_logs_log_type === 'IN' && (current.clock_logs_timestamp.getTime() - log.clock_logs_timestamp.getTime()) <= TWENTY_FOUR_HOURS_MS
          );
          if (!hasMatchingIn) {
            orphanIds.push(current.clock_logs_id);
          }
        }
      }
    }

    if (orphanIds.length > 0) {
      await prisma.vpg_clock_logs.updateMany({
        where: { clock_logs_id: { in: orphanIds } },
        data: { clock_logs_status: 'orphan' }
      });
    }

    return orphanIds.length;
  }

  /**
   * Detect double entry anomalies (two consecutive IN logs for same employee without OUT between)
   * @param sessionId - The import session ID to analyze
   * @returns Promise<number> - Count of logs marked as anomaly
   * @throws Error if database query fails
   */
  static async detectDoubleEntry(sessionId: number): Promise<number> {
    const logs = await prisma.vpg_clock_logs.findMany({
      where: {
        clock_logs_import_session_id: sessionId,
        clock_logs_status: 'pending'
      },
      orderBy: {
        clock_logs_timestamp: 'asc'
      }
    });

    if (logs.length === 0) {
      return 0;
    }

    // Group by employee
    const logsByEmployee = new Map<number, typeof logs>();
    for (const log of logs) {
      const employeeId = log.clock_logs_employee_id;
      if (!logsByEmployee.has(employeeId)) {
        logsByEmployee.set(employeeId, []);
      }
      logsByEmployee.get(employeeId)!.push(log);
    }

    const anomalyIds: number[] = [];

    // Find consecutive IN/IN pairs
    for (const [, employeeLogs] of logsByEmployee) {
      employeeLogs.sort((a, b) => a.clock_logs_timestamp.getTime() - b.clock_logs_timestamp.getTime());

      for (let i = 0; i < employeeLogs.length - 1; i++) {
        const current = employeeLogs[i];
        const next = employeeLogs[i + 1];
        // Skip if not pending
        if (current.clock_logs_status !== 'pending' || next.clock_logs_status !== 'pending') continue;

        if (current.clock_logs_log_type === 'IN' && next.clock_logs_log_type === 'IN') {
          anomalyIds.push(current.clock_logs_id, next.clock_logs_id);
          i++; // Skip the next log to avoid overlapping pairs
        }
      }
    }

    if (anomalyIds.length > 0) {
      await prisma.vpg_clock_logs.updateMany({
        where: { clock_logs_id: { in: anomalyIds } },
        data: { clock_logs_status: 'anomaly' }
      });
    }

    return anomalyIds.length;
  }

  /**
   * Detect double exit anomalies (two consecutive OUT logs for same employee without IN between)
   * @param sessionId - The import session ID to analyze
   * @returns Promise<number> - Count of logs marked as anomaly
   * @throws Error if database query fails
   */
  static async detectDoubleExit(sessionId: number): Promise<number> {
    const logs = await prisma.vpg_clock_logs.findMany({
      where: {
        clock_logs_import_session_id: sessionId,
        clock_logs_status: 'pending'
      },
      orderBy: {
        clock_logs_timestamp: 'asc'
      }
    });

    if (logs.length === 0) {
      return 0;
    }

    // Group by employee
    const logsByEmployee = new Map<number, typeof logs>();
    for (const log of logs) {
      const employeeId = log.clock_logs_employee_id;
      if (!logsByEmployee.has(employeeId)) {
        logsByEmployee.set(employeeId, []);
      }
      logsByEmployee.get(employeeId)!.push(log);
    }

    const anomalyIds: number[] = [];

    // Find consecutive OUT/OUT pairs
    for (const [, employeeLogs] of logsByEmployee) {
      employeeLogs.sort((a, b) => a.clock_logs_timestamp.getTime() - b.clock_logs_timestamp.getTime());

      for (let i = 0; i < employeeLogs.length - 1; i++) {
        const current = employeeLogs[i];
        const next = employeeLogs[i + 1];
        // Skip if not pending
        if (current.clock_logs_status !== 'pending' || next.clock_logs_status !== 'pending') continue;

        if (current.clock_logs_log_type === 'OUT' && next.clock_logs_log_type === 'OUT') {
          anomalyIds.push(current.clock_logs_id, next.clock_logs_id);
          i++; // Skip the next log to avoid overlapping pairs
        }
      }
    }

    if (anomalyIds.length > 0) {
      await prisma.vpg_clock_logs.updateMany({
        where: { clock_logs_id: { in: anomalyIds } },
        data: { clock_logs_status: 'anomaly' }
      });
    }

    return anomalyIds.length;
  }

  /**
   * Detect long session anomalies (IN->OUT pairs with duration > 16 hours)
   * @param sessionId - The import session ID to analyze
   * @returns Promise<number> - Count of logs marked as anomaly
   * @throws Error if database query fails
   */
  static async detectLongSessions(sessionId: number): Promise<number> {
    const logs = await prisma.vpg_clock_logs.findMany({
      where: {
        clock_logs_import_session_id: sessionId,
        clock_logs_status: 'pending'
      },
      orderBy: {
        clock_logs_timestamp: 'asc'
      }
    });

    if (logs.length === 0) {
      return 0;
    }

    // Group by employee
    const logsByEmployee = new Map<number, typeof logs>();
    for (const log of logs) {
      const employeeId = log.clock_logs_employee_id;
      if (!logsByEmployee.has(employeeId)) {
        logsByEmployee.set(employeeId, []);
      }
      logsByEmployee.get(employeeId)!.push(log);
    }

    const anomalyIds: number[] = [];
    const SIXTEEN_HOURS_MS = 16 * 60 * 60 * 1000;

    // Find IN->OUT pairs exceeding 16 hours
    for (const [, employeeLogs] of logsByEmployee) {
      employeeLogs.sort((a, b) => a.clock_logs_timestamp.getTime() - b.clock_logs_timestamp.getTime());

    // Find valid IN/OUT pairs
    for (let i = 0; i < employeeLogs.length; i++) {
      // Skip if not pending
      if (employeeLogs[i].clock_logs_status !== 'pending') continue;

      if (employeeLogs[i].clock_logs_log_type === 'IN') {
        // Find the next OUT for this IN
        for (let j = i + 1; j < employeeLogs.length; j++) {
          if (employeeLogs[j].clock_logs_log_type === 'OUT') {
            // Only consider if both are pending
            if (employeeLogs[j].clock_logs_status === 'pending') {
              const duration = employeeLogs[j].clock_logs_timestamp.getTime() - employeeLogs[i].clock_logs_timestamp.getTime();
              if (duration > SIXTEEN_HOURS_MS) {
                anomalyIds.push(employeeLogs[i].clock_logs_id, employeeLogs[j].clock_logs_id);
              }
            }
            break; // Only consider the first OUT after this IN
          }
        }
      }
    }
    }

    if (anomalyIds.length > 0) {
      await prisma.vpg_clock_logs.updateMany({
        where: { clock_logs_id: { in: anomalyIds } },
        data: { clock_logs_status: 'anomaly' }
      });
    }

    return anomalyIds.length;
  }

  /**
   * Run all post-import analyses and mark remaining pending logs as valid
   * @param sessionId - The import session ID to analyze
   * @returns Object with counts of each anomaly type and total
   * @throws Error if any analysis fails
   */
  static async runPostImportAnalysis(sessionId: number): Promise<{
    orphans: number;
    doubleEntry: number;
    doubleExit: number;
    longSessions: number;
    total: number;
  }> {
    const orphans = await this.detectOrphans(sessionId);
    const doubleEntry = await this.detectDoubleEntry(sessionId);
    const doubleExit = await this.detectDoubleExit(sessionId);
    const longSessions = await this.detectLongSessions(sessionId);

    // Mark remaining pending logs as valid
    await this.markValid(sessionId);

    // Total anomalies = sum of all anomaly types
    const total = orphans + doubleEntry + doubleExit + longSessions;

    return {
      orphans,
      doubleEntry,
      doubleExit,
      longSessions,
      total
    };
  }

  /**
   * Mark all remaining pending logs for a session as valid
   * @param sessionId - The import session ID
   * @returns Promise<number> - Count of logs marked as valid
   * @throws Error if database update fails
   */
  static async markValid(sessionId: number): Promise<number> {
    const result = await prisma.vpg_clock_logs.updateMany({
      where: {
        clock_logs_import_session_id: sessionId,
        clock_logs_status: 'pending'
      },
      data: { clock_logs_status: 'valid' }
    });

    return result.count;
  }
}
