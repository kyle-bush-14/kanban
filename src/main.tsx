import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// NOTE: StrictMode is intentionally omitted. Its development-only double-mount
// leaves @dnd-kit/react 0.5 with unbound pointer sensors, which silently breaks
// dragging cards between columns. Re-enable it once dnd-kit handles the
// double-invoked effects; it does not affect production builds either way.
createRoot(document.getElementById("root")!).render(<App />);
