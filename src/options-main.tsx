import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import OptionsApp from "./OptionsApp";
import { getSettings } from "./lib/settings";
import { applyTheme } from "./lib/theme";

// Apply theme immediately before rendering
getSettings().then((settings) => {
  applyTheme(settings.theme);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
