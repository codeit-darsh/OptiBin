/**
 * server.js – Express REST API + static file server for OptiBin
 *
 * Run:  node server.js
 * Open: http://localhost:3000/login.html
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Bins, Trucks, Reports, Notifications } = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve all static HTML/JS/CSS files from this folder
app.use(express.static(path.join(__dirname)));

/* ─── helper ─── */
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function ok(res, data) { res.json({ success: true, data }); }
function err(res, msg, code = 400) { res.status(code).json({ success: false, error: msg }); }

/* ============================================================
   BINS
============================================================ */
app.get('/api/bins', (req, res) => {
  ok(res, Bins.getAll());
});

app.post('/api/bins', (req, res) => {
  const { id, location, zone, fill = 0, capacity = 120, lat, lng, fillRate = 1.5 } = req.body;
  if (!id || !location) return err(res, 'id and location are required');
  if (Bins.getById(id)) return err(res, `Bin "${id}" already exists`);
  const center = { lat: 28.6270, lng: 77.3000 };
  Bins.insert.run({
    id, location, zone: zone || 'East Delhi', fill,
    capacity, lat: lat || center.lat + (Math.random() - 0.5) * 0.08,
    lng: lng || center.lng + (Math.random() - 0.5) * 0.12, fillRate,
  });
  ok(res, Bins.getById(id));
});

app.put('/api/bins/:id/fill', (req, res) => {
  const { fill } = req.body;
  if (fill === undefined) return err(res, 'fill is required');
  if (!Bins.getById(req.params.id)) return err(res, 'Bin not found', 404);
  Bins.updateFill.run({ fill: Math.min(100, Math.max(0, fill)), id: req.params.id });
  ok(res, Bins.getById(req.params.id));
});

app.delete('/api/bins/:id', (req, res) => {
  if (!Bins.getById(req.params.id)) return err(res, 'Bin not found', 404);
  Bins.delete.run(req.params.id);
  ok(res, { id: req.params.id });
});

// Simulation tick — accumulate fill for all bins
app.post('/api/bins/tick', (req, res) => {
  Bins.tick();
  ok(res, Bins.getAll());
});

// Collect a bin (reset fill to near 0)
app.post('/api/bins/:id/collect', (req, res) => {
  Bins.collect.run(Math.floor(Math.random() * 8), req.params.id);
  ok(res, Bins.getById(req.params.id));
});

// Randomize ALL bin fill levels (5–100% random)
app.post('/api/bins/randomize', (req, res) => {
  const { db } = require('./database');
  const bins = Bins.getAll();
  const upd = db.prepare('UPDATE bins SET fill = ? WHERE id = ?');
  const txn = db.transaction(() => {
    bins.forEach(b => {
      const fill = Math.floor(5 + Math.random() * 95);  // 5–100%
      upd.run(fill, b.id);
    });
  });
  txn();
  ok(res, Bins.getAll());
});

/* ============================================================
   TRUCKS
============================================================ */
app.get('/api/trucks', (req, res) => {
  ok(res, Trucks.getAll());
});

app.post('/api/trucks', (req, res) => {
  const { id, name, driverName = 'Unassigned', color = '#6b7280', lat, lng, zone = 'All' } = req.body;
  if (!id || !name || !lat || !lng) return err(res, 'id, name, lat, lng are required');
  if (Trucks.getById(id)) return err(res, `Truck "${id}" already exists`);
  Trucks.insert.run({ id, name, driverName, color, lat, lng, zone });
  ok(res, Trucks.getById(id));
});

app.put('/api/trucks/:id', (req, res) => {
  const truck = Trucks.getById(req.params.id);
  if (!truck) return err(res, 'Truck not found', 404);
  const updated = { ...truck, ...req.body };
  Trucks.update.run({
    lat: updated.lat, lng: updated.lng, status: updated.status,
    route: JSON.stringify(updated.route || []),
    routeIndex: updated.routeIndex || 0,
    collected: updated.collected || 0,
    id: req.params.id,
  });
  ok(res, Trucks.getById(req.params.id));
});

app.delete('/api/trucks/:id', (req, res) => {
  if (!Trucks.getById(req.params.id)) return err(res, 'Truck not found', 404);
  Trucks.delete.run(req.params.id);
  ok(res, { id: req.params.id });
});

app.post('/api/trucks/reset', (req, res) => {
  Trucks.reset();
  ok(res, Trucks.getAll());
});

/* ============================================================
   REPORTS
============================================================ */
app.get('/api/reports', (req, res) => {
  ok(res, Reports.getAll());
});

app.post('/api/reports', (req, res) => {
  const { binId, binLocation, type, description = '', reporterName = 'Anonymous', urgent = false } = req.body;
  if (!binId || !type) return err(res, 'binId and type are required');

  const id = 'RPT-' + uid();
  Reports.insert.run({
    id, binId, binLocation: binLocation || binId, type, description,
    reporterName, status: 'open', urgent: urgent ? 1 : 0,
    timestamp: new Date().toISOString()
  });

  // Auto-create a notification for all roles
  Notifications.insert.run({
    id: 'NTF-' + uid(),
    title: `🚨 Citizen Report: ${type}`,
    message: `${binId} at ${binLocation} — "${description}"`,
    type: 'report', binId, reportId: id,
    forRole: 'all', forDriver: null,
    timestamp: new Date().toISOString(),
  });

  ok(res, Reports.getById(id));
});

app.put('/api/reports/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return err(res, 'status is required');
  Reports.updateStatus.run(status, req.params.id);
  ok(res, Reports.getById(req.params.id));
});

/* ============================================================
   NOTIFICATIONS
============================================================ */
app.get('/api/notifications', (req, res) => {
  const { role = 'all', driverId } = req.query;
  ok(res, Notifications.getAll(role, driverId));
});

app.post('/api/notifications', (req, res) => {
  const { title, message, type = 'info', binId, reportId, forRole = 'all', forDriver } = req.body;
  if (!title) return err(res, 'title is required');
  const id = 'NTF-' + uid();
  Notifications.insert.run({
    id, title, message: message || '', type,
    binId: binId || null, reportId: reportId || null,
    forRole, forDriver: forDriver || null,
    timestamp: new Date().toISOString()
  });
  ok(res, { id });
});

app.put('/api/notifications/:id/read', (req, res) => {
  Notifications.markRead.run(req.params.id);
  ok(res, { id: req.params.id });
});

app.put('/api/notifications/mark-all-read', (req, res) => {
  const { role = 'all', driverId } = req.body;
  Notifications.markAllRead(role, driverId);
  ok(res, { success: true });
});

/* ============================================================
   DEFAULT ROUTE → login page
============================================================ */
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.listen(PORT, () => {
  console.log(`\n✅  OptiBin server running at http://localhost:${PORT}`);
  console.log(`    Open → http://localhost:${PORT}/login.html\n`);
});
