/** Register UI-created journal entries (found by text) for cleanup. */
async function trackJournalByText(api, text) {
  const all = await api._request('GET', '/journal');
  for (const e of all.filter(e => e.text === text)) {
    if (!api._createdJournalEntries.includes(e._id)) api._createdJournalEntries.push(e._id);
  }
}

module.exports = { trackJournalByText };
