import { isToday, getLocalDateKey } from "../utils/date";
import { formatAge } from "../utils/age";
import { useContext } from "react";
import { PatientContext } from "../context/PatientContext.js";
import { VoidButton, VoidNote } from "./VoidControls";
import ShowMore from "./ShowMore";
import { usePaged } from "../utils/usePaged";

function RecentPatientsTable({ todayOnly = true, selectedDate = null, useSearch = true, onSelect }) {
  const { patients, searchTerm, voidPatient } = useContext(PatientContext);
  const visiblePatients = (selectedDate ? patients.filter((p) => p.createdAt && getLocalDateKey(p.createdAt) === selectedDate) : todayOnly ? patients.filter((p) => isToday(p.createdAt)) : patients)
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const normalizedSearch = useSearch ? searchTerm.trim().toLowerCase() : "";
  const filteredPatients = visiblePatients.filter((p) => String(p.name || "").toLowerCase().includes(normalizedSearch) || String(p.token || "").toLowerCase().includes(normalizedSearch));
  const { shown: shownPatients, remaining, showMore } = usePaged(filteredPatients);
  const liveCount = filteredPatients.filter((p) => !p.void).length;

  return (
    <div className="recent-patients-card">
      <div className="table-heading"><h2>{selectedDate ? "Patients on Selected Date" : todayOnly ? "Today's General OPD" : "Recent General OPD Patients"}</h2><span>{liveCount} Patients</span></div>
      <div className="table-wrapper">
        <table className="patients-table">
          <thead><tr><th>Token</th><th>Patient Name</th><th>Age</th><th>Gender</th><th>Doctor</th><th>Sugar Test</th><th>Time</th><th>Fee</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shownPatients.map((patient) => (
              <tr key={patient.id} className={`${patient.void ? "row-void" : ""} ${onSelect ? "selectable-row" : ""}`} onClick={() => onSelect?.(patient.id)} onKeyDown={(event) => { if (onSelect && (event.key === "Enter" || event.key === " ")) onSelect(patient.id); }} tabIndex={onSelect ? 0 : undefined}>
                <td className="patient-token">{patient.token}</td><td>{patient.name}</td><td>{formatAge(patient.age, patient.ageUnit)}</td><td>{patient.gender}</td><td>{patient.doctor || "—"}</td><td>{patient.sugarTest && patient.sugarTest !== "none" ? patient.sugarTest : "—"}</td>
                <td>{new Date(patient.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</td><td>Rs. {patient.fee}</td><td><span className="status-badge">{patient.void ? "Voided" : patient.status}</span></td>
                <td className="actions-cell" onClick={(event) => event.stopPropagation()}><div className="row-actions"><VoidButton record={patient} summary={`${patient.token} — ${patient.name} — Rs. ${patient.fee}`} onVoid={(info) => voidPatient(patient.id, info)} /><VoidNote record={patient} /></div></td>
              </tr>
            ))}
            {filteredPatients.length === 0 && <tr><td colSpan="10" className="empty-table">No patients found</td></tr>}
          </tbody>
        </table>
      </div>
      {onSelect && <p className="table-hint">Select a patient row to display and reprint that token slip.</p>}
      <ShowMore remaining={remaining} onClick={showMore} />
    </div>
  );
}
export default RecentPatientsTable;
