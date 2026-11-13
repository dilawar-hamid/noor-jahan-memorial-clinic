import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReceptionLayout from "./layouts/ReceptionLayout";
import Dashboard from "./pages/Dashboard";
import Registration from "./pages/Registration";
import History from "./pages/History";
import Login from "./pages/Login";
import ServicePage from "./pages/ServicePage";
import Settings from "./pages/Settings";
import DayReport from "./pages/DayReport";
import LabSettlement from "./pages/LabSettlement";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./config";

function App() {
  return (
    <BrowserRouter basename="/noor-jahan-memorial-clinic">
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Any logged-in user */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ReceptionLayout />}>
            <Route path="/" element={<Registration />} />
            <Route
              path="/consultation"
              element={<ServicePage key="consultation" type="consultation" />}
            />
            <Route
              path="/procedures"
              element={<ServicePage key="procedure" type="procedure" />}
            />
            <Route
              path="/lab"
              element={<ServicePage key="lab" type="lab" />}
            />
            <Route
              path="/ultrasound"
              element={<ServicePage key="ultrasound" type="ultrasound" />}
            />

            {/* Owner only */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.OWNER]} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/day-report" element={<DayReport />} />
              <Route path="/lab-settlement" element={<LabSettlement />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
