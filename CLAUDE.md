# Development Notes

## Tech Stack

- **Backend**: Feathers.js 5 + Express + MongoDB (Mongoose) + Socket.io
- **Frontend**: React 18 + MobX 6 + React Bootstrap + Vite
- **Forms**: mobx-react-form with VJF validator (BaseForm in `web/forms/baseForm.js`)
- **Testing**: Vitest (unit), Playwright (e2e)

## Project Structure

```
src/           Backend (Feathers services, models, hooks)
web/           Frontend (React/MobX)
  stores/      MobX stores (observable state, Feathers service subscriptions)
  components/  React components
  containers/  Page-level components
  forms/       mobx-react-form implementations
e2e/           Playwright e2e tests
test/          Vitest unit tests
config/        Feathers config (default.json, production.json)
```

## Commands

```bash
npm run api:dev        # Start backend in dev mode
npm run web:dev        # Start Vite dev server (HMR)
npm run web:build      # Build frontend → /public
npm test               # Run unit tests (Vitest)
npm run e2e            # Run Playwright e2e tests (starts MongoDB + app via testcontainers)
```

## E2E Tests

E2E tests use testcontainers to start an ephemeral MongoDB and the app server automatically:

```bash
npm run web:build       # Rebuild frontend if you changed web/ files
npm run e2e             # Run Playwright e2e tests
```

The frontend is built once and cached in `public/`. Rebuild with `web:build` after changing frontend code.

## Key Patterns

- **Store pattern**: MobX stores subscribe to Feathers service events (`on('created')`, `on('updated')`, etc.) for real-time sync. Stores use `makeObservable()` with explicit annotations.
- **loginReaction()**: Triggers side effects on login/logout (defined in `web/stores/index.js`).
- **restrictToRoles()**: HOC that hides components if user lacks required roles (in `web/components/restrictToRoles.jsx`).
- **Form $changed counter**: mobx-react-form tracks changes via an incrementing `$changed` counter, NOT value comparison. Only `reset()` or `clear()` zeroes it. After a successful save, recreate the form or call `reset()` to clear the dirty state.
- **Feathers client**: Configured in `web/app.js` with Socket.io transport. Service calls return promises; real-time events fire separately via socket.

## Git

Do not include a co-author signature in commit messages.
