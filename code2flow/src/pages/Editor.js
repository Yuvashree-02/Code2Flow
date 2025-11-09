import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { parseToGraph, codeTemplates } from "../utils/parseToGraph";

function Editor() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(codeTemplates.python);
  const [lang, setLang] = useState("python");
  const [graph, setGraph] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const langParam = searchParams.get("lang");
    if (langParam && codeTemplates[langParam]) {
      setLang(langParam);
      setCode(codeTemplates[langParam]);
    }
  }, [searchParams]);

  const handleGenerate = () => {
    if (!code.trim()) {
      setMessage("Please enter some code to generate a flowchart.");
      setGraph(null);
      return;
    }
    const g = parseToGraph(code);
    setGraph(g);
    setMessage("");
  };

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <div style={styles.controls}>
          <select
            value={lang}
            onChange={(e) => {
              const newLang = e.target.value;
              setLang(newLang);
              setCode(codeTemplates[newLang]);
            }}
            style={styles.select}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="sql">SQL</option>
            <option value="html">HTML/CSS</option>
          </select>

          <button onClick={handleGenerate} style={styles.button}>
            Generate Flowchart
          </button>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={styles.textarea}
          placeholder="Paste your code here..."
        />

        {message && <div style={styles.message}>{message}</div>}
      </section>

      <section style={{ ...styles.card, marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Flowchart</h3>
        <div style={{ minHeight: 220 }}>
          {graph && JSON.stringify(graph, null, 2)}
        </div>
      </section>
    </main>
  );
}

const styles = {
  container: {
    maxWidth: 1100,
    margin: "24px auto",
    padding: "0 18px",
  },
  card: {
    background: "#fff",
    padding: 18,
    borderRadius: 12,
    boxShadow: "0 6px 18px rgba(2,6,23,0.06)",
  },
  controls: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  select: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e6e9ef",
  },
  button: {
    padding: "8px 14px",
    background: "#4b0082",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "transform .12s ease",
    boxShadow: "0 6px 12px rgba(75,0,130,0.08)",
  },
  textarea: {
    width: "100%",
    minHeight: 160,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #e6e9ef",
    fontFamily: "monospace",
    fontSize: 13,
    resize: "vertical",
  },
  message: {
    marginTop: 10,
    color: "#b91c1c",
  },
  placeholder: {
    color: "#6b7280",
    padding: 18,
  },
};

export default Editor;

