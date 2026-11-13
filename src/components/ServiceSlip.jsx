import { CLINIC_ADDRESS, CLINIC_NAME, CLINIC_PHONE, SERVICE_TYPES, SHOW_FEE_ON_SLIP } from "../config";
import { money } from "../utils/income";
import { formatAge } from "../utils/age";

function ServiceSlip({ record, slipRef }) {
  const meta = SERVICE_TYPES[record.type];
  const date = new Date(record.createdAt);
  const itemsTotal = record.items.reduce((total, item) => total + (Number(item.price) || 0), 0);
  const showPrices = SHOW_FEE_ON_SLIP && itemsTotal > 0;
  const discount = Number(record.discount?.amount) || Math.max(0, itemsTotal - Number(record.amount));
  const doctorLabel = record.type === "ultrasound" ? "Scan performed by" : "Doctor";

  return (
    <div className="svc-slip" ref={slipRef}>
      <h3 className="svc-slip-clinic">{CLINIC_NAME}</h3>
      <p className="svc-slip-contact">{CLINIC_ADDRESS}</p>
      <p className="svc-slip-contact">{CLINIC_PHONE}</p>
      {record.void && <p className="svc-slip-void">*** VOID ***</p>}
      <p className="svc-slip-title">{meta.slipTitle}</p>
      <div className="svc-slip-number">{record.slipNo}</div>
      <div className="svc-slip-details">
        <p><b>Patient:</b> {record.patientName}</p>
        {(record.age !== "" && record.age !== null && record.age !== undefined || record.gender) && (
          <p><b>Age/Gender:</b> {[record.age !== "" && record.age !== null && record.age !== undefined ? formatAge(record.age, record.ageUnit || "years") : "", record.gender].filter(Boolean).join(" / ")}</p>
        )}
        {record.phone && <p><b>Phone:</b> {record.phone}</p>}
        {record.doctor && ["consultation", "ultrasound"].includes(record.type) && <p><b>{doctorLabel}:</b> {record.doctor}</p>}
        <p><b>Date:</b> {date.toLocaleDateString("en-PK")} &nbsp; <b>Time:</b> {date.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
      <table className="svc-slip-items">
        <thead><tr><th>{meta.itemLabel}</th>{showPrices && <th>Rs.</th>}</tr></thead>
        <tbody>
          {record.items.map((item, index) => <tr key={`${item.name}-${index}`}><td>{item.name}</td>{showPrices && <td>{Number(item.price) || 0}</td>}</tr>)}
          {discount > 0 && <tr><td>Historical discount{record.discount?.reason ? ` — ${record.discount.reason}` : ""}</td><td>-{discount}</td></tr>}
        </tbody>
      </table>
      {SHOW_FEE_ON_SLIP && <p className="svc-slip-total">Total: {money(record.amount)}</p>}
      <p className="svc-slip-footer">Thank you for visiting us.</p>
    </div>
  );
}
export default ServiceSlip;
