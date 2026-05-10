# Phase 16: Mejorar rendimiento web — reducir LCP de 5.86s a <2.5s y mejorar CLS

**Gathered:** 2026-04-02
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode — performance optimization phase)

<domain>
## Phase Boundary

Reducir Largest Contentful Paint (LCP) de 5.86s a menos de 2.5s y mejorar Cumulative Layout Shift (CLS) en la aplicación Next.js frontend. Esto incluye optimización de carga de recursos, lazy loading, image optimization, font loading strategy, y eliminación de layout shifts causados por contenido dinámico.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — performance optimization phase with clear technical targets. Use Web Vitals best practices, Next.js optimization features, and codebase patterns to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research. Key areas to investigate:
- Next.js Image component usage vs raw img tags
- Font loading strategy (next/font vs external)
- Dynamic imports and code splitting
- CSS loading order and layout stability
- Data fetching patterns (server vs client components)

</code_context>

<specifics>
## Specific Ideas

- LCP actual: 5.86s — target: <2.5s
- CLS necesita mejora — identificar causas de layout shift
- Enfocarse en páginas de mayor tráfico primero

</specifics>

<deferred>
## Deferred Ideas

None — performance optimization stayed within phase scope.

</deferred>
