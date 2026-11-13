import { CLINIC_NAME, CLINIC_ADDRESS, CLINIC_PHONE } from "../config";
import { money } from "../utils/income";

// 80mm end-of-day summary for the owner.
function DayReportSlip({ date, summary, voidedItems, discountItems, slipRef }) {
  const { rows, totals, voided, discounts } = summary;
  const lab = rows.find((row) => row.key === "lab");
  const now = new Date();

  return (
    <div className="svc-slip" ref={slipRef}>
      <h3 className="svc-slip-clinic">{CLINIC_NAME}</h3>
      <p className="svc-slip-contact">{CLINIC_ADDRESS}</p>
      <p className="svc-slip-contact">{CLINIC_PHONE}</p>
      <p className="svc-slip-title">Day Report</p>
      <div className="svc-slip-number">{date}</div>

      <table className="svc-slip-items">
        <thead>
          <tr>
            <th>Service</th>
            <th>Rs.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>
                {row.label} ({row.count})
              </td>
              <td>{row.collected.toLocaleString("en-PK")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="svc-slip-items svc-slip-summary">
        <tbody>
          <tr>
            <td>Cash Collected</td>
            <td>{totals.collected.toLocaleString("en-PK")}</td>
          </tr>
          <tr>
            <td>Payable to Lab</td>
            <td>{(lab?.lab || 0).toLocaleString("en-PK")}</td>
          </tr>
          <tr>
            <td>
              <b>Hospital Income</b>
            </td>
            <td>
              <b>{totals.hospital.toLocaleString("en-PK")}</b>
            </td>
          </tr>
        </tbody>
      </table>

      {discounts.count > 0 && (
        <div className="svc-slip-details">
          <p>
            <b>Historical discounts:</b> {discounts.count} · {money(discounts.amount)}
          </p>
          {discountItems.map((item) => (
            <p key={item.ref}>
              {item.ref} — Rs. {item.amount} off: {item.reason}
            </p>
          ))}
        </div>
      )}

      {voided.count > 0 && (
        <div className="svc-slip-details">
          <p>
            <b>Voided (not counted):</b> {voided.count} · {money(voided.amount)}
          </p>
          {voidedItems.map((item) => (
            <p key={item.ref}>
              {item.ref} — Rs. {item.amount}: {item.reason}
            </p>
          ))}
        </div>
      )}

      <p className="svc-slip-footer">
        Printed {now.toLocaleDateString("en-PK")}{" "}
        {now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

export default DayReportSlip;
