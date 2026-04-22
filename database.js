/**
 * database.js – SQLite schema, seed data (40 bins across Delhi NCR), query helpers
 */
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'optibin.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS bins (
    id TEXT PRIMARY KEY, location TEXT NOT NULL, zone TEXT NOT NULL,
    fill REAL NOT NULL DEFAULT 0, capacity INTEGER NOT NULL DEFAULT 120,
    lat REAL NOT NULL, lng REAL NOT NULL, fill_rate REAL NOT NULL DEFAULT 1.5
  );
  CREATE TABLE IF NOT EXISTS trucks (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    driver_name TEXT NOT NULL DEFAULT 'Unassigned',
    color TEXT NOT NULL DEFAULT '#6b7280',
    lat REAL NOT NULL, lng REAL NOT NULL,
    depot_lat REAL NOT NULL, depot_lng REAL NOT NULL,
    zone TEXT NOT NULL DEFAULT 'All', status TEXT NOT NULL DEFAULT 'idle',
    route TEXT NOT NULL DEFAULT '[]', route_index INTEGER NOT NULL DEFAULT 0,
    collected INTEGER NOT NULL DEFAULT 0, speed REAL NOT NULL DEFAULT 0.0018
  );
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY, bin_id TEXT NOT NULL, bin_location TEXT NOT NULL,
    type TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    reporter_name TEXT NOT NULL DEFAULT 'Anonymous',
    status TEXT NOT NULL DEFAULT 'open',
    urgent INTEGER NOT NULL DEFAULT 0, timestamp TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', bin_id TEXT, report_id TEXT,
    for_role TEXT NOT NULL DEFAULT 'all', for_driver TEXT,
    is_read INTEGER NOT NULL DEFAULT 0, timestamp TEXT NOT NULL
  );
`);

/* ── SEED BINS (40 bins across Delhi NCR) ── */
if (db.prepare('SELECT COUNT(*) as c FROM bins').get().c === 0) {
  const ins = db.prepare(`INSERT INTO bins (id,location,zone,fill,capacity,lat,lng,fill_rate)
                          VALUES (@id,@location,@zone,@fill,@capacity,@lat,@lng,@fillRate)`);
  db.transaction(bins => bins.forEach(b => ins.run(b)))([
    // North Delhi
    { id: 'BIN-001', location: 'Rohini Sector 7 Market', zone: 'North Delhi', fill: 78, capacity: 120, lat: 28.7185, lng: 77.1146, fillRate: 2.1 },
    { id: 'BIN-002', location: 'Pitampura Metro Gate', zone: 'North Delhi', fill: 45, capacity: 100, lat: 28.6985, lng: 77.1305, fillRate: 1.6 },
    { id: 'BIN-003', location: 'Shalimar Bagh Main Market', zone: 'North Delhi', fill: 62, capacity: 150, lat: 28.7132, lng: 77.1686, fillRate: 1.8 },
    { id: 'BIN-004', location: 'Model Town Metro Station', zone: 'North Delhi', fill: 91, capacity: 120, lat: 28.7010, lng: 77.1948, fillRate: 2.5 },
    { id: 'BIN-005', location: 'Burari Main Road Chowk', zone: 'North Delhi', fill: 33, capacity: 100, lat: 28.7403, lng: 77.2012, fillRate: 1.2 },
    // West Delhi
    { id: 'BIN-006', location: 'Paschim Vihar Market', zone: 'West Delhi', fill: 70, capacity: 120, lat: 28.6694, lng: 77.1050, fillRate: 2.0 },
    { id: 'BIN-007', location: 'Uttam Nagar West Market', zone: 'West Delhi', fill: 55, capacity: 150, lat: 28.6210, lng: 77.0533, fillRate: 1.5 },
    { id: 'BIN-008', location: 'Rajouri Garden Metro', zone: 'West Delhi', fill: 83, capacity: 120, lat: 28.6473, lng: 77.1229, fillRate: 2.3 },
    { id: 'BIN-009', location: 'Janakpuri C Block Market', zone: 'West Delhi', fill: 40, capacity: 100, lat: 28.6290, lng: 77.0878, fillRate: 1.3 },
    { id: 'BIN-010', location: 'Dwarka Sector 10 Market', zone: 'West Delhi', fill: 67, capacity: 150, lat: 28.5929, lng: 77.0484, fillRate: 1.9 },
    // South Delhi
    { id: 'BIN-011', location: 'Saket Select Citywalk Gate', zone: 'South Delhi', fill: 88, capacity: 200, lat: 28.5273, lng: 77.2181, fillRate: 2.8 },
    { id: 'BIN-012', location: 'Hauz Khas Village Market', zone: 'South Delhi', fill: 52, capacity: 120, lat: 28.5535, lng: 77.2006, fillRate: 1.7 },
    { id: 'BIN-013', location: 'Lajpat Nagar Central Mkt', zone: 'South Delhi', fill: 76, capacity: 150, lat: 28.5675, lng: 77.2432, fillRate: 2.2 },
    { id: 'BIN-014', location: 'Greater Kailash I M Block', zone: 'South Delhi', fill: 44, capacity: 120, lat: 28.5486, lng: 77.2449, fillRate: 1.4 },
    { id: 'BIN-015', location: 'Vasant Kunj Shopping Ctr', zone: 'South Delhi', fill: 95, capacity: 100, lat: 28.5209, lng: 77.1525, fillRate: 3.0 },
    { id: 'BIN-016', location: 'Malviya Nagar Market', zone: 'South Delhi', fill: 61, capacity: 120, lat: 28.5318, lng: 77.2089, fillRate: 1.8 },
    // Central / New Delhi
    { id: 'BIN-017', location: 'Connaught Place Inner Ring', zone: 'Central Delhi', fill: 73, capacity: 200, lat: 28.6315, lng: 77.2167, fillRate: 2.6 },
    { id: 'BIN-018', location: 'Chandni Chowk Main Bazar', zone: 'Central Delhi', fill: 89, capacity: 150, lat: 28.6505, lng: 77.2303, fillRate: 2.9 },
    { id: 'BIN-019', location: 'Sarojini Nagar Market', zone: 'Central Delhi', fill: 57, capacity: 120, lat: 28.5770, lng: 77.1983, fillRate: 1.6 },
    { id: 'BIN-020', location: 'Paharganj Main Bazar', zone: 'Central Delhi', fill: 81, capacity: 100, lat: 28.6435, lng: 77.2122, fillRate: 2.4 },
    // East Delhi
    { id: 'BIN-021', location: 'Laxmi Nagar Market', zone: 'East Delhi', fill: 85, capacity: 120, lat: 28.6319, lng: 77.2771, fillRate: 2.2 },
    { id: 'BIN-022', location: 'Preet Vihar Metro Gate', zone: 'East Delhi', fill: 60, capacity: 100, lat: 28.6272, lng: 77.2912, fillRate: 1.8 },
    { id: 'BIN-023', location: 'Shahdara Bus Terminal', zone: 'East Delhi', fill: 92, capacity: 120, lat: 28.6704, lng: 77.2871, fillRate: 2.8 },
    { id: 'BIN-024', location: 'Karkardooma Court Road', zone: 'East Delhi', fill: 48, capacity: 100, lat: 28.6492, lng: 77.3002, fillRate: 1.5 },
    { id: 'BIN-025', location: 'Patparganj Industrial Area', zone: 'East Delhi', fill: 71, capacity: 150, lat: 28.6225, lng: 77.3038, fillRate: 2.0 },
    // Noida
    { id: 'BIN-026', location: 'Sector 18 Market, Noida', zone: 'Noida', fill: 77, capacity: 120, lat: 28.5672, lng: 77.3212, fillRate: 2.5 },
    { id: 'BIN-027', location: 'Sector 62 Tech Park Gate', zone: 'Noida', fill: 30, capacity: 150, lat: 28.6273, lng: 77.3739, fillRate: 1.0 },
    { id: 'BIN-028', location: 'Sector 44 Noida Market', zone: 'Noida', fill: 88, capacity: 100, lat: 28.5390, lng: 77.3540, fillRate: 2.0 },
    { id: 'BIN-029', location: 'Botanical Garden Road', zone: 'Noida', fill: 20, capacity: 120, lat: 28.5640, lng: 77.3282, fillRate: 0.9 },
    { id: 'BIN-030', location: 'Sector 15 Noida', zone: 'Noida', fill: 65, capacity: 100, lat: 28.5830, lng: 77.3190, fillRate: 1.7 },
    // Ghaziabad
    { id: 'BIN-031', location: 'Kaushambi Main Market', zone: 'Ghaziabad', fill: 95, capacity: 120, lat: 28.6362, lng: 77.3270, fillRate: 3.0 },
    { id: 'BIN-032', location: 'Indirapuram Alpha 1', zone: 'Ghaziabad', fill: 48, capacity: 150, lat: 28.6487, lng: 77.3700, fillRate: 1.4 },
    { id: 'BIN-033', location: 'Vaishali Sector 4 Market', zone: 'Ghaziabad', fill: 72, capacity: 120, lat: 28.6454, lng: 77.3378, fillRate: 1.9 },
    { id: 'BIN-034', location: 'Mohan Nagar Chowk', zone: 'Ghaziabad', fill: 81, capacity: 150, lat: 28.7009, lng: 77.4342, fillRate: 2.3 },
    // Gurugram
    { id: 'BIN-035', location: 'DLF Cyber City Gate', zone: 'Gurugram', fill: 64, capacity: 200, lat: 28.4950, lng: 77.0890, fillRate: 2.1 },
    { id: 'BIN-036', location: 'MG Road Gurugram Metro', zone: 'Gurugram', fill: 87, capacity: 150, lat: 28.4796, lng: 77.0892, fillRate: 2.6 },
    { id: 'BIN-037', location: 'Sector 14 Gurugram Market', zone: 'Gurugram', fill: 39, capacity: 120, lat: 28.4683, lng: 77.0328, fillRate: 1.1 },
    { id: 'BIN-038', location: 'Golf Course Road Market', zone: 'Gurugram', fill: 74, capacity: 100, lat: 28.4605, lng: 77.1050, fillRate: 2.0 },
    { id: 'BIN-039', location: 'Udyog Vihar Phase 4', zone: 'Gurugram', fill: 56, capacity: 120, lat: 28.5035, lng: 77.0912, fillRate: 1.6 },
    // Faridabad
    { id: 'BIN-040', location: 'NIT Faridabad Market', zone: 'Faridabad', fill: 68, capacity: 120, lat: 28.3833, lng: 77.3142, fillRate: 1.8 },
  ]);
}

/* ── SEED TRUCKS ── */
if (db.prepare('SELECT COUNT(*) as c FROM trucks').get().c === 0) {
  const ins = db.prepare(`INSERT INTO trucks (id,name,driver_name,color,lat,lng,depot_lat,depot_lng,zone)
                          VALUES (@id,@name,@driverName,@color,@lat,@lng,@lat,@lng,@zone)`);
  [
    { id: 'TRK-A', name: 'Truck Alpha', driverName: 'Ramesh Kumar', color: '#0d9488', lat: 28.7185, lng: 77.1146, zone: 'North Delhi' },
    { id: 'TRK-B', name: 'Truck Beta', driverName: 'Suresh Yadav', color: '#ea580c', lat: 28.6473, lng: 77.1229, zone: 'West Delhi' },
    { id: 'TRK-C', name: 'Truck Gamma', driverName: 'Pradeep Singh', color: '#7c3aed', lat: 28.6315, lng: 77.2167, zone: 'Central Delhi' },
    { id: 'TRK-D', name: 'Truck Delta', driverName: 'Vijay Sharma', color: '#dc2626', lat: 28.5273, lng: 77.2181, zone: 'South Delhi' },
    { id: 'TRK-E', name: 'Truck Echo', driverName: 'Mohan Lal', color: '#0891b2', lat: 28.6319, lng: 77.2771, zone: 'East Delhi' },
    { id: 'TRK-F', name: 'Truck Foxtrot', driverName: 'Ajay Verma', color: '#2563eb', lat: 28.5672, lng: 77.3212, zone: 'Noida' },
    { id: 'TRK-G', name: 'Truck Golf', driverName: 'Rakesh Gupta', color: '#c026d3', lat: 28.6362, lng: 77.3270, zone: 'Ghaziabad' },
    { id: 'TRK-H', name: 'Truck Hotel', driverName: 'Sanjay Mehra', color: '#ca8a04', lat: 28.4950, lng: 77.0890, zone: 'Gurugram' },
  ].forEach(t => ins.run(t));
}

/* ── QUERY HELPERS ── */
function hydrateBin(r) {
  if (!r) return null;
  return {
    id: r.id, location: r.location, zone: r.zone, fill: r.fill,
    capacity: r.capacity, lat: r.lat, lng: r.lng, fillRate: r.fill_rate
  };
}
function hydrateTruck(r) {
  if (!r) return null;
  return {
    id: r.id, name: r.name, driverName: r.driver_name, color: r.color,
    lat: r.lat, lng: r.lng, depotLat: r.depot_lat, depotLng: r.depot_lng,
    zone: r.zone, status: r.status,
    route: JSON.parse(r.route || '[]'), routeIndex: r.route_index,
    collected: r.collected, speed: r.speed
  };
}
function hydrateReport(r) {
  if (!r) return null;
  return {
    id: r.id, binId: r.bin_id, binLocation: r.bin_location, type: r.type,
    description: r.description, reporterName: r.reporter_name,
    status: r.status, urgent: !!r.urgent, timestamp: r.timestamp
  };
}
function hydrateNotif(r) {
  if (!r) return null;
  return {
    id: r.id, title: r.title, message: r.message, type: r.type,
    binId: r.bin_id, reportId: r.report_id, forRole: r.for_role,
    forDriver: r.for_driver, read: !!r.is_read, timestamp: r.timestamp
  };
}

const Bins = {
  getAll: () => db.prepare('SELECT * FROM bins ORDER BY id').all().map(hydrateBin),
  getById: id => hydrateBin(db.prepare('SELECT * FROM bins WHERE id=?').get(id)),
  insert: db.prepare('INSERT INTO bins (id,location,zone,fill,capacity,lat,lng,fill_rate) VALUES (@id,@location,@zone,@fill,@capacity,@lat,@lng,@fillRate)'),
  updateFill: db.prepare('UPDATE bins SET fill=@fill WHERE id=@id'),
  delete: db.prepare('DELETE FROM bins WHERE id=?'),
  collect: db.prepare('UPDATE bins SET fill=? WHERE id=?'),
};
const Trucks = {
  getAll: () => db.prepare('SELECT * FROM trucks ORDER BY id').all().map(hydrateTruck),
  getById: id => hydrateTruck(db.prepare('SELECT * FROM trucks WHERE id=?').get(id)),
  insert: db.prepare(`INSERT INTO trucks (id,name,driver_name,color,lat,lng,depot_lat,depot_lng,zone,speed)
                       VALUES (@id,@name,@driverName,@color,@lat,@lng,@lat,@lng,@zone,0.0018)`),
  update: db.prepare('UPDATE trucks SET lat=@lat,lng=@lng,status=@status,route=@route,route_index=@routeIndex,collected=@collected WHERE id=@id'),
  delete: db.prepare('DELETE FROM trucks WHERE id=?'),
  reset: () => db.prepare('UPDATE trucks SET lat=depot_lat,lng=depot_lng,status=\'idle\',route=\'[]\',route_index=0,collected=0').run(),
};
const Reports = {
  getAll: () => db.prepare('SELECT * FROM reports ORDER BY timestamp DESC').all().map(hydrateReport),
  getById: id => hydrateReport(db.prepare('SELECT * FROM reports WHERE id=?').get(id)),
  insert: db.prepare('INSERT INTO reports (id,bin_id,bin_location,type,description,reporter_name,status,urgent,timestamp) VALUES (@id,@binId,@binLocation,@type,@description,@reporterName,@status,@urgent,@timestamp)'),
  updateStatus: db.prepare('UPDATE reports SET status=? WHERE id=?'),
};
const Notifications = {
  getAll: (role, driverId) => db.prepare('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 60').all()
    .filter(n => n.for_role === 'all' || n.for_role === role || (role === 'driver' && n.for_driver === driverId))
    .map(hydrateNotif),
  insert: db.prepare('INSERT INTO notifications (id,title,message,type,bin_id,report_id,for_role,for_driver,timestamp) VALUES (@id,@title,@message,@type,@binId,@reportId,@forRole,@forDriver,@timestamp)'),
  markRead: db.prepare('UPDATE notifications SET is_read=1 WHERE id=?'),
  markAllRead: (role, driverId) => db.prepare('UPDATE notifications SET is_read=1 WHERE for_role=\'all\' OR for_role=? OR for_driver=?').run(role, driverId || ''),
};

module.exports = { db, Bins, Trucks, Reports, Notifications };
