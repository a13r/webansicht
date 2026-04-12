# Development Notes

## E2E Tests

After making code changes, rebuild the Docker containers before running e2e tests:

```bash
npm run e2e:docker:up
npm run e2e
```

`e2e:docker:up` rebuilds the app with your changes. Without it, tests run against stale code.
