/**
 * ChainGuard AI - Global Interactive Geographic Supply-Chain Map (Leaflet.js)
 * Visualizes active oceanic lanes, air corridors, inter-facility trucking,
 * port congestion bottlenecks, and meteorological hazard zones.
 */
class GlobalSupplyChainMap {
  constructor(containerId, onSimulateLane) {
    this.containerId = containerId;
    this.onSimulateLane = onSimulateLane;
    this.map = null;
    this.markers = [];
    this.lanes = [];
    this.hazards = [];
  }

  initMap() {
    if (this.map) return;
    const el = document.getElementById(this.containerId);
    if (!el) return;

    // Initialize Leaflet map centered over Pacific/North America
    this.map = L.map(this.containerId, {
      center: [28.0, -140.0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true
    });

    const GMAP_KEY = window.GMAP_KEY || "";

    // 1. Google Maps Roadmap Layer
    const googleRoads = L.tileLayer(`https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GMAP_KEY}`, {
      attribution: '&copy; Google Maps',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20
    });

    // 2. Google Maps Satellite Imagery
    const googleSatellite = L.tileLayer(`https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${GMAP_KEY}`, {
      attribution: '&copy; Google Maps Satellite',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20
    });

    // 3. Google Maps Hybrid (Satellite + Roads/Labels)
    const googleHybrid = L.tileLayer(`https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GMAP_KEY}`, {
      attribution: '&copy; Google Maps Hybrid',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20
    });

    // 4. Google Maps Terrain & Topography
    const googleTerrain = L.tileLayer(`https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&key=${GMAP_KEY}`, {
      attribution: '&copy; Google Maps Terrain',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20
    });

    // 5. Clean Enterprise Vector (CartoDB Positron)
    const lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19
    });

    // 6. High-Resolution Satellite Imagery (ESRI)
    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics',
      maxZoom: 18
    });

    // Default to Google Maps Roadmap
    googleRoads.addTo(this.map);

    // Add Layer Control & Scale Bar
    const baseLayers = {
      "Google Maps (Roadmap)": googleRoads,
      "Google Maps (Satellite)": googleSatellite,
      "Google Maps (Hybrid)": googleHybrid,
      "Google Maps (Terrain)": googleTerrain,
      "Enterprise Clean Light": lightTiles,
      "ESRI High-Res Satellite": esriSatellite
    };
    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(this.map);
    L.control.scale({ imperial: true, metric: true, position: 'bottomleft' }).addTo(this.map);

    this.loadGeoData();
  }

  async loadGeoData() {
    try {
      const res = await fetch(`${API_BASE}/api/map/geo-data`);
      const data = await res.json();
      this.renderGeoData(data);
    } catch (err) {
      console.error("Failed to load map geo data:", err);
    }
  }

  renderGeoData(data) {
    if (!this.map) return;

    // Clear previous layers
    this.markers.forEach(m => this.map.removeLayer(m));
    this.lanes.forEach(l => this.map.removeLayer(l));
    this.hazards.forEach(h => this.map.removeLayer(h));
    this.markers = [];
    this.lanes = [];
    this.hazards = [];

    // 1. Render Hazard Circles (Cyclone, War, Port Congestion)
    (data.hazards || []).forEach(haz => {
      const isWar = haz.category === "GEOPOLITICAL_WAR" || haz.name.includes("War");
      const isCyclone = haz.category === "CYCLONE_WEATHER" || haz.name.includes("Typhoon") || haz.name.includes("Cyclonic");
      const isCrit = haz.severity === "CRITICAL";

      let color = isWar ? '#8F2718' : isCyclone ? '#78450E' : '#5A645C';
      let tagLabel = isWar ? '[WAR RISK]' : isCyclone ? '[CYCLONE]' : '[PORT CONGESTION]';

      const circle = L.circle([haz.lat, haz.lng], {
        color: color,
        fillColor: color,
        fillOpacity: isWar ? 0.28 : isCyclone ? 0.22 : 0.18,
        weight: 2.0,
        dashArray: isWar ? '6, 4' : null,
        radius: haz.radius_km * 1000
      }).addTo(this.map);

      circle.bindPopup(`
        <div class="p-3 text-xs space-y-1.5 font-sans max-w-xs bg-white border border-[#D8D5CD]">
          <div class="flex items-center space-x-1.5">
            <span class="font-mono text-[10px] font-bold text-[#8F2718]">${tagLabel}</span>
            <span class="font-bold text-[#1C201D] font-serif text-sm">${haz.name}</span>
          </div>
          <div class="stamp-tag ${isWar || isCrit ? 'stamp-critical' : 'stamp-disrupted'}">
            ${haz.category || haz.severity}
          </div>
          <p class="text-[#2C332D] leading-relaxed text-[11px] font-sans">${haz.description}</p>
        </div>
      `);
      this.hazards.push(circle);
    });

    // 2. Render Shipping Lanes (Polylines)
    (data.lanes || []).forEach(lane => {
      let coords = [];
      if (lane.waypoint) {
        coords = [lane.origin, lane.waypoint, lane.destination];
      } else if (lane.port_of_entry) {
        coords = [lane.origin, lane.port_of_entry, lane.destination];
      } else {
        coords = [lane.origin, lane.destination];
      }

      const isDelayed = lane.status === "CRITICAL_DELAY";
      const isAction = lane.status === "RECOMMENDED_ACTION";
      const isAlt = lane.status === "ALTERNATIVE_ACTIVE_PATH";

      const polyline = L.polyline(coords, {
        color: isDelayed ? '#8F2718' : isAction ? '#144336' : isAlt ? '#78450E' : '#2C332D',
        weight: isDelayed ? 3.5 : isAlt ? 3.0 : isAction ? 2.5 : 2.0,
        opacity: 0.85,
        dashArray: isAlt ? '4, 4' : isAction ? '6, 6' : isDelayed ? '8, 4' : null
      }).addTo(this.map);

      polyline.bindPopup(`
        <div class="p-3 text-xs space-y-2 font-sans max-w-xs bg-white border border-[#D8D5CD]">
          <div class="flex items-center justify-between">
            <span class="font-bold text-[#1C201D] font-serif text-sm">${lane.name}</span>
          </div>
          <div class="text-[#2C332D] space-y-0.5 text-xs">
            <div>Shipment: <span class="font-mono text-[#1C201D] font-bold">${lane.shipment_id}</span></div>
            <div>Component: <span class="text-[#1C201D] font-semibold">${lane.component}</span></div>
            <div>Calibrated Delay Risk: <span class="font-mono font-bold ${isDelayed ? 'text-[#8F2718]' : isAlt ? 'text-[#78450E]' : 'text-[#144336]'}">${lane.delay_prob}%</span></div>
            ${lane.current_deviation_days ? `<div>Milestone Lag: <span class="font-mono text-[#8F2718] font-bold">+${lane.current_deviation_days} days</span></div>` : ''}
            ${lane.mitigation_code ? `<div class="mt-1 px-2 py-0.5 bg-[#E8F1EC] text-[#144336] font-mono text-[10px]">Mitigation Protocol: ${lane.mitigation_code}</div>` : ''}
          </div>
          ${isAlt ? `
            <button onclick="window.inspectAlternativeAndCompliance('${lane.component}', '${lane.shipment_id}')" class="btn-craft-primary w-full text-xs font-mono uppercase tracking-wider justify-center mt-2">
              [ Inspect Compliance Policies ]
            </button>
          ` : `
            <button onclick="window.triggerMapDisruption('${lane.shipment_id}', '${lane.component}')" class="btn-craft-danger w-full text-xs font-mono uppercase tracking-wider justify-center mt-2">
              [ Simulate Disruption Shock ]
            </button>
          `}
        </div>
      `);
      this.lanes.push(polyline);
    });

    // 3. Render Nodes (Ports & Manufacturing Plants)
    (data.nodes || []).forEach(node => {
      let markerColor = '#144336';
      if (node.type === "MANUFACTURING_PLANT") markerColor = '#8F2718';
      else if (node.type === "SISTER_PLANT") markerColor = '#144336';
      else if (node.type === "DESTINATION_PORT") markerColor = '#78450E';
      else if (node.type === "ALT_SUPPLIER") markerColor = '#144336';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 2px; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(this.map);
      marker.bindPopup(`
        <div class="p-2.5 text-xs space-y-1 font-sans bg-white border border-[#D8D5CD]">
          <div class="font-bold text-[#1C201D] font-serif text-sm">${node.name}</div>
          <div class="text-[#5A645C] font-mono text-[10px]">${node.type} • ${node.country}</div>
          <div class="text-[#2C332D] font-medium">Status: <span class="font-bold ${node.status.includes('CRITICAL') ? 'text-[#8F2718]' : 'text-[#144336]'}">${node.status}</span></div>
        </div>
      `);
      this.markers.push(marker);
    });

    // 4. Render Multi-Source Intelligence Signals (X/Twitter, Google News)
    (data.signals || []).forEach(sig => {
      const isX = sig.source_platform === "X_TWITTER";
      const iconColor = isX ? "#144336" : "#78450E";
      const iconLetter = isX ? "X" : "G";

      const signalIcon = L.divIcon({
        className: 'custom-signal-pin',
        html: `<div style="background-color: ${iconColor}; color: white; width: 22px; height: 22px; border-radius: 2px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: monospace; font-size: 11px; border: 1.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.25); cursor: pointer;" title="${sig.headline}">[${iconLetter}]</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([sig.lat, sig.lng], { icon: signalIcon }).addTo(this.map);
      marker.bindPopup(`
        <div class="p-3 text-xs space-y-2 font-sans max-w-xs bg-white border border-[#D8D5CD]">
          <div class="flex items-center justify-between">
            <span class="stamp-tag ${isX ? 'stamp-operational' : 'stamp-disrupted'}">
              ${isX ? 'X Intelligence' : 'News Wire'}
            </span>
            <span class="text-[10px] text-[#5A645C] font-mono">${sig.signal_id}</span>
          </div>
          <div class="font-bold text-[#1C201D] font-serif text-sm leading-snug">${sig.headline}</div>
          <p class="text-[#2C332D] text-[11px] leading-relaxed font-sans">${sig.content}</p>
          <div class="pt-1 border-t border-[#D8D5CD] flex items-center justify-between text-[10px] text-[#5A645C] font-mono">
            <span>Predicted Shock: +${sig.predicted_delay_shock_days}d</span>
            <span class="font-bold text-[#8F2718]">${sig.urgency_tier}</span>
          </div>
          <button onclick="window.inspectAlternativeAndCompliance('${sig.component_id}', '${sig.signal_id}')" class="btn-craft-primary w-full text-xs font-mono uppercase tracking-wider justify-center mt-2">
            [ Evaluate Alternative Path & Policies ]
          </button>
        </div>
      `);
      this.markers.push(marker);
    });
  }

  flyToCorridor(lat, lng, zoom = 4) {
    if (this.map) {
      this.map.flyTo([lat, lng], zoom, { duration: 1.5 });
    }
  }

  focusPacific() {
    if (this.map) this.map.flyTo([30.0, -145.0], 4, { duration: 1.2 });
  }

  focusRedSeaWar() {
    if (this.map) this.map.flyTo([15.0, 42.0], 5, { duration: 1.2 });
  }

  focusTaiwanStrait() {
    if (this.map) this.map.flyTo([24.0, 120.0], 6, { duration: 1.2 });
  }

  resetGlobalView() {
    if (this.map) this.map.flyTo([28.0, -140.0], 3, { duration: 1.2 });
  }
}

