import { GenericContainer } from 'testcontainers';

export async function setup() {
  const container = await new GenericContainer('mongo:7')
    .withExposedPorts(27017)
    .start();

  const port = container.getMappedPort(27017);
  process.env.MONGODB_URI = `mongodb://localhost:${port}/webansicht_test`;

  globalThis.__MONGO_CONTAINER__ = container;
}

export async function teardown() {
  await globalThis.__MONGO_CONTAINER__?.stop();
}
