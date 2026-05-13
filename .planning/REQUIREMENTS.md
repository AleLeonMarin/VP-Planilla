# Milestone v1.10 Requirements — Production Hardening & DX

## 1. Observability (OBS)

- [ ] **OBS-01**: Integrar Sentry SDK en el Backend (Express 5) usando el patrón de inicialización `--import` para instrumentación temprana.
- [ ] **OBS-02**: Integrar Sentry SDK en el Frontend (Next.js 15) usando `instrumentation.ts` y `global-error.tsx`.
- [ ] **OBS-03**: Configurar Distributed Tracing para vincular trazas entre el Frontend y el Backend.

## 2. Security (SEC)

- [ ] **SEC-01**: Implementar middleware `hpp` en Express para protección contra HTTP Parameter Pollution.
- [ ] **SEC-02**: Auditar y refactorizar controladores que muten `req.query` para usar Zod (evitando el crash de Express 5).

## 3. Developer Experience (DX)

- [ ] **DX-01**: Configurar Husky y Commitlint para forzar Conventional Commits en el repositorio.
- [ ] **DX-02**: Integrar `prisma-dbml-generator` en `schema.prisma` para generación automática de diagramas de base de datos (DBML).

## Future Requirements (Deferred)

- [ ] **DX-03**: Configurar Semantic Release para versionado automático basado en commits.
- [ ] **OBS-04**: Implementar Sentry Session Replay para el Frontend.

## Out of Scope

- **Migración a Microservicios**: Fuera del alcance para este milestone de hardening.
- **Auditoría de Seguridad Externa**: Solo se implementan protecciones básicas de middleware.

## Traceability Matrix

| REQ-ID | Phase | Status |
|--------|-------|--------|
| OBS-01 | — | Pending |
| OBS-02 | — | Pending |
| OBS-03 | — | Pending |
| SEC-01 | — | Pending |
| SEC-02 | — | Pending |
| DX-01  | — | Pending |
| DX-02  | — | Pending |
