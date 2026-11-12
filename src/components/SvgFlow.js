// src/components/SvgFlow.js
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

function parseCodeToFlowchart(code = "") {
  const nodes = [];
  const edges = [];

  if (!code || !code.trim()) return { nodes, edges };

  // Parse function declaration
  const fnMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)/) || code.match(/const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/);
  const fnName = fnMatch ? fnMatch[1] : "fn";
  const param = fnMatch ? fnMatch[2].trim() : "";

  // Start node
  nodes.push({ 
    id: "start", 
    label: "Start", 
    type: "terminal",
    shape: "stadium" 
  });

  // Function declaration node
  nodes.push({
    id: "function",
    label: `Function: ${fnName}(${param})`,
    type: "process",
    shape: "rectangle"
  });
  edges.push({ from: "start", to: "function" });

  // Input parameter node
  if (param) {
    nodes.push({ 
      id: "input", 
      label: `Input parameter: ${param}`, 
      type: "io",
      shape: "parallelogram" 
    });
    edges.push({ from: "function", to: "input" });
  }

  // Decision node for if condition
  const hasCondition = /if\s*\(/.test(code);
  if (hasCondition) {
    const condMatch = code.match(/if\s*\(([^)]+)\)/);
    const condition = condMatch ? condMatch[1].trim() : "condition";
    
    nodes.push({ 
      id: "decision", 
      label: `Check if ${condition}`, 
      type: "decision",
      shape: "diamond" 
    });
    edges.push({ 
      from: param ? "input" : "function", 
      to: "decision" 
    });

    // True path
    const trueLogMatch = code.match(/if\s*\([^{]*\)\s*{([^}]*)}/);
    const trueLog = trueLogMatch ? 
      trueLogMatch[1].trim().replace(/console\.log\(|\)/g, '').replace(/["']/g, '') : 
      "true branch";
    
    nodes.push({ 
      id: "true_process", 
      label: `Print: ${trueLog}`, 
      type: "io",
      shape: "parallelogram" 
    });
    edges.push({ 
      from: "decision", 
      to: "true_process", 
      label: "Yes" 
    });

    // False path
    const falseLogMatch = code.match(/else\s*{([^}]*)}/);
    const falseLog = falseLogMatch ? 
      falseLogMatch[1].trim().replace(/console\.log\(|\)/g, '').replace(/["']/g, '') : 
      "false branch";

    nodes.push({ 
      id: "false_process", 
      label: `Print: ${falseLog}`, 
      type: "io",
      shape: "parallelogram" 
    });
    edges.push({ 
      from: "decision", 
      to: "false_process", 
      label: "No" 
    });

    // Connect both paths to end
    edges.push({ from: "true_process", to: "end" });
    edges.push({ from: "false_process", to: "end" });
  } else {
    // If no condition, connect directly to end
    edges.push({ from: param ? "input" : "function", to: "end" });
  }

  // End node
  nodes.push({ 
    id: "end", 
    label: "End", 
    type: "terminal",
    shape: "stadium" 
  });

  return { nodes, edges };
}

function SvgFlow({ graph, code, onNodeClick }) {
  const svgRef = useRef();

  useEffect(() => {
    let g;
    
    // Use graph if provided, otherwise parse code
    if (graph && graph.nodes && graph.nodes.length) {
      g = graph;
      // Normalize the graph - ensure nodes have 'label' property
      g.nodes = g.nodes.map(node => ({
        ...node,
        label: node.label || node.text || 'Unknown',
        shape: node.shape || (
          node.type === 'decision' ? 'diamond' : 
          node.type === 'loop' ? 'diamond' :
          node.type === 'start' ? 'terminal' :
          node.type === 'end' ? 'terminal' :
          node.type === 'input' ? 'parallelogram' :
          node.type === 'output' ? 'parallelogram' :
          node.type === 'function' ? 'rectangle' :
          node.type === 'return' ? 'parallelogram' : 'rectangle'
        )
      }));
    } else if (code) {
      g = parseCodeToFlowchart(code);
    } else {
      g = { nodes: [], edges: [] };
    }
    
    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove(); // clear old diagram

    if (!g.nodes || !g.nodes.length) {
      // show placeholder text
      svgEl
        .append("text")
        .attr("x", 20)
        .attr("y", 30)
        .attr("fill", "#6b7280")
        .style("font-size", "14px")
        .text('No flowchart yet — click "Generate Flowchart"');
      return;
    }

    const containerWidth = svgRef.current.parentElement?.clientWidth || 900;
    
    // Dynamic sizing based on graph complexity
    const nodeCount = g.nodes.length;
    const edgeCount = g.edges.length;
    const hasDecisions = g.nodes.some(n => n.type === 'decision' || n.type === 'loop');
    
    const nodeWidth = 240;
    const nodeHeight = 80;
    const verticalGap = 200;
    const horizontalGap = hasDecisions ? 400 : 300;
    
    // Calculate required dimensions
    const estimatedLayers = Math.ceil(Math.sqrt(nodeCount)) + 2;
    const estimatedWidth = Math.max(1600, horizontalGap * 4);
    const estimatedHeight = Math.max(1400, verticalGap * estimatedLayers + 200);
    
    const width = estimatedWidth;
    const height = estimatedHeight;

    svgEl.attr("width", "100%").attr("height", height);
    svgEl.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMin meet");

    // Simple hierarchical layout
    const layers = [];
    const nodeMap = new Map(g.nodes.map(n => [n.id, n]));
    const visited = new Set();
    
    // Build layers (BFS approach) - assign each node to a layer
    const queue = [{ nodeId: g.nodes[0]?.id, layer: 0, branchPosition: 0 }];
    const layerNodes = new Map();
    const nodeLayer = new Map(); // Track which layer each node is in
    
    while (queue.length > 0) {
      const { nodeId, layer, branchPosition } = queue.shift();
      if (!nodeId || visited.has(nodeId)) continue;
      
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      
      visited.add(nodeId);
      nodeLayer.set(nodeId, layer);
      
      if (!layerNodes.has(layer)) {
        layerNodes.set(layer, []);
      }
      layerNodes.get(layer).push({ node, branchPosition });
      
      // Find children
      const outgoingEdges = g.edges.filter(e => e.from === nodeId && !visited.has(e.to));
      
      if (node.type === 'decision' || node.type === 'loop') {
        const yesEdge = outgoingEdges.find(e => e.label === 'Yes');
        const noEdge = outgoingEdges.find(e => e.label === 'No');
        const loopBackEdge = outgoingEdges.find(e => e.label === 'Loop back');
        
        // Yes branch goes to the left
        if (yesEdge) {
          queue.push({ nodeId: yesEdge.to, layer: layer + 1, branchPosition: branchPosition - 1 });
        }
        // No branch goes to the right
        if (noEdge) {
          queue.push({ nodeId: noEdge.to, layer: layer + 1, branchPosition: branchPosition + 1 });
        }
        
        // Other edges (non-labeled, no loop back) - typically converging to this node
        outgoingEdges.filter(e => e !== yesEdge && e !== noEdge && e !== loopBackEdge && !e.label)
          .forEach((edge, idx) => {
            queue.push({ nodeId: edge.to, layer: layer + 1, branchPosition: branchPosition });
          });
      } else {
        // For non-decision nodes, check if multiple nodes connect to the same target
        const targets = new Map();
        outgoingEdges.forEach(edge => {
          if (edge.label !== 'Loop back') {
            if (!targets.has(edge.to)) {
              targets.set(edge.to, []);
            }
            targets.get(edge.to).push(edge);
          }
        });
        
        targets.forEach((edges, targetId) => {
          queue.push({ nodeId: targetId, layer: layer + 1, branchPosition });
        });
      }
    }
    
    // Position nodes based on layers with improved centering
    const centerX = width / 2;
    const startY = 80;
    
    // First pass: calculate positions
    const maxNodesInLayer = Math.max(...Array.from(layerNodes.values()).map(nodes => nodes.length));
    const effectiveHorizontalGap = maxNodesInLayer > 2 ? horizontalGap * 0.9 : horizontalGap;
    
    layerNodes.forEach((nodesInLayer, layer) => {
      const y = startY + layer * verticalGap;
      
      // Sort nodes by branch position for consistent left-to-right ordering
      nodesInLayer.sort((a, b) => a.branchPosition - b.branchPosition);
      
      if (nodesInLayer.length === 1) {
        // Single node - center it perfectly
        nodesInLayer[0].node.x = centerX;
        nodesInLayer[0].node.y = y;
      } else if (nodesInLayer.length === 2) {
        // Two nodes - balanced on either side of center
        const offset = effectiveHorizontalGap / 2;
        nodesInLayer[0].node.x = centerX - offset;
        nodesInLayer[0].node.y = y;
        nodesInLayer[1].node.x = centerX + offset;
        nodesInLayer[1].node.y = y;
      } else {
        // Multiple nodes - distribute evenly
        const totalWidth = (nodesInLayer.length - 1) * effectiveHorizontalGap;
        const startX = centerX - totalWidth / 2;
        
        nodesInLayer.forEach((item, index) => {
          item.node.x = startX + index * effectiveHorizontalGap;
          item.node.y = y;
        });
      }
      
      nodesInLayer.forEach(item => {
        item.node.label = item.node.label || item.node.text;
      });
    });

    // markers for arrows - larger, more visible arrowheads
    const defs = svgEl.append("defs");
    
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 12 12")
      .attr("refX", 11)
      .attr("refY", 6)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 12 6 L 0 12 z")
      .attr("fill", "#000000")
      .style("stroke", "none");

    // draw edges
    const edgeGroup = svgEl.append("g").attr("class", "edges");
    g.edges.forEach((e) => {
      const from = g.nodes.find((n) => n.id === e.from);
      const to = g.nodes.find((n) => n.id === e.to);
      if (!from || !to) return;

      let path;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      
      // Determine if this is a decision/loop node
      const isDecision = from.type === 'decision' || from.type === 'loop';
      
      // For loop back edges (going upward)
      if (dy < 0) {
        const fromBottom = { x: from.x, y: from.y + nodeHeight / 2 + 5 };
        const toTop = { x: to.x, y: to.y - nodeHeight / 2 - 8 };
        const offset = 140;
        const leftX = Math.min(from.x, to.x) - offset;
        path = `M ${fromBottom.x},${fromBottom.y} 
                L ${fromBottom.x},${fromBottom.y + 25}
                L ${leftX},${fromBottom.y + 25}
                L ${leftX},${toTop.y - 25}
                L ${toTop.x},${toTop.y - 25}
                L ${toTop.x},${toTop.y}`;
      } 
      // For branches from decision/loop nodes (Yes/No paths)
      else if (isDecision && Math.abs(dx) > 15) {
        // Start from the side corners of the diamond
        let fromPoint, toPoint;
        
        if (dx > 0) {
          // Right branch (No) - start from right corner of diamond
          fromPoint = { x: from.x + 140, y: from.y };
          toPoint = { x: to.x, y: to.y - nodeHeight / 2 - 8 };
        } else {
          // Left branch (Yes) - start from left corner of diamond
          fromPoint = { x: from.x - 140, y: from.y };
          toPoint = { x: to.x, y: to.y - nodeHeight / 2 - 8 };
        }
        
        // Create clear step-by-step path with smoother curves
        const step1Y = fromPoint.y + 70;  // First step down (increased from 60)
        
        path = `M ${fromPoint.x} ${fromPoint.y} 
                L ${fromPoint.x} ${step1Y}
                L ${toPoint.x} ${step1Y}
                L ${toPoint.x} ${toPoint.y}`;
      }
      // For vertical connections
      else if (Math.abs(dx) < 15) {
        const fromBottom = { x: from.x, y: from.y + nodeHeight / 2 + 5 };
        const toTop = { x: to.x, y: to.y - nodeHeight / 2 - 8 };
        path = `M ${fromBottom.x} ${fromBottom.y} L ${toTop.x} ${toTop.y}`;
      } 
      // For other diagonal connections
      else {
        const fromBottom = { x: from.x, y: from.y + nodeHeight / 2 + 5 };
        const toTop = { x: to.x, y: to.y - nodeHeight / 2 - 8 };
        const midY = fromBottom.y + 40;
        path = `M ${fromBottom.x} ${fromBottom.y} 
                L ${fromBottom.x} ${midY}
                L ${toTop.x} ${midY}
                L ${toTop.x} ${toTop.y}`;
      }

      // Draw white outline for better visibility (drawn first, behind the arrow)
      edgeGroup
        .append("path")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 10)
        .attr("opacity", 0.95);

      // Draw main arrow with solid black color (drawn on top)
      edgeGroup
        .append("path")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#000000")
        .attr("stroke-width", 5)
        .attr("marker-end", "url(#arrow)");

      if (e.label) {
        let labelX, labelY;
        
        const isDecision = from.type === 'decision' || from.type === 'loop';
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        
        // For loop back edges
        if (dy < 0) {
          const offset = 140;
          const leftX = Math.min(from.x, to.x) - offset;
          labelX = leftX - 45;
          labelY = from.y + nodeHeight / 2 + (to.y - from.y) / 2;
        }
        // For decision branches (Yes/No from diamond corners)
        else if (isDecision && Math.abs(dx) > 15) {
          // Position label near the diamond, on the vertical arrow going down
          const step1Y = from.y + 60;
          
          if (dx > 0) {
            // Right branch (No) - position on vertical part
            labelX = from.x + 140;
            labelY = from.y + 52; // On the vertical arrow going down
          } else {
            // Left branch (Yes) - position on vertical part  
            labelX = from.x - 140;
            labelY = from.y + 52; // On the vertical arrow going down
          }
        }
        // For vertical connections
        else if (Math.abs(dx) < 15) {
          labelX = from.x + 65;
          labelY = from.y + (to.y - from.y) / 2;
        }
        // For other diagonal connections
        else {
          const midY = from.y + nodeHeight / 2 + 40;
          labelX = from.x + dx / 2;
          labelY = midY - 28;
        }
        
        edgeGroup
          .append("rect")
          .attr("x", labelX - 42)
          .attr("y", labelY - 26)
          .attr("width", 84)
          .attr("height", 52)
          .attr("rx", 14)
          .attr("fill", "#ffffff")
          .attr("stroke", "#2563eb")
          .attr("stroke-width", 5);
        
        edgeGroup
          .append("text")
          .attr("x", labelX)
          .attr("y", labelY + 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "#1e40af")
          .style("font-size", "26px")
          .style("font-weight", "900")
          .text(e.label);
      }
    });

    // draw nodes
    const nodeGroup = svgEl.append("g").attr("class", "nodes");
    const gNodes = nodeGroup.selectAll(".node").data(g.nodes).enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        // Highlight the node temporarily
        d3.select(this).select("rect, polygon").style("opacity", 0.7);
        setTimeout(() => {
          d3.select(this).select("rect, polygon").style("opacity", 1);
        }, 200);
        
        // Call the callback with line number and node data if provided
        if (onNodeClick && d.lineNumber) {
          onNodeClick(d.lineNumber, d);
        }
      });

    // shapes
    gNodes.each(function (d) {
      const node = d3.select(this);
      const x = d.x - nodeWidth / 2;
      const y = d.y - nodeHeight / 2;

      if (d.type === "decision" || d.type === "condition" || d.type === "loop" || d.shape === "diamond") {
        // Diamond for decisions and loops - make it bigger and clearer
        const cx = d.x;
        const cy = d.y;
        const w = 140;
        const h = 65;
        const points = [
          [cx, cy - h],
          [cx + w, cy],
          [cx, cy + h],
          [cx - w, cy],
        ]
          .map((p) => p.join(","))
          .join(" ");
        
        // Add shadow
        node
          .append("polygon")
          .attr("points", points)
          .attr("fill", "#fbbf24")
          .attr("opacity", 0.2)
          .attr("transform", "translate(4, 4)");
        
        node
          .append("polygon")
          .attr("points", points)
          .attr("fill", "#fef9c3")
          .attr("stroke", "#f59e0b")
          .attr("stroke-width", 4)
          .style("filter", "drop-shadow(0px 3px 6px rgba(0,0,0,0.15))");
        
        // Text with better wrapping
        const text = d.label || d.text || '';
        const words = text.split(' ');
        const textElement = node
          .append("text")
          .attr("x", d.x)
          .attr("y", d.y)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "#92400e")
          .style("font-size", "16px")
          .style("font-weight", "700");
        
        if (text.length > 20 && words.length > 2) {
          const mid = Math.ceil(words.length / 2);
          textElement
            .append("tspan")
            .attr("x", d.x)
            .attr("dy", "-0.6em")
            .text(words.slice(0, mid).join(' '));
          textElement
            .append("tspan")
            .attr("x", d.x)
            .attr("dy", "1.3em")
            .text(words.slice(mid).join(' '));
        } else {
          textElement.text(text);
        }
      } else if (d.shape === "stadium" || d.shape === "terminal" || d.type === "start" || d.type === "end") {
        // Terminal shape (rounded rectangle) for Start/End
        // Add shadow
        node
          .append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", nodeWidth)
          .attr("height", nodeHeight)
          .attr("rx", nodeHeight / 2)
          .attr("ry", nodeHeight / 2)
          .attr("fill", "#10b981")
          .attr("opacity", 0.2)
          .attr("transform", "translate(4, 4)");
        
        node
          .append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", nodeWidth)
          .attr("height", nodeHeight)
          .attr("rx", nodeHeight / 2)
          .attr("ry", nodeHeight / 2)
          .attr("fill", "#d1fae5")
          .attr("stroke", "#10b981")
          .attr("stroke-width", 4)
          .style("filter", "drop-shadow(0px 3px 6px rgba(0,0,0,0.15))");

        node
          .append("text")
          .attr("x", d.x)
          .attr("y", d.y)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "#065f46")
          .style("font-size", "18px")
          .style("font-weight", "700")
          .text(d.label || d.text);
      } else if (d.shape === "parallelogram" || d.type === "input" || d.type === "output") {
        // Parallelogram for input/output
        const skew = 25;
        const points = [
          [x + skew, y],
          [x + nodeWidth, y],
          [x + nodeWidth - skew, y + nodeHeight],
          [x, y + nodeHeight],
        ]
          .map((p) => p.join(","))
          .join(" ");
        
        // Add shadow
        node
          .append("polygon")
          .attr("points", points)
          .attr("fill", "#3b82f6")
          .attr("opacity", 0.2)
          .attr("transform", "translate(4, 4)");
        
        node
          .append("polygon")
          .attr("points", points)
          .attr("fill", "#dbeafe")
          .attr("stroke", "#3b82f6")
          .attr("stroke-width", 4)
          .style("filter", "drop-shadow(0px 3px 6px rgba(0,0,0,0.15))");

        const text = d.label || d.text || '';
        const words = text.split(' ');
        const textElement = node
          .append("text")
          .attr("x", d.x)
          .attr("y", d.y)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "#1e40af")
          .style("font-size", "15px")
          .style("font-weight", "600");

        if (text.length > 25 && words.length > 3) {
          const mid = Math.ceil(words.length / 2);
          textElement
            .append("tspan")
            .attr("x", d.x)
            .attr("dy", "-0.5em")
            .text(words.slice(0, mid).join(' '));
          textElement
            .append("tspan")
            .attr("x", d.x)
            .attr("dy", "1.2em")
            .text(words.slice(mid).join(' '));
        } else {
          textElement.text(text);
        }
      } else {
        // Rectangle for process
        // Add shadow
        node
          .append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", nodeWidth)
          .attr("height", nodeHeight)
          .attr("rx", 10)
          .attr("fill", "#a855f7")
          .attr("opacity", 0.2)
          .attr("transform", "translate(4, 4)");
        
        node
          .append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", nodeWidth)
          .attr("height", nodeHeight)
          .attr("rx", 10)
          .attr("fill", "#f3e8ff")
          .attr("stroke", "#9333ea")
          .attr("stroke-width", 4)
          .style("filter", "drop-shadow(0px 3px 6px rgba(0,0,0,0.15))");

        const text = d.label || d.text || '';
        const words = text.split(' ');
        const textElement = node
          .append("text")
          .attr("x", d.x)
          .attr("y", d.y)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "#581c87")
          .style("font-size", "15px")
          .style("font-weight", "600");

        if (text.length > 25 && words.length > 3) {
          const mid = Math.ceil(words.length / 2);
          textElement
            .append("tspan")
            .attr("x", d.x)
            .attr("dy", "-0.5em")
            .text(words.slice(0, mid).join(' '));
          textElement
            .append("tspan")
            .attr("x", d.x)
            .attr("dy", "1.2em")
            .text(words.slice(mid).join(' '));
        } else {
          textElement.text(text);
        }
      }
    });
  }, [graph, code]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "400px" }}>
      <svg ref={svgRef} style={{ display: "block", width: "100%", height: "auto", minHeight: "400px" }}></svg>
    </div>
  );
}

export default SvgFlow;
