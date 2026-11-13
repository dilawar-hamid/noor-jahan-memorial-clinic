import { useContext } from "react";
import { ServiceContext } from "../context/ServiceContext.js";
import { SERVICE_TYPES } from "../config";
import { money } from "../utils/income";
import { VoidButton, VoidNote } from "./VoidControls";
import ShowMore from "./ShowMore";
import { usePaged } from "../utils/usePaged";

// All service slips for the given records (used by History, owner only).
function ServiceSlipsTable({ title, records }) {
  const { voidService } = useContext(ServiceContext);
  const { shown, remaining, showMore } = usePaged(records);

  return (
    <div className="recent-patients-card">
      <div className="table-heading">
        <h2>{title}</h2>
        <span>{records.length} Slips</span>
      </div>

      <div className="table-wrapper">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Slip</th>
              <th>Service</th>
              <th>Patient</th>
              <th>Details</th>
              <th>Time</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((record) => (
              <tr key={record.id} className={record.void ? "row-void" : ""}>
                <td className="patient-token">{record.slipNo}</td>
                <td>{SERVICE_TYPES[record.type]?.title || record.type}</td>
                <td>{record.patientName}</td>
                <td>{record.items.map((item) => item.name).join(", ")}</td>
                <td>
                  {new Date(record.createdAt).toLocaleTimeString("en-PK", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td>{money(record.amount)}</td>
                <td className="actions-cell">
                  <div className="row-actions">
                    <VoidButton
                      record={record}
                      summary={`${record.slipNo} — ${record.patientName} — ${money(record.amount)}`}
                      onVoid={(info) => voidService(record.id, info)}
                    />
                    <VoidNote record={record} />
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-table">
                  No service slips
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ShowMore remaining={remaining} onClick={showMore} />
    </div>
  );
}

export default ServiceSlipsTable;
