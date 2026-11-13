import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.js";
import { ROLES } from "../config";

const COMMON_LINKS = [
  { to: "/", label: "General OPD", icon: "O", end: true },
  { to: "/consultation", label: "Consultant", icon: "C" },
  { to: "/procedures", label: "Procedures", icon: "P" },
  { to: "/lab", label: "Lab Tests", icon: "L" },
  { to: "/ultrasound", label: "Ultrasound", icon: "U" },
];

const OWNER_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "D" },
  { to: "/day-report", label: "Day Report", icon: "E" },
  { to: "/lab-settlement", label: "Lab Settlement", icon: "$" },
  { to: "/history", label: "History", icon: "H" },
  { to: "/settings", label: "Settings", icon: "S" },
];

function Sidebar({ mobileSidebarOpen, onNavigate }) {
  const { role } = useContext(AuthContext);
  const links =
    role === ROLES.OWNER ? [...COMMON_LINKS, ...OWNER_LINKS] : COMMON_LINKS;

  return (
    <aside className={`sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          N
        </div>
        <h2 className="sidebar-title">
          Noor Jahan <span>Memorial</span>
        </h2>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            title={link.label}
          >
            <span className="nav-icon" aria-hidden="true">
              {link.icon}
            </span>
            <span className="nav-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">Clinic Management</div>
    </aside>
  );
}

export default Sidebar;
