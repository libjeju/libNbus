import React from "react";
import { createRoot } from "react-dom/client";
import AdminEditor from "./AdminEditor.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminEditor />
  </React.StrictMode>
);
