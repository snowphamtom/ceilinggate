import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import "./index.css";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
const root = createRoot(document.getElementById("root")!);

if (!url) {
  root.render(
    <StrictMode>
      <div className="shell">
        <h1>CeilingGate</h1>
        <p className="muted">
          Set <code>VITE_CONVEX_URL</code> after <code>npx convex dev</code> /
          deploy. Gate self-check still runs offline via{" "}
          <code>npm run test:gate</code>.
        </p>
        <OfflineFixtures />
      </div>
    </StrictMode>,
  );
} else {
  const client = new ConvexReactClient(url);
  root.render(
    <StrictMode>
      <ConvexProvider client={client}>
        <App />
      </ConvexProvider>
    </StrictMode>,
  );
}

function OfflineFixtures() {
  const grant = { status: "grant", mask: 0, failed: [] as number[] };
  const refuse = { status: "refuse", mask: 10, failed: [1, 3] };
  return (
    <div className="grid">
      <div className="card grant">
        <h2>fuel-grant</h2>
        <p>claimed [98,49,25,9] ≤ [100,50,25,10]</p>
        <div className="badge">GRANT · mask {grant.mask}</div>
      </div>
      <div className="card refuse">
        <h2>fuel-refuse</h2>
        <p>claimed [98,51,25,11] ≰ interior → bits 1,3</p>
        <div className="badge">REFUSE · mask {refuse.mask}</div>
      </div>
    </div>
  );
}
