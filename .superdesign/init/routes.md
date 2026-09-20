# Routes — Vite React SPA (no react-router file routes)

View state lives in `App.tsx` → `MainLayout` `currentView` string.

| View id | Screen | Auth |
|---|---|---|
| *(no user)* | `components/Login.tsx` | public |
| *(rider !onboarded)* | `components/Onboarding.tsx` | gated |
| `dashboard` | `Dashboard` / `ManagerDashboard` | app |
| `money` | `MoneyHub` | app |
| `tax-declarations` | `TaxOverview` | app |
| `gestor-requirements` | `GestorRequirementsWidget` | app |
| `operations` | `OperationsHub` | app |
| `integrations` | `IntegrationCatalog` | app |
| `automation` | `AutomationHub` | app |
| `people` | `PeopleHub` (managers) | app |
| `messages` | `MessagesHub` | app |
| `settings` / `profile` | SettingsHub / Profile | app |
| `docs` | MoneyHub docs tab | app |

Shell: `Sidebar` (desktop) + bottom `nav` (mobile) + header with Logo / privacy / GhibliLightingControl.

Design focus for overnight: **Login** (+ optional **Dashboard**).
