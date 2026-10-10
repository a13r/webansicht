const { ApiHelper } = require('./api');

// Console errors caused by the unreachable external basemap are expected in the
// sandboxed test environment and are not application bugs.
const IGNORED_ERRORS = [
  /Failed to load resource/,
  /basemap/i,
  /WMTS/i,
  // map.jsx logs the failed basemap capabilities request (404/HTML or network error)
  /readFromNode|Failed to fetch/,
  /ERR_(NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|CONNECTION|TUNNEL|CERT|PROXY)/,
];

/**
 * Collects console errors and uncaught page errors. Call the returned function
 * at the end of a test to get the list (known basemap/tile network noise ignored).
 */
function collectErrors(page) {
  const found = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED_ERRORS.some((re) => re.test(text))) return;
    found.push(`console: ${text}`);
  });
  page.on('pageerror', (err) => found.push(`pageerror: ${err.message}`));
  return () => found.slice();
}

/** ApiHelper with todo, position and message-patch support (kept out of the shared helper). */
class MiscApiHelper extends ApiHelper {
  constructor(baseURL) {
    super(baseURL);
    this._createdTodos = [];
    this._createdPositions = [];
  }

  async createTodo(data) {
    const todo = await this._request('POST', '/todos', {
      description: 'E2E todo',
      dueDate: new Date(Date.now() + 3600_000).toISOString(),
      ...data,
    });
    this._createdTodos.push(todo._id);
    return todo;
  }

  async getTodos() {
    return this._request('GET', '/todos');
  }

  async patchMessage(id, data) {
    return this._request('PATCH', `/messages/${id}`, data);
  }

  async createPosition(data) {
    const position = await this._request('POST', '/positions', data);
    this._createdPositions.push(position._id);
    return position;
  }

  async cleanup() {
    for (const id of this._createdTodos) {
      await this._request('DELETE', `/todos/${id}`).catch(() => {});
    }
    for (const id of this._createdPositions) {
      await this._request('DELETE', `/positions/${id}`).catch(() => {});
    }
    this._createdTodos = [];
    this._createdPositions = [];
    await super.cleanup();
  }
}

module.exports = { collectErrors, MiscApiHelper };
