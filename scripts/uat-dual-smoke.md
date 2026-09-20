# Smoke: checklist dual-cuenta + prep machine-check

```bash
npm run uat:dual
```

Imprime `docs/UAT_DUAL_ACCOUNT.md` y un bloque **prep** (sin red, sin secretos):

| Check | Qué mira | FAIL significa |
| --- | --- | --- |
| `checklist_doc` | Firma Lewis / PASS global en el doc | Doc incompleto |
| `env_example` | `VITE_SUPABASE_*` en `.env.example` | Ejemplo roto |
| `env_local` | Entradas en `.env.local` (valores no se imprimen) | Aviso: copia `.env.example` antes del UAT live |
| `migrations_dir` / `rpc_*` | SQL menciona `link_manager_by_email` + `unlink_own_manager` | Falta shape RPC en repo |
| `vitest_link_guards` | Tests de rechazo self-link / no-gestoría | Guards ausentes |

Salida máquina (parseable):

```text
PREP_STATUS=ready|ready_with_warnings|blocked
UAT_PASS_CLAIMED=false
PREP_JSON={...}
```

- Exit **0** si no hay blockers de repo (`ready` o `ready_with_warnings`).
- Exit **1** solo si `PREP_STATUS=blocked` (shape rota).
- **Nunca** interpreta exit 0 como PASS de UAT dual-cuenta.

## Automatizado (sin credenciales live)

```bash
npm test
```

Cubre (entre otros):

- `gestoriaLinking` — self-link y rider-as-manager rechazados
- `messageCache` — aislamiento por `userId`
- `bankAdapter` / `bankApi` — Open Banking refuse
- `billingService` — `VITE_BILLING_ENABLED` default off

**Esto no es PASS de UAT dual-cuenta.** El PASS lo firma Lewis tras la checklist española (§G).
