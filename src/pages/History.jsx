import { useContext, useEffect, useRef, useState } from "react";
import { PatientContext } from "../context/PatientContext.js";
import { ServiceContext } from "../context/ServiceContext.js";
import IncomeBreakdown from "../components/IncomeBreakdown";
import ServiceSlipsTable from "../components/ServiceSlipsTable";
import StatCard from "../components/StatCard";
import RecentPatientsTable from "../components/RecentPatientsTable";
import { summarizeIncome, rowOf, money } from "../utils/income";
import { getLocalDateKey } from "../utils/date";

function SummaryCards({ summary, patientsLabel, feesLabel, incomeLabel }) {
  const registration = rowOf(summary, "registration");
  const lab = rowOf(summary, "lab");
  const ultrasound = rowOf(summary, "ultrasound");

  return (
    <div className="history-stats-grid">
      <StatCard title={patientsLabel} value={registration.count} />
      <StatCard title={feesLabel} value={money(registration.collected)} />
      <StatCard title={incomeLabel} value={money(summary.totals.hospital)} />
      <StatCard title="Cash Collected" value={money(summary.totals.collected)} />
      <StatCard title="Hospital Income from Lab" value={money(lab.hospital)} />
      <StatCard title="Payable to Lab" value={money(lab.lab)} />
      <StatCard
        title="Ultrasound Collection"
        value={`${money(ultrasound.collected)} · ${ultrasound.count} scans`}
      />
    </div>
  );
}

function History() {
  const { patients } = useContext(PatientContext);
  const { services } = useContext(ServiceContext);

  const [selectedDate, setSelectedDate] = useState(getLocalDateKey(new Date()));
  const autoDateRef = useRef(selectedDate);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const today = getLocalDateKey(new Date());
      if (selectedDate === autoDateRef.current && today !== autoDateRef.current) setSelectedDate(today);
      autoDateRef.current = today;
    }, 15000);
    return () => window.clearInterval(timer);
  }, [selectedDate]);
  const monthKey = selectedDate.slice(0, 7);

  const dailyPatients = patients.filter(
    (patient) => getLocalDateKey(patient.createdAt) === selectedDate,
  );
  const monthlyPatients = patients.filter(
    (patient) => getLocalDateKey(patient.createdAt).slice(0, 7) === monthKey,
  );
  const dailyServices = services.filter(
    (record) => getLocalDateKey(record.createdAt) === selectedDate,
  );
  const monthlyServices = services.filter(
    (record) => getLocalDateKey(record.createdAt).slice(0, 7) === monthKey,
  );

  const dailySummary = summarizeIncome(dailyPatients, dailyServices);
  const monthlySummary = summarizeIncome(monthlyPatients, monthlyServices);

  const [year, month] = selectedDate.split("-").map(Number);
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-PK", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="history-page">
      <div className="dashboard-heading">
        <div className="dashboard-header-row">
          <h1>History</h1>
        </div>
        <p>View daily records and monthly collection. Voided records are not counted.</p>
      </div>

      <div className="history-date-filter">
        <label htmlFor="history-date">Select Date</label>
        <input
          id="history-date"
          type="date"
          value={selectedDate}
          onChange={(e) => { if (e.target.value) { setSelectedDate(e.target.value); autoDateRef.current = getLocalDateKey(new Date()); } }}
        />
      </div>

      <h2>Daily Summary</h2>
      <SummaryCards
        summary={dailySummary}
        patientsLabel="Total Patients"
        feesLabel="General OPD Fees"
        incomeLabel="Hospital Income (All Services)"
      />

      <h2>Monthly Summary — {monthName}</h2>
      <SummaryCards
        summary={monthlySummary}
        patientsLabel="Total Patients This Month"
        feesLabel="Monthly General OPD Fees"
        incomeLabel="Monthly Hospital Income"
      />

      <div className="history-patient-records">
        <IncomeBreakdown
          title="Income by Service — Selected Date"
          patients={dailyPatients}
          services={dailyServices}
        />
      </div>

      <div className="history-patient-records">
        <IncomeBreakdown
          title={`Income by Service — ${monthName}`}
          patients={monthlyPatients}
          services={monthlyServices}
        />
      </div>

      <div className="history-patient-records">
        <ServiceSlipsTable
          title="Service Slips on Selected Date"
          records={dailyServices}
        />
      </div>

      <div className="history-patient-records">
        <RecentPatientsTable
          todayOnly={false}
          selectedDate={selectedDate}
          useSearch={false}
        />
      </div>
    </div>
  );
}

export default History;
