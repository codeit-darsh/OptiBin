/**
 * data.js – BinStore (hybrid: in-memory cache + SQLite API sync)
 * Reads: synchronous from cache
 * Writes: async to API, cache updated immediately for responsive UI
 */
const BinStore = (() => {
  let bins = [];

  function getStatus(fill) {
    if (fill <= 40) return 'low';
    if (fill <= 75) return 'medium';
    return 'full';
  }

  /** Load all bins from the backend (call once on page load) */
  async function init() {
    try {
      bins = await Api.Bins.getAll();
    } catch (e) {
      console.warn('BinStore.init: API unreachable, using empty cache.', e.message);
      bins = [];
    }
  }

  function getAll() { return bins.map(b => ({ ...b, status: getStatus(b.fill) })); }
  function getById(id) {
    const b = bins.find(b => b.id === id);
    return b ? { ...b, status: getStatus(b.fill) } : null;
  }

  async function add(data) {
    const result = await Api.Bins.add(data);       // throws on error
    bins.push(result);
    return result;
  }

  async function updateFill(id, val) {
    await Api.Bins.updateFill(id, val);
    const b = bins.find(b => b.id === id);
    if (b) b.fill = Math.min(100, Math.max(0, val));
  }

  async function remove(id) {
    await Api.Bins.remove(id);
    bins = bins.filter(b => b.id !== id);
  }

  /** Called by simulation loop — API handles fill increment */
  async function tick() {
    const updated = await Api.Bins.tick();
    bins = updated;
  }

  /** Local-only simulate (manual button) */
  function simulate() {
    bins.forEach(b => {
      b.fill = Math.min(100, Math.max(0, b.fill + Math.floor(Math.random() * 18) - 3));
    });
  }

  async function collect(id) {
    const updated = await Api.Bins.collect(id);
    const b = bins.find(b => b.id === id);
    if (b && updated) b.fill = updated.fill;
  }

  function getStats() {
    const all = getAll();
    return {
      total: all.length,
      needsCollection: all.filter(b => b.status === 'full').length,
      operational: all.filter(b => b.status !== 'full').length,
      avg: all.length ? Math.round(all.reduce((s, b) => s + b.fill, 0) / all.length) : 0,
    };
  }

  return { init, getAll, getById, add, updateFill, remove, tick, simulate, collect, getStats };
})();
