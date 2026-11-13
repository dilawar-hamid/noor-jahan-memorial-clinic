import { summarizeIncome, money } from "../utils/income";

function IncomeBreakdown({ title, patients, services }) {
  const { rows, totals, voided, discounts } = summarizeIncome(patients, services);

  return (
    <div className="recent-patients-card income-card">
      <div className="table-heading">
        <h2>{title}</h2>
      </div>

      <div className="table-wrapper">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Slips</th>
              <th>Collected</th>
              <th>Hospital Income</th>
              <th>Payable to Lab</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td>{row.count}</td>
                <td>{money(row.collected)}</td>
                <td>{money(row.hospital)}</td>
                <td>{row.lab ? money(row.lab) : "—"}</td>
              </tr>
            ))}
            <tr className="income-total-row">
              <td>Total</td>
              <td>{totals.count}</td>
              <td>{money(totals.collected)}</td>
              <td>{money(totals.hospital)}</td>
              <td>{totals.lab ? money(totals.lab) : "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {discounts.count > 0 && (
        <p className="income-void-note income-discount-note">
          Historical discounts: {discounts.count} slips · {money(discounts.amount)} (already
          deducted above)
        </p>
      )}

      {voided.count > 0 && (
        <p className="income-void-note">
          Voided (not counted above): {voided.count} slips · {money(voided.amount)}
        </p>
      )}
    </div>
  );
}

export default IncomeBreakdown;
