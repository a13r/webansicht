const { GenericContainer } = require('testcontainers');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

module.exports = async function globalSetup() {
  const mongo = await new GenericContainer('mongo:7')
    .withExposedPorts(27017)
    .start();

  const mongoUri = `mongodb://localhost:${mongo.getMappedPort(27017)}/webansicht_e2e`;

  // Build frontend if not already built
  if (!fs.existsSync(path.join(ROOT, 'public', 'index.html'))) {
    execSync('npm run web:build', { cwd: ROOT, stdio: 'inherit' });
  }

  // Start the app server
  const app = spawn('node', ['src/'], {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: 'production', MONGODB_URI: mongoUri },
    stdio: 'pipe',
  });

  app.stderr.on('data', (d) => process.stderr.write(d));

  // Wait for the app to be ready
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch('http://localhost:3030');
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }

  return async () => {
    app.kill();
    await mongo.stop();
  };
};
