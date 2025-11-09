import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";

export default function CodeFlowchart() {
  const svgRef = useRef();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");

  const generateFlow = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const lines = code.split("\n").map((l) => l.trim()).filter(Boolean);
    const nodes = lines.map((line, i) => ({
      id: i,
      text: line,
    }));

    const width = 800;
    const height = 400;
    const nodeGap = 70;

    svg
      .attr("width", width)
      .attr("height", height)
      .style("background", "#111")
      .style("border-radius", "12px");

    const group = svg.append("g").attr("transform", "translate(50,50)");

    nodes.forEach((node, i) => {
      group
        .append("rect")
        .attr("x", 100)
        .attr("y", i * nodeGap)
        .attr("width", 300)
        .attr("height", 40)
        .attr("fill", "#2a9d8f")
        .attr("rx", 8)
        .attr("ry", 8);

      group
        .append("text")
        .attr("x", 120)
        .attr("y", i * nodeGap + 25)
        .attr("fill", "white")
        .attr("font-size", "14px")
        .text(node.text);

      if (i > 0) {
        group
          .append("line")
          .attr("x1", 250)
          .attr("y1", i * nodeGap - 30)
          .attr("x2", 250)
          .attr("y2", i * nodeGap)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("marker-end", "url(#arrow)");
      }
    });

    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrow")
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("refX", 6)
      .attr("refY", 3)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L0,6 L9,3 z")
      .attr("fill", "white");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🧠 Code2Flow - Visual Code Flow Generator</h2>

      <div style={{ marginBottom: "10px" }}>
        <label>Choose Language: </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>

      <CodeMirror
        value={code}
        height="150px"
        extensions={[
          language === "python" ? python() : javascript(),
        ]}
        onChange={(value) => setCode(value)}
      />

      <button
        onClick={generateFlow}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          background: "#1f6feb",
          color: "white",
          border: "none",
          borderRadius: "8px",
        }}
      >
        Generate Flowchart
      </button>

      <h3 style={{ marginTop: "20px" }}>Flowchart</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}
