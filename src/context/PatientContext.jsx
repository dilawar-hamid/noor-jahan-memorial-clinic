import { useEffect, useState } from "react";
import { PatientContext } from "./PatientContext.js";
import { STORAGE_KEY } from "../config";
import { getStoredJSON, updateStoredJSON, STORAGE_DATA_EVENT } from "../utils/storage";
import { getLocalDateKey } from "../utils/date";

function readStoredPatients() {
  const parsed = getStoredJSON(STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState(readStoredPatients);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const onData = (event) => { if (event.detail?.key === STORAGE_KEY && Array.isArray(event.detail.value)) setPatients(event.detail.value); };
    window.addEventListener(STORAGE_DATA_EVENT, onData);
    return () => window.removeEventListener(STORAGE_DATA_EVENT, onData);
  }, []);



  async function addPatient(patient) {
    const updated = await updateStoredJSON(STORAGE_KEY, (currentValue) => {
      const current = Array.isArray(currentValue) ? currentValue : [];
      const createdAt = Date.parse(patient.createdAt);
      const duplicate = current.some((p) => !p.void && p.name === patient.name && p.age === patient.age && p.ageUnit === patient.ageUnit && p.gender === patient.gender && p.doctor === patient.doctor && p.phone === patient.phone && p.sugarTest === patient.sugarTest && Math.abs(createdAt - Date.parse(p.createdAt)) < 5000);
      if (duplicate) return current;
      const day = getLocalDateKey(patient.createdAt);
      const highest = current.reduce((max, p) => {
        if (getLocalDateKey(p.createdAt) !== day) return max;
        const token = String(p.token || "");
        const match = token.match(/^OPD-(\d+)$/i);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      return [{ ...patient, token: `OPD-${String(highest + 1).padStart(3, "0")}` }, ...current];
    }, []);
    setPatients(updated);
  }

  async function voidPatient(id, info) {
    const updated = await updateStoredJSON(STORAGE_KEY, (current) => current.map((patient) => patient.id === id && !patient.void ? { ...patient, void: info } : patient), []);
    setPatients(updated);
  }

  async function resetDemo() {
    const updated = await updateStoredJSON(STORAGE_KEY, () => [], []);
    setPatients(updated);
  }

  return <PatientContext.Provider value={{ patients, searchTerm, setSearchTerm, addPatient, voidPatient, resetDemo }}>{children}</PatientContext.Provider>;
}
