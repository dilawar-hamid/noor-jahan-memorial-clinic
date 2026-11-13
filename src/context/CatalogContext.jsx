import { useEffect, useState } from "react";
import { CatalogContext } from "./CatalogContext.js";
import { CATALOG_KEY, CATALOG_VERSION, DEFAULT_CATALOG } from "../config";
import { getStoredJSON, saveJSON, STORAGE_DATA_EVENT } from "../utils/storage";

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_CATALOG));

function readCatalog() {
  try {
    const saved = getStoredJSON(CATALOG_KEY, null);
    if (!saved || typeof saved !== "object") return cloneDefaults();

    // V6 catalog used one shared doctor list and sample lab/consultation lists.
    // Migrate those demo catalog values to the clinic's confirmed lists while
    // retaining owner-entered registration/lab-share settings and procedures.
    if (Number(saved.version || 0) < CATALOG_VERSION) {
      const defaults = cloneDefaults();
      return {
        ...defaults,
        registrationFee: Number.isFinite(Number(saved.registrationFee)) ? Number(saved.registrationFee) : defaults.registrationFee,
        labHospitalPercent: Number.isFinite(Number(saved.labHospitalPercent)) ? Number(saved.labHospitalPercent) : defaults.labHospitalPercent,
        procedures: Array.isArray(saved.procedures) && saved.procedures.length ? saved.procedures : defaults.procedures,
        version: CATALOG_VERSION,
      };
    }

    const merged = { ...cloneDefaults(), ...saved, version: CATALOG_VERSION };
    const defaultTimings = cloneDefaults().procedureTimings;
    merged.procedureTimings = {
      oxygen: Array.isArray(saved.procedureTimings?.oxygen) && saved.procedureTimings.oxygen.length
        ? saved.procedureTimings.oxygen : defaultTimings.oxygen,
      nebulizer: Array.isArray(saved.procedureTimings?.nebulizer) && saved.procedureTimings.nebulizer.length
        ? saved.procedureTimings.nebulizer : defaultTimings.nebulizer,
    };
    ["generalOPDDoctors", "specialties", "ultrasoundDoctors", "procedures", "ultrasound", "labTests"].forEach((key) => {
      if (!Array.isArray(merged[key])) merged[key] = cloneDefaults()[key];
    });
    return merged;
  } catch {
    return cloneDefaults();
  }
}

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(readCatalog);

  useEffect(() => {
    saveJSON(CATALOG_KEY, catalog);
  }, [catalog]);

  useEffect(() => {
    const onData = (event) => { if (event.detail?.key === CATALOG_KEY && event.detail.value && typeof event.detail.value === "object") setCatalog(event.detail.value); };
    window.addEventListener(STORAGE_DATA_EVENT, onData);
    return () => window.removeEventListener(STORAGE_DATA_EVENT, onData);
  }, []);

  return (
    <CatalogContext.Provider value={{ catalog, setCatalog }}>
      {children}
    </CatalogContext.Provider>
  );
}
