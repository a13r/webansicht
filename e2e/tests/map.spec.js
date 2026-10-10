const { test, expect } = require('@playwright/test');
const { collectErrors, MiscApiHelper } = require('../helpers/misc');

// The map component exposes the OpenLayers instance as window.map. The resource layer
// is the vector layer with zIndex 10; this returns its features as plain data.
const resourceFeatures = (page) => page.evaluate(() => {
  const layer = window.map && window.map.getLayers().getArray().find((l) => l.getZIndex() === 10);
  const source = layer && layer.getSource();
  if (!source) return [];
  return source.getFeatures().map((f) => ({ name: f.get('name'), color: f.get('color') }));
});

const featureNames = async (page) => (await resourceFeatures(page)).map((f) => f.name);

test.describe('Map', () => {
  let api;
  // unique issi per run so parallel/previous runs cannot interfere
  const issi = () => String(70000 + Math.floor(Math.random() * 29999));

  test.beforeEach(async () => {
    api = new MiscApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('loads, renders the canvas and shows a position of a resource', async ({ page }) => {
    const errors = collectErrors(page);
    const tetra = issi();
    await api.createResource({ callSign: 'MAP-1', tetra, state: 1, showOnMap: true });
    await api.createPosition({ issi: tetra, lat: 48.2, lon: 16.3 });

    await page.goto('/map');
    await expect(page.locator('.openlayers-map canvas').first()).toBeVisible();
    await expect.poll(() => featureNames(page)).toContain('MAP-1');
    expect(errors()).toEqual([]);
  });

  test('uses the state color of the resource for its marker and follows state changes', async ({ page }) => {
    const tetra = issi();
    const resource = await api.createResource({ callSign: 'MAP-COLOR', tetra, state: 1, showOnMap: true });
    await api.createPosition({ issi: tetra, lat: 48.21, lon: 16.31 });

    await page.goto('/map');
    const colorOf = async () => (await resourceFeatures(page)).find((f) => f.name === 'MAP-COLOR')?.color;
    await expect.poll(colorOf).toBeTruthy();
    const before = await colorOf();

    await api.patchResource(resource._id, { state: 4 });
    await expect.poll(colorOf).not.toBe(before);
  });

  test('shows a new position in real time and removes it again', async ({ page }) => {
    await page.goto('/map');
    await expect(page.locator('.openlayers-map canvas').first()).toBeVisible();
    const tetra = issi();
    expect(await featureNames(page)).not.toContain(tetra);

    // position without a matching resource is shown under its ISSI (red marker)
    const position = await api.createPosition({ issi: tetra, lat: 48.22, lon: 16.32 });
    await expect.poll(() => featureNames(page)).toContain(tetra);
    expect((await resourceFeatures(page)).find((f) => f.name === tetra).color).toBe('red');

    await api._request('DELETE', `/positions/${position._id}`);
    await expect.poll(() => featureNames(page)).not.toContain(tetra);
  });

  test('hides positions of resources that are not shown on the map', async ({ page }) => {
    const tetra = issi();
    const resource = await api.createResource({ callSign: 'MAP-HIDE', tetra, state: 1, showOnMap: true });
    await api.createPosition({ issi: tetra, lat: 48.23, lon: 16.33 });

    await page.goto('/map');
    await expect.poll(() => featureNames(page)).toContain('MAP-HIDE');

    await api.patchResource(resource._id, { showOnMap: false });
    await expect.poll(() => featureNames(page)).not.toContain('MAP-HIDE');
  });
});
