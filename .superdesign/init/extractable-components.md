# Extractable DraftComponents

## Logo
- Source: `components/Logo.tsx`
- Category: basic
- Description: Labora+ mark (forest gradient + path + clay dot) with optional wordmark
- Extractable props: size (sm|md|lg|xl), showText (boolean), variant (light|dark), animated (boolean)
- Hardcoded: SVG paths, brand gradient, clay/gold accents, "Labora+" text

## MeadowLandscape
- Source: `components/MeadowLandscape.tsx`
- Category: basic
- Description: Ghibli-inspired SVG meadow (hills, grass, clouds, sun/moon, path)
- Extractable props: variant (panel|strip|hero), className, palette override
- Hardcoded: SVG geometry, grass tufts, fence posts (no characters)

## Sidebar
- Source: `components/Sidebar.tsx`
- Category: layout
- Description: Warm parchment OS sidebar — rider/manager nav, identity, logout
- Extractable props: currentView, setView, isMobileMenuOpen, setIsMobileMenuOpen
- Hardcoded: Spanish labels, Lucide icons, section grouping (Primary / Workspace)

## AuthCard (pattern inside Login)
- Source: `components/Login.tsx` (inline)
- Category: basic
- Description: Cream parchment card — Entrar / Crear cuenta tabs, clay CTA
- Extractable props: mode (login|register), loading, error, info
- Hardcoded: Spanish copy, input chrome, meadow mobile strip

## AppShell / MainLayout
- Source: `App.tsx`
- Category: layout
- Description: Full-height shell with Sidebar + header + mobile bottom nav
- Extractable props: currentView, pendingReqCount, privacyMode
- Hardcoded: view titles map, nav items, canvas `#F7F3EA`
