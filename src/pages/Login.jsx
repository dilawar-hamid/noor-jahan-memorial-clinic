import { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.js";
import { CLINIC_NAME, ROLES } from "../config";

function Login() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to={user.role === ROLES.OWNER ? "/dashboard" : "/"} replace />;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const session = login(username, password);
    if (!session) {
      setError("Invalid username or password.");
      return;
    }
    navigate(session.role === ROLES.OWNER ? "/dashboard" : "/", { replace: true });
  }

  return (
    <div className="login-page">
      <div className="register-card login-card">
        <div className="register-heading">
          <h2>{CLINIC_NAME}</h2>
          <p>Sign in to continue.</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <small role="alert">{error}</small>}

          <button className="register-button" type="submit">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
