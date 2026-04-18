/**
 * Canonical log type for clock logs — only IN or OUT.
 */
export type CanonicalLogType = 'IN' | 'OUT';

/**
 * All recognized variants that map to IN.
 */
const IN_TYPES = new Set([
  'in', 'entrada', 'entry', 'start', 'check_in', 'checkin',
  'almuerzo_entrada', 'lunch_in', 'break_in', 'entrada almuerzo',
  'almuerzo in', 'almuerzo_in', 'regreso almuerzo', 'vuelta almuerzo'
]);

/**
 * All recognized variants that map to OUT.
 */
const OUT_TYPES = new Set([
  'out', 'salida', 'exit', 'end', 'check_out', 'checkout',
  'salida final', 'fin turno',
  'almuerzo', 'almuerzo_salida', 'lunch_out', 'break_out', 'salida almuerzo',
  'almuerzo out', 'almuerzo_out'
]);

/**
 * Normalizes any clock log type variant to canonical IN/OUT.
 * @param value - Raw log type from any source (Excel, Java, manual)
 * @returns 'IN' | 'OUT'
 * @throws Error if value cannot be normalized to a canonical type
 */
export function normalizeLogType(value: string): CanonicalLogType {
  const v = value.toLowerCase().trim();
  if (IN_TYPES.has(v)) return 'IN';
  if (OUT_TYPES.has(v)) return 'OUT';
  throw new Error(`Tipo de marca desconocido: "${value}". Valores aceptados: IN, OUT, ENTRADA, SALIDA`);
}

/**
 * Validates that a value is already a canonical IN/OUT.
 * Use after normalization to enforce strict type checking.
 * @param value - String to validate
 * @returns true if value is 'IN' or 'OUT'
 */
export function isValidCanonicalType(value: string): value is CanonicalLogType {
  return value === 'IN' || value === 'OUT';
}

/**
 * InferLogTypeRow - Input row for type inference (without log_type).
 */
export type InferLogTypeRow = {
  employee_id: number;
  timestamp: Date;
  remarks?: string | null;
};

/**
 * InferLogTypeResult - Row with inferred log_type.
 */
export type InferLogTypeResult = {
  employee_id: number;
  timestamp: Date;
  log_type: CanonicalLogType;
  remarks?: string | null;
};

/**
 * Infers IN/OUT log type by sequence when clock file does not provide type.
 * Groups rows by (employee_id, UTC date), sorts each group by timestamp ascending,
 * then assigns alternately: index 0 -> IN, index 1 -> OUT, index 2 -> IN, etc.
 *
 * @param rows - Array of resolved rows without log_type
 * @returns Same rows with log_type inferred as 'IN' | 'OUT'
 */
export function inferLogTypeBySequence(
  rows: InferLogTypeRow[]
): InferLogTypeResult[] {
  if (rows.length === 0) return [];

  // Group by (employee_id, YYYY-MM-DD UTC date)
  const grouped = new Map<string, InferLogTypeRow[]>();

  for (const row of rows) {
    const dateStr = row.timestamp.toISOString().split('T')[0];
    const key = `${row.employee_id}|${dateStr}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(row);
  }

  const result: InferLogTypeResult[] = [];

  for (const group of grouped.values()) {
    // Sort ascending by timestamp within each group
    group.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 0; i < group.length; i++) {
      result.push({
        employee_id: group[i].employee_id,
        timestamp: group[i].timestamp,
        log_type: i % 2 === 0 ? 'IN' : 'OUT',
        remarks: group[i].remarks,
      });
    }
  }

  return result;
}
