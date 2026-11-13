import { useContext, useRef } from "react";
import { PatientContext } from "../context/PatientContext.js";
import { CLINIC_ADDRESS, CLINIC_NAME, CLINIC_PHONE, SHOW_FEE_ON_SLIP } from "../config";
import { isToday } from "../utils/date";
import { formatAge } from "../utils/age";
import { printSlip } from "../utils/print";
import { money } from "../utils/income";

function TokenSlip({ selectedPatientId = null }) {
  const { patients } = useContext(PatientContext);
  const selectedPatient = selectedPatientId
    ? patients.find((item) => item.id === selectedPatientId)
    : null;
  const latestTodayPatient = patients
    .filter((item) => isToday(item.createdAt))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] || null;
  const patient = (selectedPatient && isToday(selectedPatient.createdAt) ? selectedPatient : null)
    || latestTodayPatient;
  const slipRef = useRef(null);

  return (
    <div className="token-slip-card">
      <div className="token-slip-heading">
        <h2>General OPD Slip</h2>
        <button type="button" className="print-button" onClick={() => printSlip(slipRef.current)} disabled={!patient || Boolean(patient.void)}>
          Print Slip
        </button>
      </div>
      {!patient ? <p className="no-token">No active patient registered today.</p> : (
        <div className="svc-slip opd-slip" ref={slipRef}>
          <h3 className="svc-slip-clinic">{CLINIC_NAME}</h3>
          <p className="svc-slip-contact">{CLINIC_ADDRESS}</p>
          <p className="svc-slip-contact">{CLINIC_PHONE}</p>
          {patient.void && <p className="svc-slip-void">*** VOID ***</p>}
          <p className="svc-slip-title">General OPD Token Slip</p>
          <div className="svc-slip-number">{patient.token}</div>
          <div className="svc-slip-details">
            <p><b>Patient:</b> {patient.name}</p>
            <p><b>Age/Gender:</b> {formatAge(patient.age, patient.ageUnit || "years")} / {patient.gender}</p>
            {patient.phone && <p><b>Phone:</b> {patient.phone}</p>}
            <p><b>Doctor:</b> {patient.doctor}</p>
            {patient.sugarTest && patient.sugarTest !== "none" && <p><b>Sugar Test:</b> {patient.sugarTest}</p>}
            <p><b>Date:</b> {new Date(patient.createdAt).toLocaleDateString("en-PK")} &nbsp; <b>Time:</b> {new Date(patient.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          {SHOW_FEE_ON_SLIP && (
            <>
              <table className="svc-slip-items">
                <tbody>
                  <tr><td>General OPD Fee</td><td>{money(patient.baseFee ?? patient.fee)}</td></tr>
                  {Number(patient.sugarTestFee) > 0 && <tr><td>{patient.sugarTest} Sugar Test</td><td>{money(patient.sugarTestFee)}</td></tr>}
                </tbody>
              </table>
              <p className="svc-slip-total">Total: {money(patient.fee)}</p>
            </>
          )}
          <p className="svc-slip-footer">Thank you for visiting us.</p>
        </div>
      )}
    </div>
  );
}

export default TokenSlip;
