# Roadmap: VP-Planilla

## Milestones

- ✅ **v1.3 — Sistema de Marcas de Reloj Robusto** (shipped 2026-04-09)
- 🚧 **v1.4 — Stability and Integration Hardening**

## Phases

<details>
<summary>✅ v1.3 (Phases 18-23) — SHIPPED 2026-04-09</summary>

- [x] Phase 18: Normalización y Trazabilidad
- [x] Phase 19: Sesiones de Importación
- [x] Phase 20: Huérfanas y Anomalías
- [x] Phase 21: Corrección Manual
- [x] Phase 22: Dashboard UI de Marcas
- [x] Phase 23: Debug y Corrección de Funcionalidad de Marcas

</details>

### 🚧 v1.4 (Planned)

- [ ] **Phase 24: Auth Token Lifecycle End-to-End** - Unificar refresh/revocation/logout y errores de autenticacion en toda la plataforma
- [ ] **Phase 25: HTTP Client Layer Enforcement** - Eliminar bypasses a `http.ts` y estandarizar manejo de errores en servicios frontend
- [ ] **Phase 26: Repository Hygiene and Build Artifacts Cleanup** - Limpiar artefactos versionados y reforzar `.gitignore` multi-stack
- [ ] **Phase 27: Monolith Decomposition and Maintainability** - Refactor de archivos monoliticos con pruebas de regresion

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 18. Normalización y Trazabilidad | v1.3 | 2/2 | Complete | 2026-04-05 |
| 19. Sesiones de Importación | v1.3 | 2/2 | Complete | 2026-04-05 |
| 20. Huérfanas y Anomalías | v1.3 | 3/3 | Complete | 2026-04-05 |
| 21. Corrección Manual | v1.3 | 2/2 | Complete | 2026-04-05 |
| 22. Dashboard UI de Marcas | v1.3 | 3/3 | Complete | 2026-04-06 |
| 23. Debug y Corrección de Marcas | v1.3 | 2/2 | Complete | 2026-04-09 |
| 24. Auth Token Lifecycle End-to-End | v1.4 | 0/3 | Pending | — |
| 25. HTTP Client Layer Enforcement | v1.4 | 0/2 | Pending | — |
| 26. Repository Hygiene and Build Cleanup | v1.4 | 0/2 | Pending | — |
| 27. Monolith Decomposition and Maintainability | v1.4 | 0/3 | Pending | — |

## Archives

- Milestone roadmap archive: `.planning/milestones/v1.3-ROADMAP.md`
- Milestone requirements archive: `.planning/milestones/v1.3-REQUIREMENTS.md`
