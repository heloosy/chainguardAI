/**
 * ChainGuard AI - Interactive Graph Visualizer (Light / White Theme)
 * Renders the multi-tier supply chain network with SVG/Canvas.
 */
class SupplyChainGraphView {
  constructor(containerId, onNodeClick) {
    this.container = document.getElementById(containerId);
    this.onNodeClick = onNodeClick;
    this.elements = [];
    this.nodes = [];
    this.edges = [];
    this.selectedNodeId = null;
  }

  setData(graphData, consequencesMap = {}) {
    this.elements = graphData.elements || [];
    this.consequencesMap = consequencesMap;
    this.nodes = this.elements.filter(e => e.data.source === undefined).map(e => e.data);
    this.edges = this.elements.filter(e => e.data.source !== undefined).map(e => e.data);
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";

    const width = this.container.clientWidth || 900;
    const height = this.container.clientHeight || 520;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.userSelect = "none";

    const tierX = {
      "Supplier": 90,
      "Component": 270,
      "Assembly": 460,
      "Product": 640,
      "Facility": 820,
      "CustomerOrder": 820
    };

    const grouped = {};
    this.nodes.forEach(n => {
      const type = n.type || "Component";
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(n);
    });

    const nodePos = {};
    Object.keys(grouped).forEach(type => {
      const list = grouped[type];
      const x = tierX[type] || 450;
      const count = list.length;
      const spacing = height / (count + 1);
      list.forEach((node, idx) => {
        let y = spacing * (idx + 1);
        if (type === "CustomerOrder") {
          y += 35;
        }
        nodePos[node.id] = { x, y, data: node };
      });
    });

    // Arrow markers
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
      </marker>
      <marker id="arrow-red" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
      </marker>
      <filter id="glow-light" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#ef4444" flood-opacity="0.3" />
      </filter>
    `;
    svg.appendChild(defs);

    // Edges
    const edgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    edgesGroup.setAttribute("class", "edges");

    this.edges.forEach(edge => {
      const p1 = nodePos[edge.source];
      const p2 = nodePos[edge.target];
      if (p1 && p2) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const dx = p2.x - p1.x;
        const cx1 = p1.x + dx * 0.5;
        const cy1 = p1.y;
        const cx2 = p1.x + dx * 0.5;
        const cy2 = p2.y;
        const d = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;

        const isCritical = (edge.source === "CMP-MCU-01" || edge.target === "CMP-MCU-01" || edge.target === "ASM-AUTOPILOT" || edge.target === "PRD-EV-CORE" || edge.target === "ORD-OEM-901");
        
        line.setAttribute("d", d);
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", isCritical ? "#ef4444" : "#cbd5e1");
        line.setAttribute("stroke-width", isCritical ? "2.4" : "1.2");
        line.setAttribute("marker-end", isCritical ? "url(#arrow-red)" : "url(#arrow)");
        edgesGroup.appendChild(line);
      }
    });
    svg.appendChild(edgesGroup);

    // Nodes
    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodesGroup.setAttribute("class", "nodes");

    Object.keys(nodePos).forEach(nodeId => {
      const item = nodePos[nodeId];
      const n = item.data;
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("transform", `translate(${item.x}, ${item.y})`);
      g.style.cursor = "pointer";

      let nodeColor = "#3b82f6";
      let isRisk = false;
      let strokeColor = "#1d4ed8";

      if (n.type === "Supplier") {
        nodeColor = "#8b5cf6";
        strokeColor = "#6d28d9";
      } else if (n.type === "Component") {
        if (n.id === "CMP-MCU-01") {
          nodeColor = "#ef4444";
          strokeColor = "#b91c1c";
          isRisk = true;
        } else {
          nodeColor = "#10b981";
          strokeColor = "#047857";
        }
      } else if (n.type === "Assembly") {
        if (n.id === "ASM-AUTOPILOT") {
          nodeColor = "#f97316";
          strokeColor = "#c2410c";
          isRisk = true;
        } else {
          nodeColor = "#0284c7";
          strokeColor = "#0369a1";
        }
      } else if (n.type === "Product") {
        if (n.id === "PRD-EV-CORE") {
          nodeColor = "#d97706";
          strokeColor = "#b45309";
          isRisk = true;
        } else {
          nodeColor = "#0d9488";
          strokeColor = "#0f766e";
        }
      } else if (n.type === "CustomerOrder") {
        if (n.id === "ORD-OEM-901") {
          nodeColor = "#dc2626";
          strokeColor = "#991b1b";
          isRisk = true;
        } else {
          nodeColor = "#4f46e5";
          strokeColor = "#3730a3";
        }
      }

      // Outer circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", isRisk ? "13" : "10");
      circle.setAttribute("fill", nodeColor);
      circle.setAttribute("stroke", strokeColor);
      circle.setAttribute("stroke-width", "2.5");
      if (isRisk) {
        circle.setAttribute("filter", "url(#glow-light)");
      }
      g.appendChild(circle);

      // Label text
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("y", "-16");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", isRisk ? "#b91c1c" : "#1e293b");
      text.setAttribute("font-size", "11px");
      text.setAttribute("font-weight", isRisk ? "700" : "600");
      text.textContent = n.label || n.id;
      g.appendChild(text);

      // Sub-label (type)
      const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
      sub.setAttribute("y", "24");
      sub.setAttribute("text-anchor", "middle");
      sub.setAttribute("fill", "#64748b");
      sub.setAttribute("font-size", "9px");
      sub.setAttribute("font-weight", "500");
      sub.textContent = n.type;
      g.appendChild(sub);

      // Click handler
      g.addEventListener("click", () => {
        this.selectedNodeId = nodeId;
        if (this.onNodeClick) {
          this.onNodeClick(n);
        }
      });

      nodesGroup.appendChild(g);
    });

    svg.appendChild(nodesGroup);
    this.container.appendChild(svg);
  }
}
