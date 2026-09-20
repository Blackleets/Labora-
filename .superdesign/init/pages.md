# Pages — dependency trees (design targets)

## Login (public)
Entry: `components/Login.tsx`
Dependencies:
- `components/MeadowLandscape.tsx`
  - `contexts/GhibliAtmosphereContext.tsx`
- `components/Logo.tsx`
- `components/IdentityImagePicker.tsx` (register only)
- `contexts/GhibliAtmosphereContext.tsx`
- `services/authWorkspace.ts`
- `types.ts` (UserRole)
- `index.css` (tokens)

## Dashboard (rider Inicio)
Entry: `components/Dashboard.tsx`
Dependencies:
- `components/MeadowLandscape.tsx`
  - `contexts/GhibliAtmosphereContext.tsx`
- `components/GasStationCaptureModal.tsx`
- `contexts/DataContext.tsx`
- `contexts/CountryContext.tsx`
- work-session helpers in services

## App shell (authenticated)
Entry: `App.tsx` → `MainLayout`
Dependencies:
- `components/Sidebar.tsx`
  - `components/Logo.tsx`
  - `contexts/DataContext.tsx`
  - `contexts/GhibliAtmosphereContext.tsx`
- `components/Login.tsx` (when !currentUser)
- `components/Dashboard.tsx` / `ManagerDashboard.tsx`
- `components/GhibliLightingControl.tsx`
- `components/Toast.tsx`
- hub modules under `modules/`

## MeadowLandscape (shared scenic)
Entry: `components/MeadowLandscape.tsx`
- variants: `panel` | `strip` | `hero`
- palette from atmosphere; hills/grass/clouds/sun-moon SVG (no copyrighted characters)
