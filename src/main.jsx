import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CatalogProvider } from "./context/CatalogContext.jsx";
import { ServiceProvider } from "./context/ServiceContext.jsx";
import { LabPaymentProvider } from "./context/LabPaymentContext.jsx";
import { PatientProvider } from "./context/PatientContext.jsx";
import { initializeClinicStorage } from "./utils/storage.js";

async function startApplication() {
  await initializeClinicStorage();

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <AuthProvider>
        <CatalogProvider>
          <ServiceProvider>
            <LabPaymentProvider>
              <PatientProvider>
                <App />
              </PatientProvider>
            </LabPaymentProvider>
          </ServiceProvider>
        </CatalogProvider>
      </AuthProvider>
    </StrictMode>,
  );

  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    const basePath = import.meta.env.BASE_URL;
    navigator.serviceWorker.register(`${basePath}sw.js`, { scope: basePath })
      .catch((error) => console.error("Clinic offline worker registration failed.", error));
  }
}

startApplication().catch((error) => {
  console.error("Clinic application could not initialize local storage.", error);
  const root = document.getElementById("root");
  if (root) root.innerHTML = '<div role="alert" style="padding:24px;font-family:Arial,sans-serif;color:#681629">Clinic data storage could not be initialized. Do not clear browser data. Please reload or contact the system owner.</div>';
});
