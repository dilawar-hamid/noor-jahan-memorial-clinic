import { useContext, useEffect, useRef, useState } from "react";
import { PatientContext } from "../context/PatientContext.js";
import { ServiceContext } from "../context/ServiceContext.js";
import IncomeBreakdown from "../components/IncomeBreakdown";
import DayReportSlip from "../components/DayReportSlip";
import { getLocalDateKey } from "../utils/date";
import { summarizeIncome } from "../utils/income";
import { printSlip } from "../utils/print";

function DayReport() {
  const { patients } = useContext(PatientContext);
  const { services } = useContext(ServiceContext);
  const [date, setDate] = useState(getLocalDateKey(new Date()));
  const autoDateRef = useRef(date);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const today = getLocalDateKey(new Date());
      if (date === autoDateRef.current && today !== autoDateRef.current) setDate(today);
      autoDateRef.current = today;
    }, 15000);
    return () => window.clearInterval(timer);
  }, [date]);
  const slipRef = useRef(null);

  const dayPatients = patients.filter((p) => getLocalDateKey(p.createdAt) === date);
  const dayServices = services.filter((s) => getLocalDateKey(s.createdAt) === date);
  const summary = summarizeIncome(dayPatients, dayServices);

  const voidedItems = [
    ...dayPatients
      .filter((p) => p.void)
      .map((p) => ({ ref: p.token, amount: p.fee, reason: p.void.reason })),
    ...dayServices
      .filter((s) => s.void)
      .map((s) => ({ ref: s.slipNo, amount: s.amount, reason: s.void.reason })),
  ];

  const discountItems = dayServices
    .filter((s) => !s.void && Number(s.discount?.amount) > 0)
    .map((s) => ({ ref: s.slipNo, amount: s.discount.amount, reason: s.discount.reason }));

  return (
    <div className="registration-page">
      <div className="dashboard-heading">
        <div className="dashboard-header-row">
          <h1>Day Report</h1>
        </div>
        <p>End-of-day totals to match against the cash in hand.</p>
      </div>

      <div className="history-date-filter">
        <label htmlFor="report-date">Select Date</label>
        <input
          id="report-date"
          type="date"
          value={date}
          onChange={(e) => { if (e.target.value) { setDate(e.target.value); autoDateRef.current = getLocalDateKey(new Date()); } }}
        />
      </div>

      <div className="registration-workspace">
        <IncomeBreakdown
          title="Income by Service"
          patients={dayPatients}
          services={dayServices}
        />

        <div className="token-slip-card">
          <div className="token-slip-heading">
            <h2>Report Slip</h2>
            <button
              type="button"
              className="print-button"
              onClick={() => printSlip(slipRef.current)}
            >
              Print Report
            </button>
          </div>
          <DayReportSlip
            date={date}
            summary={summary}
            voidedItems={voidedItems}
            discountItems={discountItems}
            slipRef={slipRef}
          />
        </div>
      </div>
    </div>
  );
}

export default DayReport;
