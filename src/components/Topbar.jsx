import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PatientContext } from "../context/PatientContext.js";
import { AuthContext } from "../context/AuthContext.js";

// Patient search only makes sense where the patient list is shown.
const SEARCH_PAGES = ["/", "/dashboard"];

function Topbar({ onMenuClick }) {
  const { searchTerm, setSearchTerm } = useContext(PatientContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const today = new Date().toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="topbar">
      <button
        className="menu-toggle"
        type="button"
        onClick={onMenuClick}
        aria-label="Toggle navigation"
        title="Toggle navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <div className="topbar-search">
        {SEARCH_PAGES.includes(pathname) && (
          <input
            className="search-input"
            type="search"
            placeholder="Search patients..."
            aria-label="Search patients"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        )}
      </div>

      <div className="topbar-info">
        <span className="topbar-date">{today}</span>
        <span className="receptionist-label">{user?.name}</span>
        <button type="button" className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;
