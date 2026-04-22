/**
 * server.js – Express REST API + static file server for OptiBin
 *
 * Run:  node server.js
 * Open: http://localhost:3000/login.html
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connect, Bins, Trucks, Reports, Notifications } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.get('/api/bins', async (req, res) => {
  ok(res, await Bins.getAll());
});

app.post('/api/bins', async (req, res) => {
  const { id, location, zone, fill = 0, capacity = 120, lat, lng, fillRate = 1.5 } = req.body;
  if (!id || !location) return err(res, 'id and location are required');
  if (await Bins.getById(id)) return err(res, `Bin "${id}" already exists`);
  const center = { lat: 28.6270, lng: 77.3000 };
  await Bins.insert({
    id, location, zone: zone || 'East Delhi', fill,
    capacity, lat: lat || center.lat + (Math.random() - 0.5) * 0.08,
    lng: lng || center.lng + (Math.random() - 0.5) * 0.12, fillRate,
  });
  ok(res, await Bins.getById(id));
});

app.put('/api/bins/:id/fill', async (req, res) => {
  const { fill } = req.body;
  if (fill === undefined) return err(res, 'fill is required');
  if (!await Bins.getById(req.params.id)) return err(res, 'Bin not found', 404);
  await Bins.updateFill(req.params.id, Math.min(100, Math.max(0, fill)));
  ok(res, await Bins.getById(req.params.id));
});

app.delete('/api/bins/:id', async (req, res) => {
  if (!await Bins.getById(req.params.id)) return err(res, 'Bin not found', 404);
  await Bins.delete(req.params.id);
  ok(res, { id: req.params.id });
});

// Simulation tick — accumulate fill for all bins
app.post('/api/bins/tick', async (req, res) => {
  ok(res, await Bins.tick());
});

// Collect a bin (reset fill to near 0)
app.post('/api/bins/:id/collect', async (req, res) => {
  await Bins.collect(req.params.id, Math.floor(Math.random() * 8));
  ok(res, await Bins.getById(req.params.id));
});

// Randomize ALL bin fill levels (5–100% random)
app.post('/api/bins/randomize', async (req, res) => {
  ok(res, await Bins.randomize());
});

/* ============================================================
   TRUCKS
============================================================ */
app.get('/api/trucks', async (req, res) => {
  ok(res, await Trucks.getAll());
});

app.post('/api/trucks', async (req, res) => {
  const { id, name, driverName = 'Unassigned', color = '#6b7280', lat, lng, zone = 'All' } = req.body;
  if (!id || !name || !lat || !lng) return err(res, 'id, name, lat, lng are required');
  if (await Trucks.getById(id)) return err(res, `Truck "${id}" already exists`);
  await Trucks.insert({ id, name, driverName, color, lat, lng, zone });
  ok(res, await Trucks.getById(id));
});

app.put('/api/trucks/:id', async (req, res) => {
  const truck = await Trucks.getById(req.params.id);
  if (!truck) return err(res, 'Truck not found', 404);
  const updated = { ...truck, ...req.body };
  await Trucks.update(req.params.id, {
    lat: updated.lat, lng: updated.lng, status: updated.status,
    route: updated.route || [],
    routeIndex: updated.routeIndex || 0,
    collected: updated.collected || 0,
  });
  ok(res, await Trucks.getById(req.params.id));
});

app.delete('/api/trucks/:id', async (req, res) => {
  if (!await Trucks.getById(req.params.id)) return err(res, 'Truck not found', 404);
  await Trucks.delete(req.params.id);
  ok(res, { id: req.params.id });
});

app.post('/api/trucks/reset', async (req, res) => {
  await Trucks.reset();
  ok(res, await Trucks.getAll());
});

/* ============================================================
   REPORTS
============================================================ */
app.get('/api/reports', async (req, res) => {
  ok(res, await Reports.getAll());
});

app.post('/api/reports', async (req, res) => {
  const { binId, binLocation, type, description = '', reporterName = 'Anonymous', urgent = false } = req.body;
  if (!binId || !type) return err(res, 'binId and type are required');

  const id = 'RPT-' + uid();
  await Reports.insert({
    id, binId, binLocation: binLocation || binId, type, description,
    reporterName, status: 'open', urgent,
    timestamp: new Date().toISOString()
  });

  // Auto-create a notification for all roles
  await Notifications.insert({
    id: 'NTF-' + uid(),
    title: `🚨 Citizen Report: ${type}`,
    message: `${binId} at ${binLocation} — "${description}"`,
    type: 'report', binId, reportId: id,
    forRole: 'all', forDriver: null,
    timestamp: new Date().toISOString(),
  });

  ok(res, await Reports.getById(id));
});

app.put('/api/reports/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!status) return err(res, 'status is required');
  await Reports.updateStatus(req.params.id, status);
  ok(res, await Reports.getById(req.params.id));
});

/* ============================================================
   NOTIFICATIONS
============================================================ */
app.get('/api/notifications', async (req, res) => {
  const { role = 'all', driverId } = req.query;
  ok(res, await Notifications.getAll(role, driverId));
});

app.post('/api/notifications', async (req, res) => {
  const { title, message, type = 'info', binId, reportId, forRole = 'all', forDriver } = req.body;
  if (!title) return err(res, 'title is required');
  const id = 'NTF-' + uid();
  await Notifications.insert({
    id, title, message: message || '', type,
    binId: binId || null, reportId: reportId || null,
    forRole, forDriver: forDriver || null,
    timestamp: new Date().toISOString()
  });
  ok(res, { id });
});

app.put('/api/notifications/:id/read', async (req, res) => {
  await Notifications.markRead(req.params.id);
  ok(res, { id: req.params.id });
});

app.put('/api/notifications/mark-all-read', async (req, res) => {
  const { role = 'all', driverId } = req.body;
  await Notifications.markAllRead(role, driverId);
  ok(res, { success: true });
});

/* ============================================================
   DEFAULT ROUTE → login page
============================================================ */
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

/* ============================================================
   START — connect to MongoDB first, then listen
============================================================ */
connect().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅  OptiBin server running at http://localhost:${PORT}`);
    console.log(`    Open → http://localhost:${PORT}/login.html\n`);
  });
}).catch(e => {
  console.error('❌ Failed to connect to MongoDB:', e.message);
  process.exit(1);
});
