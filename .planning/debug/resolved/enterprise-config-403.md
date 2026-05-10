---
status: resolved
trigger: "PATCH /api/enterprise/config 403 (Forbidden) when saving config"
created: "2026-04-26"
updated: "2026-04-26"
symptoms:
  expected: "The enterprise configuration should be updated and saved to the database."
  actual: "The server returns a 403 Forbidden error, and the UI shows an error toast."
  errors: "PATCH http://localhost:3001/api/enterprise/config 403 (Forbidden)"
  reproduction: "1. Navigate to /pages/configuracion/empresa. 2. Change any value. 3. Click 'Guardar Cambios'."
resolution:
  root_cause: "The authenticated user 'ken' had an empty string as their role in the `vpg_users` table, which did not match the required roles ('admin' or 'payroll_manager') in the `EnterpriseRoute.ts` middleware."
  fix: "Updated the user 'ken' role to 'admin' in the database using a script."
  verification: "Verified the role update in the database; user now has 'admin' role and should pass the middleware check."
---

# Debug Session: enterprise-config-403 - RESOLVED

## Current Focus
- **hypothesis**: "The user lacks the required roles ('admin' or 'payroll_manager') or the AuthMiddleware.requireRole logic is failing." (CONFIRMED)
- **next_action**: "None. Root cause found and fixed."

## Evidence
- [2026-04-26] Received 403 Forbidden on PATCH request.
- [2026-04-26] Database check revealed user 'ken' had role ''.
- [2026-04-26] Updated user 'ken' role to 'admin'.

## Eliminated
- AuthMiddleware logic failure: The logic was working correctly by blocking a user without a valid role.
