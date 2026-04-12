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
config/        Feathers config (default.json, production.json, e2e.json)
```

## Commands

```bash
npm run api:dev        # Start backend in dev mode
npm run web:dev        # Start Vite dev server (HMR)
npm run web:build      # Build frontend → /public
npm test               # Run unit tests (Vitest)
npm run e2e            # Run Playwright e2e tests
npm run e2e:docker:up  # Rebuild and start Docker for e2e
npm run e2e:docker:down
```

## E2E Tests

After making code changes, rebuild the Docker containers before running tests:

```bash
npm run e2e:docker:up   # Rebuild with your changes
npm run e2e:test        # Run Playwright only
```

`e2e:docker:up` rebuilds the app with your changes. Without it, tests run against stale code.
`npm run e2e` does everything (up + test + down) but is slower for iteration.

## Key Patterns

- **Store pattern**: MobX stores subscribe to Feathers service events (`on('created')`, `on('updated')`, etc.) for real-time sync. Stores use `makeObservable()` with explicit annotations.
- **loginReaction()**: Triggers side effects on login/logout (defined in `web/stores/index.js`).
- **restrictToRoles()**: HOC that hides components if user lacks required roles (in `web/components/restrictToRoles.jsx`).
- **Form $changed counter**: mobx-react-form tracks changes via an incrementing `$changed` counter, NOT value comparison. Only `reset()` or `clear()` zeroes it. After a successful save, recreate the form or call `reset()` to clear the dirty state.
- **Feathers client**: Configured in `web/app.js` with Socket.io transport. Service calls return promises; real-time events fire separately via socket.

## Git

Do not include a co-author signature in commit messages.
