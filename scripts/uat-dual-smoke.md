# Smoke: imprimir checklist dual-cuenta

```bash
npm run uat:dual
```

Equivale a volcar `docs/UAT_DUAL_ACCOUNT.md` en consola para seguirlo en una sesión de Lewis.

## Automatizado (sin credenciales live)

```bash
npm test
```

Cubre:

- `messageCache` — aislamiento por `userId`, purge de cache legacy, fallback offline fail-closed
- `bankAdapter` / `bankApi` — Open Banking refuse (sin tokens ni «connected»)
- `billingService` — `VITE_BILLING_ENABLED` default off

**Esto no es PASS de UAT dual-cuenta.** El PASS lo firma Lewis tras la checklist española.
