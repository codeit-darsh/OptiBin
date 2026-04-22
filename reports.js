/**
 * reports.js – ReportStore + NotifStore backed by SQLite via API
 */

const ReportStore = (() => {
  let cache = [];

  const TYPES = ['Overflowing', 'Damaged', 'Bad Smell', 'Blocked Access', 'Other'];

  async function init() {
    try { cache = await Api.Reports.getAll(); }
    catch (e) { console.warn('ReportStore.init failed:', e.message); }
  }

  async function add(report) {
    const result = await Api.Reports.add({
      binId:        report.binId,
      binLocation:  report.binLocation,
      type:         report.type,
      description:  report.description || '',
      reporterName: report.reporterName || 'Anonymous',
      urgent:       report.urgent || false,
    });
    cache.unshift(result);
    return result;
  }

  function getAll()    { return [...cache]; }
  function getOpen()   { return cache.filter(r => r.status === 'open'); }
  function getUrgent() { return cache.filter(r => r.urgent && r.status === 'open'); }
  function getByBin(binId) { return cache.filter(r => r.binId === binId); }

  async function updateStatus(id, status) {
    await Api.Reports.updateStatus(id, status);
    const r = cache.find(r => r.id === id);
    if (r) { r.status = status; r.resolvedAt = new Date().toISOString(); }
  }

  async function refresh() {
    cache = await Api.Reports.getAll();
  }

  return { TYPES, init, add, getAll, getOpen, getUrgent, getByBin, updateStatus, refresh };
})();


const NotifStore = (() => {
  let cache = [];

  async function init(role, driverId) {
    try { cache = await Api.Notifs.getAll(role, driverId); }
    catch (e) { console.warn('NotifStore.init failed:', e.message); }
  }

  async function add(notif) {
    await Api.Notifs.add(notif);
    // Refresh local cache
    try { cache = await Api.Notifs.getAll('all'); } catch {}
  }

  async function refresh(role, driverId) {
    try { cache = await Api.Notifs.getAll(role, driverId); } catch {}
  }

  function getAll()     { return [...cache]; }
  function getUnread()  { return cache.filter(n => !n.read); }
  function countUnread(){ return cache.filter(n => !n.read).length; }

  async function markRead(id) {
    await Api.Notifs.markRead(id);
    const n = cache.find(n => n.id === id);
    if (n) n.read = true;
  }

  async function markAllRead(role, driverId) {
    await Api.Notifs.markAllRead(role, driverId);
    cache.forEach(n => { n.read = true; });
  }

  return { init, add, refresh, getAll, getUnread, countUnread, markRead, markAllRead };
})();
