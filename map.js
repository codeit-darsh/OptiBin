/**
 * map.js – Leaflet map with OSRM real-road routing
 */
const MapView = (() => {
  let map = null;
  let binLayer = L.layerGroup();
  let truckLayer = L.layerGroup();
  let routeLayer = L.layerGroup();

  /* ── OSRM: fetch real road geometry ─────────────────────── */
  async function fetchRoadRoute(points) {
    if (!points || points.length < 2) return null;
    // OSRM uses lng,lat order
    const coords = points.map(p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
      );
      if (!res.ok) return null;
      const json = await res.json();
      if (json.code === 'Ok' && json.routes?.length > 0) {
        // Convert [lng, lat] → [lat, lng] for Leaflet
        return json.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      }
    } catch (e) {
      console.warn('OSRM failed:', e.message);
    }
    return null;
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  function init(containerId) {
    map = L.map(containerId, { zoomControl: true }).setView([28.6139, 77.2090], 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);
    binLayer.addTo(map);
    truckLayer.addTo(map);
    routeLayer.addTo(map);
  }

  /* ── BINS ─────────────────────────────────────────────────── */
  function fillColor(f) { return f <= 40 ? '#22c55e' : f <= 75 ? '#f59e0b' : '#ef4444'; }

  function renderBins(bins) {
    binLayer.clearLayers();
    bins.forEach(bin => {
      const c = fillColor(bin.fill);
      const r = 7 + (bin.fill / 100) * 9;
      const m = L.circleMarker([bin.lat, bin.lng], {
        radius: r, fillColor: c, color: '#fff', weight: 2, fillOpacity: 0.85,
      }).addTo(binLayer);
      m.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:160px">
          <b style="font-size:13px">${bin.id}</b><br>
          <span style="font-size:12px;color:#555">${bin.location}</span><br>
          <span style="font-size:12px;color:#888">${bin.zone}</span><br>
          <b style="font-size:14px;color:${c}">${bin.fill.toFixed(0)}% full</b>
        </div>`);
      // Label
      L.marker([bin.lat, bin.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="font-size:10px;font-weight:700;color:#1a2035;background:rgba(255,255,255,0.85);padding:1px 4px;border-radius:4px;white-space:nowrap;margin-top:${r + 2}px;transform:translateX(-50%)">${bin.id}</div>`,
          iconSize: [0, 0], iconAnchor: [0, 0],
        }),
      }).addTo(binLayer);
    });
  }

  /* ── TRUCKS ───────────────────────────────────────────────── */
  function renderTrucks(trucks) {
    truckLayer.clearLayers();
    trucks.forEach(t => {
      L.marker([t.lat, t.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:34px;height:34px;border-radius:50%;background:${t.color};border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.25)">🚛</div>`,
          iconSize: [34, 34], iconAnchor: [17, 17],
        }), zIndexOffset: 1000,
      }).addTo(truckLayer)
        .bindPopup(`<b>${t.name}</b><br>${t.driverName}<br><span style="color:#888">${t.zone}</span><br>Route: ${t.route.length} stops`);
    });
  }

  /* ── ROUTES (OSRM road geometry) ─────────────────────────── */
  async function renderRoutes(trucks, bins) {
    routeLayer.clearLayers();
    const promises = trucks.map(async truck => {
      const remaining = truck.route.slice(truck.routeIndex || 0);
      if (!remaining.length) return;
      const points = [{ lat: truck.lat, lng: truck.lng }];
      remaining.forEach(id => {
        const b = bins.find(b => b.id === id);
        if (b) points.push({ lat: b.lat, lng: b.lng });
      });
      if (points.length < 2) return;

      // Limit to 10 waypoints for OSRM public server
      const capped = points.slice(0, 10);
      const roadCoords = await fetchRoadRoute(capped);

      if (roadCoords && roadCoords.length > 1) {
        L.polyline(roadCoords, {
          color: truck.color, weight: 4, opacity: 0.80,
        }).addTo(routeLayer).bindPopup(`<b>${truck.name}</b> route`);
      } else {
        // Fallback: straight dashed line
        L.polyline(capped.map(p => [p.lat, p.lng]), {
          color: truck.color, weight: 2.5, dashArray: '8 6', opacity: 0.6,
        }).addTo(routeLayer);
      }
    });
    await Promise.all(promises);
  }

  /* ── UPDATE (called after route assignment) ────────────────── */
  async function update(bins, trucks) {
    renderBins(bins);
    renderTrucks(trucks);
    await renderRoutes(trucks, bins);
  }

  function invalidate() {
    if (map) setTimeout(() => map.invalidateSize(), 200);
  }

  return { init, update, renderBins, renderTrucks, renderRoutes, invalidate };
})();
