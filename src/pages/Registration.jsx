import { useState } from "react";
import RegisterForm from "../components/RegisterForm";
import TokenSlip from "../components/TokenSlip";
import RecentPatientsTable from "../components/RecentPatientsTable";

function Registration() {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  return (
    <div className="registration-page">
      <div className="registration-workspace">
        <RegisterForm onPatientCreated={setSelectedPatientId} />
        <TokenSlip selectedPatientId={selectedPatientId} />
      </div>
      <div className="registration-patients">
        <RecentPatientsTable onSelect={setSelectedPatientId} />
      </div>
    </div>
  );
}
export default Registration;
