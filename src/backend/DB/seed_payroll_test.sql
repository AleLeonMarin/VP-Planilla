-- Script de prueba para cálculo de planilla
-- Prefijo solicitado: verdepradera.<nombre de la tabla>
-- Ajusta el esquema "verdepradera" si tu DB usa otro search_path.

-- ===============================
-- LIMPIEZA OPCIONAL (comentada)
-- ===============================
-- TRUNCATE verdepradera.vpg_clock_logs RESTART IDENTITY CASCADE;
-- TRUNCATE verdepradera.vpg_employee_labor_event RESTART IDENTITY CASCADE;
-- TRUNCATE verdepradera.vpg_vacations RESTART IDENTITY CASCADE;
-- TRUNCATE verdepradera.vpg_payroll_employee RESTART IDENTITY CASCADE;
-- TRUNCATE verdepradera.vpg_employees RESTART IDENTITY CASCADE;
-- TRUNCATE verdepradera.vpg_positions RESTART IDENTITY CASCADE;
-- TRUNCATE verdepradera.vpg_labor_events RESTART IDENTITY CASCADE;

-- ===============================
-- SINCRONIZAR SECUENCIAS (evita duplicate key en PK si el SEQUENCE quedó atrás)
-- Ejecuta este bloque si obtienes errores 23505 al insertar sin especificar IDs
-- ===============================
SELECT setval(pg_get_serial_sequence('verdepradera.vpg_positions','position_id'), COALESCE((SELECT MAX(position_id) FROM verdepradera.vpg_positions),0));
SELECT setval(pg_get_serial_sequence('verdepradera.vpg_labor_events','labor_events_id'), COALESCE((SELECT MAX(labor_events_id) FROM verdepradera.vpg_labor_events),0));
SELECT setval(pg_get_serial_sequence('verdepradera.vpg_employees','employee_id'), COALESCE((SELECT MAX(employee_id) FROM verdepradera.vpg_employees),0));
SELECT setval(pg_get_serial_sequence('verdepradera.vpg_clock_logs','clock_logs_id'), COALESCE((SELECT MAX(clock_logs_id) FROM verdepradera.vpg_clock_logs),0));
SELECT setval(pg_get_serial_sequence('verdepradera.vpg_employee_labor_event','employee_labor_event_id'), COALESCE((SELECT MAX(employee_labor_event_id) FROM verdepradera.vpg_employee_labor_event),0));
SELECT setval(pg_get_serial_sequence('verdepradera.vpg_vacations','vacations_id'), COALESCE((SELECT MAX(vacations_id) FROM verdepradera.vpg_vacations),0));

-- ===============================
-- POSICIONES (idempotente por nombre)
-- ===============================
INSERT INTO verdepradera.vpg_positions (position_name, position_description, position_base_salary, position_version)
SELECT 'Tester JR', 'Posición de prueba junior', 5000.00, 1
WHERE NOT EXISTS (
  SELECT 1 FROM verdepradera.vpg_positions p WHERE p.position_name = 'Tester JR'
);

INSERT INTO verdepradera.vpg_positions (position_name, position_description, position_base_salary, position_version)
SELECT 'Tester SR', 'Posición de prueba senior', 8000.00, 1
WHERE NOT EXISTS (
  SELECT 1 FROM verdepradera.vpg_positions p WHERE p.position_name = 'Tester SR'
);

-- ===============================
-- EVENTOS LABORALES (Tipos de eventos) idempotente por nombre
-- ===============================
INSERT INTO verdepradera.vpg_labor_events (labor_events_name, labor_events_description, labor_events_version)
SELECT 'Suspensión', 'Empleado suspendido temporalmente', 1
WHERE NOT EXISTS (
  SELECT 1 FROM verdepradera.vpg_labor_events le WHERE le.labor_events_name = 'Suspensión'
);

INSERT INTO verdepradera.vpg_labor_events (labor_events_name, labor_events_description, labor_events_version)
SELECT 'Incapacidad', 'Empleado incapacitado por salud', 1
WHERE NOT EXISTS (
  SELECT 1 FROM verdepradera.vpg_labor_events le WHERE le.labor_events_name = 'Incapacidad'
);

INSERT INTO verdepradera.vpg_labor_events (labor_events_name, labor_events_description, labor_events_version)
SELECT 'Permiso Especial', 'Permiso concedido por la empresa', 1
WHERE NOT EXISTS (
  SELECT 1 FROM verdepradera.vpg_labor_events le WHERE le.labor_events_name = 'Permiso Especial'
);

-- ===============================
-- EMPLEADOS DE PRUEBA
--  - Grupo A: activos normales
--  - Grupo B: con eventos laborales
--  - Grupo C: en vacaciones dentro del periodo a probar
-- ===============================
-- Nota: employee_status: usar por ejemplo 'A' = Activo, 'I' = Inactivo (ajusta según tu lógica interna)

-- ===============================
-- EMPLEADOS (idempotente por employee_national_id)
-- ===============================
INSERT INTO verdepradera.vpg_employees (
  employee_first_name,
  employee_last_name,
  employee_middle_name,
  employee_national_id,
  employee_social_code,
  employee_email,
  employee_position_id,
  employee_hire_date,
  employee_exit_date,
  employee_fired,
  employee_status,
  employee_version
)
SELECT 'Test','Uno','A','TEST-A-001','SC-A-001','test.uno@example.com',
       (SELECT position_id FROM verdepradera.vpg_positions WHERE position_name='Tester JR'),
       '2025-01-01', NULL, FALSE, 'A', 1
WHERE NOT EXISTS (SELECT 1 FROM verdepradera.vpg_employees e WHERE e.employee_national_id='TEST-A-001');

INSERT INTO verdepradera.vpg_employees (
  employee_first_name, employee_last_name, employee_middle_name,
  employee_national_id, employee_social_code, employee_email,
  employee_position_id, employee_hire_date, employee_exit_date,
  employee_fired, employee_status, employee_version
)
SELECT 'Test','Dos','B','TEST-A-002','SC-A-002','test.dos@example.com',
       (SELECT position_id FROM verdepradera.vpg_positions WHERE position_name='Tester JR'),
       '2025-01-01', NULL, FALSE, 'A', 1
WHERE NOT EXISTS (SELECT 1 FROM verdepradera.vpg_employees e WHERE e.employee_national_id='TEST-A-002');

INSERT INTO verdepradera.vpg_employees (
  employee_first_name, employee_last_name, employee_middle_name,
  employee_national_id, employee_social_code, employee_email,
  employee_position_id, employee_hire_date, employee_exit_date,
  employee_fired, employee_status, employee_version
)
SELECT 'Test','Tres','C','TEST-A-003','SC-A-003','test.tres@example.com',
       (SELECT position_id FROM verdepradera.vpg_positions WHERE position_name='Tester SR'),
       '2025-01-01', NULL, FALSE, 'A', 1
WHERE NOT EXISTS (SELECT 1 FROM verdepradera.vpg_employees e WHERE e.employee_national_id='TEST-A-003');

-- Grupo B (Con eventos laborales)
INSERT INTO verdepradera.vpg_employees (
  employee_first_name, employee_last_name, employee_middle_name,
  employee_national_id, employee_social_code, employee_email,
  employee_position_id, employee_hire_date, employee_exit_date,
  employee_fired, employee_status, employee_version
)
SELECT 'Test','Evento','X','TEST-B-001','SC-B-001','test.evento.x@example.com',
       (SELECT position_id FROM verdepradera.vpg_positions WHERE position_name='Tester JR'),
       '2025-01-01', NULL, FALSE, 'A', 1
WHERE NOT EXISTS (SELECT 1 FROM verdepradera.vpg_employees e WHERE e.employee_national_id='TEST-B-001');

INSERT INTO verdepradera.vpg_employees (
  employee_first_name, employee_last_name, employee_middle_name,
  employee_national_id, employee_social_code, employee_email,
  employee_position_id, employee_hire_date, employee_exit_date,
  employee_fired, employee_status, employee_version
)
SELECT 'Test','Evento','Y','TEST-B-002','SC-B-002','test.evento.y@example.com',
       (SELECT position_id FROM verdepradera.vpg_positions WHERE position_name='Tester SR'),
       '2025-01-01', NULL, FALSE, 'A', 1
WHERE NOT EXISTS (SELECT 1 FROM verdepradera.vpg_employees e WHERE e.employee_national_id='TEST-B-002');

-- Grupo C (En vacaciones)
INSERT INTO verdepradera.vpg_employees (
  employee_first_name, employee_last_name, employee_middle_name,
  employee_national_id, employee_social_code, employee_email,
  employee_position_id, employee_hire_date, employee_exit_date,
  employee_fired, employee_status, employee_version
)
SELECT 'Test','Vacaciones','M','TEST-C-001','SC-C-001','test.vacaciones.m@example.com',
       (SELECT position_id FROM verdepradera.vpg_positions WHERE position_name='Tester JR'),
       '2025-01-01', NULL, FALSE, 'A', 1
WHERE NOT EXISTS (SELECT 1 FROM verdepradera.vpg_employees e WHERE e.employee_national_id='TEST-C-001');

INSERT INTO verdepradera.vpg_employees (
  employee_first_name, employee_last_name, employee_middle_name,
  employee_national_id, employee_social_code, employee_email,
  employee_position_id, employee_hire_date, employee_exit_date,
  employee_fired, employee_status, employee_version
)
SELECT 'Test','Vacaciones','N','TEST-C-002','SC-C-002','test.vacaciones.n@example.com',
       (SELECT position_id FROM verdepradera.vpg_positions WHERE position_name='Tester SR'),
       '2025-01-01', NULL, FALSE, 'A', 1
WHERE NOT EXISTS (SELECT 1 FROM verdepradera.vpg_employees e WHERE e.employee_national_id='TEST-C-002');

-- ===============================
-- CLOCK LOGS (Entrada / Salida) para un rango (ej: 2025-11-01 a 2025-11-05)
-- Se generan logs de 5 días hábiles para Grupo A y parcialmente para otros
-- Tipos: 'IN' y 'OUT'
-- ===============================
-- Ajusta si tu lógica usa otros identificadores de tipo (ej: 'Entrada'/'Salida').

-- Grupo A/B/C: logs idempotentes usando employee_national_id
INSERT INTO verdepradera.vpg_clock_logs (clock_logs_employee_id, clock_logs_timestamp, clock_logs_log_type, clock_logs_remarks, clock_logs_version)
SELECT e.employee_id, CAST(v.ts AS timestamp), v.lt, v.rm, v.ver
FROM (
  VALUES
  -- Empleado TEST-A-001 (Test Uno)
  ('TEST-A-001', '2025-11-01 08:00:00', 'IN',  NULL, 1), ('TEST-A-001', '2025-11-01 16:00:00', 'OUT', NULL, 1),
  ('TEST-A-001', '2025-11-02 08:00:00', 'IN',  NULL, 1), ('TEST-A-001', '2025-11-02 16:00:00', 'OUT', NULL, 1),
  ('TEST-A-001', '2025-11-03 08:00:00', 'IN',  NULL, 1), ('TEST-A-001', '2025-11-03 16:00:00', 'OUT', NULL, 1),
  ('TEST-A-001', '2025-11-04 08:00:00', 'IN',  NULL, 1), ('TEST-A-001', '2025-11-04 16:00:00', 'OUT', NULL, 1),
  ('TEST-A-001', '2025-11-05 08:00:00', 'IN',  NULL, 1), ('TEST-A-001', '2025-11-05 16:00:00', 'OUT', NULL, 1),
  -- Empleado TEST-A-002 (Test Dos)
  ('TEST-A-002', '2025-11-01 08:15:00', 'IN',  NULL, 1), ('TEST-A-002', '2025-11-01 16:15:00', 'OUT', NULL, 1),
  ('TEST-A-002', '2025-11-02 08:15:00', 'IN',  NULL, 1), ('TEST-A-002', '2025-11-02 16:15:00', 'OUT', NULL, 1),
  ('TEST-A-002', '2025-11-03 08:15:00', 'IN',  NULL, 1), ('TEST-A-002', '2025-11-03 16:15:00', 'OUT', NULL, 1),
  ('TEST-A-002', '2025-11-04 08:15:00', 'IN',  NULL, 1), ('TEST-A-002', '2025-11-04 16:15:00', 'OUT', NULL, 1),
  ('TEST-A-002', '2025-11-05 08:15:00', 'IN',  NULL, 1), ('TEST-A-002', '2025-11-05 16:15:00', 'OUT', NULL, 1),
  -- Empleado TEST-A-003 (Test Tres)
  ('TEST-A-003', '2025-11-01 07:50:00', 'IN',  NULL, 1), ('TEST-A-003', '2025-11-01 15:50:00', 'OUT', NULL, 1),
  ('TEST-A-003', '2025-11-02 07:50:00', 'IN',  NULL, 1), ('TEST-A-003', '2025-11-02 15:50:00', 'OUT', NULL, 1),
  ('TEST-A-003', '2025-11-03 07:50:00', 'IN',  NULL, 1), ('TEST-A-003', '2025-11-03 15:50:00', 'OUT', NULL, 1),
  ('TEST-A-003', '2025-11-04 07:50:00', 'IN',  NULL, 1), ('TEST-A-003', '2025-11-04 15:50:00', 'OUT', NULL, 1),
  ('TEST-A-003', '2025-11-05 07:50:00', 'IN',  NULL, 1), ('TEST-A-003', '2025-11-05 15:50:00', 'OUT', NULL, 1),
  -- Grupo B: TEST-B-001 (2 días) y TEST-B-002 (1 día)
  ('TEST-B-001', '2025-11-01 08:00:00', 'IN',  NULL, 1), ('TEST-B-001', '2025-11-01 16:00:00', 'OUT', NULL, 1),
  ('TEST-B-001', '2025-11-02 08:05:00', 'IN',  NULL, 1), ('TEST-B-001', '2025-11-02 16:05:00', 'OUT', NULL, 1),
  ('TEST-B-002', '2025-11-01 08:30:00', 'IN',  NULL, 1), ('TEST-B-002', '2025-11-01 16:30:00', 'OUT', NULL, 1),
  -- Grupo C: PRE/POST vacaciones
  ('TEST-C-001', '2025-10-31 08:00:00', 'IN',  'Pre-vacaciones', 1), ('TEST-C-001', '2025-10-31 16:00:00', 'OUT', 'Pre-vacaciones', 1),
  ('TEST-C-002', '2025-11-06 08:00:00', 'IN',  'Post-vacaciones', 1), ('TEST-C-002', '2025-11-06 16:00:00', 'OUT', 'Post-vacaciones', 1)
) AS v(nid, ts, lt, rm, ver)
JOIN verdepradera.vpg_employees e ON e.employee_national_id = v.nid
WHERE NOT EXISTS (
  SELECT 1 FROM verdepradera.vpg_clock_logs cl
  WHERE cl.clock_logs_employee_id = e.employee_id
    AND cl.clock_logs_timestamp = CAST(v.ts AS timestamp)
    AND cl.clock_logs_log_type = v.lt
);

-- Nota: Bloques legacy de INSERT directos para clock logs de Grupos B/C eliminados.
-- Los registros de todos los grupos ahora se insertan arriba con la carga idempotente
-- basada en employee_national_id para evitar FKs y duplicados.

-- ===============================
-- EVENTOS LABORALES ASIGNADOS (Grupo B) - idempotente usando llaves naturales
-- ===============================
INSERT INTO verdepradera.vpg_employee_labor_event (
  employee_labor_event_employee_id,
  employee_labor_event_labor_event_id,
  employee_labor_event_start_date,
  employee_labor_event_end_date,
  employee_labor_event_status,
  employee_labor_event_version
)
SELECT e.employee_id,
       le.labor_events_id,
      CAST(v.start_d AS date),
      CAST(v.end_d AS date),
       v.status,
       1
FROM (
  VALUES
    ('TEST-B-001','Suspensión','2025-11-03','2025-11-05','Activo'),
    ('TEST-B-002','Incapacidad','2025-11-02','2025-11-05','Activo')
) AS v(nid, event_name, start_d, end_d, status)
JOIN verdepradera.vpg_employees e ON e.employee_national_id = v.nid
JOIN verdepradera.vpg_labor_events le ON le.labor_events_name = v.event_name
WHERE NOT EXISTS (
  SELECT 1 FROM verdepradera.vpg_employee_labor_event ele
  WHERE ele.employee_labor_event_employee_id = e.employee_id
    AND ele.employee_labor_event_labor_event_id = le.labor_events_id
    AND ele.employee_labor_event_start_date = CAST(v.start_d AS date)
    AND ele.employee_labor_event_end_date   = CAST(v.end_d AS date)
);

-- ===============================
-- VACACIONES (Grupo C)
-- ===============================
INSERT INTO verdepradera.vpg_vacations (
  vacations_employee_id,
  vacations_start_date,
  vacations_end_date,
  vacations_paid,
  vacations_status,
  vacations_version
)
SELECT e.employee_id, CAST(v.start_d AS date), CAST(v.end_d AS date), v.paid, v.status, 1
FROM (
  VALUES
    ('TEST-C-001','2025-11-01','2025-11-05', TRUE, 'Aprobado'),
    ('TEST-C-002','2025-11-01','2025-11-05', TRUE, 'Aprobado')
) AS v(nid, start_d, end_d, paid, status)
JOIN verdepradera.vpg_employees e ON e.employee_national_id = v.nid
WHERE NOT EXISTS (
  SELECT 1 FROM verdepradera.vpg_vacations vc
  WHERE vc.vacations_employee_id = e.employee_id
    AND vc.vacations_start_date = CAST(v.start_d AS date)
    AND vc.vacations_end_date   = CAST(v.end_d AS date)
);

-- ===============================
-- INSTRUCCIONES DE USO
-- ===============================
-- 1. Ejecuta este script en tu base de datos (psql / GUI) asegurando el search_path del esquema verdepradera.
-- 2. Usa un periodo de cálculo que cubra 2025-11-01 a 2025-11-05 para verificar:
--    - Grupo A produce horas completas.
--    - Grupo B se interrumpe por eventos laborales.
--    - Grupo C aparece como vacaciones y no genera horas durante el rango.
-- 3. Verifica luego vpg_payroll_employee tras correr tu proceso de cálculo.
-- 4. Ajusta nombres/IDs si tu lógica de estatus difiere.

-- FIN DEL SCRIPT
