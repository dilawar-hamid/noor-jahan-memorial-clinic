import { useContext } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import IncomeBreakdown from "../components/IncomeBreakdown";
import RecentPatientsTable from "../components/RecentPatientsTable";
import { PatientContext } from "../context/PatientContext.js";
import { ServiceContext } from "../context/ServiceContext.js";
import { isToday } from "../utils/date";
import { summarizeIncome, rowOf, money } from "../utils/income";
import { getLastBackup } from "../utils/storage";

function backupWarning() {
  const last = getLastBackup();
  if (!last) return "No backup has been taken yet.";
  const days = Math.floor((Date.now() - Date.parse(last)) / 86400000);
  return days >= 1 ? `Last backup was ${days} day(s) ago.` : null;
}

function Dashboard() {
  const { patients } = useContext(PatientContext);
  const { services } = useContext(ServiceContext);

  const todayPatients = patients.filter((patient) => isToday(patient.createdAt));
  const todayServices = services.filter((record) => isToday(record.createdAt));

  const summary = summarizeIncome(todayPatients, todayServices);
  const { totals } = summary;
  const registration = rowOf(summary, "registration");
  const lab = rowOf(summary, "lab");
  const ultrasound = rowOf(summary, "ultrasound");

  const warning = backupWarning();

  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div className="dashboard-header-row">
          <h1>Dashboard</h1>
        </div>
        <p>Welcome back! Here's your clinic overview for today.</p>
      </div>

      {warning && (
        <div className="backup-banner">
          <b>Backup reminder:</b> {warning} Take one from{" "}
          <Link to="/settings">Settings → Backup</Link>.
        </div>
      )}

      <div className="stats-grid">
        <StatCard title="Hospital Income Today" value={money(totals.hospital)} />
        <StatCard title="Cash Collected Today" value={money(totals.collected)} />
        <StatCard title="Hospital Income from Lab" value={money(lab.hospital)} />
        <StatCard title="Payable to Lab" value={money(lab.lab)} />
      </div>

      <div className="stats-grid">
        <StatCard
          title="Ultrasound Collection"
          value={`${money(ultrasound.collected)} · ${ultrasound.count} scans`}
        />
        <StatCard title="General OPD Patients Today" value={registration.count} />
      </div>

      <div className="dashboard-content">
        <IncomeBreakdown
          title="Today's Income by Service"
          patients={todayPatients}
          services={todayServices}
        />
        <RecentPatientsTable todayOnly={false} />
      </div>
    </div>
  );
}

export default Dashboard;
