# webansicht

Real-time operational dashboard for emergency medical services (Sanitätshilfsstellen). Provides dispatchers and station operators with live resource tracking, patient load monitoring, transport management, and a shared operational journal.

## Tech Stack

- **Backend**: [Feathers.js](http://feathersjs.com) 5 (Express) + MongoDB (Mongoose) + Socket.io
- **Frontend**: [React](https://reactjs.org/) 18 + [MobX](https://github.com/mobxjs/mobx) 6 + [React Bootstrap](https://react-bootstrap.github.io/) + [Vite](https://vitejs.dev/)
- **Forms**: [mobx-react-form](https://github.com/foxhound87/mobx-react-form)
- **Maps**: [OpenLayers](https://openlayers.org/) (Basemap.at tiles)
- **Testing**: [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (e2e)
- **Runtime**: Node.js >= 20, npm >= 10

## Project Structure

```
src/                Backend
  services/         Feathers service definitions (REST + real-time)
  models/           Mongoose schemas
  hooks/            Service hooks (audit, logging, dedup, etc.)
  authentication.js JWT + local + OAuth auth setup
  channels.js       Socket.io pub/sub channels
  lardis.js         LARDIS radio dispatch integration
web/                Frontend
  stores/           MobX stores (state management + real-time subscriptions)
  components/       Reusable React components
  containers/       Page-level components (routes)
  forms/            mobx-react-form definitions and validators
  app.js            Feathers client (Socket.io transport)
config/             Environment configs (default.json, production.json)
e2e/                Playwright end-to-end tests
test/               Vitest unit tests
```

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- Docker (for running MongoDB via testcontainers in tests)

### Installation

```bash
npm install
```

### Development

Run the frontend and backend separately, with hot-reloading on the frontend. A local MongoDB instance must be running.

```bash
npm run api:dev    # Start Feathers backend (port 3030)
npm run web:dev    # Start Vite dev server with HMR
```

On first startup, a default admin user is created with username `admin` and password `changeme`.

Open the app at the Vite dev server URL shown in the terminal (usually [http://localhost:5173](http://localhost:5173)). The backend API runs on port 3030 but does not serve the frontend in dev mode — run `npm run web:build` first if you need to access it at [http://localhost:3030](http://localhost:3030).

### Production (Docker)

```bash
docker compose up
```

This starts the app and MongoDB. The app is available at [http://localhost:3030](http://localhost:3030).

## Testing

### Unit Tests

```bash
npm test
```

Runs Vitest against `test/` directory. An ephemeral MongoDB is started automatically via testcontainers.

### End-to-End Tests

E2E tests use Playwright with testcontainers for an ephemeral MongoDB and a local app server.

```bash
npm run web:build   # Build frontend (cached in public/)
npm run e2e         # Run Playwright e2e tests
```

Rebuild with `npm run web:build` after changing frontend code.

## User Roles

Access is controlled via user roles:

| Role | Access |
|------|--------|
| **admin** | Full access: resource management, station configuration, user management |
| **dispo** | Dispatcher: resource overview, transport management, journal, keyboard shortcuts (F1-F8) |
| **station** | Station operator: own station's patient counts and status |

## Key Features

- **Resource Overview** - Live status of all emergency vehicles and units
- **Station Management (SanHiSts)** - Patient load tracking per station with real-time updates
- **Transport Management** - Request and track patient transports between stations and hospitals
- **Operational Journal (ETB)** - Shared log for dispatchers to record events
- **Status History** - Audit trail of all resource state changes
- **Map View** - OpenLayers map with live GPS positions (Basemap.at tiles)
- **Notifications** - Browser notifications for system-wide alerts and messages
- **LARDIS Integration** - Direct connection to emergency radio dispatch systems
- **Export** - Excel/CSV export of journal, log, and transport data

## License

Licensed under the [MIT license](LICENSE).
