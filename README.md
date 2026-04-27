# MY.OS

A personal life-OS Progressive Web App. Money, tasks, workouts, goals, leveling, and a coach with personality — all running offline, on your phone, across one connected app.

> **Status:** under construction. Phase 1 (shell + PWA install path) is complete. Modules land in subsequent phases.

---

## Live build

Once deployed, MY.OS will live at:

**https://clewiidaho.github.io/RickyOS/**

The GitHub Actions workflow (`.github/workflows/deploy.yml`) auto-builds and publishes on every push to `main`.

---

## Install on Android (PWA)

1. Open **https://clewiidaho.github.io/RickyOS/** in **Chrome** on your Android phone.
2. Wait a moment for the page to load (the service worker registers automatically).
3. Open the Chrome menu (⋮) → **Add to Home screen** (or **Install app**).
4. Confirm. MY.OS appears as a standalone app icon on your home screen.
5. Open it — the splash screen uses the deep-indigo theme color, then the shell loads.
6. Try airplane mode → re-open. The app still loads (shell + assets are cached).

> **First load is the only time the network is required.** After that, MY.OS works fully offline.

### iOS note

iOS Safari has weaker PWA support (no Web Push, narrower install affordances) but MY.OS will still install via **Share → Add to Home Screen**. Android Chrome is the primary target.

---

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # strict TypeScript check
npm run build        # production bundle in /dist
npm run preview      # serve the production build locally
```

To regenerate PWA icons after editing `scripts/generate-icons.mjs`:

```bash
npm run generate-icons
```

---

## Architecture

```
src/
  app/                 Routing + layout shell
  modules/
    money/
    responsibilities/  (Tasks)
    workouts/
    goals/
    level/
    coach/
  voice/               Quip library + selection engine + week analyzer
  db/                  Dexie schema + seed data
  notifications/       Local web push scheduling
  ui/
    components/        Reusable primitives (Card, Button, Sheet, etc.)
    motion/            Shared Framer Motion variants
    theme/             Design tokens
  utils/               XP math, pace math, event bus, backup, etc.
  hooks/
  stores/              Zustand stores for cross-module state
```

### Stack

- **Vite + React 18 + TypeScript** (strict mode)
- **Tailwind CSS** with a custom dark token palette
- **Framer Motion** for all animation
- **Dexie.js** for IndexedDB persistence
- **Recharts** for visualizations
- **vite-plugin-pwa** (Workbox) for offline + service worker
- **react-router-dom v6**
- **zustand** for lightweight global state
- **date-fns** for date math
- **canvas-confetti** for celebration moments
- **lucide-react** for icons

No backend. No telemetry. No cloud sync. All data lives in your browser's IndexedDB.

---

## Phase progress

- [x] **Phase 1** — Scaffold, design tokens, PWA install path, layout shell, routing, GitHub Pages CI/CD
- [x] **Phase 2** — Dexie schema + seed data
- [x] **Phase 3** — Event bus + XP engine + streak engine + action orchestrator
- [ ] Phase 4 — Voice engine + 500+ quips
- [x] **Phase 5** — Onboarding flow (welcome → name → tone → daily XP target → ready)
- [x] **Phase 6** — Money module (bills with monthly status, income, cash adjustments, summary)
- [x] **Phase 7** — Responsibilities module (daily/weekly/one-off, categories, streak card)
- [ ] Phase 8 — Workouts module
- [ ] Phase 9 — Goals module (cross-module integration)
- [ ] Phase 10 — Level system polish (level-up sequence)
- [ ] Phase 11 — Coach module
- [ ] Phase 12 — Notifications scheduler
- [ ] Phase 13 — Settings + Backup/Restore + Voice Studio
- [ ] Phase 14 — Polish pass

---

## License

Personal project. Not currently licensed for redistribution.
