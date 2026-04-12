const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio-client');
const auth = require('@feathersjs/authentication-client');
const { io } = require('socket.io-client');

class ApiHelper {
  constructor(baseURL) {
    this.baseURL = baseURL || process.env.E2E_BASE_URL || 'http://localhost:3030';
    this.token = null;
    this._socketClient = null;
    this._socket = null;
    this._createdResources = [];
    this._createdUsers = [];
    this._createdStations = [];
    this._createdTransports = [];
    this._createdJournalEntries = [];
  }

  async authenticate(username = 'admin', password = 'changeme') {
    const res = await fetch(`${this.baseURL}/authentication`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy: 'local', username, password }),
    });
    if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
    const data = await res.json();
    this.token = data.accessToken;
    return data;
  }

  async _getSocketClient() {
    if (this._socketClient) return this._socketClient;
    this._socket = io(this.baseURL);
    this._socketClient = feathers();
    this._socketClient.configure(socketio(this._socket));
    this._socketClient.configure(auth());
    await this._socketClient.authenticate({
      strategy: 'local',
      username: 'admin',
      password: 'changeme',
    });
    return this._socketClient;
  }

  async _request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${this.baseURL}${path}`, opts);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
    }
    return res.json();
  }

  // Resources
  async createResource(data) {
    const resource = await this._request('POST', '/resources', {
      callSign: 'TEST-1',
      type: 'RTW',
      tetra: '12345',
      state: 0,
      ordering: 99,
      hidden: false,
      ...data,
    });
    this._createdResources.push(resource._id);
    return resource;
  }

  async patchResource(id, data) {
    return this._request('PATCH', `/resources/${id}`, data);
  }

  async getResources() {
    return this._request('GET', '/resources');
  }

  async deleteResource(id) {
    return this._request('DELETE', `/resources/${id}`);
  }

  // Users (via Socket.IO — REST user creation lacks authenticate hook)
  async createUser(data) {
    const suffix = Math.random().toString(36).slice(2, 8);
    const client = await this._getSocketClient();
    const user = await client.service('users').create({
      username: `testuser-${suffix}`,
      name: 'Test User',
      password: 'testpass123',
      initials: suffix.toUpperCase().slice(0, 4),
      roles: ['station'],
      ...data,
    });
    this._createdUsers.push(user._id);
    return user;
  }

  // Stations
  async createStation(data) {
    const station = await this._request('POST', '/stations', {
      name: 'Test Station',
      currentPatients: 5,
      maxPatients: 20,
      ordering: 1,
      ...data,
    });
    this._createdStations.push(station._id);
    return station;
  }

  async patchStation(id, data) {
    return this._request('PATCH', `/stations/${id}`, data);
  }

  // Journal
  async createJournalEntry(data) {
    const entry = await this._request('POST', '/journal', {
      text: 'Test journal entry',
      ...data,
    });
    this._createdJournalEntries.push(entry._id);
    return entry;
  }

  // Transports
  async createTransport(data) {
    const transport = await this._request('POST', '/transports', {
      requester: 'Test Station',
      priority: 0,
      type: 0,
      diagnose: 'Test diagnosis',
      destination: { hospital: 'Test Hospital', station: 'Station A' },
      state: 0,
      ...data,
    });
    this._createdTransports.push(transport._id);
    return transport;
  }

  // Log
  async getLog(query = {}) {
    const params = new URLSearchParams(query);
    return this._request('GET', `/log?${params}`);
  }

  // Cleanup
  async cleanup() {
    for (const id of this._createdResources) {
      await this._request('DELETE', `/resources/${id}`).catch(() => {});
    }
    if (this._createdUsers.length > 0 && this._socketClient) {
      for (const id of this._createdUsers) {
        await this._socketClient.service('users').remove(id).catch(() => {});
      }
    }
    for (const id of this._createdStations) {
      await this._request('DELETE', `/stations/${id}`).catch(() => {});
    }
    for (const id of this._createdTransports) {
      await this._request('DELETE', `/transports/${id}`).catch(() => {});
    }
    for (const id of this._createdJournalEntries) {
      await this._request('DELETE', `/journal/${id}`).catch(() => {});
    }
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
      this._socketClient = null;
    }
    this._createdResources = [];
    this._createdUsers = [];
    this._createdStations = [];
    this._createdTransports = [];
    this._createdJournalEntries = [];
  }
}

module.exports = { ApiHelper };
