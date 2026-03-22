import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { VerifyForm } from "./components/VerifyForm.js";
import { Header } from "./components/Header.js";
import { Subscription } from "./components/Subscription.js";
import { NoticeAlert } from "./components/NoticeAlert.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* <App /> */}
    {<Header />}
    {<Subscription />}
    {<VerifyForm />}
  </StrictMode>
);
