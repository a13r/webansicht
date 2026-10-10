const { GenericContainer } = require('testcontainers');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Ask the OS for a free port, so parallel runs (e.g. from different worktrees) don't collide
function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

module.exports = async function globalSetup() {
  // Run against an already running server instead of starting one
  if (process.env.E2E_BASE_URL) return;

  const mongo = await new GenericContainer('mongo:7')
    .withExposedPorts(27017)
    .start();

  const mongoUri = `mongodb://localhost:${mongo.getMappedPort(27017)}/webansicht_e2e`;

  // Build frontend if not already built
  if (!fs.existsSync(path.join(ROOT, 'public', 'index.html'))) {
    execSync('npm run web:build', { cwd: ROOT, stdio: 'inherit' });
  }

  const port = await freePort();
  const baseURL = `http://localhost:${port}`;

  // Start the app server
  const app = spawn('node', ['src/'], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      MONGODB_URI: mongoUri,
      NODE_CONFIG: JSON.stringify({ port }),
    },
    stdio: 'pipe',
  });

  app.stderr.on('data', (d) => process.stderr.write(d));
  let exitCode = null;
  app.on('exit', (code) => { exitCode = code; });

  const stop = async () => {
    app.kill();
    await mongo.stop();
  };

  // Wait for the app to be ready
  let ready = false;
  for (let i = 0; i < 60 && exitCode === null; i++) {
    try {
      const res = await fetch(baseURL);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!ready) {
    await stop();
    throw new Error(exitCode === null
      ? `App did not start on ${baseURL} within 60s`
      : `App exited with code ${exitCode} before it was ready on ${baseURL}`);
  }

  // Workers inherit the environment, so the config and helpers pick this up
  process.env.E2E_BASE_URL = baseURL;

  return stop;
};
