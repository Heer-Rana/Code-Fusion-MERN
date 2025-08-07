// import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import AppProvider from "./context/AppProvider.jsx"
import "@/styles/global.css"

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <AppProvider>
      <App />
    </AppProvider>
  );
}
