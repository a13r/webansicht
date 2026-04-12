import { describe, it, beforeAll, afterEach } from 'vitest';
import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const app = require('../../src/app');

describe('state-transitions hook', () => {
    const service = app.service('resources');
    const created = [];

    beforeAll(async () => {
        const mongoose = app.get('mongooseClient');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || app.get('mongodb'));
        }
    });

    async function createResource(data) {
        const resource = await service.create({callSign: `TEST-${Date.now()}`, type: 'RTW', ...data});
        created.push(resource._id);
        return resource;
    }

    afterEach(async () => {
        for (const id of created) {
            try { await service.remove(id); } catch { /* already removed */ }
        }
        created.length = 0;
    });

    it('4→5: copies destination to lastPosition and clears destination', async () => {
        const resource = await createResource({state: 4, destination: 'Hospital A'});
        const patched = await service.patch(resource._id, {state: 5});
        assert.equal(patched.lastPosition, 'Hospital A');
        assert.equal(patched.destination, '');
    });

    it('2→3: copies destination to lastPosition and clears destination', async () => {
        const resource = await createResource({state: 2, destination: 'Scene B'});
        const patched = await service.patch(resource._id, {state: 3});
        assert.equal(patched.lastPosition, 'Scene B');
        assert.equal(patched.destination, '');
    });

    it('any→1 with home: sets lastPosition to home', async () => {
        const resource = await createResource({state: 3, home: 'Station Alpha'});
        const patched = await service.patch(resource._id, {state: 1});
        assert.equal(patched.lastPosition, 'Station Alpha');
    });

    it('any→1 without home: does not change lastPosition', async () => {
        const resource = await createResource({state: 3, lastPosition: 'Existing'});
        const patched = await service.patch(resource._id, {state: 1});
        assert.equal(patched.lastPosition, 'Existing');
    });

    it('non-matching transition: no side effects', async () => {
        const resource = await createResource({state: 1, destination: 'Somewhere', lastPosition: 'Here'});
        const patched = await service.patch(resource._id, {state: 2});
        assert.equal(patched.destination, 'Somewhere');
        assert.equal(patched.lastPosition, 'Here');
    });

    it('same state (dedup): no side effects', async () => {
        const resource = await createResource({state: 4, destination: 'Hospital', lastPosition: 'Old'});
        const patched = await service.patch(resource._id, {state: 4});
        assert.equal(patched.destination, 'Hospital');
        assert.equal(patched.lastPosition, 'Old');
    });

    it('4→5 with destination in patch data: uses patch destination', async () => {
        const resource = await createResource({state: 4, destination: 'Old Hospital'});
        const patched = await service.patch(resource._id, {state: 5, destination: 'New Hospital'});
        assert.equal(patched.lastPosition, 'New Hospital');
        assert.equal(patched.destination, '');
    });
});
