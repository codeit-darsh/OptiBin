/**
 * routeOptimizer.js – Distance-aware greedy route optimizer
 *
 * PRIORITY FORMULA (per truck):
 *   score = 0.55 × fillLevel + 0.45 × proximityScore
 *   proximityScore = 20 / (distanceKm + 0.3)
 *
 * This balances urgency (fill %) with efficiency (distance).
 * A full bin 10 km away may score lower than a half-full bin 0.5 km away.
 *
 * GREEDY ASSIGNMENT:
 *   Bins are distributed across trucks without double-booking.
 *   Each truck greedily picks from the remaining unassigned pool
 *   based on its own priority scores (since distance differs per truck).
 */

const RouteOptimizer = (() => {

  /** Haversine great-circle distance in kilometres */
  function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Combined priority score for one bin from one truck's perspective.
   * Higher score = higher priority for that truck.
   */
  function scoreForTruck(bin, truckLat, truckLng) {
    const dist = haversineDistance(truckLat, truckLng, bin.lat, bin.lng);
    const proximityScore = 20 / (dist + 0.3); // peaks when dist → 0
    return 0.55 * bin.fill + 0.45 * proximityScore;
  }

  /**
   * Assign bins to all trucks greedily — no bin is assigned twice.
   *
   * Algorithm:
   * 1. Filter eligible bins (fill >= threshold)
   * 2. Shuffle truck order to avoid systematic bias
   * 3. Each truck in turn picks its highest-scoring unassigned bin,
   *    adds it to its route, then picks the next best from remaining pool.
   * 4. Continue until pool is empty.
   *
   * @param {Array}  bins      – All bins (with lat/lng)
   * @param {Array}  trucks    – All trucks (with current lat/lng)
   * @param {number} threshold – Min fill % to include
   * @returns {Object} { truckId: [binId, ...], ... }
   */
  function assignAllTrucks(bins, trucks, threshold = 30) {
    const assignment = {};
    trucks.forEach(t => { assignment[t.id] = []; });

    // Eligible pool
    let pool = bins.filter(b => b.fill >= threshold && b.lat && b.lng);
    if (pool.length === 0) return assignment;

    // Round-robin greedy: each truck picks its best from remaining pool
    // until pool is exhausted. Trucks that have no qualifying nearby bin
    // may end up with fewer stops — that's realistic.
    let truckIdx = 0;
    while (pool.length > 0) {
      const truck = trucks[truckIdx % trucks.length];
      truckIdx++;

      // Score all remaining bins for this truck
      const scored = pool
        .map(bin => ({ bin, score: scoreForTruck(bin, truck.lat, truck.lng) }))
        .sort((a, b) => b.score - a.score);

      // Pick top bin
      const best = scored[0];
      assignment[truck.id].push(best.bin.id);
      pool = pool.filter(b => b.id !== best.bin.id);
    }

    return assignment;
  }

  /**
   * Generate a simple single-route ordered by combined score.
   * Used by the Route Optimizer tab (manual generation).
   */
  function generate(bins, truckLat, truckLng, threshold = 50, zone = 'all') {
    const eligible = bins
      .filter(b => b.fill >= threshold && (zone === 'all' || b.zone === zone))
      .map(b => ({ ...b, score: scoreForTruck(b, truckLat, truckLng) }))
      .sort((a, b) => b.score - a.score);
    return eligible;
  }

  function summarize(route) {
    if (!route.length) return null;
    return {
      count: route.length,
      avgFill: Math.round(route.reduce((s, b) => s + b.fill, 0) / route.length),
      topBin: route[0],
      zones: [...new Set(route.map(b => b.zone))],
    };
  }

  return { haversineDistance, scoreForTruck, assignAllTrucks, generate, summarize };
})();
