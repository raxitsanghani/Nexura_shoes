import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Provider } from "react-redux";
import store from "./redux/store/store.ts";
import ScrollToTop from "./utils/ScrollToTop.ts";
import { HelmetProvider } from "react-helmet-async";
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <HelmetProvider>
          <BrowserRouter>
            <ScrollToTop />
            <App />
            <Toaster />
          </BrowserRouter>
        </HelmetProvider>
      </Provider>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}
