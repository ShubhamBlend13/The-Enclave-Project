import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import RootApp from "./RootApp";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
);