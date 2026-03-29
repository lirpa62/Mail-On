import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { VerifyForm } from "./components/VerifyForm.js";
import { Header } from "./components/Header.js";
import { Subscription } from "./components/Subscription.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {<Header />}
    {<Subscription />}
    {<VerifyForm />}
  </StrictMode>,
);
