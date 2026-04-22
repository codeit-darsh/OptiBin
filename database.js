/**
 * database.js – MongoDB (Mongoose) schema, seed data, query helpers
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/optibin';

/* ── Helper: _id → id ── */
function clean(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id;
  delete obj._id;
  return obj;
}
function cleanAll(docs) { return docs.map(clean); }

/* ── SCHEMAS ── */
const binSchema = new mongoose.Schema({
  _id: String,
  location: String, zone: String,
  fill: { type: Number, default: 0 },
  capacity: { type: Number, default: 120 },
  lat: Number, lng: Number,
  fillRate: { type: Number, default: 1.5 },
}, { versionKey: false });

const truckSchema = new mongoose.Schema({
  _id: String,
  name: String,
  driverName: { type: String, default: 'Unassigned' },
  color: { type: String, default: '#6b7280' },
  lat: Number, lng: Number,
  depotLat: Number, depotLng: Number,
  zone: { type: String, default: 'All' },
  status: { type: String, default: 'idle' },
  route: { type: [String], default: [] },
  routeIndex: { type: Number, default: 0 },
  collected: { type: Number, default: 0 },
  speed: { type: Number, default: 0.0018 },
}, { versionKey: false });

const reportSchema = new mongoose.Schema({
  _id: String,
  binId: String, binLocation: String,
  type: { type: String },
  description: { type: String, default: '' },
  reporterName: { type: String, default: 'Anonymous' },
  status: { type: String, default: 'open' },
  urgent: { type: Boolean, default: false },
  timestamp: String,
}, { versionKey: false });

const notifSchema = new mongoose.Schema({
  _id: String,
  title: String,
  message: { type: String, default: '' },
  ntype: { type: String, default: 'info' },
  binId: String, reportId: String,
  forRole: { type: String, default: 'all' },
  forDriver: String,
  read: { type: Boolean, default: false },
  timestamp: String,
}, { versionKey: false });

const BinModel = mongoose.model('Bin', binSchema);
const TruckModel = mongoose.model('Truck', truckSchema);
const ReportModel = mongoose.model('Report', reportSchema);
const NotifModel = mongoose.model('Notification', notifSchema);

/* ── SEED DATA ── */
async function seed() {
  if (await BinModel.countDocuments() === 0) {
    await BinModel.insertMany([
      { _id:'BIN-001', location:'Rohini Sector 7 Market', zone:'North Delhi', fill:78, capacity:120, lat:28.7185, lng:77.1146, fillRate:2.1 },
      { _id:'BIN-002', location:'Pitampura Metro Gate', zone:'North Delhi', fill:45, capacity:100, lat:28.6985, lng:77.1305, fillRate:1.6 },
      { _id:'BIN-003', location:'Shalimar Bagh Main Market', zone:'North Delhi', fill:62, capacity:150, lat:28.7132, lng:77.1686, fillRate:1.8 },
      { _id:'BIN-004', location:'Model Town Metro Station', zone:'North Delhi', fill:91, capacity:120, lat:28.7010, lng:77.1948, fillRate:2.5 },
      { _id:'BIN-005', location:'Burari Main Road Chowk', zone:'North Delhi', fill:33, capacity:100, lat:28.7403, lng:77.2012, fillRate:1.2 },
      { _id:'BIN-006', location:'Paschim Vihar Market', zone:'West Delhi', fill:70, capacity:120, lat:28.6694, lng:77.1050, fillRate:2.0 },
      { _id:'BIN-007', location:'Uttam Nagar West Market', zone:'West Delhi', fill:55, capacity:150, lat:28.6210, lng:77.0533, fillRate:1.5 },
      { _id:'BIN-008', location:'Rajouri Garden Metro', zone:'West Delhi', fill:83, capacity:120, lat:28.6473, lng:77.1229, fillRate:2.3 },
      { _id:'BIN-009', location:'Janakpuri C Block Market', zone:'West Delhi', fill:40, capacity:100, lat:28.6290, lng:77.0878, fillRate:1.3 },
      { _id:'BIN-010', location:'Dwarka Sector 10 Market', zone:'West Delhi', fill:67, capacity:150, lat:28.5929, lng:77.0484, fillRate:1.9 },
      { _id:'BIN-011', location:'Saket Select Citywalk Gate', zone:'South Delhi', fill:88, capacity:200, lat:28.5273, lng:77.2181, fillRate:2.8 },
      { _id:'BIN-012', location:'Hauz Khas Village Market', zone:'South Delhi', fill:52, capacity:120, lat:28.5535, lng:77.2006, fillRate:1.7 },
      { _id:'BIN-013', location:'Lajpat Nagar Central Mkt', zone:'South Delhi', fill:76, capacity:150, lat:28.5675, lng:77.2432, fillRate:2.2 },
      { _id:'BIN-014', location:'Greater Kailash I M Block', zone:'South Delhi', fill:44, capacity:120, lat:28.5486, lng:77.2449, fillRate:1.4 },
      { _id:'BIN-015', location:'Vasant Kunj Shopping Ctr', zone:'South Delhi', fill:95, capacity:100, lat:28.5209, lng:77.1525, fillRate:3.0 },
      { _id:'BIN-016', location:'Malviya Nagar Market', zone:'South Delhi', fill:61, capacity:120, lat:28.5318, lng:77.2089, fillRate:1.8 },
      { _id:'BIN-017', location:'Connaught Place Inner Ring', zone:'Central Delhi', fill:73, capacity:200, lat:28.6315, lng:77.2167, fillRate:2.6 },
      { _id:'BIN-018', location:'Chandni Chowk Main Bazar', zone:'Central Delhi', fill:89, capacity:150, lat:28.6505, lng:77.2303, fillRate:2.9 },
      { _id:'BIN-019', location:'Sarojini Nagar Market', zone:'Central Delhi', fill:57, capacity:120, lat:28.5770, lng:77.1983, fillRate:1.6 },
      { _id:'BIN-020', location:'Paharganj Main Bazar', zone:'Central Delhi', fill:81, capacity:100, lat:28.6435, lng:77.2122, fillRate:2.4 },
      { _id:'BIN-021', location:'Laxmi Nagar Market', zone:'East Delhi', fill:85, capacity:120, lat:28.6319, lng:77.2771, fillRate:2.2 },
      { _id:'BIN-022', location:'Preet Vihar Metro Gate', zone:'East Delhi', fill:60, capacity:100, lat:28.6272, lng:77.2912, fillRate:1.8 },
      { _id:'BIN-023', location:'Shahdara Bus Terminal', zone:'East Delhi', fill:92, capacity:120, lat:28.6704, lng:77.2871, fillRate:2.8 },
      { _id:'BIN-024', location:'Karkardooma Court Road', zone:'East Delhi', fill:48, capacity:100, lat:28.6492, lng:77.3002, fillRate:1.5 },
      { _id:'BIN-025', location:'Patparganj Industrial Area', zone:'East Delhi', fill:71, capacity:150, lat:28.6225, lng:77.3038, fillRate:2.0 },
      { _id:'BIN-026', location:'Sector 18 Market, Noida', zone:'Noida', fill:77, capacity:120, lat:28.5672, lng:77.3212, fillRate:2.5 },
      { _id:'BIN-027', location:'Sector 62 Tech Park Gate', zone:'Noida', fill:30, capacity:150, lat:28.6273, lng:77.3739, fillRate:1.0 },
      { _id:'BIN-028', location:'Sector 44 Noida Market', zone:'Noida', fill:88, capacity:100, lat:28.5390, lng:77.3540, fillRate:2.0 },
      { _id:'BIN-029', location:'Botanical Garden Road', zone:'Noida', fill:20, capacity:120, lat:28.5640, lng:77.3282, fillRate:0.9 },
      { _id:'BIN-030', location:'Sector 15 Noida', zone:'Noida', fill:65, capacity:100, lat:28.5830, lng:77.3190, fillRate:1.7 },
      { _id:'BIN-031', location:'Kaushambi Main Market', zone:'Ghaziabad', fill:95, capacity:120, lat:28.6362, lng:77.3270, fillRate:3.0 },
      { _id:'BIN-032', location:'Indirapuram Alpha 1', zone:'Ghaziabad', fill:48, capacity:150, lat:28.6487, lng:77.3700, fillRate:1.4 },
      { _id:'BIN-033', location:'Vaishali Sector 4 Market', zone:'Ghaziabad', fill:72, capacity:120, lat:28.6454, lng:77.3378, fillRate:1.9 },
      { _id:'BIN-034', location:'Mohan Nagar Chowk', zone:'Ghaziabad', fill:81, capacity:150, lat:28.7009, lng:77.4342, fillRate:2.3 },
      { _id:'BIN-035', location:'DLF Cyber City Gate', zone:'Gurugram', fill:64, capacity:200, lat:28.4950, lng:77.0890, fillRate:2.1 },
      { _id:'BIN-036', location:'MG Road Gurugram Metro', zone:'Gurugram', fill:87, capacity:150, lat:28.4796, lng:77.0892, fillRate:2.6 },
      { _id:'BIN-037', location:'Sector 14 Gurugram Market', zone:'Gurugram', fill:39, capacity:120, lat:28.4683, lng:77.0328, fillRate:1.1 },
      { _id:'BIN-038', location:'Golf Course Road Market', zone:'Gurugram', fill:74, capacity:100, lat:28.4605, lng:77.1050, fillRate:2.0 },
      { _id:'BIN-039', location:'Udyog Vihar Phase 4', zone:'Gurugram', fill:56, capacity:120, lat:28.5035, lng:77.0912, fillRate:1.6 },
      { _id:'BIN-040', location:'NIT Faridabad Market', zone:'Faridabad', fill:68, capacity:120, lat:28.3833, lng:77.3142, fillRate:1.8 },
    ]);
    console.log('  Seeded 40 bins');
  }

  if (await TruckModel.countDocuments() === 0) {
    await TruckModel.insertMany([
      { _id:'TRK-A', name:'Truck Alpha', driverName:'Ramesh Kumar', color:'#0d9488', lat:28.7185, lng:77.1146, depotLat:28.7185, depotLng:77.1146, zone:'North Delhi' },
      { _id:'TRK-B', name:'Truck Beta', driverName:'Suresh Yadav', color:'#ea580c', lat:28.6473, lng:77.1229, depotLat:28.6473, depotLng:77.1229, zone:'West Delhi' },
      { _id:'TRK-C', name:'Truck Gamma', driverName:'Pradeep Singh', color:'#7c3aed', lat:28.6315, lng:77.2167, depotLat:28.6315, depotLng:77.2167, zone:'Central Delhi' },
      { _id:'TRK-D', name:'Truck Delta', driverName:'Vijay Sharma', color:'#dc2626', lat:28.5273, lng:77.2181, depotLat:28.5273, depotLng:77.2181, zone:'South Delhi' },
      { _id:'TRK-E', name:'Truck Echo', driverName:'Mohan Lal', color:'#0891b2', lat:28.6319, lng:77.2771, depotLat:28.6319, depotLng:77.2771, zone:'East Delhi' },
      { _id:'TRK-F', name:'Truck Foxtrot', driverName:'Ajay Verma', color:'#2563eb', lat:28.5672, lng:77.3212, depotLat:28.5672, depotLng:77.3212, zone:'Noida' },
      { _id:'TRK-G', name:'Truck Golf', driverName:'Rakesh Gupta', color:'#c026d3', lat:28.6362, lng:77.3270, depotLat:28.6362, depotLng:77.3270, zone:'Ghaziabad' },
      { _id:'TRK-H', name:'Truck Hotel', driverName:'Sanjay Mehra', color:'#ca8a04', lat:28.4950, lng:77.0890, depotLat:28.4950, depotLng:77.0890, zone:'Gurugram' },
    ]);
    console.log('  Seeded 8 trucks');
  }
}

/* ── CONNECT ── */
async function connect() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  await seed();
}

/* ── QUERY HELPERS ── */
const Bins = {
  getAll:     async ()          => cleanAll(await BinModel.find().sort('_id').lean()),
  getById:    async (id)        => clean(await BinModel.findById(id).lean()),
  insert:     async (data)      => { const d = await BinModel.create({ _id: data.id, ...data }); return clean(d); },
  updateFill: async (id, fill)  => { await BinModel.updateOne({ _id: id }, { fill }); },
  delete:     async (id)        => { await BinModel.deleteOne({ _id: id }); },
  collect:    async (id, fill)  => { await BinModel.updateOne({ _id: id }, { fill }); },
  tick:       async ()          => {
    const bins = await BinModel.find().lean();
    const ops = bins.map(b => ({
      updateOne: { filter: { _id: b._id }, update: { fill: Math.min(100, b.fill + (b.fillRate || 1.5)) } }
    }));
    if (ops.length) await BinModel.bulkWrite(ops);
    return cleanAll(await BinModel.find().sort('_id').lean());
  },
  randomize:  async ()          => {
    const bins = await BinModel.find().lean();
    const ops = bins.map(b => ({
      updateOne: { filter: { _id: b._id }, update: { fill: Math.floor(5 + Math.random() * 95) } }
    }));
    if (ops.length) await BinModel.bulkWrite(ops);
    return cleanAll(await BinModel.find().sort('_id').lean());
  },
};

const Trucks = {
  getAll:   async ()       => cleanAll(await TruckModel.find().sort('_id').lean()),
  getById:  async (id)     => clean(await TruckModel.findById(id).lean()),
  insert:   async (data)   => {
    const d = await TruckModel.create({ _id: data.id, ...data, depotLat: data.lat, depotLng: data.lng });
    return clean(d);
  },
  update:   async (id, data) => {
    await TruckModel.updateOne({ _id: id }, data);
  },
  delete:   async (id)     => { await TruckModel.deleteOne({ _id: id }); },
  reset:    async ()       => {
    const trucks = await TruckModel.find().lean();
    const ops = trucks.map(t => ({
      updateOne: { filter: { _id: t._id }, update: { lat: t.depotLat, lng: t.depotLng, status: 'idle', route: [], routeIndex: 0, collected: 0 } }
    }));
    if (ops.length) await TruckModel.bulkWrite(ops);
  },
};

const Reports = {
  getAll:       async ()          => cleanAll(await ReportModel.find().sort({ timestamp: -1 }).lean()),
  getById:      async (id)        => clean(await ReportModel.findById(id).lean()),
  insert:       async (data)      => { const d = await ReportModel.create({ _id: data.id, ...data }); return clean(d); },
  updateStatus: async (id, status) => { await ReportModel.updateOne({ _id: id }, { status }); },
};

const Notifications = {
  getAll: async (role, driverId) => {
    const all = await NotifModel.find().sort({ timestamp: -1 }).limit(60).lean();
    return cleanAll(all.filter(n =>
      n.forRole === 'all' || n.forRole === role || (role === 'driver' && n.forDriver === driverId)
    )).map(n => { n.type = n.ntype; delete n.ntype; return n; });
  },
  insert: async (data) => {
    const d = await NotifModel.create({ _id: data.id, ...data, ntype: data.type });
    const obj = clean(d);
    obj.type = obj.ntype; delete obj.ntype;
    return obj;
  },
  markRead:    async (id)               => { await NotifModel.updateOne({ _id: id }, { read: true }); },
  markAllRead: async (role, driverId)   => {
    await NotifModel.updateMany(
      { $or: [{ forRole: 'all' }, { forRole: role }, { forDriver: driverId || '' }] },
      { read: true }
    );
  },
};

module.exports = { connect, Bins, Trucks, Reports, Notifications };
