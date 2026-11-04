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

      let color = isWar ? '#dc2626' : isCyclone ? '#7c3aed' : '#f97316';
      let icon = isWar ? '⚔️' : isCyclone ? '🌀' : '⚓';

      const circle = L.circle([haz.lat, haz.lng], {
        color: color,
        fillColor: color,
        fillOpacity: isWar ? 0.28 : isCyclone ? 0.22 : 0.18,
        weight: 2.0,
        dashArray: isWar ? '6, 4' : null,
        radius: haz.radius_km * 1000
      }).addTo(this.map);

      circle.bindPopup(`
        <div class="p-3 text-xs space-y-1.5 font-sans max-w-xs">
          <div class="flex items-center space-x-1.5">
            <span class="text-sm">${icon}</span>
            <span class="font-bold text-slate-900">${haz.name}</span>
          </div>
          <div class="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded inline-block ${isWar ? 'bg-red-100 text-red-800' : isCyclone ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}">
            ${haz.category || haz.severity}
          </div>
          <p class="text-slate-600 leading-relaxed text-[11px]">${haz.description}</p>
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
        color: isDelayed ? '#ef4444' : isAction ? '#10b981' : isAlt ? '#8b5cf6' : '#3b82f6',
        weight: isDelayed ? 3.5 : isAlt ? 3.0 : isAction ? 2.5 : 2.0,
        opacity: 0.85,
        dashArray: isAlt ? '4, 4' : isAction ? '6, 6' : isDelayed ? '8, 4' : null
      }).addTo(this.map);

      polyline.bindPopup(`
        <div class="p-3 text-xs space-y-2 font-sans max-w-xs">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-900">${lane.name}</span>
          </div>
          <div class="text-slate-600 space-y-0.5">
            <div>Shipment: <span class="font-mono text-slate-800 font-bold">${lane.shipment_id}</span></div>
            <div>Component: <span class="text-slate-900 font-semibold">${lane.component}</span></div>
            <div>Calibrated Delay Risk: <span class="font-mono font-bold ${isDelayed ? 'text-red-600' : isAlt ? 'text-purple-600' : 'text-emerald-600'}">${lane.delay_prob}%</span></div>
            ${lane.current_deviation_days ? `<div>Milestone Lag: <span class="font-mono text-red-600 font-bold">+${lane.current_deviation_days} days</span></div>` : ''}
            ${lane.mitigation_code ? `<div class="mt-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-semibold text-[10px]">Policy Mitigation: ${lane.mitigation_code}</div>` : ''}
          </div>
          ${isAlt ? `
            <button onclick="window.inspectAlternativeAndCompliance('${lane.component}', '${lane.shipment_id}')" class="w-full mt-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold shadow-sm transition">
              ⚖️ Inspect Compliance & Trade Policies
            </button>
          ` : `
            <button onclick="window.triggerMapDisruption('${lane.shipment_id}', '${lane.component}')" class="w-full mt-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold shadow-sm transition">
              ⚡ Simulate Disruption Shock on this Corridor
            </button>
          `}
        </div>
      `);
      this.lanes.push(polyline);
    });

    // 3. Render Nodes (Ports & Manufacturing Plants)
    (data.nodes || []).forEach(node => {
      let markerColor = '#2563eb';
      if (node.type === "MANUFACTURING_PLANT") markerColor = '#dc2626';
      else if (node.type === "SISTER_PLANT") markerColor = '#10b981';
      else if (node.type === "DESTINATION_PORT") markerColor = '#f59e0b';
      else if (node.type === "ALT_SUPPLIER") markerColor = '#8b5cf6';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: ${markerColor}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(this.map);
      marker.bindPopup(`
        <div class="p-2 text-xs space-y-1 font-sans">
          <div class="font-bold text-slate-900">${node.name}</div>
          <div class="text-slate-500 font-mono text-[10px]">${node.type} • ${node.country}</div>
          <div class="text-slate-700 font-medium">Status: <span class="font-bold ${node.status.includes('CRITICAL') ? 'text-red-600' : 'text-emerald-700'}">${node.status}</span></div>
        </div>
      `);
      this.markers.push(marker);
    });

    // 4. Render Multi-Source Intelligence Signals (X/Twitter, Google News)
    (data.signals || []).forEach(sig => {
      const isX = sig.source_platform === "X_TWITTER";
      const iconColor = isX ? "#0284c7" : "#ea580c";
      const iconLetter = isX ? "𝕏" : "G";

      const signalIcon = L.divIcon({
        className: 'custom-signal-pin',
        html: `<div style="background-color: ${iconColor}; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; border: 2.5px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); cursor: pointer;" title="${sig.headline}">${iconLetter}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([sig.lat, sig.lng], { icon: signalIcon }).addTo(this.map);
      marker.bindPopup(`
        <div class="p-3 text-xs space-y-2 font-sans max-w-xs">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isX ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'}">
              ${isX ? '𝕏 Twitter Alert' : 'Google News'}
            </span>
            <span class="text-[10px] text-slate-500 font-mono">${sig.signal_id}</span>
          </div>
          <div class="font-bold text-slate-900 leading-snug">${sig.headline}</div>
          <p class="text-slate-600 text-[11px] leading-relaxed">${sig.content}</p>
          <div class="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Predicted Shock: +${sig.predicted_delay_shock_days}d</span>
            <span class="font-bold text-red-600">${sig.urgency_tier}</span>
          </div>
          <button onclick="window.inspectAlternativeAndCompliance('${sig.component_id}', '${sig.signal_id}')" class="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition">
            ⚖️ Evaluate Alternative Path & Policies
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

