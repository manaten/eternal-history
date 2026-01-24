import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import OptionsApp from "./OptionsApp";
import { initializeTheme } from "./lib/theme";

initializeTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
