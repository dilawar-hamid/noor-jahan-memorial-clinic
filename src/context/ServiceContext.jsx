import { useEffect, useState } from "react";
import { ServiceContext } from "./ServiceContext.js";
import { SERVICES_KEY, SERVICE_TYPES } from "../config";
import { getLocalDateKey } from "../utils/date";
import { getStoredJSON, updateStoredJSON, STORAGE_DATA_EVENT } from "../utils/storage";

function readServices() {
  const saved = getStoredJSON(SERVICES_KEY, []);
  return Array.isArray(saved) ? saved : [];
}

export function ServiceProvider({ children }) {
  const [services, setServices] = useState(readServices);
  useEffect(() => {
    const onData = (event) => { if (event.detail?.key === SERVICES_KEY && Array.isArray(event.detail.value)) setServices(event.detail.value); };
    window.addEventListener(STORAGE_DATA_EVENT, onData);
    return () => window.removeEventListener(STORAGE_DATA_EVENT, onData);
  }, []);


  async function addService(record) {
    const updated = await updateStoredJSON(SERVICES_KEY, (currentValue) => {
      const current = Array.isArray(currentValue) ? currentValue : [];
      const names = record.items.map((item) => item.name).join("|");
      const createdAt = Date.parse(record.createdAt);
      const duplicate = current.some((r) => !r.void && r.type === record.type && r.patientName === record.patientName && Number(r.amount) === Number(record.amount) && r.items.map((item) => item.name).join("|") === names && r.doctor === record.doctor && r.specialty === record.specialty && r.age === record.age && r.ageUnit === record.ageUnit && r.gender === record.gender && r.phone === record.phone && Math.abs(createdAt - Date.parse(r.createdAt)) < 5000);
      if (duplicate) return current;
      const day = getLocalDateKey(record.createdAt);
      const prefix = record.tokenPrefix || SERVICE_TYPES[record.type].prefix;
      const highest = current.reduce((max, r) => {
        if (r.type !== record.type || getLocalDateKey(r.createdAt) !== day) return max;
        const slip = String(r.slipNo || "");
        const number = slip.toUpperCase().startsWith(`${prefix.toUpperCase()}-`) ? Number(slip.slice(prefix.length + 1)) : 0;
        return Number.isFinite(number) ? Math.max(max, number) : max;
      }, 0);
      return [{ ...record, slipNo: `${prefix}-${String(highest + 1).padStart(3, "0")}` }, ...current];
    }, []);
    setServices(updated);
  }

  async function voidService(id, info) {
    const updated = await updateStoredJSON(SERVICES_KEY, (current) => current.map((record) => record.id === id && !record.void ? { ...record, void: info } : record), []);
    setServices(updated);
  }
  async function resetServices() {
    const updated = await updateStoredJSON(SERVICES_KEY, () => [], []);
    setServices(updated);
  }

  return <ServiceContext.Provider value={{ services, addService, voidService, resetServices }}>{children}</ServiceContext.Provider>;
}
