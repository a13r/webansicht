const { MongoClient } = require('mongodb');
const { ApiHelper } = require('./api');

/**
 * Extends ApiHelper with the things overview/editor tests need:
 * talk groups, incoming radio calls and logged-in browser contexts for
 * users with a specific role set.
 */
class OverviewHelper extends ApiHelper {
  constructor(baseURL) {
    super(baseURL);
    this._talkGroups = [];
    this._callIds = [];
    this._contexts = [];
  }

  async createTalkGroup(data) {
    const talkGroup = await this._request('POST', '/talkGroups', { name: 'E2E TG', gssi: 9000001, ...data });
    this._talkGroups.push(talkGroup._id);
    return talkGroup;
  }

  /**
   * Incoming calls can only be created internally by the LARDIS integration
   * (external create is disallowed), so insert it straight into MongoDB.
   * Needs E2E_MONGODB_URI, which containerSetup.js exports.
   */
  async createIncomingCall({ issi, gssi }) {
    const uri = process.env.E2E_MONGODB_URI;
    if (!uri) throw new Error('E2E_MONGODB_URI is not set; cannot insert calls directly');
    const client = await MongoClient.connect(uri);
    try {
      const { insertedId } = await client.db().collection('calls').insertOne({
        direction: 'incoming',
        issi: Number(issi),
        gssi: Number(gssi),
        timestamp: new Date(),
      });
      this._callIds.push(insertedId);
      return insertedId;
    } finally {
      await client.close();
    }
  }

  /** Create a user with exactly the given roles and log in with a fresh browser context. */
  async loginAsNewUser(browser, roles) {
    const password = 'testpass123';
    const user = await this.createUser({ roles, password });
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, baseURL: this.baseURL });
    this._contexts.push(context);
    const page = await context.newPage();
    await page.goto('/');
    await page.getByLabel('Benutzername').fill(user.username);
    await page.getByLabel('Passwort').fill(password);
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await page.getByText(user.name).waitFor();
    return { user, context, page };
  }

  async cleanup() {
    for (const context of this._contexts) await context.close().catch(() => {});
    this._contexts = [];
    for (const id of this._talkGroups) {
      await this._request('DELETE', `/talkGroups/${id}`).catch(() => {});
    }
    this._talkGroups = [];
    if (this._callIds.length > 0 && process.env.E2E_MONGODB_URI) {
      const client = await MongoClient.connect(process.env.E2E_MONGODB_URI);
      try {
        await client.db().collection('calls').deleteMany({ _id: { $in: this._callIds } });
      } finally {
        await client.close();
      }
    }
    this._callIds = [];
    await super.cleanup();
  }
}

/** Short random suffix that makes call signs, texts etc. unique per test, so parallel tests and leftovers never match each other's rows. */
const uniqueSuffix = () => Math.random().toString(36).slice(2, 8);

module.exports = { OverviewHelper, uniqueSuffix };
