import { useContext, useState } from "react";
import { ServiceContext } from "../context/ServiceContext.js";
import { LabPaymentContext } from "../context/LabPaymentContext.js";
import { AuthContext } from "../context/AuthContext.js";
import StatCard from "../components/StatCard";
import { VoidButton, VoidNote } from "../components/VoidControls";
import ShowMore from "../components/ShowMore";
import { usePaged } from "../utils/usePaged";
import { getLocalDateKey } from "../utils/date";
import { labSummaryForMonth, monthKeyOf } from "../utils/lab";
import { money } from "../utils/income";
import { createRecordId } from "../utils/id";

const STATUS_LABEL = {
  none: "No lab slips",
  unpaid: "Unpaid",
  partial: "Partly paid",
  paid: "Paid",
  overpaid: "Overpaid",
};

function LabSettlement() {
  const { services } = useContext(ServiceContext);
  const { payments, addLabPayment, voidLabPayment } = useContext(LabPaymentContext);
  const { user } = useContext(AuthContext);

  const [monthKey, setMonthKey] = useState(monthKeyOf(new Date()));
  const [amount, setAmount] = useState("");
  const [paidDate, setPaidDate] = useState(getLocalDateKey(new Date()));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const summary = labSummaryForMonth(services, payments, monthKey);
  const paymentsPage = usePaged(summary.monthPayments);
  const slipsPage = usePaged(summary.slips);
  const [year, month] = monthKey.split("-").map(Number);
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-PK", {
    month: "long",
    year: "numeric",
  });

  async function handleAdd(event) {
    event.preventDefault();
    if (isSaving) return;
    const value = Number(amount);

    if (!paidDate || !paidDate.startsWith(monthKey)) {
      setError("Paid date must be within the selected month.");
      return;
    }
    if (!Number.isInteger(value) || value <= 0) {
      setError("Enter the amount paid to the lab.");
      return;
    }
    if (value > summary.balance) {
      setError(`Amount is more than the balance (${money(summary.balance)}).`);
      return;
    }

    setIsSaving(true);
    try {
      await addLabPayment({
        id: createRecordId(),
        monthKey,
        amount: value,
        paidDate,
        note: note.trim(),
        by: user?.username || "",
        createdAt: new Date().toISOString(),
      });
      setAmount("");
      setNote("");
      setError("");
    } catch {
      setError("Payment could not be saved. Please try again before closing this page.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="settlement-page">
      <div className="dashboard-heading">
        <div className="dashboard-header-row">
          <h1>Lab Settlement</h1>
          <span className={`status-chip status-${summary.status}`}>
            {STATUS_LABEL[summary.status]}
          </span>
        </div>
        <p>What the hospital owes the lab for the month, and what has been paid.</p>
      </div>

      <div className="history-date-filter">
        <label htmlFor="settle-month">Select Month</label>
        <input
          id="settle-month"
          type="month"
          value={monthKey}
          onChange={(e) => e.target.value && setMonthKey(e.target.value)}
        />
      </div>

      <h2>{monthName}</h2>
      <div className="history-stats-grid">
        <StatCard title="Lab Slips" value={summary.valid.length} />
        <StatCard title="Collected from Patients" value={money(summary.collected)} />
        <StatCard title="Hospital Income" value={money(summary.hospital)} />
        <StatCard title="Payable to Lab" value={money(summary.payable)} />
        <StatCard title="Paid So Far" value={money(summary.paid)} />
        <StatCard title="Balance Due" value={money(Math.max(summary.balance, 0))} />
        {summary.overpaid > 0 && <StatCard title="Overpaid — Recover / Adjust" value={money(summary.overpaid)} />}
      </div>

      <div className="register-card settings-card">
        <div className="register-heading">
          <h2>Record a Payment to the Lab</h2>
          <p>
            Balance due: <b>{money(Math.max(summary.balance, 0))}</b>. Part payments are
            fine. {summary.overpaid > 0 && <span className="overpaid-warning"> Overpaid {money(summary.overpaid)} — recover from the lab or adjust in the next settlement.</span>}
          </p>
        </div>

        <form className="register-form" onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="pay-amount">
                Amount (Rs.) <span>*</span>
              </label>
              <input
                id="pay-amount"
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="pay-date">Paid on</label>
              <input
                id="pay-date"
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="pay-note">Note (cash / bank reference)</label>
            <input
              id="pay-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <small role="alert">{error}</small>}

          <div className="settlement-actions">
            <button
              type="button"
              className="print-button"
              disabled={summary.balance <= 0}
              onClick={() => setAmount(String(Math.max(summary.balance, 0)))}
            >
              Fill full balance
            </button>
            <button className="register-button" type="submit" disabled={summary.balance <= 0 || isSaving}>
              {isSaving ? "Recording…" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>

      <div className="recent-patients-card">
        <div className="table-heading">
          <h2>Payments — {monthName}</h2>
          <span>{summary.monthPayments.length}</span>
        </div>
        <div className="table-wrapper">
          <table className="patients-table">
            <thead>
              <tr>
                <th>Paid on</th>
                <th>Amount</th>
                <th>Note</th>
                <th>By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paymentsPage.shown.map((payment) => (
                <tr key={payment.id} className={payment.void ? "row-void" : ""}>
                  <td>{payment.paidDate}</td>
                  <td>{money(payment.amount)}</td>
                  <td>{payment.note || "—"}</td>
                  <td>{payment.by || "—"}</td>
                  <td className="actions-cell">
                    <div className="row-actions">
                      <VoidButton
                        record={payment}
                        summary={`Payment of ${money(payment.amount)} paid on ${payment.paidDate}`}
                        onVoid={(info) => voidLabPayment(payment.id, info)}
                      />
                      <VoidNote record={payment} />
                    </div>
                  </td>
                </tr>
              ))}
              {summary.monthPayments.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-table">
                    No payments recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ShowMore remaining={paymentsPage.remaining} onClick={paymentsPage.showMore} />
      </div>

      <div className="recent-patients-card">
        <div className="table-heading">
          <h2>Lab Slips — {monthName}</h2>
          <span>{summary.slips.length}</span>
        </div>
        <div className="table-wrapper">
          <table className="patients-table">
            <thead>
              <tr>
                <th>Slip</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Tests</th>
                <th>Collected</th>
                <th>Hospital Income</th>
                <th>Payable to Lab</th>
              </tr>
            </thead>
            <tbody>
              {slipsPage.shown.map((slip) => (
                <tr key={slip.id} className={slip.void ? "row-void" : ""}>
                  <td className="patient-token">{slip.slipNo}</td>
                  <td>{getLocalDateKey(slip.createdAt)}</td>
                  <td>{slip.patientName}</td>
                  <td>
                    {slip.items.map((item) => item.name).join(", ")}
                    <VoidNote record={slip} />
                  </td>
                  <td>{money(slip.amount)}</td>
                  <td>{money(slip.hospitalShare)}</td>
                  <td>{money(slip.labShare)}</td>
                </tr>
              ))}
              {summary.slips.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-table">
                    No lab slips this month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ShowMore remaining={slipsPage.remaining} onClick={slipsPage.showMore} />
      </div>
    </div>
  );
}

export default LabSettlement;
