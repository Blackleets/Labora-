# Registration policy

## Roles

| Role | Who | Signup |
|------|-----|--------|
| **Autónomo (rider)** | Delivery / freelance workers | **Open** — name, email, password (optional plate / NIF). No invite code. |
| **Gestoría (manager)** | Accounting firms | **Identified** — company name + **company NIF/CIF/NIE** + **collegiate number**, format-validated before account creation. |

## What we validate

- **Spanish tax id (NIF / CIF / NIE):** control-character / format check only.
- **Número de colegiado:** non-empty, minimum length, alphanumeric (normalized).

We do **not**:

- Call AEAT or any government API
- Put gestorías in a `pending_verification` queue
- Require invite codes
- Close autónomo registration

## Enforcement

1. **UI (`Login.tsx`):** manager path requires the fields and shows clear Spanish errors.
2. **Client service (`signUpRemote` in `authWorkspace.ts`):** calls `assertManagerSignupFields` — throws if `role=manager` without both valid NIF and collegiate number. Riders skip this guard.

Shared helpers live in `services/registrationValidation.ts` (unit-tested).
