import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { STORAGE, applyTheme, readStorage } from "./data";

// Before the first paint, so the page doesn't flash white in dark mode
applyTheme(readStorage(STORAGE.theme, ""));

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
