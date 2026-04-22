/**
 * ui.js – UI rendering helpers (pure DOM builders, no logic)
 * Keeps presentation separate from business logic.
 */

const UI = (() => {

  /* -------- BIN CARD -------- */
  function createBinCard(bin) {
    const card = document.createElement('div');
    card.className = 'bin-card';
    card.dataset.binId = bin.id;
    card.dataset.status = bin.status;

    const fillColor = bin.status === 'low' ? '#22c55e'
                    : bin.status === 'medium' ? '#f59e0b' : '#ef4444';

    card.innerHTML = `
      <div class="bin-card-header">
        <div>
          <div class="bin-id">${bin.id}</div>
          <div class="bin-location">${bin.location}</div>
        </div>
        <span class="status-badge ${bin.status}">${bin.status}</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-label">
          <span>Fill Level</span>
          <span style="font-weight:700;color:${fillColor}">${bin.fill}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${bin.status}" style="width:${bin.fill}%"></div>
        </div>
      </div>
      <div class="bin-meta">
        <span>Zone: <strong>${bin.zone}</strong></span>
        <span>${bin.capacity}L capacity</span>
      </div>
    `;
    return card;
  }

  /* -------- TABLE ROW -------- */
  function createTableRow(bin) {
    const tr = document.createElement('tr');
    const fillColor = bin.status === 'low' ? '#22c55e'
                    : bin.status === 'medium' ? '#f59e0b' : '#ef4444';
    const fillVal = typeof bin.fill === 'number' ? bin.fill.toFixed(1) : bin.fill;
    const rate    = bin.fillRate ? bin.fillRate.toFixed(1) : '—';
    const coords  = (bin.lat && bin.lng) ? `${bin.lat.toFixed(4)}, ${bin.lng.toFixed(4)}` : 'N/A';

    tr.innerHTML = `
      <td><strong>${bin.id}</strong></td>
      <td>${bin.location}</td>
      <td>${bin.zone}</td>
      <td>
        <div class="fill-bar-mini">
          <div class="bar"><div class="bar-fill" style="width:${bin.fill}%;background:${fillColor}"></div></div>
          <span style="font-weight:600;color:${fillColor};min-width:38px">${fillVal}%</span>
        </div>
      </td>
      <td><span class="fill-rate-badge">${rate}%/tick</span></td>
      <td><span class="status-badge ${bin.status}">${bin.status}</span></td>
      <td style="font-size:11px;color:var(--text-muted)">${coords}</td>
      <td>
        <button class="btn btn-danger" onclick="AppController.removeBin('${bin.id}')">Remove</button>
      </td>
    `;
    return tr;
  }

  /* -------- ROUTE STEP -------- */
  function createRouteStep(bin, index) {
    const step = document.createElement('div');
    step.className = 'route-step';

    const fillColor = bin.status === 'low' ? '#22c55e'
                    : bin.status === 'medium' ? '#f59e0b' : '#ef4444';

    step.innerHTML = `
      <div class="route-step-num">${index + 1}</div>
      <div class="route-step-info">
        <div class="route-step-id">${bin.id}</div>
        <div class="route-step-meta">${bin.location} · ${bin.zone}</div>
      </div>
      <div class="route-step-fill" style="color:${fillColor}">${bin.fill}%</div>
    `;
    return step;
  }

  /* -------- BIN NODE (visual canvas) -------- */
  /**
   * ANTI-GRAVITY VISUALIZATION:
   * Position on screen is determined by fill level.
   * fill=100 → top=5% (high on canvas — needs urgent attention)
   * fill=0   → top=85% (near bottom — no urgency)
   *
   * Formula: top% = 5 + (100 - fill) * 0.80
   * This maps fill level inversely to vertical position.
   */
  function createBinNode(bin, index, totalBins) {
    const node = document.createElement('div');
    node.className = 'bin-node';
    node.dataset.binId = bin.id;

    // Spread bins horizontally across the canvas
    const leftPct = 6 + (index / Math.max(totalBins - 1, 1)) * 88;

    // Vertical: higher fill → higher on screen (lower top%)
    const topPct = 5 + (100 - bin.fill) * 0.80;

    node.style.left = `${leftPct}%`;
    node.style.top  = `${topPct}%`;

    const fillColor = bin.status === 'low' ? '#22c55e'
                    : bin.status === 'medium' ? '#f59e0b' : '#ef4444';
    const bgLight   = bin.status === 'low' ? '#dcfce7'
                    : bin.status === 'medium' ? '#fef3c7' : '#fee2e2';

    node.innerHTML = `
      <div class="bin-node-body" style="border-color:${fillColor}">
        <div class="bin-node-fill" style="height:${bin.fill}%;background:${bgLight}"></div>
      </div>
      <div class="bin-node-pct" style="color:${fillColor}">${bin.fill}%</div>
      <div class="bin-node-label">${bin.id}</div>
    `;

    // Tooltip on hover
    node.title = `${bin.id} | ${bin.location} | ${bin.fill}% full`;
    return node;
  }

  /* -------- TOAST -------- */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  /* -------- UPDATE STATS DISPLAY -------- */
  function updateStats(stats) {
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statFull').textContent  = stats.needsCollection;
    document.getElementById('statAvg').textContent   = `${stats.avg}%`;
    document.getElementById('statLow').textContent   = stats.operational;
  }

  /* -------- POPULATE BIN SELECT DROPDOWNS -------- */
  function populateBinSelect(bins) {
    const sel = document.getElementById('updateBinSelect');
    sel.innerHTML = '<option value="">-- Select a bin --</option>';
    bins.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `${b.id} – ${b.location} (${b.fill}%)`;
      sel.appendChild(opt);
    });
  }

  /* -------- TRUCK CARD -------- */
  function createTruckCard(truck) {
    const card = document.createElement('div');
    card.className = 'truck-card';
    card.style.setProperty('--truck-color', truck.color);
    card.id = `truckCard-${truck.id}`;

    const statusIcons = { idle: '⏸', 'en-route': '🚛', collecting: '📦' };
    const statusLabels = { idle: 'Idle', 'en-route': 'En Route', collecting: 'Collecting' };
    const icon = statusIcons[truck.status] || '🚛';
    const label = statusLabels[truck.status] || truck.status;
    const remaining = Math.max(0, truck.route.length - truck.routeIndex);
    const targetBin = truck.route[truck.routeIndex] || '—';
    const isPulse = truck.status !== 'idle';

    card.innerHTML = `
      <div class="truck-icon-wrap">🚛</div>
      <div class="truck-info">
        <div class="truck-name" style="color:${truck.color}">${truck.name}</div>
        <div class="truck-status-badge ${truck.status}">
          ${isPulse ? `<span class="pulse-dot" style="background:${truck.color}"></span>` : ''}
          ${icon} ${label}
        </div>
        <div class="truck-meta">Next: <strong>${targetBin}</strong> · ${remaining} stop${remaining !== 1 ? 's' : ''} left</div>
      </div>
      <div class="truck-stats">
        <div class="truck-collected">${truck.collected}</div>
        <div class="truck-collected-label">Collected</div>
      </div>
    `;
    return card;
  }

  /** Update existing truck card in-place (avoids full re-render flicker) */
  function updateTruckCard(truck) {
    const existing = document.getElementById(`truckCard-${truck.id}`);
    if (!existing) return;
    const replacement = createTruckCard(truck);
    existing.replaceWith(replacement);
  }

  return {
    createBinCard,
    createTableRow,
    createRouteStep,
    createBinNode,
    createTruckCard,
    updateTruckCard,
    showToast,
    updateStats,
    populateBinSelect,
  };
})();
