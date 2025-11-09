import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Editor from "./pages/Editor";

function App() {
  return (
    <div style={{ background: "#f6f8fb", minHeight: "100vh", fontFamily: 'Inter, system-ui, sans-serif' }}>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </div>
  );
}

export default App;