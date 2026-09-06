import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import "./index.css";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
const root = createRoot(document.getElementById("root")!);

if (url) {
  const client = new ConvexReactClient(url);
  root.render(
    <StrictMode>
      <ConvexProvider client={client}>
        <App />
      </ConvexProvider>
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
