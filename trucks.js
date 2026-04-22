/**
 * trucks.js – TruckStore (hybrid: in-memory simulation + API sync)
 *
 * During simulation: trucks move in-memory every tick (smooth animation).
 * Sync to API: on route assignment, on collection, every 5 ticks.
 */
const TruckStore = (() => {
  let trucks    = [];
  let tickCount = 0;

  async function init() {
    try {
      trucks = await Api.Trucks.getAll();
    } catch (e) {
      console.warn('TruckStore.init: API unreachable.', e.message);
      trucks = [];
    }
  }

  function getAll()    { return trucks.map(t => ({ ...t })); }
  function getById(id) { return trucks.find(t => t.id === id) ? { ...trucks.find(t => t.id === id) } : null; }

  async function add(data) {
    const result = await Api.Trucks.add(data);
    trucks.push(result);
    return result;
  }

  async function remove(id) {
    await Api.Trucks.remove(id);
    trucks = trucks.filter(t => t.id !== id);
  }

  /** Assign routes using greedy algorithm, then persist to API */
  async function assignRoutes(bins, threshold = 30) {
    const assignments = RouteOptimizer.assignAllTrucks(bins, trucks, threshold);
    trucks.forEach(t => {
      t.route      = assignments[t.id] || [];
      t.routeIndex = 0;
      t.status     = t.route.length > 0 ? 'en-route' : 'idle';
    });
    // Persist route assignments to DB
    await Promise.all(trucks.map(t => Api.Trucks.update(t.id, {
      route: t.route, routeIndex: t.routeIndex, status: t.status,
      lat: t.lat, lng: t.lng, collected: t.collected,
    })));
  }

  /** Assign a specific bin urgently to the nearest truck */
  async function assignUrgent(binId, bins) {
    const bin = bins.find(b => b.id === binId);
    if (!bin) return null;
    let nearest = null, minDist = Infinity;
    trucks.forEach(t => {
      const d = RouteOptimizer.haversineDistance(t.lat, t.lng, bin.lat, bin.lng);
      if (d < minDist) { minDist = d; nearest = t; }
    });
    if (nearest && !nearest.route.includes(binId)) {
      nearest.route.splice(nearest.routeIndex, 0, binId);
      nearest.status = 'en-route';
      await Api.Trucks.update(nearest.id, { route: nearest.route, status: nearest.status,
        routeIndex: nearest.routeIndex, lat: nearest.lat, lng: nearest.lng, collected: nearest.collected });
    }
    return nearest ? nearest.id : null;
  }

  /**
   * Move all trucks one step; return list of { truckId, binId } collections.
   * Syncs to API every 5 ticks to reduce HTTP calls during fast simulation.
   */
  function tick(bins) {
    const collected = [];
    trucks.forEach(truck => {
      if (truck.status === 'idle' || !truck.route.length) return;
      if (truck.routeIndex >= truck.route.length) { truck.status = 'idle'; return; }

      const targetId  = truck.route[truck.routeIndex];
      const targetBin = bins.find(b => b.id === targetId);
      if (!targetBin) { truck.routeIndex++; return; }

      const dLat = targetBin.lat - truck.lat;
      const dLng = targetBin.lng - truck.lng;
      const dist  = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist < truck.speed * 0.8) {
        truck.lat = targetBin.lat; truck.lng = targetBin.lng;
        collected.push({ truckId: truck.id, binId: targetId });
        truck.collected++;
        truck.routeIndex++;
        truck.status = truck.routeIndex >= truck.route.length ? 'idle' : 'en-route';
      } else {
        truck.lat += dLat * (truck.speed / dist);
        truck.lng += dLng * (truck.speed / dist);
        truck.status = 'en-route';
      }
    });

    tickCount++;
    if (tickCount % 5 === 0) {
      // Background sync every 5 ticks (fire-and-forget)
      trucks.forEach(t => Api.Trucks.update(t.id, {
        lat: t.lat, lng: t.lng, status: t.status,
        route: t.route, routeIndex: t.routeIndex, collected: t.collected,
      }).catch(() => {}));
    }

    return collected;
  }

  async function resetAll() {
    await Api.Trucks.reset();
    trucks = await Api.Trucks.getAll();
  }

  return { init, getAll, getById, add, remove, assignRoutes, assignUrgent, tick, resetAll };
})();
